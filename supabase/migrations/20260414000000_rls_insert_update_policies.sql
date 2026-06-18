-- Fix RLS policies for user_health_profiles and profiles tables.
-- The existing FOR ALL USING policies lack an explicit WITH CHECK clause,
-- which can silently block INSERT rows in some Supabase/PG configurations.
-- Adding explicit INSERT + UPDATE policies with correct WITH CHECK clauses.

-- ── user_health_profiles ────────────────────────────────────────────────────

ALTER TABLE user_health_profiles ENABLE ROW LEVEL SECURITY;

-- Drop the broad FOR ALL policy and replace with granular per-operation policies
-- so INSERT / UPDATE have explicit WITH CHECK clauses.
DROP POLICY IF EXISTS "users_own_health" ON user_health_profiles;

CREATE POLICY IF NOT EXISTS "users_select_own_health"
  ON user_health_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "users_insert_own_health"
  ON user_health_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "users_update_own_health"
  ON user_health_profiles FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "users_delete_own_health"
  ON user_health_profiles FOR DELETE
  USING (auth.uid() = user_id);

-- ── profiles ────────────────────────────────────────────────────────────────
-- The app upserts profiles using `id = auth.user.id` (the PK, not the user_id
-- FK column). The original policy checked `auth.uid() = user_id` which never
-- matches because user_id is NULL on these rows — silently blocking the INSERT.
-- Fix: policy checks the PK column `id` instead.

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_own_profile" ON profiles;

CREATE POLICY IF NOT EXISTS "users_select_own_profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY IF NOT EXISTS "users_insert_own_profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY IF NOT EXISTS "users_update_own_profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY IF NOT EXISTS "users_delete_own_profile"
  ON profiles FOR DELETE
  USING (auth.uid() = id);
