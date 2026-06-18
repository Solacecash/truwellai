import { normalizeAiMealPlanDays, type AiDayPlan } from './savePersonalizedMealPlan';
import { supabase } from './supabase';

export async function scanBarcode(barcode: string) {
  const { data, error } = await supabase.functions.invoke('scan-barcode', {
    body: { barcode },
  });
  if (error) throw new Error(error.message);
  return data as Record<string, unknown>;
}

export async function scanOcr(imageBase64: string) {
  const { data, error } = await supabase.functions.invoke('scan-ocr', {
    body: { imageBase64 },
  });
  if (error) throw new Error(error.message);
  return data as Record<string, unknown>;
}

export async function fetchAlternatives(filters: {
  excludeBarcode?: string;
  brand?: string;
  /** Exact match on products.price_band, e.g. $, $$, $$$ */
  priceBand?: string;
}) {
  const { data, error } = await supabase.functions.invoke('alternatives-search', {
    body: filters,
  });
  if (error) throw new Error(error.message);
  return data as { items: AltDto[] };
}

export type AltDto = {
  id: string;
  name: string;
  brand: string;
  grade: string;
  score: number;
  priceBand?: string;
  imageUrl?: string;
};

export async function sendAssistantMessage(
  messages: { role: string; content: string }[],
  context?: string
) {
  const { data, error } = await supabase.functions.invoke('assistant', {
    body: { messages, ...(context ? { context } : {}) },
  });
  if (error) throw new Error(error.message);
  return data as { reply: string };
}

export interface AiHealthAssistantResponse {
  reply: string;
  specialist_recommendation?: {
    specialist_id: string;
    name: string;
    title: string;
    reason: string;
  } | null;
  specialty_suggestion?: {
    specialty: string;
    reason: string;
    cta: string;
  } | null;
}

/** Map raw Edge Function / network errors to user-friendly messages. */
function friendlyError(raw: string): string {
  if (/credit balance|too low|billing|upgrade or purchase/i.test(raw)) {
    return "The assistant is temporarily offline. Service is being restored -- please try again shortly.";
  }
  if (/rate.?limit|too many/i.test(raw) || raw.includes('429')) {
    return "You're sending messages quickly. Please wait a few seconds.";
  }
  if (/unavailable|overloaded|503|502/i.test(raw)) {
    return "The assistant is temporarily unavailable. We're on it -- please try again shortly.";
  }
  if (/api.?key|unauthorized|401/i.test(raw)) {
    return "The assistant is temporarily unavailable. Please try again shortly.";
  }
  if (/non-2xx/i.test(raw) || /fetch/i.test(raw)) {
    return "I'm having trouble connecting right now. Please try again in a moment.";
  }
  return "I'm having trouble responding. Please try again in a moment.";
}

export async function invokeAiHealthAssistant(payload: {
  messages: { role: string; content: string }[];
  context?: string;
  product_name?: string;
  ingredient_name?: string;
  diet_meal_name?: string;
}): Promise<AiHealthAssistantResponse> {
  if (__DEV__) console.log('[ai] invoking ai-health-assistant with', {
    messageCount: payload.messages.length,
    hasContext: !!payload.context,
    contextLen: payload.context?.length ?? 0,
    product_name: payload.product_name,
    ingredient_name: payload.ingredient_name,
  });
  const { data, error } = await supabase.functions.invoke('ai-health-assistant', {
    body: payload,
  });
  if (error) {
    // FunctionsHttpError exposes .context (the Response object). Try to read the
    // actual response body so we can surface the real server error rather than
    // the generic "Edge Function returned a non-2xx status code".
    let bodyError: string | null = (data as { error?: string } | null)?.error ?? null;
    try {
      const ctx = (error as unknown as { context?: Response }).context;
      if (!bodyError && ctx && typeof ctx.text === 'function') {
        const txt = await ctx.text();
        if (__DEV__) console.log('[ai] edge response body:', txt);
        try {
          const parsed = JSON.parse(txt) as { error?: string };
          if (parsed?.error) bodyError = parsed.error;
        } catch {
          if (txt) bodyError = txt;
        }
      }
    } catch (readErr) {
      if (__DEV__) console.log('[ai] failed to read edge error body:', readErr);
    }
    const raw = bodyError ?? error.message;
    if (__DEV__) console.log('[ai] invocation error:', { rawError: error.message, bodyError, name: error.name });
    throw new Error(friendlyError(raw));
  }
  const d = data as AiHealthAssistantResponse;
  if (__DEV__) console.log('[ai] success: reply chars =', (d.reply ?? '').length);
  return {
    reply: d.reply ?? '',
    specialist_recommendation: d.specialist_recommendation ?? null,
    specialty_suggestion: d.specialty_suggestion ?? null,
  };
}

