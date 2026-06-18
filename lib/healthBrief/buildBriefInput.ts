import type { Message } from '@/components/assistant/AIMessageBubble';
import type {
  HealthBriefInputBundle,
  PsychBriefSnapshot,
  ProfileBriefSlice,
  HealthProfileBriefSlice,
  ChatSanitizeOptions,
} from './types';

const DEFAULT_NON_DIAGNOSTIC =
  'This brief is informational only and is not a medical diagnosis or treatment plan. It summarizes information the member chose to share. A licensed clinician remains responsible for all clinical decisions.';

export function buildNonDiagnosticNotice(): string {
  return DEFAULT_NON_DIAGNOSTIC;
}

function truncate(text: string, max: number): string {
  const t = text.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max)}…`;
}

/**
 * Turns raw chat rows into sanitized excerpts suitable for summaries and clinician briefs.
 * Does not mutate the original Message objects.
 */
export function messagesToBriefExcerpts(
  messages: Message[],
  opts?: ChatSanitizeOptions
): { role: 'user' | 'assistant'; text: string }[] {
  const maxMsgs = opts?.maxMessages ?? 24;
  const maxChars = opts?.maxCharsPerMessage ?? 400;
  const slice = messages.slice(-maxMsgs);
  return slice.map((m) => ({
    role: m.role,
    text: truncate(m.content, maxChars),
  }));
}

/**
 * Merge optional psych snapshot onto bundle (caller supplies read-only onboardingStore snapshot fields).
 */
export function psychSnapshotFromOnboarding(fields: Partial<PsychBriefSnapshot> | null): PsychBriefSnapshot | null {
  if (!fields || typeof fields !== 'object') return null;
  const {
    healthGoal,
    weightRange,
    painPoints,
    activityLevel,
    dietStyle,
    dailyMinutes,
  } = fields;
  const hasAny =
    (healthGoal && healthGoal.length > 0) ||
    (weightRange && weightRange.length > 0) ||
    (painPoints && painPoints.length > 0) ||
    (activityLevel && activityLevel.length > 0) ||
    (dietStyle && dietStyle.length > 0) ||
    dailyMinutes != null;
  if (!hasAny) return null;
  return {
    healthGoal: healthGoal ?? '',
    weightRange: weightRange ?? '',
    painPoints: painPoints ?? [],
    activityLevel: activityLevel ?? '',
    dietStyle: dietStyle ?? '',
    dailyMinutes: dailyMinutes ?? null,
  };
}

/**
 * Pure merge of persisted profile slices + sanitized chat excerpts + free text member context.
 */
export function buildBriefInputBundle(input: {
  profile: ProfileBriefSlice;
  healthProfile: HealthProfileBriefSlice;
  psych: PsychBriefSnapshot | null;
  messages?: Message[];
  sessionTitles?: string[];
  userProvidedContext?: string;
}): HealthBriefInputBundle {
  const chatExcerpts = messagesToBriefExcerpts(input.messages ?? [], {});
  const userProvidedContext = truncate(input.userProvidedContext?.trim() ?? '', 1200);

  return {
    profile: {
      displayName: input.profile.displayName,
      email: input.profile.email,
    },
    healthProfile: {
      age: input.healthProfile.age,
      biologicalSex: input.healthProfile.biologicalSex,
      conditions: [...input.healthProfile.conditions],
      allergens: [...input.healthProfile.allergens],
      activityLevel: input.healthProfile.activityLevel,
    },
    psych: input.psych,
    chatExcerpts,
    userProvidedContext,
    recentSessionTitles: (input.sessionTitles ?? []).slice(0, 15).map((t) => truncate(t, 120)),
  };
}
