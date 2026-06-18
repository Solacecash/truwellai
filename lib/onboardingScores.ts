import type { ConversionRole } from '@/lib/conversionOnboardingTypes';

/** Spec Screen 6 — guardian score range 45–85, default 72. */
export const GUARDIAN_SCORE_MIN = 45;
export const GUARDIAN_SCORE_MAX = 85;
export const GUARDIAN_SCORE_DEFAULT = 72;

export function clampGuardianScore(score: number): number {
  return Math.min(GUARDIAN_SCORE_MAX, Math.max(GUARDIAN_SCORE_MIN, Math.round(score)));
}

export function resolveHealthScore(_role: ConversionRole | '', raw?: number): number {
  return clampGuardianScore(typeof raw === 'number' ? raw : GUARDIAN_SCORE_DEFAULT);
}