// ---------------------------------------------------------------------------
// Voice: TTS (text-to-speech) and STT (speech-to-text)
// ---------------------------------------------------------------------------

export interface TtsSynthesisResult {
  audio_base64: string;
  mime: string;
  chars: number;
}

/** Extract the real error message from a Supabase Functions invocation error. */
async function extractFnError(
  data: unknown,
  error: { message: string; context?: unknown }
): Promise<string> {
  let bodyError: string | null = (data as { error?: string } | null)?.error ?? null;
  try {
    const ctx = (error as unknown as { context?: Response }).context;
    if (!bodyError && ctx && typeof ctx.text === 'function') {
      const txt = await ctx.text();
      try {
        const parsed = JSON.parse(txt) as { error?: string };
        if (parsed?.error) bodyError = parsed.error;
      } catch { if (txt) bodyError = txt; }
    }
  } catch { /* ignore */ }
  return bodyError ?? error.message;
}

/**
 * Primary TTS — Google Cloud Neural2 voices via the `tts-google` Edge Function.
 * Returns base64 MP3.
 */
export async function invokeGoogleTtsSynthesis(payload: {
  text: string;
  voice: string;
}): Promise<TtsSynthesisResult> {
  const { data, error } = await supabase.functions.invoke('tts-google', {
    body: payload,
  });
  if (error) throw new Error(await extractFnError(data, error));
  const d = data as TtsSynthesisResult;
  if (!d.audio_base64) throw new Error('No audio returned from Google TTS.');
  return d;
}

/**
 * Fallback TTS — OpenAI tts-1-hd via the `tts-synthesize` Edge Function.
 * Returns base64 MP3.
 */
export async function invokeTtsSynthesis(payload: {
  text: string;
  voice: string;
}): Promise<TtsSynthesisResult> {
  const { data, error } = await supabase.functions.invoke('tts-synthesize', {
    body: payload,
  });
  if (error) throw new Error(await extractFnError(data, error));
  const d = data as TtsSynthesisResult;
  if (!d.audio_base64) throw new Error('No audio returned from OpenAI TTS.');
  return d;
}

export interface SttTranscriptionResult {
  text: string;
  duration_ms?: number;
}

/**
 * Transcribe a recorded audio clip via the `stt-transcribe` Edge Function
 * (OpenAI whisper-1). Expects a raw base64-encoded audio file.
 */
export async function invokeSttTranscription(payload: {
  audio_base64: string;
  mime_type?: string;
  filename?: string;
  language?: string;
}): Promise<SttTranscriptionResult> {
  const { data, error } = await supabase.functions.invoke('stt-transcribe', {
    body: payload,
  });
  if (error) {
    let bodyError: string | null = (data as { error?: string } | null)?.error ?? null;
    try {
      const ctx = (error as unknown as { context?: Response }).context;
      if (!bodyError && ctx && typeof ctx.text === 'function') {
        const txt = await ctx.text();
        try {
          const parsed = JSON.parse(txt) as { error?: string };
          if (parsed?.error) bodyError = parsed.error;
        } catch { if (txt) bodyError = txt; }
      }
    } catch { /* ignore */ }
    throw new Error(bodyError ?? error.message);
  }
  const d = data as SttTranscriptionResult;
  return { text: d.text ?? '', duration_ms: d.duration_ms };
}

export type FoodAnalysisResult = {
  food_name: string;
  calories: number;
  calories_per_serving?: number;
  serving_size_g?: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g: number;
  sugar_g?: number;
  confidence: 'high' | 'medium' | 'low';
  detected_ingredients?: string[];
  glycemic_index?: 'low' | 'medium' | 'high';
  insulin_risk?: boolean;
  weekly_calorie_impact?: number;
  monthly_weight_risk_kg?: number;
  daily_consumption_warning?: string | null;
  notes: string | null;
  foodName?: string;
  cuisineRegion?: string;
  cookingMethod?: string;
  portionDescription?: string;
  caloriesKcal?: number;
  proteinG?: number;
  carbsG?: number;
  fatG?: number;
  fiberG?: number;
  confidenceScore?: number;
  aiEstimated?: boolean;
  grade?: string;
  score?: number;
};

