/**
 * Structured TruWell Patient Health Brief (consult-ready outline).
 * All fields are descriptive summaries derived from supplied inputs only (no diagnosis).
 */
export type HealthBriefSections = {
  patientOverview: string;
  goals: string;
  symptomsConcerns: string;
  lifestyleSummary: string;
  keyPatternsObserved: string;
  suggestedQuestionsForClinician: string[];
  /** Stable schema version embedded in payloads */
  briefVersion: 1;
  /** Disclaimer block required for clinician-facing previews */
  nonDiagnosticNotice: string;
};

export interface PsychBriefSnapshot {
  healthGoal?: string;
  weightRange?: string;
  painPoints?: string[];
  activityLevel?: string;
  dietStyle?: string;
  dailyMinutes?: number | null;
}

export interface ProfileBriefSlice {
  displayName: string | null;
  email: string | null;
}

export interface HealthProfileBriefSlice {
  age: number | null;
  biologicalSex: string | null;
  conditions: string[];
  allergens: string[];
  activityLevel: string | null;
}

/** Pure input assembled on device before invoking the assembler Edge Function. */
export interface HealthBriefInputBundle {
  profile: ProfileBriefSlice;
  healthProfile: HealthProfileBriefSlice;
  psych: PsychBriefSnapshot | null;
  /** Sanitized excerpts from chat ("user writes X / assistant summarizes Y"); max length enforced in builder. */
  chatExcerpts: { role: 'user' | 'assistant'; text: string }[];
  userProvidedContext: string;
  recentSessionTitles: string[];
}

export interface HealthBriefAssemblerRequest {
  bundle: HealthBriefInputBundle;
  /** When false, Edge may return heuristic merge without LLM when no API key present */
  useLlm?: boolean;
}

export interface HealthBriefAssemblerResponse {
  sections: HealthBriefSections;
  assembledAtIso: string;
}

export interface ChatSanitizeOptions {
  maxMessages?: number;
  maxCharsPerMessage?: number;
}
