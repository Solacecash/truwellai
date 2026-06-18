/** Allowed `profiles.subscription_plan` values (must match Supabase CHECK). */
export const SUBSCRIPTION_PLAN_VALUES = [
  'free',
  'preview',
  'boost',
  'top_performer',
  'mastery',
  'guardian_monthly',
  'guardian_annual',
  'professional',
  'professional_monthly',
  'professional_annual',
  'trial',
  'none',
  'pro',
  'pro_monthly',
  'pro_yearly',
  'family',
  'lifetime',
] as const;

export type SubscriptionPlanValue = (typeof SUBSCRIPTION_PLAN_VALUES)[number];

export function normalizeSubscriptionPlan(
  value: string | null | undefined,
  fallback: SubscriptionPlanValue = 'free'
): SubscriptionPlanValue {
  if (!value) return fallback;
  if ((SUBSCRIPTION_PLAN_VALUES as readonly string[]).includes(value)) {
    return value as SubscriptionPlanValue;
  }
  if (value === 'pro') return 'pro_monthly';
  return fallback;
}
