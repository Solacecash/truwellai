import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import {
  analyseWithGeminiText,
  analyseWithGeminiVision,
  type GeminiAnalysisResult,
} from '../_shared/geminiAnalysis.ts';
import {
  resolveProduct,
  type ResolvedProduct,
} from '../_shared/productLookup.ts';
import {
  lookupByName,
} from '../_shared/usdaLookup.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const ALLOWED_ORIGINS = [
  'https://truwellai.xyz',
  'capacitor://localhost',
  'http://localhost',
  'http://localhost:8081',
  'http://localhost:19006',
];

function getCorsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get('Origin') ?? '';
  const allowed = ALLOWED_ORIGINS.includes(origin)
    ? origin
    : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Headers':
      'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Vary': 'Origin',
  };
}

const ANALYSIS_PROMPT = `You are TruWell AI — a world-class
product safety and nutrition intelligence system. You analyse
ANY consumer product: food, beverages, cosmetics, skincare,
haircare, supplements, vitamins, household cleaners,
baby products, pet food, and all other consumer goods.

You have comprehensive knowledge of:
- Global food ingredients and nutrition
- Cosmetic and personal care ingredients (INCI names)
- Supplement and vitamin formulations
- Household chemical ingredients
- Regulatory databases: FDA, EU, MHRA, WHO, Health Canada,
  TGA Australia, and global equivalents

When given a barcode, product name, or ingredient list:
1. Identify the product type (food/cosmetic/supplement/
   household/beverage/baby/pet/other)
2. Analyse every ingredient for safety concerns
3. Flag ingredients banned or restricted by any major
   regulatory body worldwide
4. Cross-reference with user health profile if provided
5. Provide personalised risk assessment

Return ONLY valid JSON with this exact shape:
{
  "foodName": "product name",
  "product_type": "food|cosmetic|supplement|household|beverage|baby|pet|other",
  "cuisineRegion": "applicable or null",
  "dishType": "product category",
  "caloriesKcal": number_or_null,
  "proteinG": number_or_null,
  "carbsG": number_or_null,
  "fatG": number_or_null,
  "fiberG": number_or_null,
  "sugarG": number_or_null,
  "sodiumMg": number_or_null,
  "confidenceScore": 0.0_to_1.0,
  "aiEstimated": true_or_false,
  "grade": "A+|A|B|C|D|F",
  "score": 0_to_100,
  "summary": "2-3 sentence plain English safety and quality summary",
  "ingredients": [
    {
      "name": "ingredient name",
      "traffic": "green|yellow|red",
      "note": "brief safety note"
    }
  ],
  "high_risk_ingredients": [
    {
      "name": "ingredient name",
      "risk": "high|medium|low",
      "reason": "why this is a risk"
    }
  ],
  "banned_substances_detected": ["substance1"],
  "healthInsights": ["2-3 insights"],
  "riskNotes": ["personalized risks based on health profile"],
  "recommendations": ["1-3 concrete actions"]
}

GRADING RULES:
- A+/A (85-100): clean ingredients, no concerns
- B (70-84): mostly safe, minor concerns
- C (55-69): moderate concerns, use with caution
- D (40-54): significant concerns
- F (<40): serious safety issues, banned substances

For NON-FOOD products (cosmetics, household):
- Set caloriesKcal, proteinG, carbsG, fatG, fiberG,
  sugarG, sodiumMg all to null
- Focus analysis on ingredient safety, not nutrition
- Reference EU Cosmetics Regulation, FDA, or relevant
  body for ingredient bans

Always provide ingredient-level analysis even with
partial information. Never return empty ingredients array
if any ingredient names are provided.`;

