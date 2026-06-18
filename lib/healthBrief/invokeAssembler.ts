import { supabase } from '@/lib/supabase';

import type { HealthBriefAssemblerRequest, HealthBriefAssemblerResponse } from './types';

/**
 * Runs the clinician brief assembler Edge Function without touching Guardian chat internals.
 */
export async function invokeHealthBriefAssembler(
  req: HealthBriefAssemblerRequest
): Promise<HealthBriefAssemblerResponse> {
  const { data, error } = await supabase.functions.invoke('health-brief-assembler', {
    body: req,
  });
  if (error) {
    const msg =
      typeof (data as { error?: string })?.error === 'string'
        ? (data as { error?: string }).error!
        : error.message;
    throw new Error(msg);
  }
  const out = data as HealthBriefAssemblerResponse & { sections?: unknown };
  if (
    !out ||
    typeof out.assembledAtIso !== 'string' ||
    typeof out.sections !== 'object' ||
    !out.sections
  ) {
    throw new Error('Unexpected response from brief assembler.');
  }
  const s = out.sections as HealthBriefAssemblerResponse['sections'];
  if (
    typeof s.patientOverview !== 'string' ||
    typeof s.goals !== 'string' ||
    typeof s.symptomsConcerns !== 'string' ||
    typeof s.lifestyleSummary !== 'string' ||
    typeof s.keyPatternsObserved !== 'string' ||
    !Array.isArray(s.suggestedQuestionsForClinician) ||
    typeof s.nonDiagnosticNotice !== 'string'
  ) {
    throw new Error('Assembler returned malformed sections.');
  }
  for (let i = 0; i < s.suggestedQuestionsForClinician.length; i += 1) {
    if (typeof s.suggestedQuestionsForClinician[i] !== 'string') {
      throw new Error('Assembler suggested questions contained a non-string value.');
    }
  }
  return { sections: { ...s, briefVersion: 1 }, assembledAtIso: out.assembledAtIso };
}
