# Apply onboarding pre-launch migrations (Supabase SQL Editor)

Run this block in the Supabase SQL Editor if `node scripts/verify-onboarding-migration.cjs` fails.

```sql
-- 1) Profiles onboarding fields
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS role TEXT,
  ADD COLUMN IF NOT EXISTS care_goals TEXT[],
  ADD COLUMN IF NOT EXISTS health_conditions TEXT[],
  ADD COLUMN IF NOT EXISTS lifestyle_factors TEXT[],
  ADD COLUMN IF NOT EXISTS care_recipient TEXT,
  ADD COLUMN IF NOT EXISTS commitment_level TEXT,
  ADD COLUMN IF NOT EXISTS specialization TEXT,
  ADD COLUMN IF NOT EXISTS practice_type TEXT,
  ADD COLUMN IF NOT EXISTS patient_focus TEXT[],
  ADD COLUMN IF NOT EXISTS preferred_tools TEXT[],
  ADD COLUMN IF NOT EXISTS professional_goals TEXT[],
  ADD COLUMN IF NOT EXISTS wellness_plan_generated BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS onboarding_complete BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS onboarding_role_path TEXT;

-- 2) Analytics events
CREATE TABLE IF NOT EXISTS onboarding_analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  event_name TEXT NOT NULL,
  properties JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS onboarding_analytics_events_event_name_idx
  ON onboarding_analytics_events (event_name);

CREATE INDEX IF NOT EXISTS onboarding_analytics_events_created_at_idx
  ON onboarding_analytics_events (created_at DESC);

ALTER TABLE onboarding_analytics_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS onboarding_analytics_insert_authenticated ON onboarding_analytics_events;
CREATE POLICY onboarding_analytics_insert_authenticated
  ON onboarding_analytics_events
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id IS NULL OR user_id = auth.uid());

DROP POLICY IF EXISTS onboarding_analytics_insert_anon ON onboarding_analytics_events;
CREATE POLICY onboarding_analytics_insert_anon
  ON onboarding_analytics_events
  FOR INSERT
  TO anon
  WITH CHECK (user_id IS NULL);
```

Then verify:

```bash
cd mobile
node scripts/verify-onboarding-migration.cjs
```

Note: `supabase db push` failed on an unrelated earlier migration (`uuid_generate_v4()`). Use the SQL Editor for onboarding migrations until the full migration chain is repaired.
