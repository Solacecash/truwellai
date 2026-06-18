/**
 * Conversion onboarding (Guardian path only).
 * Persisted separately from the legacy psych slice to avoid corrupting TruWellPsych v1.
 */

export const CONVERSION_FLOW_VERSION_DEFAULT = 6;
export type ConversionRole = 'guardian';

export interface GuardianHealthStatus {
  weightRange: string;
  activityLevel: string;
  sleepQuality: string;
  stressLevel: string;
  waterIntake: string;
  eatingHabits: string;
}

export const defaultGuardianHealthStatus = (): GuardianHealthStatus => ({
  weightRange: '',
  activityLevel: '',
  sleepQuality: '',
  stressLevel: '',
  waterIntake: '',
  eatingHabits: '',
});

export interface GuardianLifestyleAnswers {
  targetWeightRange: string;
  energyTarget: number;
  sleepTarget: string;
  fitnessFrequency: string;
  /** Desired primary lifestyle transformation (single select in spec BATCH 8) */
  biggestShiftDesired: string;
}

export const defaultGuardianLifestyle = (): GuardianLifestyleAnswers => ({
  targetWeightRange: '',
  energyTarget: 6,
  sleepTarget: '',
  fitnessFrequency: '',
  biggestShiftDesired: '',
});