function mapFoodAnalysisFromEdge(data: Record<string, unknown>): FoodAnalysisResult {
  const confScore = typeof data.confidenceScore === 'number' ? data.confidenceScore : null;
  const confidence: FoodAnalysisResult['confidence'] =
    confScore != null
      ? confScore >= 0.8
        ? 'high'
        : confScore >= 0.5
          ? 'medium'
          : 'low'
      : 'medium';

  const calories = Number(data.caloriesKcal ?? data.calories ?? 0);
  const components = Array.isArray(data.components)
    ? (data.components as { name?: string }[]).map((c) => String(c.name ?? '')).filter(Boolean)
    : undefined;
  const ingredientNames = Array.isArray(data.ingredients)
    ? (data.ingredients as { name?: string }[]).map((i) => String(i.name ?? '')).filter(Boolean)
    : undefined;

  const foodName = String(data.foodName ?? data.food_name ?? 'Unknown meal');

  return {
    food_name: foodName,
    foodName,
    cuisineRegion: data.cuisineRegion != null ? String(data.cuisineRegion) : undefined,
    cookingMethod: data.cookingMethod != null ? String(data.cookingMethod) : undefined,
    portionDescription:
      data.portionDescription != null ? String(data.portionDescription) : undefined,
    calories,
    caloriesKcal: calories,
    calories_per_serving: calories,
    serving_size_g:
      data.portionWeightG != null ? Number(data.portionWeightG) : undefined,
    protein_g: Number(data.proteinG ?? data.protein_g ?? 0),
    proteinG: Number(data.proteinG ?? data.protein_g ?? 0),
    carbs_g: Number(data.carbsG ?? data.carbs_g ?? 0),
    carbsG: Number(data.carbsG ?? data.carbs_g ?? 0),
    fat_g: Number(data.fatG ?? data.fat_g ?? 0),
    fatG: Number(data.fatG ?? data.fat_g ?? 0),
    fiber_g: Number(data.fiberG ?? data.fiber_g ?? 0),
    fiberG: Number(data.fiberG ?? data.fiber_g ?? 0),
    sugar_g: data.sugarG != null ? Number(data.sugarG) : undefined,
    confidence,
    confidenceScore: confScore ?? undefined,
    aiEstimated: data.aiEstimated === true || data.aiEstimated === false
      ? Boolean(data.aiEstimated)
      : true,
    grade: data.grade != null ? String(data.grade) : undefined,
    score: data.score != null ? Number(data.score) : undefined,
    detected_ingredients: components ?? ingredientNames,
    notes: data.summary != null ? String(data.summary) : null,
    weekly_calorie_impact:
      typeof data.caloriesKcal === 'number' ? Math.round(Number(data.caloriesKcal) * 7) : undefined,
    monthly_weight_risk_kg:
      typeof data.caloriesKcal === 'number' && Number(data.caloriesKcal) > 600
        ? Number(((Number(data.caloriesKcal) * 30) / 7700).toFixed(1))
        : 0,
    daily_consumption_warning:
      typeof data.caloriesKcal === 'number' && Number(data.caloriesKcal) > 800
        ? 'High calorie meal if eaten daily'
        : null,
    insulin_risk: Number(data.sugarG ?? 0) > 25,
  };
}

export type OcrLabelResult = {
  product_type: 'food' | 'cosmetic' | 'supplement' | 'household' | 'unknown';
  detected_text: string;
  ingredients: string[];
  ingredient_count: number;
  high_risk_ingredients: Array<{ name: string; risk: 'high' | 'medium' | 'low'; reason: string }>;
  banned_substances_detected: string[];
  overall_grade: 'A' | 'B' | 'C' | 'D' | 'F';
  safety_score: number;
  summary: string;
  recommendations: string[];
};

export type RecallCheckResult = {
  recalled: boolean;
  recallReason: string | null;
  affectedBatches: string | null;
  recallDate: string | null;
  actionRequired: string | null;
  source: 'FDA' | 'NAFDAC' | 'EU' | 'WHO' | 'other' | 'none';
};

