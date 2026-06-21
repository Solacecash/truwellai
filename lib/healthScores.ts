import type { Grade } from '@/components/ui/GradeCard';
import type { GradedIngredient, ScanResultPayload } from '@/stores/scanStore';
import { logFoodScan } from '@/lib/edge';
import { supabase } from '@/lib/supabase';

export type LiveHealthMetrics = {
  overallScore: number;
  overallGrade: Grade | null;
  skinSafetyPct: number;
  ingredientPurityPct: number;
  allergenRiskPct: number;
  scanCount: number;
};

type ScorableIngredient = {
  name?: string;
  traffic?: string;
  safety_rating?: string;
  risk?: string;
};

export type ScanRow = {
  score?: number | null;
  grade?: string | null;
  result_summary?: unknown;
  raw_payload?: unknown;
  skin_safety_pct?: number | null;
  ingredient_purity_pct?: number | null;
  allergen_risk_pct?: number | null;
  personalized_risk_flags?: string[] | null;
};

function normalizeTraffic(raw?: string): 'safe' | 'moderate' | 'avoid' {
  const t = (raw ?? '').toLowerCase();
  if (t === 'safe' || t === 'green') return 'safe';
  if (t === 'avoid' || t === 'red' || t === 'high') return 'avoid';
  return 'moderate';
}

function toGrade(score: number): Grade {
  if (score >= 95) return 'A+';
  if (score >= 85) return 'A';
  if (score >= 70) return 'B';
  if (score >= 55) return 'C';
  if (score >= 40) return 'D';
  return 'F';
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object') return null;
  return value as Record<string, unknown>;
}

function parseSummary(value: unknown): Record<string, unknown> | null {
  if (typeof value === 'string') {
    try {
      return asRecord(JSON.parse(value));
    } catch {
      return null;
    }
  }
  return asRecord(value);
}

function extractIngredients(row: ScanRow): ScorableIngredient[] {
  const summary = parseSummary(row.result_summary);
  const payload = asRecord(row.raw_payload);
  const fromSummary = summary?.ingredients;
  if (Array.isArray(fromSummary) && fromSummary.length > 0) {
    return fromSummary as ScorableIngredient[];
  }
  const fromPayloadList = payload?.ingredientsList;
  if (Array.isArray(fromPayloadList) && fromPayloadList.length > 0) {
    return fromPayloadList as ScorableIngredient[];
  }
  const names = payload?.ingredients;
  if (Array.isArray(names) && names.length > 0) {
    return names.map((name) => ({ name: String(name) }));
  }
  const highRisk = summary?.high_risk_ingredients;
  if (Array.isArray(highRisk) && highRisk.length > 0) {
    return highRisk as ScorableIngredient[];
  }
  return [];
}

function extractRiskNotes(row: ScanRow): string[] {
  const summary = parseSummary(row.result_summary);
  const notes = summary?.riskNotes ?? summary?.risk_notes;
  if (Array.isArray(notes)) return notes.map(String);
  const flags = row.personalized_risk_flags;
  if (Array.isArray(flags)) return flags;
  return [];
}

export function computeMetricsFromIngredients(
  ingredients: ScorableIngredient[],
  riskNotes: string[] = []
): Omit<LiveHealthMetrics, 'scanCount'> {
  const total = Math.max(1, ingredients.length);
  let safeCount = 0;
  let safeOrModerate = 0;

  for (const ing of ingredients) {
    const traffic = normalizeTraffic(ing.traffic ?? ing.safety_rating ?? ing.risk);
    if (traffic === 'safe') {
      safeCount += 1;
      safeOrModerate += 1;
    } else if (traffic === 'moderate') {
      safeOrModerate += 1;
    }
  }

  const allergenMatches = riskNotes.filter((n) =>
    /allerg|sensitiv|matches your|intoleran/i.test(n)
  ).length;

  let overallScore = 100;
  for (const ing of ingredients) {
    const traffic = normalizeTraffic(ing.traffic ?? ing.safety_rating ?? ing.risk);
    if (traffic === 'avoid') overallScore -= 15;
    else if (traffic === 'moderate') overallScore -= 5;
  }
  overallScore -= allergenMatches * 25;
  overallScore = Math.max(0, overallScore);

  const skinSafetyPct = Math.round((safeCount / total) * 100);
  const ingredientPurityPct = Math.round((safeOrModerate / total) * 100);
  const allergenRiskPct = Math.max(0, 100 - Math.round((allergenMatches / total) * 100));

  return {
    overallScore,
    overallGrade: toGrade(overallScore),
    skinSafetyPct,
    ingredientPurityPct,
    allergenRiskPct,
  };
}

