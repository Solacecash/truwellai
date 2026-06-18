import { supabase } from '@/lib/supabase';
import { getRankForPoints } from '@/lib/breathingExercises';
import type { BreathExercise } from '@/stores/breathingStore';

export interface BreathingProgressRow {
  user_id: string;
  total_sessions: number;
  total_minutes: number;
  current_streak: number;
  longest_streak: number;
  last_session_date: string | null;
  current_rank: string;
  rank_points: number;
  unlocked_exercises: string[];
  preferred_exercise: string | null;
}

export interface CompletedSession {
  exercise: BreathExercise;
  durationSeconds: number;
  cyclesCompleted: number;
  stressBefore: number | null;
  stressAfter: number | null;
  militaryRank?: string | null;
}

const DEFAULT_PROGRESS: BreathingProgressRow = {
  user_id: '',
  total_sessions: 0,
  total_minutes: 0,
  current_streak: 0,
  longest_streak: 0,
  last_session_date: null,
  current_rank: 'Recruit',
  rank_points: 0,
  unlocked_exercises: ['4-7-8', 'box-breathing', 'diaphragmatic'],
  preferred_exercise: null,
};

/** Fetch (or create) the breathing_progress row for a user. */
export async function loadBreathingProgress(
  userId: string
): Promise<BreathingProgressRow> {
  try {
    const { data } = await supabase
      .from('breathing_progress')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
    if (data) return data as BreathingProgressRow;

    const row = { ...DEFAULT_PROGRESS, user_id: userId };
    await supabase.from('breathing_progress').insert(row);
    return row;
  } catch {
    return { ...DEFAULT_PROGRESS, user_id: userId };
  }
}

function isoDate(d: Date = new Date()): string {
  return d.toISOString().slice(0, 10);
}

function daysBetween(a: string, b: string): number {
  const d1 = new Date(a + 'T00:00:00Z').getTime();
  const d2 = new Date(b + 'T00:00:00Z').getTime();
  return Math.round((d2 - d1) / 86400000);
}

/**
 * Compute XP for a session. Base 25 pts + 1 per cycle + 10 bonus for
 * military-visual exercises + 15 bonus if stress dropped by >= 20.
 */
export function computeXp(session: CompletedSession): number {
  let xp = 25 + session.cyclesCompleted;
  if (session.exercise.visualType === 'military') xp += 10;
  if (
    session.stressBefore != null &&
    session.stressAfter != null &&
    session.stressBefore - session.stressAfter >= 20
  ) {
    xp += 15;
  }
  return xp;
}

/**
 * Persist a completed session + update the per-user progress row.
 * Returns the reward summary so the reward screen can display it.
 */
export async function recordBreathingSession(
  userId: string,
  session: CompletedSession
): Promise<{
  xpEarned: number;
  newRank: string | null;
  streakCount: number;
  isNewRecord: boolean;
  rankPoints: number;
  stressReductionPercent: number;
}> {
  const xp = computeXp(session);
  const today = isoDate();

  // Insert the session row. The legacy columns (pattern, duration_seconds,
  // completed_at) are still honoured for any downstream analytics that
  // read them.
  try {
    await supabase.from('breathing_sessions').insert({
      user_id: userId,
      pattern: session.exercise.id,
      duration_seconds: session.durationSeconds,
      completed_at: new Date().toISOString(),
      exercise_id: session.exercise.id,
      exercise_name: session.exercise.name,
      category: session.exercise.category,
      cycles_completed: session.cyclesCompleted,
      stress_score_before: session.stressBefore,
      stress_score_after: session.stressAfter,
      xp_earned: xp,
      completed: true,
      military_rank: session.militaryRank ?? null,
    });
  } catch {
    // Table must exist; if insert fails, degrade gracefully
  }

  // Update progress row.
  const prev = await loadBreathingProgress(userId);
  const prevRank = prev.current_rank;
  const prevRankPoints = prev.rank_points;

  let streak = prev.current_streak;
  if (!prev.last_session_date) {
    streak = 1;
  } else {
    const gap = daysBetween(prev.last_session_date, today);
    if (gap === 0) {
      // same day, keep streak
    } else if (gap === 1) {
      streak += 1;
    } else {
      streak = 1;
    }
  }

  const longest = Math.max(prev.longest_streak, streak);
  const isNewRecord = streak > prev.longest_streak && streak > 1;

  const nextPoints = prevRankPoints + xp;
  const nextRankInfo = getRankForPoints(nextPoints);
  const newRank = nextRankInfo.rank !== prevRank ? nextRankInfo.rank : null;

  const updated = {
    user_id: userId,
    total_sessions: prev.total_sessions + 1,
    total_minutes: prev.total_minutes + Math.round(session.durationSeconds / 60),
    current_streak: streak,
    longest_streak: longest,
    last_session_date: today,
    current_rank: nextRankInfo.rank,
    rank_points: nextPoints,
    unlocked_exercises: prev.unlocked_exercises,
    preferred_exercise: session.exercise.id,
    updated_at: new Date().toISOString(),
  };

  try {
    await supabase
      .from('breathing_progress')
      .upsert(updated, { onConflict: 'user_id' });
  } catch {
    // degrade gracefully
  }

  const before = session.stressBefore ?? 0;
  const after = session.stressAfter ?? Math.max(0, before - 20);
  const stressReductionPercent =
    before > 0 ? Math.round(Math.max(0, (before - after) / before) * 100) : 0;

  return {
    xpEarned: xp,
    newRank,
    streakCount: streak,
    isNewRecord,
    rankPoints: nextPoints,
    stressReductionPercent,
  };
}

/** Return today's sessions + total minutes for the breathing hub widgets. */
export async function loadTodayStats(userId: string): Promise<{
  sessions: number;
  minutes: number;
  xp: number;
}> {
  try {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const { data } = await supabase
      .from('breathing_sessions')
      .select('duration_seconds, xp_earned')
      .eq('user_id', userId)
      .gte('created_at', start.toISOString());
    const rows = (data as Array<{ duration_seconds: number | null; xp_earned: number | null }> | null) ?? [];
    const sessions = rows.length;
    const minutes = Math.round(
      rows.reduce((acc, r) => acc + (r.duration_seconds ?? 0), 0) / 60
    );
    const xp = rows.reduce((acc, r) => acc + (r.xp_earned ?? 0), 0);
    return { sessions, minutes, xp };
  } catch {
    return { sessions: 0, minutes: 0, xp: 0 };
  }
}

/** List recent sessions for the progress screen history list. */
export async function loadSessionHistory(
  userId: string,
  limit = 30
): Promise<Array<{
  id: string;
  exercise_id: string | null;
  exercise_name: string | null;
  category: string | null;
  pattern: string | null;
  duration_seconds: number | null;
  cycles_completed: number | null;
  stress_score_before: number | null;
  stress_score_after: number | null;
  xp_earned: number | null;
  created_at: string;
}>> {
  try {
    const { data } = await supabase
      .from('breathing_sessions')
      .select('id, exercise_id, exercise_name, category, pattern, duration_seconds, cycles_completed, stress_score_before, stress_score_after, xp_earned, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);
    return (data as Array<{
      id: string;
      exercise_id: string | null;
      exercise_name: string | null;
      category: string | null;
      pattern: string | null;
      duration_seconds: number | null;
      cycles_completed: number | null;
      stress_score_before: number | null;
      stress_score_after: number | null;
      xp_earned: number | null;
      created_at: string;
    }> | null) ?? [];
  } catch {
    return [];
  }
}
