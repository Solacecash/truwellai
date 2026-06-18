import { useRouter } from 'expo-router';
import { useCallback } from 'react';

import { routeForOnboardingStep } from '@/lib/onboardingService';
import { ONBOARDING_ROUTES } from '@/lib/onboardingRoutePaths';
import { useOnboardingStore } from '@/stores/onboardingStore';

/**
 * Deterministic back navigation for the conversion funnel.
 * Uses canonical step + role routing instead of the nav stack, because many
 * transitions use `replace` (splash, resume, post-auth) and `router.back()`
 * then throws GO_BACK with no history.
 */
export function useOnboardingBack(conversionFlowStep: number) {
  const router = useRouter();
  const setConversionFlowStep = useOnboardingStore((s) => s.setConversionFlowStep);
  const selectedRole = useOnboardingStore((s) => s.selectedRole);

  return useCallback(() => {
    if (conversionFlowStep <= 1) {
      router.replace('/(auth)/welcome' as never);
      return;
    }

    // AI processing auto-advances; backing out of score reveal skips it.
    const prevStep =
      conversionFlowStep === 14 ? 12 : conversionFlowStep === 13 ? 12 : conversionFlowStep - 1;
    setConversionFlowStep(prevStep);
    const href = routeForOnboardingStep(prevStep, selectedRole);
    router.replace(href as never);
  }, [conversionFlowStep, router, selectedRole, setConversionFlowStep]);
}

/** Skip eligible steps jump to subscription (spec screen 10). Ref: spec funnel order. */
export function useOnboardingSkip() {
  const router = useRouter();
  const setConversionFlowStep = useOnboardingStore((s) => s.setConversionFlowStep);
  const selectedRole = useOnboardingStore((s) => s.selectedRole);
  return useCallback(() => {
    setConversionFlowStep(10);
    router.push(ONBOARDING_ROUTES.subscription);
  }, [router, setConversionFlowStep]);
}

/** Whether skip is allowed for this funnel step (not subscription or account). */
export function onboardingSkipEligible(conversionFlowStep: number): boolean {
  return conversionFlowStep >= 2 && conversionFlowStep <= 15;
}