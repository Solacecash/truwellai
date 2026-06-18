import { supabase } from '@/lib/supabase';

export type OnboardingAnalyticsEvent =
  | 'onboarding_started'
  | 'role_selected'
  | 'blueprint_viewed'
  | 'registration_completed'
  | 'paywall_viewed'
  | 'purchase_completed'
  | 'purchase_completed_dev'
  | 'onboarding_completed';

type EventProperties = Record<string, string | number | boolean | null | undefined>;

let analyticsEnabledCache: boolean | null = null;

async function isAnalyticsEnabled(userId: string | null): Promise<boolean> {
  if (analyticsEnabledCache !== null) return analyticsEnabledCache;
  if (!userId) {
    analyticsEnabledCache = true;
    return true;
  }
  try {
    const { data, error } = await supabase
      .from('user_preferences')
      .select('usage_analytics')
      .eq('user_id', userId)
      .maybeSingle();
    if (error) {
      analyticsEnabledCache = true;
      return true;
    }
    analyticsEnabledCache = data?.usage_analytics !== false;
    return analyticsEnabledCache;
  } catch {
    analyticsEnabledCache = true;
    return true;
  }
}

/**
 * Fire-and-forget onboarding funnel analytics.
 * Respects usage_analytics when authenticated; always logs in __DEV__.
 */
export async function trackOnboardingEvent(
  event: OnboardingAnalyticsEvent,
  properties: EventProperties = {}
): Promise<void> {
  const sanitized = Object.fromEntries(
    Object.entries(properties).filter(([, v]) => v !== undefined)
  ) as Record<string, string | number | boolean | null>;

  let userId: string | null = null;
  try {
    const { data } = await supabase.auth.getSession();
    userId = data.session?.user?.id ?? null;
  } catch {
    /* ignore */
  }

  if (__DEV__) {
    if (__DEV__) console.log('[onboarding-analytics]', event, sanitized);
  }

  const enabled = await isAnalyticsEnabled(userId);
  if (!enabled) return;

  try {
    await supabase.from('onboarding_analytics_events').insert({
      user_id: userId,
      event_name: event,
      properties: sanitized,
    });
  } catch {
    /* table may not exist until migration is applied */
  }
}