const FOOD_VISION_PROMPT = `You are TruWell AI food
intelligence. Analyse this food photograph precisely.
You MUST identify the specific food — never return
"Unknown meal". Look for: dish type, ingredients
visible, cooking method, portion size, cuisine region.
If you cannot identify exactly, give your best estimate
with confidence "low".

Return ONLY valid JSON:
{
  "foodName": "specific dish name",
  "cuisineRegion": "region",
  "dishType": "category",
  "cookingMethod": "method",
  "portionDescription": "e.g. 1 plate ~350g",
  "caloriesKcal": number,
  "proteinG": number,
  "carbsG": number,
  "fatG": number,
  "fiberG": number,
  "sugarG": number,
  "sodiumMg": number,
  "confidenceScore": 0.0_to_1.0,
  "aiEstimated": true,
  "grade": "A|B|C|D|F",
  "score": 0_to_100,
  "summary": "2-3 sentence health analysis",
  "ingredients": [{"name":"item","traffic":"green|yellow|red","note":"brief"}],
  "healthInsights": ["insight1","insight2"],
  "riskNotes": [],
  "calorieRangeMin": number,
  "calorieRangeMax": number
}

RULES:
- NEVER return foodName as "Unknown meal"
- If unsure of exact dish, describe what you see:
  e.g. "Rice dish with vegetables and protein"
- caloriesKcal must be a realistic positive number
- confidenceScore: 0.9+ for clear photos, 0.6+ for
  partial views, 0.4+ for unclear but guessable
- Always provide protein, carbs, fat estimates`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: getCorsHeaders(req) });
  }

  try {
    const {
      barcode,
      ingredient_names,
      product_name,
      user_health_profile,
      imageBase64,
      foodDescription,
      scanType,
    } = await req.json() as {
      barcode?: string;
      ingredient_names?: string[];
      product_name?: string;
      user_health_profile?: Record<string, unknown> | null;
      imageBase64?: string;
      foodDescription?: string;
      scanType?: string;
    };

    const geminiKey = Deno.env.get('GEMINI_API_KEY') ?? '';
    const anthropicKey =
      Deno.env.get('ANTHROPIC_API_KEY') ?? '';
    // Gemini is primary — Claude is last-resort fallback only

    // ── Check cache first ────────────────────────────────
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    let cachedResolved: {
      productName: string;
      brandName: string | null;
      productType: ResolvedProduct['productType'];
      ingredients: string[];
      ingredientsRaw: string;
      allergens: string[];
      nutrition: Record<string, number | string | null>;
      imageUrl: string | null;
      sources: ResolvedProduct['sources'];
      confidence: number;
    } | null = null;

    if (barcode) {
      const { data: cached } = await supabaseAdmin
        .from('barcode_cache')
        .select('*')
        .eq('barcode', barcode)
        .maybeSingle();

      if (cached && cached.product_name) {
        const cachedNutrition = (cached.nutrition as Record<string, number | null>) ?? {};
        cachedResolved = {
          productName: cached.product_name,
          brandName: cached.brand_name,
          productType: (cached.product_type as ResolvedProduct['productType']) ?? 'unknown',
          ingredients: cached.ingredients as string[],
          ingredientsRaw: cached.ingredients_raw,
          allergens: cached.allergens as string[],
          nutrition: cachedNutrition,
          imageUrl: cached.image_url,
          sources: cached.data_sources as ResolvedProduct['sources'],
          confidence: Number(cached.confidence),
        };
      }
    }

    // ── Multi-source product resolution ─────────────────
    const usdaKey = Deno.env.get('USDA_API_KEY') ?? '';
    let resolved: ResolvedProduct | null = null;

    if (cachedResolved) {
      const n = cachedResolved.nutrition;
      resolved = {
        barcode: barcode ?? '',
        productName: cachedResolved.productName,
        brandName: cachedResolved.brandName,
        quantity: null,
        categories: null,
        productType: cachedResolved.productType,
        ingredients: cachedResolved.ingredients,
        ingredientsRaw: cachedResolved.ingredientsRaw,
        allergens: cachedResolved.allergens,
        imageUrl: cachedResolved.imageUrl,
        nutrition: {
          calories: n.calories ?? null,
          protein: n.protein ?? null,
          fat: n.fat ?? null,
          carbs: n.carbs ?? null,
          fiber: n.fiber ?? null,
          sugar: n.sugar ?? null,
          sodium: n.sodium ?? null,
          servingSize: typeof n.servingSize === 'string' ? n.servingSize : null,
        },
        sources: cachedResolved.sources?.length
          ? cachedResolved.sources
          : ['truwell_cache'],
        confidence: cachedResolved.confidence,
      };
    } else if (barcode) {
      resolved = await resolveProduct(barcode, usdaKey);
    }

    // If name provided but no barcode hit — try USDA by name
    if (!resolved && product_name && usdaKey) {
      try {
        const usda = await lookupByName(product_name, usdaKey);
        if (usda) {
          resolved = {
            barcode: barcode ?? '',
            productName: usda.productName,
            brandName: usda.brandName,
            quantity: usda.servingSize,
            categories: null,
            productType: 'food',
            ingredients: usda.ingredients,
            ingredientsRaw: usda.ingredientsRaw,
            allergens: [],
            imageUrl: null,
            nutrition: {
              calories: usda.calories,
              protein: usda.protein,
              fat: usda.fat,
              carbs: usda.carbs,
              fiber: usda.fiber,
              sugar: usda.sugar,
              sodium: usda.sodium,
              servingSize: usda.servingSize,
            },
            sources: ['usda'],
            confidence: 0.75,
          };
        }
      } catch { /* non-fatal */ }
    }

    const gs1Meta = resolved as (ResolvedProduct & {
      gs1Country?: string;
      gs1Region?: string;
    }) | null;

    const noProductData =
      !resolved?.productName &&
      !resolved?.ingredients.length &&
      !ingredient_names?.length;

    // If we have zero data — tell the client to scan the
    // label instead of returning a meaningless result
    if (noProductData && barcode) {
      const gs1Country = gs1Meta?.gs1Country ?? 'Unknown';
      return new Response(
        JSON.stringify({
          needs_ocr: true,
          barcode,
          gs1Country,
          message: gs1Country !== 'Unknown'
            ? `This product is manufactured in ${gs1Country} and is not yet in our databases. Point the camera at the ingredients label to analyse it directly.`
            : 'This product is not in our databases yet. Point the camera at the ingredients label to analyse it directly.',
          foodName: 'Product not in database',
          product_type: 'unknown',
          score: 0,
          grade: 'C',
          ingredients: [],
          summary: gs1Country !== 'Unknown'
            ? `${gs1Country}-manufactured product not found in global databases.`
            : 'Product not found in global databases.',
          dataSources: ['ai_inference'],
          dataVerified: false,
        }),
        { headers: {
          ...getCorsHeaders(req),
          'Content-Type': 'application/json',
        }}
      );
    }

    const mergedProductName =
      resolved?.productName ||
      product_name ||
      'Unidentified Product';

    const mergedIngredients =
      resolved?.ingredients.length
        ? resolved.ingredients
        : (ingredient_names ?? []);

    const nutritionCtx = resolved?.nutrition
      ? `\nVerified Nutrition (per 100g/serving):
  Calories: ${resolved.nutrition.calories ?? 'N/A'} kcal
  Protein: ${resolved.nutrition.protein ?? 'N/A'}g
  Fat: ${resolved.nutrition.fat ?? 'N/A'}g
  Carbs: ${resolved.nutrition.carbs ?? 'N/A'}g
  Fiber: ${resolved.nutrition.fiber ?? 'N/A'}g
  Sugar: ${resolved.nutrition.sugar ?? 'N/A'}g
  Sodium: ${resolved.nutrition.sodium ?? 'N/A'}mg
  Serving: ${resolved.nutrition.servingSize ?? 'N/A'}
  Brand: ${resolved.brandName ?? 'N/A'}
  Data sources: ${resolved.sources.join(', ')}
  Allergens: ${resolved.allergens.join(', ') || 'none listed'}`
      : '';

    const ingredients = mergedIngredients.length
      ? mergedIngredients.join(', ')
      : ingredient_names?.length
        ? ingredient_names.join(', ')
        : 'No ingredient data available — analyse by product name';

    const profileCtx = user_health_profile
      ? `\nUser health profile: ${JSON.stringify(user_health_profile)}`
      : '';

    const userContent = foodDescription
      ? `Analyse this food: ${foodDescription}
${profileCtx}
Provide full nutritional and safety analysis.`
      : `Product: ${mergedProductName}
Barcode: ${barcode ?? 'N/A'}
Product Type: ${resolved?.productType ?? 'unknown'}
Brand: ${resolved?.brandName ?? 'Unknown'}
Ingredients: ${ingredients}
${nutritionCtx}
${profileCtx}

${resolved
  ? `Data verified from: ${resolved.sources.join(', ')}. Use verified nutrition directly. Focus analysis on ingredient safety.`
  : `No database match found. Infer product type from name/barcode pattern. Estimate nutrition. Still provide full safety analysis.`}

Return complete JSON analysis.`;

    let parsed: GeminiAnalysisResult | null = null;
    let usedFallback = false;

    // ── ROUTE A: Food photo scan ───────────────────────
    if (imageBase64 && scanType === 'visual_ai') {
      try {
        if (geminiKey) {
          parsed = await analyseWithGeminiVision({
            imageBase64,
            isFood: true,
            profileCtx: user_health_profile
              ? `User profile: ${JSON.stringify(user_health_profile)}`
              : '',
            apiKey: geminiKey,
          });
        } else {
          throw new Error('No Gemini key — using fallback');
        }
      } catch (geminiErr) {
        // Last resort: Claude Sonnet vision
        if (anthropicKey) {
          usedFallback = true;
          const { default: Anthropic } = await import(
            'npm:@anthropic-ai/sdk@0.27.3'
          );
          const anthropic = new Anthropic({
            apiKey: anthropicKey,
          });
          const b64clean = imageBase64.replace(
            /^data:image\/\w+;base64,/, ''
          );
          const resp = await anthropic.messages.create({
            model: 'claude-sonnet-4-6',
            max_tokens: 1024,
            system: FOOD_VISION_PROMPT,
            messages: [{
              role: 'user',
              content: [
                {
                  type: 'image',
                  source: {
                    type: 'base64',
                    media_type: 'image/jpeg',
                    data: b64clean,
                  },
                },
                {
                  type: 'text',
                  text: 'Identify and analyse this food. ' +
                    'Return only JSON. Never return Unknown meal.',
                },
              ],
            }],
          });
          const rawText = resp.content
            .filter((b) => b.type === 'text')
            .map((b) => (b as { type: 'text'; text: string }).text)
            .join('');
          const m = rawText.match(/\{[\s\S]*\}/);
          if (m) parsed = JSON.parse(m[0]);
        }
        if (!parsed) throw geminiErr;
      }
    }

    // ── ROUTE B: Barcode / ingredient scan ────────────
    else {
      const hasIngredients = mergedIngredients.length > 0;

      if (hasIngredients && geminiKey) {
        // CHEAP PATH: free DB gave us ingredients →
        // send only text to Gemini Flash (no image)
        try {
          parsed = await analyseWithGeminiText({
            productName: mergedProductName,
            productType:
              resolved?.productType ?? 'unknown',
            ingredientsText: ingredients,
            nutritionCtx,
            profileCtx,
            apiKey: geminiKey,
          });
        } catch (geminiTextErr) {
          // Fallback to Claude text
          if (anthropicKey) {
            usedFallback = true;
            const { default: Anthropic } = await import(
              'npm:@anthropic-ai/sdk@0.27.3'
            );
            const anthropic = new Anthropic({
              apiKey: anthropicKey,
            });
            const resp = await anthropic.messages.create({
              model: 'claude-sonnet-4-6',
              max_tokens: 1024,
              system: ANALYSIS_PROMPT,
              messages: [{
                role: 'user',
                content: userContent,
              }],
            });
            const rawText = resp.content
              .filter((b) => b.type === 'text')
              .map((b) => (b as { type: 'text'; text: string }).text)
              .join('');
            const m = rawText.match(/\{[\s\S]*\}/);
            if (m) parsed = JSON.parse(m[0]);
          }
          if (!parsed) throw geminiTextErr;
        }
      } else if (geminiKey) {
        // NO DB HIT: use Gemini text with product
        // name + barcode inference (still $0.000035)
        try {
          parsed = await analyseWithGeminiText({
            productName: mergedProductName,
            productType: 'unknown',
            ingredientsText:
              foodDescription ??
              `Barcode: ${barcode ?? 'N/A'}. ` +
              `Infer product type and provide safety analysis.`,
            nutritionCtx: '',
            profileCtx,
            apiKey: geminiKey,
          });
        } catch {
          // Last resort: Claude
          if (anthropicKey) {
            usedFallback = true;
            const { default: Anthropic } = await import(
              'npm:@anthropic-ai/sdk@0.27.3'
            );
            const anthropic = new Anthropic({
              apiKey: anthropicKey,
            });
            const resp = await anthropic.messages.create({
              model: 'claude-sonnet-4-6',
              max_tokens: 1024,
              system: ANALYSIS_PROMPT,
              messages: [{
                role: 'user',
                content: userContent,
              }],
            });
            const rawText = resp.content
              .filter((b) => b.type === 'text')
              .map((b) => (b as { type: 'text'; text: string }).text)
              .join('');
            const m = rawText.match(/\{[\s\S]*\}/);
            if (m) parsed = JSON.parse(m[0]);
          }
        }
      } else if (anthropicKey) {
        // No Gemini key at all — use Claude directly
        usedFallback = true;
        const { default: Anthropic } = await import(
          'npm:@anthropic-ai/sdk@0.27.3'
        );
        const anthropic = new Anthropic({
          apiKey: anthropicKey,
        });
        const resp = await anthropic.messages.create({
          model: 'claude-sonnet-4-6',
          max_tokens: 1024,
          system: ANALYSIS_PROMPT,
          messages: [{
            role: 'user',
            content: userContent,
          }],
        });
        const rawText = resp.content
          .filter((b) => b.type === 'text')
          .map((b) => (b as { type: 'text'; text: string }).text)
          .join('');
        const m = rawText.match(/\{[\s\S]*\}/);
        if (m) parsed = JSON.parse(m[0]);
      }
    }

    if (!parsed) {
      throw new Error('All AI providers failed to analyse this product');
    }

    // Keep scanType on result
    if (scanType) {
      (parsed as Record<string, unknown>).scanType = scanType;
    }
    if (usedFallback) {
      (parsed as Record<string, unknown>).aiProvider = 'claude';
    } else {
      (parsed as Record<string, unknown>).aiProvider = 'gemini';
    }

    if (resolved) {
      parsed.foodName =
        parsed.foodName || resolved.productName;
      parsed.brandName = resolved.brandName;
      parsed.productType =
        parsed.product_type || resolved.productType;
      parsed.imageUrl = resolved.imageUrl;
      parsed.allergens = resolved.allergens;
      parsed.dataSources = resolved.sources;
      parsed.dataVerified = true;
      parsed.confidence = resolved.confidence;

      // Only override nutrition if DB has real values
      if (resolved.nutrition.calories !== null)
        parsed.caloriesKcal = resolved.nutrition.calories;
      if (resolved.nutrition.protein !== null)
        parsed.proteinG = resolved.nutrition.protein;
      if (resolved.nutrition.fat !== null)
        parsed.fatG = resolved.nutrition.fat;
      if (resolved.nutrition.carbs !== null)
        parsed.carbsG = resolved.nutrition.carbs;
      if (resolved.nutrition.fiber !== null)
        parsed.fiberG = resolved.nutrition.fiber;
      if (resolved.nutrition.sugar !== null)
        parsed.sugarG = resolved.nutrition.sugar;
      if (resolved.nutrition.sodium !== null)
        parsed.sodiumMg = resolved.nutrition.sodium;
      if (resolved.nutrition.servingSize)
        parsed.servingSize = resolved.nutrition.servingSize;
    } else {
      parsed.dataVerified = false;
      parsed.dataSources = ['ai_inference'];
      parsed.confidence = 0.5;
    }

    const responseBody = JSON.stringify(parsed);

    // Background cache write — does not block response
    if (barcode && !cachedResolved && resolved?.productName) {
      EdgeRuntime.waitUntil(
        supabaseAdmin
          .from('barcode_cache')
          .upsert(
            {
              barcode,
              product_name: resolved.productName,
              brand_name: resolved.brandName,
              product_type: resolved.productType,
              ingredients: resolved.ingredients,
              ingredients_raw: resolved.ingredientsRaw,
              allergens: resolved.allergens,
              nutrition: resolved.nutrition,
              image_url: resolved.imageUrl,
              data_sources: resolved.sources,
              confidence: resolved.confidence,
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'barcode' }
          )
          .then(() => {})
          .catch(() => {})
      );
    }

    return new Response(
      responseBody,
      { headers: {
        ...getCorsHeaders(req),
        'Content-Type': 'application/json',
      }}
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
    );
  }
});
