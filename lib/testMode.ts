/**
 * TEST MODE — app review / dev only. Never enabled in production EAS builds unless env is set.
 */
export const TEST_MODE_ENABLED =
  __DEV__ && process.env.EXPO_PUBLIC_TEST_MODE === 'true';

export function isTestMode(): boolean {
  return TEST_MODE_ENABLED;
}

export const TEST_PREMIUM_PROFILE = {
  subscription_plan: 'mastery' as const,
  verification_status: 'verified' as const,
  professional_agreement_signed: true,
  kyc_submitted: true,
};
