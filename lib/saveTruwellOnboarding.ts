import type { ConversionRole } from '@/lib/conversionOnboardingTypes';

import { getSpecSelectedGoals } from '@/lib/onboardingStoreSpec';

import { supabase } from '@/lib/supabase';

import { useOnboardingStore } from '@/stores/onboardingStore';



/**

 * Persists conversion onboarding answers to `profiles` after signup.

 * Safe to call multiple times (upsert on id).

 */

export async function saveTruwellOnboarding(userId: string): Promise<void> {

  const s = useOnboardingStore.getState();

  const role = s.selectedRole;

  const health = s.guardianHealthStatus;

  const lifestyle = s.guardianLifestyleAnswers;



  const healthConditions: string[] = [];

  if (health.weightRange) healthConditions.push(`weight:${health.weightRange}`);

  if (health.activityLevel) healthConditions.push(`activity:${health.activityLevel}`);

  if (health.sleepQuality) healthConditions.push(`sleep:${health.sleepQuality}`);

  if (health.stressLevel) healthConditions.push(`stress:${health.stressLevel}`);

  if (typeof s.healthScore === 'number') healthConditions.push(`health_score:${s.healthScore}`);



  const assessment = s.assessmentAnswers ?? {};

  for (const [key, value] of Object.entries(assessment)) {

    if (typeof value === 'string' && value.trim()) {

      healthConditions.push(`assessment:${key}:${value}`);

    }

  }

  for (const pain of s.guardianConversionPainPoints ?? []) {

    if (pain.trim()) healthConditions.push(`pain:${pain}`);

  }



  const lifestyleFactors: string[] = [];

  if (lifestyle.targetWeightRange) lifestyleFactors.push(`target_weight:${lifestyle.targetWeightRange}`);

  if (lifestyle.sleepTarget) lifestyleFactors.push(`sleep_target:${lifestyle.sleepTarget}`);

  if (lifestyle.fitnessFrequency) lifestyleFactors.push(`fitness:${lifestyle.fitnessFrequency}`);

  if (lifestyle.biggestShiftDesired) lifestyleFactors.push(`shift:${lifestyle.biggestShiftDesired}`);

  if (lifestyle.energyTarget) lifestyleFactors.push(`energy:${lifestyle.energyTarget}`);

  if (typeof s.completionPercent === 'number') {

    lifestyleFactors.push(`completion_percent:${s.completionPercent}`);

  }



  const payload: Record<string, unknown> = {

    id: userId,

    user_type: 'user',

    role: role || 'guardian',

    care_goals: getSpecSelectedGoals(role, s.guardianGoals ?? []),

    health_conditions: healthConditions,

    lifestyle_factors: lifestyleFactors,

    care_recipient: role === 'guardian' ? 'family' : null,

    commitment_level: s.guardianDailyMinutes ? `${s.guardianDailyMinutes}_minutes_daily` : null,

    wellness_plan_generated: s.conversionBlueprintReady,

    onboarding_complete: s.conversionFlowComplete,

    onboarding_role_path: role || 'guardian',

    updated_at: new Date().toISOString(),

  };



  const { error } = await supabase.from('profiles').upsert(payload, { onConflict: 'id' });



  if (error) {

    if (__DEV__) console.warn('[TruWell] Onboarding save failed:', error.message);

  }

}