async function attemptOcrAnalysis(prefixed: string): Promise<OcrLabelResult> {
  const { data, error } = await supabase.functions.invoke('ai-health-assistant', {
    body: { task: 'ocr_label', ocr_image_base64: prefixed },
  });
  if (error) {
    const bodyError = (data as { error?: string } | null)?.error;
    throw new Error(bodyError ?? error.message);
  }
  const d = data as { ocr_analysis?: OcrLabelResult; error?: string } & Partial<OcrLabelResult>;
  if (d.error) throw new Error(d.error);
  const analysis = d.ocr_analysis ?? (d.ingredients !== undefined ? (d as unknown as OcrLabelResult) : null);
  if (!analysis) throw new Error('No OCR analysis returned');
  return analysis;
}

export async function invokeOcrLabelAnalysis(imageBase64: string): Promise<OcrLabelResult> {
  const prefixed = imageBase64.startsWith('data:')
    ? imageBase64
    : `data:image/jpeg;base64,${imageBase64}`;

  // Attempt 1 — full quality image
  try {
    const result = await attemptOcrAnalysis(prefixed);
    // If ingredients came back empty retry with hint
    if (result.ingredients.length === 0 && result.detected_text.length < 20) {
      throw new Error('Empty ingredients — retrying');
    }
    return result;
  } catch (firstError) {
    if (__DEV__) {
      console.warn(
        '[OCR] First attempt failed:',
        firstError instanceof Error ? firstError.message : firstError
      );
    }
  }

  // Attempt 2 — retry same image with explicit hint
  try {
    const { data, error } = await supabase.functions.invoke('ai-health-assistant', {
      body: {
        task: 'ocr_label',
        ocr_image_base64: prefixed,
        hint: 'Focus on the ingredients list section. Extract every word in the ingredients panel. This may be a cosmetic, food, supplement, or household product label.',
      },
    });
    if (!error && data) {
      const d = data as { ocr_analysis?: OcrLabelResult; error?: string };
      if (d.ocr_analysis) return d.ocr_analysis;
    }
  } catch (secondError) {
    if (__DEV__) {
      console.warn(
        '[OCR] Second attempt failed:',
        secondError instanceof Error ? secondError.message : secondError
      );
    }
  }

  // Fallback — return a minimal valid result so the user
  // sees a scan result screen rather than a crash
  const fallback: OcrLabelResult = {
    product_type: 'unknown',
    detected_text: '',
    ingredients: [],
    ingredient_count: 0,
    high_risk_ingredients: [],
    banned_substances_detected: [],
    overall_grade: 'C',
    safety_score: 50,
    summary:
      'Label could not be fully read. Try better lighting, move closer, and ensure the ingredients list is fully in frame.',
    recommendations: [
      'Ensure good lighting with no glare on the label',
      'Hold the camera 15-20cm from the label',
      'Make sure the full ingredients list is visible',
    ],
  };
  return fallback;
}

export async function invokeRecallCheck(payload: {
  batch_number?: string;
  product_name?: string;
  gtin?: string;
  expiry_date?: string;
}): Promise<RecallCheckResult> {
  const { data, error } = await supabase.functions.invoke('ai-health-assistant', {
    body: { task: 'recall_check', recall_payload: payload },
  });
  if (error) {
    const bodyError = (data as { error?: string } | null)?.error;
    throw new Error(bodyError ?? error.message);
  }
  const d = data as { recall_check?: RecallCheckResult; error?: string };
  if (d.error) throw new Error(d.error);
  if (!d.recall_check) {
    return {
      recalled: false,
      recallReason: null,
      affectedBatches: null,
      recallDate: null,
      actionRequired: null,
      source: 'none',
    };
  }
  return d.recall_check;
}

export type DietPersonalizationResponse = {
  meal_plan: AiDayPlan[];
  grocery_list: string[];
};

