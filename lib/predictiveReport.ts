import { supabase } from './supabase';

export interface PredictiveImpactRiskFlag {
  condition: string;
  risk: 'high' | 'medium' | 'low';
  explanation: string;
}

export interface PredictiveImpactIngredientWarning {
  ingredient: string;
  warning: string;
  affectedConditions: string[];
}

export interface PredictiveImpactCalorieImpact {
  dailyCalories: number;
  weeklyImpact: string;
  monthlyImpact: string;
  weightRiskPerMonth: number;
}

export interface PredictiveImpact {
  shortTerm: string[];
  longTerm: string[];
  riskFlags: PredictiveImpactRiskFlag[];
  calorieImpact?: PredictiveImpactCalorieImpact | null;
  ingredientWarnings: PredictiveImpactIngredientWarning[];
  overallRiskScore: number;
  recommendation: 'avoid' | 'limit' | 'safe' | 'excellent';
  upgradeRequired: boolean;
}

export interface PredictiveReportQuota {
  canAccess: boolean;
  remaining: number;
  used: number;
  limit: number;
  isPro: boolean;
}

const FREE_MONTHLY_LIMIT = 5;

/**
 * Check how many predictive reports this user has left this month.
 * Pro/Premium users always have access. Source of truth for tier is
 * `profiles.subscription_plan`.
 */
export async function checkPredictiveReportQuota(userId: string): Promise<PredictiveReportQuota> {
  const { data: profile } = await supabase
    .from('profiles')
    .select('subscription_plan')
    .eq('id', userId)
    .maybeSingle();

  const plan = (profile as { subscription_plan?: string } | null)?.subscription_plan ?? 'free';
  const isPro = plan !== 'free';
  if (isPro) {
    return { canAccess: true, remaining: Infinity, used: 0, limit: Infinity, isPro: true };
  }

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const { count } = await supabase
    .from('predictive_reports')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', startOfMonth.toISOString());

  const used = count ?? 0;
  const remaining = Math.max(0, FREE_MONTHLY_LIMIT - used);
  return {
    canAccess: remaining > 0,
    remaining,
    used,
    limit: FREE_MONTHLY_LIMIT,
    isPro: false,
  };
}

/**
 * Record that a user consumed one of their monthly predictive reports.
 * Silently swallows errors so a failed insert never breaks the UI.
 */
export async function recordPredictiveReportUsage(
  userId: string,
  report: PredictiveImpact,
  opts: { productId?: string | null; productName?: string | null } = {}
): Promise<void> {
  try {
    await supabase.from('predictive_reports').insert({
      user_id: userId,
      product_id: opts.productId ?? null,
      product_name: opts.productName ?? null,
      overall_risk_score: report.overallRiskScore,
      recommendation: report.recommendation,
      payload: report,
    });
  } catch {
    /* non-fatal */
  }
}

/**
 * Ask the AI edge function for a predictive impact report.
 * Never records usage — the caller must call `recordPredictiveReportUsage`
 * so quota isn't consumed on failures.
 */
export async function generatePredictiveReport(payload: {
  ingredients: string[];
  productName?: string;
  productType?: 'food' | 'cosmetic' | 'supplement' | 'household' | 'unknown';
  userConditions?: string[];
}): Promise<PredictiveImpact> {
  const { data, error } = await supabase.functions.invoke('ai-health-assistant', {
    body: {
      task: 'predictive_report',
      predictive_payload: {
        ingredients: payload.ingredients,
        product_name: payload.productName,
        product_type: payload.productType ?? 'unknown',
        user_conditions: payload.userConditions ?? [],
      },
    },
  });
  if (error) throw new Error(error.message);
  const d = data as { predictive_report?: unknown; error?: string };
  if (d?.error) throw new Error(d.error);
  const report = d?.predictive_report;
  if (!report || typeof report !== 'object') {
    throw new Error('No predictive report returned');
  }
  return normalizePredictiveReport(report as Record<string, unknown>);
}

function normalizePredictiveReport(raw: Record<string, unknown>): PredictiveImpact {
  const shortTerm = Array.isArray(raw.shortTerm) ? raw.shortTerm.map((x) => String(x)) : [];
  const longTerm = Array.isArray(raw.longTerm) ? raw.longTerm.map((x) => String(x)) : [];
  const riskFlags: PredictiveImpactRiskFlag[] = Array.isArray(raw.riskFlags)
    ? (raw.riskFlags as unknown[]).map((r) => {
        const o = r as Record<string, unknown>;
        const risk = ['high', 'medium', 'low'].includes(String(o.risk))
          ? (o.risk as 'high' | 'medium' | 'low')
          : 'low';
        return {
          condition: String(o.condition ?? ''),
          risk,
          explanation: String(o.explanation ?? ''),
        };
      })
    : [];

  const ingredientWarnings: PredictiveImpactIngredientWarning[] = Array.isArray(raw.ingredientWarnings)
    ? (raw.ingredientWarnings as unknown[]).map((r) => {
        const o = r as Record<string, unknown>;
        return {
          ingredient: String(o.ingredient ?? ''),
          warning: String(o.warning ?? ''),
          affectedConditions: Array.isArray(o.affectedConditions)
            ? (o.affectedConditions as unknown[]).map((x) => String(x))
            : [],
        };
      })
    : [];

  let calorieImpact: PredictiveImpactCalorieImpact | null = null;
  if (raw.calorieImpact && typeof raw.calorieImpact === 'object') {
    const c = raw.calorieImpact as Record<string, unknown>;
    calorieImpact = {
      dailyCalories: Number(c.dailyCalories) || 0,
      weeklyImpact: String(c.weeklyImpact ?? ''),
      monthlyImpact: String(c.monthlyImpact ?? ''),
      weightRiskPerMonth: Number(c.weightRiskPerMonth) || 0,
    };
  }

  const rec = String(raw.recommendation ?? 'limit').toLowerCase();
  const recommendation: PredictiveImpact['recommendation'] = (
    ['avoid', 'limit', 'safe', 'excellent'].includes(rec) ? rec : 'limit'
  ) as PredictiveImpact['recommendation'];

  return {
    shortTerm,
    longTerm,
    riskFlags,
    calorieImpact,
    ingredientWarnings,
    overallRiskScore: Number(raw.overallRiskScore) || 0,
    recommendation,
    upgradeRequired: false,
  };
}
