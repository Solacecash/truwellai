import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import Anthropic from 'npm:@anthropic-ai/sdk@0.39.0';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { analyseWithGeminiText } from '../_shared/geminiAnalysis.ts';

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

const SYSTEM_PROMPT = `You are Sofia — TruWell AI's personal product safety
and ingredient intelligence companion.

YOUR PRIMARY PURPOSE:
- Analyse ingredients in food, cosmetics, supplements,
  household products and any consumer goods
- Explain scan results in plain language personalised
  to the user's health profile
- Flag harmful, banned or restricted ingredients based
  on FDA, EU, WHO, MHRA and global regulatory databases
- Identify recalls, safety alerts and bans affecting
  products the user has scanned
- Suggest safer product alternatives matched to the
  user's conditions, allergens and preferences
- Educate users on what ingredients actually do to
  their body based on peer-reviewed research

YOU ARE NOT:
- A symptom checker or diagnostic tool
- A telehealth service or doctor replacement
- A specialist referral engine
- A medication advisor

When users ask about symptoms or medical conditions:
Briefly acknowledge, then redirect to your strength:
"I am best at helping you understand what is in your
products and how ingredients interact with your health
profile. For medical concerns please consult a
healthcare professional."

Always lead with product and ingredient intelligence.
Always reference the user's scanned products, health
profile and flagged ingredients when relevant.

MANDATORY RULES — you must follow every rule on every response:

1. NEVER diagnose any medical condition. Never say "you might have", "this sounds like", "this could be", or any language suggesting a specific diagnosis.

2. NEVER recommend specific medications, supplements, or treatments by name for treating any condition. You may describe what research generally shows about an ingredient or substance.

3. NEVER claim to predict individual health outcomes. Use "research suggests" or "studies indicate" followed by general population findings, not individual predictions.

4. ALWAYS recommend consulting a qualified and licensed healthcare professional for any personal health concerns.

5. ALWAYS end every response that touches on health, symptoms, or wellness with this exact sentence: "For personalised guidance on any health matter, please consult a qualified and licensed healthcare professional."

6. If a user describes symptoms that may indicate a medical emergency (chest pain, difficulty breathing, sudden severe headache, signs of stroke, etc.), your first and only priority is to tell them to call emergency services immediately.

7. You provide information based on publicly available scientific and regulatory databases. You are not a medical professional and do not have access to the user's individual health records, clinical history, or the ability to conduct a physical examination.

8. When discussing ingredients, always frame findings as: "[Ingredient] has been associated with [effect] in [type of research]. Regulatory status: [status in specific jurisdiction]."

9. Never mention specific brand names in a negative context unless citing a documented regulatory action.

10. Your role is educational only. You help users understand information — not make medical decisions.

════ CORE IDENTITY — PRODUCT SAFETY GUARDIAN ════

Sofia's responses should always feel like a
knowledgeable friend who has read every ingredient
label, studied every regulatory database, and
knows your health profile by heart.

Default response style:
- Lead with what matters to THIS user specifically
- Reference their scanned products when relevant
- Cite the regulatory basis for any safety flag
  (e.g. "EU banned in 2023", "FDA recall issued")
- Suggest a specific safer alternative when flagging
- Keep it conversational — not clinical

Example of great Sofia response:
"That moisturiser you scanned last week contains
 methylparaben — which is restricted in the EU due
 to endocrine disruption concerns. Given your
 hormonal health concern on your profile, I would
 switch to a paraben-free option. CeraVe Moisturising
 Cream is a clean alternative that suits your
 skin type."

Example of poor Sofia response (avoid):
"You may want to see a dermatologist about your
 skin concerns."

PRODUCT ANALYSIS RULES:
- When analyzing a scanned product, cross-reference its
  name and ingredients against the user's allergens,
  conditions, dietary preference, and product concerns
  from the context.
- Flag ANY ingredient that conflicts with the user's
  health profile with explicit urgency.
- Always reference the user by name when flagging a
  personal risk: "Based on your [condition], this
  ingredient is a concern for you."
- If the user has pregnancy flagged, apply strictest
  possible ingredient scrutiny with zero tolerance for
  ambiguous ingredients.
- If the user's stress level is high or very high,
  proactively mention stress-relevant ingredients
  (caffeine, artificial stimulants, cortisol-spiking
  additives) when present.
- Cross-reference the user's product concerns list when
  present — if a flagged concern (e.g. heavy metals,
  parabens, endocrine disruptors) appears in the product,
  call it out by name referencing their concern.
- If you have no specific ingredient data for a product,
  say: "I don't have the full ingredient list for this
  product. Tap (+) and snap the label — I'll analyse
  it directly."

PERSONALISATION RULES:
- You have access to this user's full health profile
  from their onboarding: conditions, allergies, diet,
  lifestyle, stress, family role, goals, and TruWell
  wellness score. Use ALL of it.
- Never give generic advice when you have personal data.
  "Studies suggest..." is for general topics. For
  personal scans and food analysis, say "For you
  specifically, given your [condition]..."
- Reference the user's goals when relevant:
  "Since one of your goals is [goal], this matters
  because..."
- Adapt your communication style to life context:
  - Parent: focus on family safety, child safety
  - Student: budget-friendly, quick solutions
  - Pregnant: maximum safety, zero tolerance
  - Professional: time-efficient, practical
  - High stress: one step at a time, gentle tone
- The user's TruWell score is their wellness baseline.
  Reference it when discussing progress:
  "Your current TruWell score is [score]. Here's how
  this [product/food/choice] affects that..."
- Diet alignment: every food recommendation must
  respect the user's diet type. Never suggest foods
  that conflict with it without explicit flagging.
- Activity-calorie alignment: factor in the user's
  activity level when discussing calorie needs.
  An athlete's needs differ from a sedentary person's.

SPECIALIST ROUTING (last resort only):
- Only suggest a specialist when the user explicitly
  asks to find or book one, OR when a conversation
  reveals a clear medical emergency or urgent clinical
  need that is beyond product safety education.
- Do NOT proactively suggest specialists in response
  to ingredient questions, scan results, or general
  health profile queries. Your job is ingredient
  intelligence — not clinical referral.
- When specialist routing is genuinely needed, respond:
  "For this I would recommend speaking with a
  specialist." then add the specialty_suggestion JSON.

When the user's message contains health concerns related to specific body parts or medical specialties, naturally offer to connect them with a relevant specialist. Use this mapping:
- teeth, tooth, dental, gum, mouth → Dentist
- skin, rash, eczema, acne, dermatitis → Dermatologist
- heart, chest pain, palpitations, blood pressure → Cardiologist
- stomach, gut, digestion, IBS, bloating → Gastroenterologist
- hormone, thyroid, diabetes, PCOS, weight → Endocrinologist
- pregnancy, period, fertility, menopause → OB/GYN
- child, baby, infant, pediatric → Pediatrician
- bone, joint, back, knee, hip → Orthopedist
- anxiety, depression, stress, mental → Mental Health Specialist
- allergy, reaction, sensitivity, immune → Allergist
- eye, vision, sight → Ophthalmologist
- ear, hearing, nose, throat → ENT Specialist
- nutrition, diet, weight loss, food → Nutritionist
- find specialist, find doctor, book appointment, need professional → General Practitioner

When you detect these keywords, add to the END of your response (after the main answer), on its own final line, ONLY valid JSON with double quotes (no other text on that line):
{"specialty_suggestion":{"specialty":"Dermatologist","reason":"Based on your skin concern","cta":"Would you like me to find a dermatologist for you?"}}

Only suggest once per conversation thread on the same topic. Do not suggest if the user has already declined.

Format ALL responses using this structure:
- Never write paragraphs longer than 2 sentences
- Use bullet points for any list of 3 or more items
- Bold the most important word or phrase in each response using **word**
- Start every response with one clear direct answer sentence
- If the topic has multiple aspects, number them: 1. 2. 3.
- Maximum response length: 150 words for simple questions, 250 words for complex ones
- End every response with exactly one of these: a relevant emoji, a follow-up question, or a specialist suggestion -- never all three
- Never use the words 'certainly', 'absolutely', 'of course', 'great question', 'I understand'`;