function metricsFromScanRow(row: ScanRow): Omit<LiveHealthMetrics, 'scanCount'> | null {
  if (
    row.skin_safety_pct != null &&
    row.ingredient_purity_pct != null &&
    row.allergen_risk_pct != null
  ) {
    const overallScore = row.score ?? Math.round(
      (row.skin_safety_pct + row.ingredient_purity_pct + row.allergen_risk_pct) / 3
    );
    return {
      overallScore,
      overallGrade: toGrade(overallScore),
      skinSafetyPct: row.skin_safety_pct,
      ingredientPurityPct: row.ingredient_purity_pct,
      allergenRiskPct: row.allergen_risk_pct,
    };
  }

  const ingredients = extractIngredients(row);
  const riskNotes = extractRiskNotes(row);
  if (ingredients.length > 0) {
    return computeMetricsFromIngredients(ingredients, riskNotes);
  }

  if (row.score != null && row.score > 0) {
    const s = Math.round(row.score);
    const penalty = Math.min(60, riskNotes.length * 12);
    return {
      overallScore: s,
      overallGrade: toGrade(s),
      skinSafetyPct: s,
      ingredientPurityPct: Math.max(0, s - Math.round(penalty / 2)),
      allergenRiskPct: Math.max(0, 100 - penalty),
    };
  }

  return null;
}

export function aggregateLiveHealthMetrics(rows: ScanRow[]): LiveHealthMetrics | null {
  const perScan = rows.map(metricsFromScanRow).filter((m): m is Omit<LiveHealthMetrics, 'scanCount'> => m != null);
  if (perScan.length === 0) return null;

  const n = perScan.length;
  const totals = perScan.reduce(
    (acc, m) => ({
      overallScore: acc.overallScore + m.overallScore,
      skinSafetyPct: acc.skinSafetyPct + m.skinSafetyPct,
      ingredientPurityPct: acc.ingredientPurityPct + m.ingredientPurityPct,
      allergenRiskPct: acc.allergenRiskPct + m.allergenRiskPct,
    }),
    { overallScore: 0, skinSafetyPct: 0, ingredientPurityPct: 0, allergenRiskPct: 0 }
  );

  const overallScore = Math.round(totals.overallScore / n);
  return {
    overallScore,
    overallGrade: toGrade(overallScore),
    skinSafetyPct: Math.round(totals.skinSafetyPct / n),
    ingredientPurityPct: Math.round(totals.ingredientPurityPct / n),
    allergenRiskPct: Math.round(totals.allergenRiskPct / n),
    scanCount: n,
  };
}

type StoredUserScores = {
  overall_score?: number | null;
  overall_grade?: string | null;
  skin_safety_pct?: number | null;
  ingredient_purity_pct?: number | null;
  allergen_risk_pct?: number | null;
};

export function resolveLiveHealthMetrics(
  stored: StoredUserScores | null | undefined,
  scanRows: ScanRow[]
): LiveHealthMetrics {
  const fromScans = aggregateLiveHealthMetrics(scanRows);
  if (fromScans) return fromScans;

  const overallScore = stored?.overall_score ?? 0;
  return {
    overallScore,
    overallGrade: overallScore > 0 ? toGrade(overallScore) : null,
    skinSafetyPct: stored?.skin_safety_pct ?? 0,
    ingredientPurityPct: stored?.ingredient_purity_pct ?? 0,
    allergenRiskPct: stored?.allergen_risk_pct ?? 0,
    scanCount: 0,
  };
}

