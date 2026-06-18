/**
 * Gemini 1.5 Flash analysis — replaces Claude for
 * standard scans. 43x cheaper than Claude Sonnet.
 * Uses native fetch (no SDK) for fast cold starts.
 */

export interface GeminiAnalysisResult {
  foodName: string;
  product_type: string;
  caloriesKcal: number | null;
  proteinG: number | null;
  carbsG: number | null;
  fatG: number | null;
  fiberG: number | null;
  sugarG: number | null;
  sodiumMg: number | null;
  confidenceScore: number;
  aiEstimated: boolean;
  grade: string;
  score: number;
  summary: string;
  ingredients: Array<{
    name: string;
    traffic: 'green' | 'yellow' | 'red';
    note: string;
  }>;
  high_risk_ingredients: Array<{
    name: string;
    risk: 'high' | 'medium' | 'low';
    reason: string;
  }>;
  banned_substances_detected: string[];
  healthInsights: string[];
  riskNotes: string[];
  recommendations: string[];
  brandName?: string | null;
  allergens?: string[];
  dataSources?: string[];
  dataVerified?: boolean;
}

const GEMINI_ENDPOINT =
  'https://generativelanguage.googleapis.com/v1beta/models/' +
  'gemini-1.5-flash:generateContent';

const RESPONSE_SCHEMA = {
  type: 'OBJECT',
  properties: {
    foodName: { type: 'STRING' },
    product_type: {
      type: 'STRING',
      enum: ['food','cosmetic','supplement','household',
             'beverage','baby','pet','other','unknown'],
    },
    caloriesKcal: { type: 'NUMBER', nullable: true },
    proteinG: { type: 'NUMBER', nullable: true },
    carbsG: { type: 'NUMBER', nullable: true },
    fatG: { type: 'NUMBER', nullable: true },
    fiberG: { type: 'NUMBER', nullable: true },
    sugarG: { type: 'NUMBER', nullable: true },
    sodiumMg: { type: 'NUMBER', nullable: true },
    confidenceScore: { type: 'NUMBER' },
    aiEstimated: { type: 'BOOLEAN' },
    grade: {
      type: 'STRING',
      enum: ['A+','A','B','C','D','F'],
    },
    score: { type: 'NUMBER' },
    summary: { type: 'STRING' },
    ingredients: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          name: { type: 'STRING' },
          traffic: {
            type: 'STRING',
            enum: ['green','yellow','red'],
          },
          note: { type: 'STRING' },
        },
        required: ['name','traffic','note'],
      },
    },
    high_risk_ingredients: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          name: { type: 'STRING' },
          risk: {
            type: 'STRING',
            enum: ['high','medium','low'],
          },
          reason: { type: 'STRING' },
        },
        required: ['name','risk','reason'],
      },
    },
    banned_substances_detected: {
      type: 'ARRAY',
      items: { type: 'STRING' },
    },
    healthInsights: {
      type: 'ARRAY',
      items: { type: 'STRING' },
    },
    riskNotes: {
      type: 'ARRAY',
      items: { type: 'STRING' },
    },
    recommendations: {
      type: 'ARRAY',
      items: { type: 'STRING' },
    },
  },
  required: [
    'foodName','product_type','confidenceScore',
    'aiEstimated','grade','score','summary',
    'ingredients','high_risk_ingredients',
    'banned_substances_detected','healthInsights',
    'riskNotes','recommendations',
  ],
};

const SYSTEM_INSTRUCTION = `You are TruWell AI — a
world-class product safety and nutrition intelligence
system. Analyse ANY consumer product: food, beverages,
cosmetics, skincare, haircare, supplements, vitamins,
household cleaners, baby products, pet food.

Knowledge base:
- Global food ingredients and nutrition
- Cosmetic INCI names and safety profiles
- Regulatory databases: FDA, EU (1400+ banned cosmetic
  ingredients), MHRA, WHO, Health Canada, TGA Australia

Grading:
A+/A (85-100): clean, no concerns
B (70-84): mostly safe, minor concerns
C (55-69): moderate concerns
D (40-54): significant concerns
F (<40): serious issues or banned substances

For non-food products set all nutrition fields to null.
Never return empty ingredients if any data is provided.
Flag EU-banned, FDA-banned, WHO-restricted substances.`;

