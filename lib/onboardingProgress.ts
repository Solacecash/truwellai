/** Conversion funnel progress segments (steps 2–11, spec eleven-screen funnel). */
export const ONBOARD_TOTAL_SEGMENTS = 10;

export function segmentsFilledForConversionStep(conversionFlowStep: number): number {
  if (conversionFlowStep <= 1) return 0;
  return Math.min(ONBOARD_TOTAL_SEGMENTS, Math.max(0, conversionFlowStep - 1));
}

/** Spec-style completion percent for legacy segment mapping. */
export function completionPercentForStep(conversionFlowStep: number): number {
  if (conversionFlowStep <= 1) return 0;
  return Math.round((segmentsFilledForConversionStep(conversionFlowStep) / ONBOARD_TOTAL_SEGMENTS) * 100);
}

/** Spec ProgressBar percent for screens 3–9 (25% step 3, 50% step 4). Ref: spec lines 257–291, 612. */
export function progressBarPercentForStep(conversionFlowStep: number): number | null {
  if (conversionFlowStep < 3 || conversionFlowStep > 9) return null;
  const map: Record<number, number> = {
    3: 25,
    4: 50,
    5: 60,
    6: 70,
    7: 80,
    8: 90,
    9: 100,
  };
  return map[conversionFlowStep] ?? null;
}

export function progressBarVariantForRole(role: string): 'teal' | 'blue' {
  return role === 'professional' ? 'blue' : 'teal';
}