const DIET_PERSONALIZATION_SYSTEM = `Generate a 7-day
personalised meal plan as compact JSON. Base it on the
user's goals, lifestyle, preferences, and — critically —
their real health profile data provided in the request.

MANDATORY SAFETY AND DIETARY RULES — these override any
other preference and must never be violated:

1. dietary_restrictions: if the array includes
   "vegetarian", never include any meat, poultry, or fish
   in any meal. If it includes "vegan", never include any
   animal product including dairy, eggs, or honey. If it
   includes "halal", never include pork or alcohol-based
   ingredients. If it includes "kosher", never mix meat
   and dairy in the same meal and never include pork or
   shellfish. Apply every restriction listed literally.

2. allergens: never include any ingredient matching or
   derived from an item in this array, under any name or
   form (e.g. if "peanuts" is listed, exclude peanut oil,
   peanut butter, and any dish traditionally containing
   peanuts).

3. excluded_ingredients: never include any ingredient
   matching or closely related to an item in this array.

4. health_conditions: if this array includes "diabetes",
   "prediabetes", "insulin resistance", or "PCOS", avoid
   high-glycemic-index meals, refined sugars, and white
   flour-heavy dishes; prefer balanced macros with fibre
   and protein. If it includes "hypertension" or "high
   blood pressure", keep meals lower in sodium and avoid
   processed/cured meats. If it includes "kidney disease",
   keep meals lower in sodium, potassium, and phosphorus.
   If it includes any condition not listed here, use sound
   nutritional judgement to avoid foods commonly
   contraindicated for that condition.

5. is_pregnant_or_breastfeeding: if true, never include
   raw or undercooked fish/eggs/meat, unpasteurised dairy,
   high-mercury fish (shark, swordfish, king mackerel), or
   excessive caffeine-containing ingredients.

If following these rules makes a default meal unsuitable,
substitute a genuinely different meal that fits — never
just rename or lightly edit an unsafe meal.

Return ONLY valid JSON (no markdown fences, no commentary)
with exactly these keys:
- meal_plan: array of 7 day objects. Each day has:
  breakfast, lunch, dinner (all required), snack (optional).
- grocery_list: array of unique ingredient strings across
  the whole week (max 30 items).

Each meal object:
{"name":"string","cal":number,"pro":number,"carb":number,"fat":number,"mins":number,"ingredients":["string"]}
Keep ingredient arrays to max 4 items. Keep meal names
under 40 chars. Be concise.`;