const FOOD_VISION_INSTRUCTION = `You are TruWell AI
food intelligence. Analyse this food photograph.
NEVER return "Unknown meal" as foodName.
Always estimate calories even with low confidence.
Describe what you see if you cannot identify exactly.
E.g. "Rice dish with vegetables and grilled protein".
Nutrition fields are required — estimate realistically.`;

/**
 * Text-only analysis — cheapest path.
 * Used when OFF/OBF already provided ingredients.
 */
export async function analyseWithGeminiText(
  params: {
    productName: string;
    productType: string;
    ingredientsText: string;
    nutritionCtx: string;
    profileCtx: string;
    apiKey: string;
  }
): Promise<GeminiAnalysisResult> {
  const prompt =
    `Product: ${params.productName}\n` +
    `Type: ${params.productType}\n` +
    `Ingredients: ${params.ingredientsText}\n` +
    `${params.nutritionCtx}\n` +
    `${params.profileCtx}\n\n` +
    `Analyse this product for safety and nutrition. ` +
    `Flag any banned or restricted ingredients globally.`;

  const body = {
    system_instruction: {
      parts: [{ text: SYSTEM_INSTRUCTION }],
    },
    contents: [{
      role: 'user',
      parts: [{ text: prompt }],
    }],
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: RESPONSE_SCHEMA,
      temperature: 0.1,
      maxOutputTokens: 1024,
    },
  };

  const res = await fetch(
    `${GEMINI_ENDPOINT}?key=${params.apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(15000),
    }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gemini text error ${res.status}: ${err}`);
  }

  const data = await res.json() as {
    candidates?: Array<{
      content?: {
        parts?: Array<{ text?: string }>;
      };
    }>;
  };

  const text =
    data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
  if (!text) throw new Error('Gemini returned empty response');

  return JSON.parse(text) as GeminiAnalysisResult;
}

/**
 * Multimodal analysis — for food photos and
 * products with no ingredient data from databases.
 * Slightly more expensive but still 20x cheaper
 * than Claude Sonnet.
 */
export async function analyseWithGeminiVision(
  params: {
    imageBase64: string;
    mediaType?: string;
    productName?: string;
    isFood?: boolean;
    profileCtx?: string;
    apiKey: string;
  }
): Promise<GeminiAnalysisResult> {
  const instruction = params.isFood
    ? FOOD_VISION_INSTRUCTION
    : SYSTEM_INSTRUCTION;

  const textPrompt = params.isFood
    ? 'Identify and analyse this food. ' +
      'Never return Unknown meal. ' +
      (params.profileCtx ?? '')
    : `Analyse this product label or packaging. ` +
      `Product hint: ${params.productName ?? 'unknown'}. ` +
      `Extract all ingredients and assess safety. ` +
      (params.profileCtx ?? '');

  const mediaType =
    params.mediaType ?? 'image/jpeg';

  // Strip data URI prefix if present
  const b64 = params.imageBase64.replace(
    /^data:image\/\w+;base64,/, ''
  );

  const body = {
    system_instruction: {
      parts: [{ text: instruction }],
    },
    contents: [{
      role: 'user',
      parts: [
        {
          inlineData: {
            mimeType: mediaType,
            data: b64,
          },
        },
        { text: textPrompt },
      ],
    }],
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: RESPONSE_SCHEMA,
      temperature: 0.1,
      maxOutputTokens: 1024,
    },
  };

  const res = await fetch(
    `${GEMINI_ENDPOINT}?key=${params.apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(20000),
    }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(
      `Gemini vision error ${res.status}: ${err}`
    );
  }

  const data = await res.json() as {
    candidates?: Array<{
      content?: {
        parts?: Array<{ text?: string }>;
      };
    }>;
  };

  const text =
    data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
  if (!text) throw new Error('Gemini returned empty vision response');

  return JSON.parse(text) as GeminiAnalysisResult;
}
