import type { Href } from 'expo-router';

import { ONBOARDING_ROUTES } from '@/lib/onboardingRoutePaths';

/** 12 segments after intro: S2..S13 maps to segment index 0..11 active, S13 celebration = full bar */
export const PSYCH_SEGMENT_TOTAL = 12;

export type PsychStepNumber = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13;

/** Maps TruWell psych step to SegmentedIndicator `currentStep` (0..12). Returns null when no bar (S1). */
export function psychStepToSegmentCurrent(step: number): number | null {
  if (step <= 1) return null;
  if (step >= 13) return PSYCH_SEGMENT_TOTAL;
  return step - 2;
}

export function getPsychHrefForStep(step: PsychStepNumber): Href {
  switch (step) {
    case 1:
      return ONBOARDING_ROUTES.welcome;
    case 2:
      return '/(auth)/psych/s2-platform' as Href;
    case 3:
      return '/(auth)/psych/s3-goal' as Href;
    case 4:
      return '/(auth)/psych/s4-weight' as Href;
    case 5:
      return '/(auth)/psych/s5-pain' as Href;
    case 6:
      return '/(auth)/psych/s6-lifestyle' as Href;
    case 7:
      return '/(auth)/psych/s7-commitment' as Href;
    case 8:
      return '/(auth)/psych/s8-plan' as Href;
    case 9:
      return '/(auth)/psych/s9-account' as Href;
    case 10:
      return '/settings/subscription?psychFlow=1' as Href;
    case 11:
      return '/(auth)/psych/s11-scan' as Href;
    case 12:
      return '/(auth)/psych/s12-notifications' as Href;
    case 13:
      return '/(auth)/psych/s13-celebration' as Href;
    default:
      return ONBOARDING_ROUTES.welcome;
  }
}