const PREDICTIVE_IMPACT_SYSTEM = `Analyse this product's ingredients and provide an ingredient research summary. Frame all findings as research observations, not individual predictions. Use language such as "studies suggest", "research has associated", "regulatory bodies have noted". Never frame findings as predictions for the specific user. Always note that individual responses vary and professional consultation is recommended.

Respond ONLY with a valid JSON object (double quotes, no markdown fences, no prose outside the JSON) matching exactly this schema:
{"shortTerm":["research observation 1","research observation 2","research observation 3"],"longTerm":["research observation 1","research observation 2"],"riskFlags":[{"condition":"condition name","risk":"high|medium|low","explanation":"research-based explanation using 'studies suggest' or 'research has associated'"}],"calorieImpact":{"dailyCalories":250,"weeklyImpact":"description","monthlyImpact":"description","weightRiskPerMonth":2}|null,"ingredientWarnings":[{"ingredient":"ingredient name","warning":"research-framed warning text","affectedConditions":["condition1"]}],"overallRiskScore":65,"recommendation":"avoid|limit|safe|excellent"}

Rules:
- shortTerm: 2-4 short bullets framed as "Studies on this ingredient pattern note:" or "Research suggests..."
- longTerm: 2-4 short bullets describing 3-12 month research patterns, framed as research findings not predictions.
- For food products calculate realistic calorie impact; for cosmetics or non-food set calorieImpact to null.
- weightRiskPerMonth: kilograms associated with similar consumption patterns in research. Use 7700 kcal = 1 kg.
- monthlyImpact must use the phrase "Studies on this ingredient pattern note:" not "If you consume this".
- insulin resistance should ONLY appear as a riskFlag when ingredients clearly include high glycemic items, refined sugars, or known insulin disruptors AND the user listed conditions includes diabetes, prediabetes, PCOS, or insulin resistance.
- overallRiskScore: 0-100 where 0 is extremely risky and 100 is excellent.
- Be specific and evidence-based. Never invent ingredients not listed.`;

const BATCH_RECALL_SYSTEM = `You check manufacturing batches against publicly known product recalls. Respond ONLY with valid JSON (double quotes, no markdown fences):
{"recalled":boolean,"recallReason":"string or null","affectedBatches":"string or null","recallDate":"string or null","actionRequired":"string or null","source":"FDA|NAFDAC|EU|WHO|other|none"}
If you do not have confirmed recall information for the specific batch and product, return recalled:false with source:"none". Do not fabricate recalls. Keep every string under 180 characters.`;

const OCR_LABEL_SYSTEM = `You are TruWell AI's product label
scanner. Extract ALL text and ingredients from photographed
labels of ANY consumer product: food, cosmetics, skincare,
haircare, supplements, vitamins, household products, baby
products, and any other consumer goods.

Respond ONLY with valid JSON (double quotes, no markdown):
{
  "product_type": "food|cosmetic|supplement|household|beverage|baby|pet|other|unknown",
  "product_name": "extracted product name if visible",
  "brand_name": "extracted brand if visible",
  "detected_text": "ALL raw text extracted from the image",
  "ingredients": ["every ingredient name extracted"],
  "ingredient_count": 0,
  "high_risk_ingredients": [
    {"name": "ingredient","risk": "high|medium|low","reason": "why"}
  ],
  "banned_substances_detected": ["substance"],
  "overall_grade": "A|B|C|D|F",
  "safety_score": 0,
  "summary": "2 sentence plain English summary",
  "recommendations": ["1-3 concrete actions"]
}

CRITICAL EXTRACTION RULES:
1. Extract EVERY word visible on the label — even partial
   or blurry text. Preserve ingredient order exactly.
2. For cosmetics: extract INCI names (Aqua, Glycerin, etc)
3. For food: extract all ingredients including additives
   with E-numbers
4. For supplements: extract all active and inactive
   ingredients
5. For household products: extract all chemical components
6. If ingredients section is found but partially obscured:
   extract what is visible, note partial in detected_text
7. NEVER return empty ingredients array if ANY ingredient
   text is visible — even 1 ingredient is better than none
8. product_name: look for largest text, brand name, or
   prominent label text
9. Flag EU-banned, FDA-banned, WHO-restricted substances
10. safety_score 0-100; grade: >=85=A, 70-84=B, 55-69=C,
    40-54=D, <40=F
11. For non-food products set nutritional fields to null
    and focus on ingredient safety analysis`;

