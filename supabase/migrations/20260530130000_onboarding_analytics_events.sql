-- Onboarding funnel analytics (pre-launch instrumentation)
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