export async function invokeDietPersonalization(
  personalization: Record<string, unknown>
): Promise<DietPersonalizationResponse> {
  const { data, error } = await supabase.functions.invoke('ai-health-assistant', {
    body: { diet_personalization: true, personalization },
  });
  if (error) {
    const bodyError = (data as { error?: string } | null)?.error;
    throw new Error(bodyError ?? error.message);
  }
  const d = data as {
    meal_plan?: AiDayPlan[];
    grocery_list?: string[];
    error?: string;
  };
  if (d.error) throw new Error(d.error);
  if (!Array.isArray(d.meal_plan)) throw new Error('Invalid meal plan from assistant');
  return {
    meal_plan: normalizeAiMealPlanDays(d.meal_plan as unknown[]),
    grocery_list: Array.isArray(d.grocery_list) ? d.grocery_list.map(String) : [],
  };
}

export async function invokeFoodImageAnalysis(imageBase64: string): Promise<FoodAnalysisResult> {
  const { data, error } = await supabase.functions.invoke(
    'scan-ingredient-analysis', {
    body: { imageBase64, scanType: 'visual_ai' },
  });

  if (!error && data) {
    const d = data as Record<string, unknown> & {
      error?: string };
    if (!d.error) {
      const result = mapFoodAnalysisFromEdge(d);
      // If Claude returned a real result with confidence
      // and actual calories — return it directly
      if (
        result.confidence !== 'low' &&
        result.calories > 0 &&
        result.food_name !== 'Unknown meal'
      ) {
        return result;
      }
    }
  }

  // Fallback: try OpenAI GPT-4o vision via edge function
  try {
    const { data: d2, error: e2 } =
      await supabase.functions.invoke('ai-health-assistant', {
        body: {
          food_image_base64: imageBase64.startsWith('data:')
            ? imageBase64
            : `data:image/jpeg;base64,${imageBase64}`,
          use_openai_fallback: true,
        },
      });
    if (!e2 && d2) {
      const fd = d2 as Record<string, unknown>;
      if (fd.food_analysis) {
        return mapFoodAnalysisFromEdge(
          fd.food_analysis as Record<string, unknown>
        );
      }
      if (fd.calories || fd.caloriesKcal) {
        return mapFoodAnalysisFromEdge(fd);
      }
    }
  } catch { /* fall through to original result */ }

  // Return original result even if low confidence
  if (!error && data) {
    const d = data as Record<string, unknown> & {
      error?: string };
    if (!d.error) return mapFoodAnalysisFromEdge(d);
  }

  throw new Error(
    error?.message ?? 'Food analysis failed'
  );
}

// ---------------------------------------------------------------------------
// Telehealth: specialist directory (bypasses RLS via service role)
// ---------------------------------------------------------------------------

export type SpecialistDto = {
  id: string;
  user_id: string | null;
  name: string;
  title: string | null;
  specialties: string[] | null;
  rating: number | null;
  review_count: number | null;
  price_per_session: number | null;
  next_available: string | null;
  avatar_url: string | null;
  bio: string | null;
  languages: string[] | null;
  is_online_now: boolean | null;
  latitude: number | null;
  longitude: number | null;
  country_code: string | null;
  continent: string | null;
  years_experience: number | null;
  kyc_status: string | null;
  license_verified: boolean | null;
};

export async function getSpecialists(): Promise<never[]> {
  return [];
}

export interface ProcessPaymentResult {
  appointmentId: string;
  bookingId: string;
  checkoutUrl: string | null;
  amountCents: number;
  currency: string;
  /** true when price_per_session = 0 */
  free: boolean;
}

export async function processPayment(payload: {
  specialist_id: string;
  slot_id: string;
  slot_start: string;
  slot_end: string;
  checkout_success_base?: string;
}): Promise<ProcessPaymentResult> {
  const { data, error } = await supabase.functions.invoke('process-payment', {
    body: payload,
  });
  if (error) throw new Error(error.message);
  return data as ProcessPaymentResult;
}

export async function sendPushNotification(payload: {
  user_id?: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
}): Promise<void> {
  const { error } = await supabase.functions.invoke('send-notification', {
    body: payload,
  });
  if (error) throw new Error(error.message);
}


// ---------------------------------------------------------------------------
// Voice: NVIDIA NIM cloud TTS (Edge Functions)
// ---------------------------------------------------------------------------

export interface NimTtsSynthesizePayload {
  text: string;
  voice?: string;
  languageCode?: string;
}

export interface NimTtsSynthesizeResult {
  audioContent: string;
  contentType: string;
  durationMs: number;
}

export interface NimTtsHealthResult {
  ready: boolean;
  ttsEnabled: boolean;
  timestamp?: string;
}