const ENHANCED_FOOD_SYSTEM = `Analyse this food photograph. Identify every ingredient you can see and estimate nutrition. Respond ONLY with valid JSON (double quotes, no markdown fences):
{"food_name":"string","calories":number,"calories_per_serving":number,"serving_size_g":number,"protein_g":number,"carbs_g":number,"fat_g":number,"fiber_g":number,"sugar_g":number,"confidence":"high|medium|low","detected_ingredients":["ingredient1","ingredient2"],"glycemic_index":"low|medium|high","insulin_risk":boolean,"weekly_calorie_impact":number,"monthly_weight_risk_kg":number,"daily_consumption_warning":"string or null","notes":"string or null"}

Rules:
- calories and calories_per_serving may be the same; include both.
- weekly_calorie_impact = calories_per_serving * 7.
- monthly_weight_risk_kg = round((calories_per_serving * 30) / 7700, 1). Clamp to 0 if calories < 150.
- insulin_risk = true when sugar_g > 20 per serving OR glycemic_index == "high".
- daily_consumption_warning: human readable warning like "If consumed daily -> +2.1kg/month risk" when monthly_weight_risk_kg > 0.5; null otherwise.
- Be conservative and realistic; if uncertain set confidence to low.`;

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

type SpecialtySuggestion = {
  specialty: string;
  reason: string;
  cta: string;
};

/** Strip trailing JSON line with specialty_suggestion from model reply. */
function parseSpecialtySuggestionFromReply(reply: string): {
  cleanReply: string;
  specialty_suggestion: SpecialtySuggestion | null;
} {
  const trimmed = reply.trimEnd();
  const lines = trimmed.split('\n');
  for (let i = lines.length - 1; i >= 0; i--) {
    const line = lines[i].trim();
    if (!line.startsWith('{') || !line.includes('"specialty_suggestion"')) continue;
    try {
      const obj = JSON.parse(line) as {
        specialty_suggestion?: { specialty?: string; reason?: string; cta?: string };
      };
      const s = obj.specialty_suggestion;
      if (s?.specialty && s.reason && s.cta) {
        const cleanReply = lines.slice(0, i).join('\n').trimEnd();
        return {
          cleanReply,
          specialty_suggestion: {
            specialty: s.specialty,
            reason: s.reason,
            cta: s.cta,
          },
        };
      }
    } catch {
      continue;
    }
  }
  return { cleanReply: reply, specialty_suggestion: null };
}

function parseFoodAnalysisResponse(raw: string): Record<string, unknown> {
  let t = raw.trim();
  if (t.startsWith('```')) {
    t = t.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/m, '');
  }
  const start = t.indexOf('{');
  const end = t.lastIndexOf('}');
  if (start < 0 || end < start) throw new Error('No JSON in food analysis response');
  return JSON.parse(t.slice(start, end + 1)) as Record<string, unknown>;
}

