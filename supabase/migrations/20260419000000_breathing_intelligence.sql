-- Breathing Intelligence: extend existing breathing_sessions, add
-- breathing_progress and stress_history. This migration is additive and
-- keeps the existing wellness tab breathing flow working unchanged.

-- ── breathing_sessions: add new metadata columns ─────────────────────────
-- The original table (from TRUWELL_IMPLEMENTATION_PROMPT.md) only had
-- id, user_id, pattern, duration_seconds, completed_at. Existing client
-- code (useBreathSessionsTodayQuery) already reads created_at, so we
-- add it here alongside the new intelligence fields.
ALTER TABLE public.breathing_sessions
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS exercise_id TEXT,
  ADD COLUMN IF NOT EXISTS exercise_name TEXT,
  ADD COLUMN IF NOT EXISTS category TEXT,
  ADD COLUMN IF NOT EXISTS cycles_completed INTEGER,
  ADD COLUMN IF NOT EXISTS stress_score_before INTEGER,
  ADD COLUMN IF NOT EXISTS stress_score_after INTEGER,
  ADD COLUMN IF NOT EXISTS xp_earned INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS completed BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS military_rank TEXT;

-- Backfill created_at for legacy rows using completed_at when present.
UPDATE public.breathing_sessions
  SET created_at = completed_at
  WHERE completed_at IS NOT NULL AND created_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_breathing_sessions_user_created
  ON public.breathing_sessions (user_id, created_at DESC);

-- ── breathing_progress: per-user summary for fast rank / streak reads ─────
CREATE TABLE IF NOT EXISTS public.breathing_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  total_sessions INTEGER NOT NULL DEFAULT 0,
  total_minutes INTEGER NOT NULL DEFAULT 0,
  current_streak INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  last_session_date DATE,
  current_rank TEXT NOT NULL DEFAULT 'Recruit',
  rank_points INTEGER NOT NULL DEFAULT 0,
  unlocked_exercises TEXT[] NOT NULL DEFAULT ARRAY['4-7-8', 'box-breathing', 'diaphragmatic'],
  preferred_exercise TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.breathing_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_own_progress" ON public.breathing_progress;
CREATE POLICY "users_own_progress" ON public.breathing_progress
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ── stress_history: stress check-ins, one row per user mood snapshot ─────
CREATE TABLE IF NOT EXISTS public.stress_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stress_score INTEGER NOT NULL CHECK (stress_score BETWEEN 0 AND 100),
  mood_rating INTEGER CHECK (mood_rating BETWEEN 1 AND 10),
  mood_tags TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  symptoms TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  source TEXT NOT NULL DEFAULT 'manual',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stress_history_user_created
  ON public.stress_history (user_id, created_at DESC);

ALTER TABLE public.stress_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_own_stress" ON public.stress_history;
CREATE POLICY "users_own_stress" ON public.stress_history
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