export async function refreshUserScoresFromAllScans(userId: string): Promise<void> {
  const [scansRes, historyRes] = await Promise.all([
    supabase
      .from('scans')
      .select('score, grade, result_summary, raw_payload')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(40),
    supabase
      .from('scan_history')
      .select(
        'overall_score, overall_grade, skin_safety_pct, ingredient_purity_pct, allergen_risk_pct, personalized_risk_flags'
      )
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(40),
  ]);

  const fromScans = (scansRes.data ?? []).map((r) => ({
    score: r.score,
    grade: r.grade,
    result_summary: r.result_summary,
    raw_payload: r.raw_payload,
  }));

  const fromHistory = (historyRes.data ?? []).map((r) => ({
    score: r.overall_score,
    grade: r.overall_grade,
    skin_safety_pct: r.skin_safety_pct,
    ingredient_purity_pct: r.ingredient_purity_pct,
    allergen_risk_pct: r.allergen_risk_pct,
    personalized_risk_flags: r.personalized_risk_flags,
  }));

  const metrics = aggregateLiveHealthMetrics(fromScans.length > 0 ? fromScans : fromHistory);
  if (!metrics) return;

  try {
    await supabase.from('user_scores').upsert(
      {
        user_id: userId,
        overall_score: metrics.overallScore,
        overall_grade: metrics.overallGrade,
        skin_safety_pct: metrics.skinSafetyPct,
        ingredient_purity_pct: metrics.ingredientPurityPct,
        allergen_risk_pct: metrics.allergenRiskPct,
        calculated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    );
  } catch {
    /* table may be absent */
  }
}

export async function persistScanResult(
  userId: string,
  result: ScanResultPayload,
  barcode?: string
): Promise<void> {
  const metrics = computeMetricsFromIngredients(result.ingredients, result.riskNotes ?? []);
  const score = Math.round(result.personalizedScore ?? result.score ?? metrics.overallScore);
  const riskFlags = result.riskNotes ?? [];

  try {
    await supabase.from('scans').insert({
      user_id: userId,
      mode: 'ingredient',
      scan_method: result.scanMethod ?? 'barcode',
      raw_payload: {
        barcode: barcode ?? result.barcode ?? null,
        productName: result.productName ?? null,
        ingredients: result.ingredients.map((i) => i.name),
        ingredientsList: result.ingredients,
      },
      grade: result.grade,
      score,
      result_summary: {
        ...result,
        skinSafetyPct: metrics.skinSafetyPct,
        ingredientPurityPct: metrics.ingredientPurityPct,
        allergenRiskPct: metrics.allergenRiskPct,
      },
    });
  } catch {
    /* non-fatal */
  }

  try {
    await supabase.from('scan_history').insert({
      user_id: userId,
      overall_score: score,
      overall_grade: result.grade,
      skin_safety_pct: metrics.skinSafetyPct,
      ingredient_purity_pct: metrics.ingredientPurityPct,
      allergen_risk_pct: metrics.allergenRiskPct,
      personalized_risk_flags: riskFlags,
    });
  } catch {
    /* legacy table may be absent */
  }
  try {
    // Also log to food_scan_history so barcode and ingredient
    // scans appear in the same unified history screen that
    // food/calorie scans already display correctly in.
    const mappedScanType =
      result.scanMethod === 'qr' || result.scanMethod === 'barcode'
        ? 'barcode'
        : result.scanMethod === 'ocr'
        ? 'ocr'
        : 'manual';
    await logFoodScan(userId, {
      scan_type: mappedScanType,
      food_name: result.productName ?? null,
      brand_name: null,
      cuisine_region: null,
      calories_kcal: null,
      protein_g: null,
      carbs_g: null,
      fat_g: null,
      fiber_g: null,
      safety_grade: result.grade,
      safety_score: score,
      portion_description: null,
      cooking_method: null,
      meal_type: null,
      image_url: null,
      confidence_score: result.personalizedScore ?? null,
      ai_estimated: true,
    });
  } catch {
    /* non-fatal — unified history is best-effort */
  }
  await refreshUserScoresFromAllScans(userId);
}