function parseDietPlanResponse(raw: string): { meal_plan: unknown[]; grocery_list: string[] } {
  let t = raw.trim();
  if (t.startsWith('```')) {
    t = t.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/m, '');
  }
  const start = t.indexOf('{');
  const end = t.lastIndexOf('}');
  if (start < 0 || end < start) throw new Error('No JSON in diet plan response');
  const obj = JSON.parse(t.slice(start, end + 1)) as {
    meal_plan?: unknown;
    grocery_list?: unknown;
  };
  const meal_plan = Array.isArray(obj.meal_plan) ? obj.meal_plan : [];
  const grocery_list = Array.isArray(obj.grocery_list) ? obj.grocery_list.map((x) => String(x)) : [];
  return { meal_plan, grocery_list };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: getCorsHeaders(req) });
  }

  try {
    const body = await req.json() as {
      messages?: Message[];
      context?: string;
      product_name?: string;
      ingredient_name?: string;
      diet_meal_name?: string;
      food_image_base64?: string;
      diet_personalization?: boolean;
      personalization?: Record<string, unknown>;
      task?: 'predictive_report' | 'recall_check' | 'ocr_label';
      predictive_payload?: {
        ingredients?: string[];
        product_name?: string;
        product_type?: string;
        user_conditions?: string[];
      };
      recall_payload?: {
        batch_number?: string;
        product_name?: string;
        gtin?: string;
        expiry_date?: string;
      };
      ocr_image_base64?: string;
      ocr_text?: string;
      full_label_text?: string;
      source?: string;
      hint?: string;
      user_conditions?: string[];
    };

    const authHeader = req.headers.get('Authorization') ?? '';
    const token = authHeader.replace('Bearer ', '');
    const authClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    const { data: authData, error: authErr } =
      await authClient.auth.getUser(token);
    if (authErr || !authData?.user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        {
          status: 401,
          headers: {
            ...getCorsHeaders(req),
            'Content-Type': 'application/json',
          },
        }
      );
    }
    const verifiedUserId = authData.user.id;

    const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY');
    if (!anthropicKey) throw new Error('ANTHROPIC_API_KEY not configured');

    const anthropic = new Anthropic({ apiKey: anthropicKey });

    // ── OCR label scanner ──────────────────────────────────────────────────
    // ML Kit text path — no image needed, much faster
    if (body.task === 'ocr_label' &&
        typeof body.ocr_text === 'string' &&
        body.ocr_text.length > 10) {

      const vision = await anthropic.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 1024,
        system: OCR_LABEL_SYSTEM,
        messages: [{
          role: 'user',
          content: `Extracted ingredient text from product label:\n\n${body.ocr_text}\n\nFull label text:\n${body.full_label_text ?? ''}\n\nReturn only the JSON object.`,
        }],
      });

      const ocrText = vision.content
        .filter((b) => b.type === 'text')
        .map((b) => (b as { type: 'text'; text: string }).text)
        .join('');

      const parsed = parseFoodAnalysisResponse(ocrText);
      const ocr_analysis = {
        product_type: ['food', 'cosmetic', 'supplement',
          'household', 'unknown'].includes(
            String(parsed.product_type))
          ? String(parsed.product_type) : 'unknown',
        detected_text: body.full_label_text ??
                       body.ocr_text ?? '',
        ingredients: Array.isArray(parsed.ingredients)
          ? (parsed.ingredients as unknown[]).map(
              (x) => String(x)) : [],
        ingredient_count:
          Number(parsed.ingredient_count) || 0,
        high_risk_ingredients: Array.isArray(
          parsed.high_risk_ingredients)
          ? (parsed.high_risk_ingredients as unknown[]) : [],
        banned_substances_detected: Array.isArray(
          parsed.banned_substances_detected)
          ? (parsed.banned_substances_detected as unknown[])
              .map((x) => String(x)) : [],
        overall_grade: ['A', 'B', 'C', 'D', 'F'].includes(
          String(parsed.overall_grade))
          ? String(parsed.overall_grade) : 'C',
        safety_score: Number(parsed.safety_score) || 50,
        summary: String(parsed.summary ?? ''),
        recommendations: Array.isArray(parsed.recommendations)
          ? (parsed.recommendations as unknown[]).map(
              (x) => String(x)) : [],
        source: 'mlkit+claude',
      };

      return new Response(
        JSON.stringify({ ocr_analysis }),
        { headers: {
          ...getCorsHeaders(req),
          'Content-Type': 'application/json',
        }}
      );
    }

    // ── OCR label scan (image → Claude Vision) ────────────
    if (body.task === 'ocr_label' &&
        typeof body.ocr_image_base64 === 'string' &&
        body.ocr_image_base64.length > 0) {
      const b64 = body.ocr_image_base64.replace(
        /^data:image\/\w+;base64,/, ''
      );
      let mediaType: 'image/jpeg' | 'image/png' | 'image/webp' =
        'image/jpeg';
      if (body.ocr_image_base64.includes('image/png'))
        mediaType = 'image/png';
      else if (body.ocr_image_base64.includes('image/webp'))
        mediaType = 'image/webp';

      const ocrHint = typeof body.hint === 'string'
        ? `\n\nAdditional context: ${body.hint}`
        : '';

      let ocrText = '';
      try {
        const vision = await anthropic.messages.create({
          model: 'claude-sonnet-4-6',
          max_tokens: 1024,
          system: OCR_LABEL_SYSTEM,
          messages: [{
            role: 'user',
            content: [
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: mediaType,
                  data: b64,
                },
              },
              {
                type: 'text',
                text: `Return only the JSON object specified in the system prompt.${ocrHint}`,
              },
            ],
          }],
        });
        ocrText = vision.content
          .filter((b) => b.type === 'text')
          .map((b) => (b as { type: 'text'; text: string }).text)
          .join('');
      } catch (claudeErr) {
        // Fallback to OpenAI Vision if Claude fails
        const openaiKey = Deno.env.get('OPENAI_API_KEY') ?? '';
        if (openaiKey) {
          try {
            const { ocrWithOpenAI } = await import('./openaiVision.ts')
              .catch(() => ({ ocrWithOpenAI: null }));
            if (ocrWithOpenAI) {
              ocrText = await ocrWithOpenAI(
                b64, mediaType, OCR_LABEL_SYSTEM, openaiKey, body.hint
              );
            }
          } catch { /* non-fatal */ }
        }
        if (!ocrText) throw claudeErr;
      }

      let parsedFromOpenAI = false;
      const parsed = parseFoodAnalysisResponse(ocrText);

      // If Claude returned empty ingredients, try OpenAI Vision
      if ((!parsed.ingredients ||
          (parsed.ingredients as unknown[]).length === 0) &&
          !parsedFromOpenAI) {
        const openaiKey = Deno.env.get('OPENAI_API_KEY') ?? '';
        if (openaiKey) {
          try {
            const openai = new (await import('npm:openai@4.28.0'))
              .default({ apiKey: openaiKey });
            const resp = await openai.chat.completions.create({
              model: 'gpt-4o',
              max_tokens: 1024,
              messages: [
                { role: 'system', content: OCR_LABEL_SYSTEM },
                {
                  role: 'user',
                  content: [
                    {
                      type: 'image_url',
                      image_url: {
                        url: `data:${mediaType};base64,${b64}`,
                        detail: 'high',
                      },
                    },
                    {
                      type: 'text',
                      text: 'Return only the JSON object specified in the system prompt.',
                    },
                  ],
                },
              ],
            });
            const fallbackText =
              resp.choices[0]?.message?.content ?? '';
            if (fallbackText) {
              const fallbackParsed =
                parseFoodAnalysisResponse(fallbackText);
              if ((fallbackParsed.ingredients as unknown[])
                  ?.length > 0) {
                Object.assign(parsed, fallbackParsed);
                parsedFromOpenAI = true;
              }
            }
          } catch { /* non-fatal */ }
        }
      }

      const ocr_analysis = {
        product_type: ['food','cosmetic','supplement',
          'household','beverage','baby','pet','other',
          'unknown'].includes(String(parsed.product_type))
          ? String(parsed.product_type) : 'unknown',
        product_name: String(parsed.product_name ?? ''),
        brand_name: String(parsed.brand_name ?? ''),
        detected_text: String(parsed.detected_text ?? ''),
        ingredients: Array.isArray(parsed.ingredients)
          ? (parsed.ingredients as unknown[]).map(
              (x) => String(x))
          : [],
        ingredient_count: Array.isArray(parsed.ingredients)
          ? (parsed.ingredients as unknown[]).length
          : Number(parsed.ingredient_count) || 0,
        high_risk_ingredients: Array.isArray(
          parsed.high_risk_ingredients)
          ? (parsed.high_risk_ingredients as unknown[]) : [],
        banned_substances_detected: Array.isArray(
          parsed.banned_substances_detected)
          ? (parsed.banned_substances_detected as unknown[])
              .map((x) => String(x)) : [],
        overall_grade: ['A','B','C','D','F'].includes(
          String(parsed.overall_grade))
          ? String(parsed.overall_grade) : 'C',
        safety_score: Number(parsed.safety_score) || 50,
        summary: String(parsed.summary ?? ''),
        recommendations: Array.isArray(parsed.recommendations)
          ? (parsed.recommendations as unknown[]).map(
              (x) => String(x)) : [],
        ai_provider: parsedFromOpenAI ? 'openai' : 'claude',
        source: 'image_vision',
      };

      return new Response(
        JSON.stringify({ ocr_analysis }),
        { headers: {
          ...getCorsHeaders(req),
          'Content-Type': 'application/json',
        }}
      );
    }

    // ── Food photo snapshot (vision) ───────────────────────────────────────
    if (typeof body.food_image_base64 === 'string' && body.food_image_base64.length > 0) {
      const b64 = body.food_image_base64.replace(/^data:image\/\w+;base64,/, '');
      let mediaType: 'image/jpeg' | 'image/png' | 'image/webp' = 'image/jpeg';
      if (body.food_image_base64.includes('image/png')) mediaType = 'image/png';
      else if (body.food_image_base64.includes('image/webp')) mediaType = 'image/webp';

      const vision = await anthropic.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 1024,
        system: ENHANCED_FOOD_SYSTEM,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: { type: 'base64', media_type: mediaType, data: b64 },
              },
              {
                type: 'text',
                text: 'Return only the JSON object specified in the system prompt.',
              },
            ],
          },
        ],
      });

      const visionText = vision.content
        .filter((b) => b.type === 'text')
        .map((b) => (b as { type: 'text'; text: string }).text)
        .join('');

      const parsed = parseFoodAnalysisResponse(visionText);
      const cals = Number(parsed.calories) || Number(parsed.calories_per_serving) || 0;
      const perServing = Number(parsed.calories_per_serving) || cals;
      const weekly = Number(parsed.weekly_calorie_impact) || perServing * 7;
      const monthlyKg = Number(parsed.monthly_weight_risk_kg);
      const safeMonthlyKg = Number.isFinite(monthlyKg)
        ? Math.max(0, Math.round(monthlyKg * 10) / 10)
        : Math.max(0, Math.round(((perServing * 30) / 7700) * 10) / 10);

      const food_analysis = {
        food_name: String(parsed.food_name ?? 'Unknown meal'),
        calories: cals,
        calories_per_serving: perServing,
        serving_size_g: Number(parsed.serving_size_g) || 0,
        protein_g: Number(parsed.protein_g) || 0,
        carbs_g: Number(parsed.carbs_g) || 0,
        fat_g: Number(parsed.fat_g) || 0,
        fiber_g: Number(parsed.fiber_g) || 0,
        sugar_g: Number(parsed.sugar_g) || 0,
        confidence: ['high', 'medium', 'low'].includes(String(parsed.confidence))
          ? (parsed.confidence as 'high' | 'medium' | 'low')
          : 'low',
        detected_ingredients: Array.isArray(parsed.detected_ingredients)
          ? (parsed.detected_ingredients as unknown[]).map((x) => String(x))
          : [],
        glycemic_index: ['low', 'medium', 'high'].includes(String(parsed.glycemic_index))
          ? (parsed.glycemic_index as 'low' | 'medium' | 'high')
          : 'medium',
        insulin_risk: Boolean(parsed.insulin_risk),
        weekly_calorie_impact: Math.round(weekly),
        monthly_weight_risk_kg: safeMonthlyKg,
        daily_consumption_warning: parsed.daily_consumption_warning == null
          ? null
          : String(parsed.daily_consumption_warning),
        notes: parsed.notes == null ? null : String(parsed.notes),
      };

      return new Response(JSON.stringify({ food_analysis }), {
        headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' },
      });
    }

    // ── Predictive impact report ───────────────────────────────────────────
    if (body.task === 'predictive_report' && body.predictive_payload) {
      const p = body.predictive_payload;
      const userMsg = `Product: ${p.product_name ?? 'Unknown'}\nType: ${p.product_type ?? 'unknown'}\nIngredients: ${(p.ingredients ?? []).join(', ') || 'not provided'}\nUser conditions: ${(p.user_conditions ?? []).join(', ') || 'none specified'}`;

      const resp = await anthropic.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 1500,
        system: PREDICTIVE_IMPACT_SYSTEM,
        messages: [{ role: 'user', content: userMsg }],
      });
      const rawText = resp.content
        .filter((b) => b.type === 'text')
        .map((b) => (b as { type: 'text'; text: string }).text)
        .join('');
      const parsed = parseFoodAnalysisResponse(rawText);

      return new Response(JSON.stringify({ predictive_report: parsed }), {
        headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' },
      });
    }

    // ── Recall check ───────────────────────────────────────────────────────
    if (body.task === 'recall_check' && body.recall_payload) {
      const p = body.recall_payload;
      const userMsg = `Check recall status for:\nProduct: ${p.product_name ?? 'Unknown'}\nGTIN: ${p.gtin ?? 'not provided'}\nBatch: ${p.batch_number ?? 'not provided'}\nExpiry: ${p.expiry_date ?? 'not provided'}`;

      const resp = await anthropic.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 512,
        system: BATCH_RECALL_SYSTEM,
        messages: [{ role: 'user', content: userMsg }],
      });
      const rawText = resp.content
        .filter((b) => b.type === 'text')
        .map((b) => (b as { type: 'text'; text: string }).text)
        .join('');
      const parsed = parseFoodAnalysisResponse(rawText);

      return new Response(JSON.stringify({ recall_check: parsed }), {
        headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' },
      });
    }

    // ── Diet personalization (JSON meal plan) ──────────────────────────────
    // Gemini Flash is primary here for speed and cost; Claude remains
    // the fallback model if Gemini fails or is unavailable, never removed.
    if (body.diet_personalization && body.personalization && typeof body.personalization === 'object') {
      const userJson = JSON.stringify(body.personalization);
      const dietPrompt = `Personalization request (JSON). Build the plan from this data:\n${userJson}`;
      const geminiKey = Deno.env.get('GEMINI_API_KEY');

      let dietText = '';
      let usedFallback = false;

      if (geminiKey) {
        try {
          dietText = await analyseWithGeminiText({
            apiKey: geminiKey,
            systemPrompt: DIET_PERSONALIZATION_SYSTEM,
            userPrompt: dietPrompt,
            maxOutputTokens: 4096,
          });
        } catch {
          usedFallback = true;
        }
      } else {
        usedFallback = true;
      }

      if (usedFallback || !dietText) {
        const dietResponse = await anthropic.messages.create({
          model: 'claude-sonnet-4-6',
          max_tokens: 4096,
          system: DIET_PERSONALIZATION_SYSTEM,
          messages: [
            {
              role: 'user',
              content: dietPrompt,
            },
          ],
        });
        dietText = dietResponse.content
          .filter((b) => b.type === 'text')
          .map((b) => (b as { type: 'text'; text: string }).text)
          .join('');
      }
      try {
        const { meal_plan, grocery_list } = parseDietPlanResponse(dietText);

        // Persist the generated 7-day plan so the Wellness
        // screen and weekly/monthly export both read real
        // data instead of falling back to empty placeholders.
        // meal_plans stores foreign keys into meals, so each
        // AI-generated meal must first be inserted into meals
        // to obtain a real id before linking it into meal_plans.
        // Wrapped in its own function and run via
        // EdgeRuntime.waitUntil below so it never blocks the
        // response returned to the client (previously caused
        // an EarlyDrop timeout under load).
        const persistMealPlan = async () => {
        try {
          const reqUserId = verifiedUserId;
          if (reqUserId && Array.isArray(meal_plan) && meal_plan.length > 0) {
            const supabaseAdmin = createClient(
              Deno.env.get('SUPABASE_URL') ?? '',
              Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
            );

            type GeneratedMeal = {
              name?: string;
              cal?: number;
              pro?: number;
              carb?: number;
              fat?: number;
              mins?: number;
              ingredients?: string[];
            };
            type GeneratedDay = {
              breakfast?: GeneratedMeal;
              lunch?: GeneratedMeal;
              dinner?: GeneratedMeal;
            };

            const todayBase = new Date();
            const slots: Array<{
              dayIndex: number;
              slot: 'breakfast' | 'lunch' | 'dinner';
              meal: GeneratedMeal;
            }> = [];

            (meal_plan.slice(0, 7) as GeneratedDay[]).forEach((day, i) => {
              (['breakfast', 'lunch', 'dinner'] as const).forEach((slot) => {
                const meal = day[slot];
                if (meal?.name) {
                  slots.push({ dayIndex: i, slot, meal });
                }
              });
            });

            if (slots.length > 0) {
              // Step 1: insert every generated meal into meals
              // and get back real ids
              const { data: insertedMeals, error: insertErr } =
                await supabaseAdmin
                  .from('meals')
                  .insert(
                    slots.map(({ slot, meal }) => ({
                      name: meal.name ?? 'Untitled meal',
                      category: slot,
                      calories: Math.round(meal.cal ?? 0),
                      cuisine_type: null,
                      prep_time_mins: meal.mins ?? null,
                      ingredient_ids: [],
                    }))
                  )
                  .select('id');

              if (!insertErr && insertedMeals) {
                // Step 2: map each new meal id back onto its
                // day/slot, then build one meal_plans row per day
                const idBySlot = new Map<string, string>();
                slots.forEach((s, idx) => {
                  idBySlot.set(`${s.dayIndex}-${s.slot}`, insertedMeals[idx]?.id);
                });

                const planRows = Array.from({ length: 7 }, (_, i) => {
                  const d = new Date(todayBase);
                  d.setDate(d.getDate() + i);
                  const planDate = d.toISOString().slice(0, 10);
                  return {
                    user_id: reqUserId,
                    plan_date: planDate,
                    breakfast_meal_id: idBySlot.get(`${i}-breakfast`) ?? null,
                    lunch_meal_id: idBySlot.get(`${i}-lunch`) ?? null,
                    dinner_meal_id: idBySlot.get(`${i}-dinner`) ?? null,
                    logged_meals: [],
                  };
                }).filter(
                  (r) => r.breakfast_meal_id || r.lunch_meal_id || r.dinner_meal_id
                );

                if (planRows.length > 0) {
                  await supabaseAdmin
                    .from('meal_plans')
                    .upsert(planRows, { onConflict: 'user_id,plan_date' });
                }
              } else if (insertErr) {
                console.error(
                  '[ai-health-assistant] meals insert failed:',
                  insertErr
                );
              }
            }
          }
        } catch (persistErr) {
          // Non-fatal: still return the plan to the client
          // even if persistence fails, but log for debugging.
          console.error(
            '[ai-health-assistant] meal plan persist failed:',
            persistErr
          );
        }
      };

      // Persist in the background — the client already has the
      // full meal plan from this response and does not need to
      // wait on these writes. This is what previously caused the
      // function to run past its execution window (EarlyDrop).
      // @ts-ignore EdgeRuntime is a Deno Deploy global, not typed in this project's tsconfig
      if (typeof EdgeRuntime !== 'undefined') {
        // @ts-ignore
        EdgeRuntime.waitUntil(persistMealPlan());
      } else {
        void persistMealPlan();
      }

      return new Response(JSON.stringify({ meal_plan, grocery_list }), {
        headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' },
      });
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        return new Response(JSON.stringify({ error: msg, raw: dietText.slice(0, 2000) }), {
          status: 422,
          headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' },
        });
      }
    }

    const { messages, context, product_name, ingredient_name, diet_meal_name } = body;
    if (!messages?.length) throw new Error('messages required');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Build system message with user context
    let system = SYSTEM_PROMPT;
    if (context) system += `\n\nUser context: ${context}`;
    if (product_name) system += `\n\nCurrently discussing product: "${product_name}"`;
    if (ingredient_name) system += `\nIngredient of focus: "${ingredient_name}"`;
    if (diet_meal_name) {
      system += `\n\nThe user is asking about this meal or diet item: "${diet_meal_name}". Tailor nutrition and habit guidance to this specific meal.`;
    }

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system,
      messages: messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
    });

    const replyText = response.content
      .filter((b) => b.type === 'text')
      .map((b) => (b as { type: 'text'; text: string }).text)
      .join('');

    const { cleanReply, specialty_suggestion: parsedSpecialty } = parseSpecialtySuggestionFromReply(replyText);
    let replyForUser = cleanReply;

    // Determine if a specialist recommendation is warranted
    // by checking for medical keywords in the query
    const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user')?.content ?? '';
    const medicalKeywords =
      /find.*specialist|book.*appointment|see.*doctor|need.*physician|refer.*me/i;
    let specialist_recommendation = null;

    if (medicalKeywords.test(lastUserMsg) && !parsedSpecialty) {
      const { data: specialist } = await supabase
        .from('professionals')
        .select('id, name, specialty')
        .order('rating', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (specialist) {
        specialist_recommendation = {
          specialist_id: specialist.id,
          name: specialist.name,
          title: (specialist.specialty as string | null) ?? 'Health Specialist',
          reason: 'Based on your question, speaking with a specialist could provide personalized guidance for your situation.',
        };
      }
    }

    return new Response(
      JSON.stringify({
        reply: replyForUser,
        specialist_recommendation: parsedSpecialty ? null : specialist_recommendation,
        specialty_suggestion: parsedSpecialty,
      }),
      { headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    // Log to Supabase Edge Function logs for traceability
    console.error('[ai-health-assistant] Error:', message, err);
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
    );
  }
});
