import type { Href } from 'expo-router';

import type { ConversionRole } from '@/lib/conversionOnboardingTypes';
import { ONBOARDING_ROUTES } from '@/lib/onboardingRoutePaths';

/**
 * Spec conversion funnel under `app/(onboarding)/` — 16-step journey.
 * account (16) and subscription (10/11 legacy indices) unchanged for signup flow.
 */
export type GuestConversionResumeInput = {
  conversionFlowComplete: boolean;
  conversionFlowStep: number;
  selectedRole: ConversionRole | '';
  guardianGoals: string[];
  conversionBlueprintReady: boolean;
  setConversionFlowStep: (step: number) => void;
};

export const CONVERSION_MAX_STEP = 16;

export function hasMeaningfulConversionAnswers(input: GuestConversionResumeInput): boolean {
  return Boolean(
    input.selectedRole ||
      input.guardianGoals.length > 0 ||
      input.conversionBlueprintReady
  );
}

/** Map persisted steps from older funnels to the 16-step journey. */
export function migrateConversionFlowStep(
  step: number,
  selectedRole: ConversionRole | ''
): number {
  let s = Math.floor(step);

  if (s >= 17) return 16;
  if (s === 11) return selectedRole ? 16 : 16;
  if (s === 10) return 10;

  if (s <= 1) return 1;
  if (s === 2) return 2;
  if (s === 3) return 3;
  if (s === 4) return selectedRole ? 4 : 2;
  if (s >= 5 && s <= 8) return s + 1;
  if (s === 9) return 15;

  return Math.min(CONVERSION_MAX_STEP, Math.max(1, s));
}

export function guestConversionResumeHref(input: GuestConversionResumeInput): Href | null {
  if (input.conversionFlowComplete) return null;

  let step = Math.min(CONVERSION_MAX_STEP, Math.max(1, Math.floor(input.conversionFlowStep)));

  if (step >= 3 && !input.selectedRole) {
    input.setConversionFlowStep(1);
    return ONBOARDING_ROUTES.welcome;
  }

  if (step >= 10 && !input.conversionBlueprintReady && step < 15) {
    step = Math.min(step, 14);
  }

  return routeForOnboardingStep(step, input.selectedRole);
}

export function routeForOnboardingStep(step: number, _role: ConversionRole | ''): Href {
  switch (step) {
    case 1:
      return ONBOARDING_ROUTES.welcome;
    case 2:
      return ONBOARDING_ROUTES.name;
    case 3:
      return ONBOARDING_ROUTES.goals;
    case 4:
      return ONBOARDING_ROUTES.ageRange;
    case 5:
      return ONBOARDING_ROUTES.gender;
    case 6:
      return ONBOARDING_ROUTES.conditions;
    case 7:
      return ONBOARDING_ROUTES.allergies;
    case 8:
      return ONBOARDING_ROUTES.dietType;
    case 9:
      return ONBOARDING_ROUTES.productConcerns;
    case 10:
      return ONBOARDING_ROUTES.lifestyle;
    case 11:
      return ONBOARDING_ROUTES.familyRole;
    case 12:
      return ONBOARDING_ROUTES.featurePreview;
    case 13:
      return ONBOARDING_ROUTES.aiProcessing;
    case 14:
      return ONBOARDING_ROUTES.scoreReveal;
    case 15:
      return ONBOARDING_ROUTES.prePaywall;
    case 16:
      return ONBOARDING_ROUTES.account;
    default:
      return ONBOARDING_ROUTES.welcome;
  }
}