export async function invokeNimTtsHealth(): Promise<NimTtsHealthResult> {
  const { data, error } = await supabase.functions.invoke('nim-tts-health', {
    method: 'GET',
  });
  if (error) {
    return { ready: false, ttsEnabled: true, timestamp: new Date().toISOString() };
  }
  const d = data as NimTtsHealthResult | null;
  return {
    ready: !!d?.ready,
    ttsEnabled: d?.ttsEnabled ?? true,
    timestamp: d?.timestamp ?? new Date().toISOString(),
  };
}

export async function invokeNimTtsSynthesize(
  payload: NimTtsSynthesizePayload
): Promise<NimTtsSynthesizeResult> {
  const { data, error } = await supabase.functions.invoke('nim-tts-synthesize', {
    body: {
      text: payload.text,
      voice: payload.voice,
      languageCode: payload.languageCode,
    },
  });
  if (error) throw new Error(await extractFnError(data, error));
  const d = data as NimTtsSynthesizeResult;
  if (!d?.audioContent) throw new Error('No audio returned from NIM TTS.');
  return d;
}

// ---------------------------------------------------------------------------
// Food scan history
// ---------------------------------------------------------------------------

export type FoodScanRecord = {
  id: string;
  scanned_at: string;
  scan_type: 'barcode' | 'visual_ai' | 'ocr' | 'manual';
  food_name: string | null;
  brand_name: string | null;
  cuisine_region: string | null;
  calories_kcal: number | null;
  protein_g: number | null;
  carbs_g: number | null;
  fat_g: number | null;
  fiber_g: number | null;
  safety_grade: string | null;
  safety_score: number | null;
  portion_description: string | null;
  cooking_method: string | null;
  meal_type: string | null;
  image_url: string | null;
  confidence_score: number | null;
  ai_estimated: boolean;
  deleted_at: string | null;
};

export type DailyCalorieSummary = {
  log_date: string;
  item_count: number;
  total_calories: number;
  total_protein_g: number;
  total_carbs_g: number;
  total_fat_g: number;
};

export async function logFoodScan(
  userId: string,
  record: Omit<FoodScanRecord, 'id' | 'scanned_at' | 'deleted_at'>
): Promise<string | null> {
  const { data, error } = await supabase
    .from('food_scan_history')
    .insert({ ...record, user_id: userId })
    .select('id')
    .single();
  if (error) {
    if (__DEV__) console.error('[logFoodScan]', error);
    return null;
  }
  return data.id;
}

export async function getFoodScanHistory(
  userId: string,
  limit = 30,
  offset = 0,
  scanType?: string
): Promise<FoodScanRecord[]> {
  let query = supabase
    .from('food_scan_history')
    .select('*')
    .eq('user_id', userId)
    .is('deleted_at', null)
    .order('scanned_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (scanType) {
    query = query.eq('scan_type', scanType);
  }

  const { data, error } = await query;
  if (error) return [];
  return (data ?? []) as FoodScanRecord[];
}

export async function deleteFoodScanRecord(
  userId: string,
  recordId: string
): Promise<boolean> {
  const { error } = await supabase
    .from('food_scan_history')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', recordId)
    .eq('user_id', userId);
  return !error;
}

export async function restoreFoodScanRecord(
  userId: string,
  recordId: string
): Promise<boolean> {
  const { error } = await supabase
    .from('food_scan_history')
    .update({ deleted_at: null })
    .eq('id', recordId)
    .eq('user_id', userId);
  return !error;
}

export async function wipeScanHistory(
  userId: string
): Promise<boolean> {
  const { error } = await supabase
    .from('food_scan_history')
    .update({ deleted_at: new Date().toISOString() })
    .eq('user_id', userId)
    .is('deleted_at', null);
  return !error;
}

export async function getDailyCalorieSummary(
  userId: string,
  days = 7
): Promise<DailyCalorieSummary[]> {
  const since = new Date();
  since.setDate(since.getDate() - days);
  const { data, error } = await supabase
    .from('daily_calorie_summary')
    .select('*')
    .eq('user_id', userId)
    .gte('log_date', since.toISOString().slice(0, 10))
    .order('log_date', { ascending: false });
  if (error) return [];
  return (data ?? []) as DailyCalorieSummary[];
}
