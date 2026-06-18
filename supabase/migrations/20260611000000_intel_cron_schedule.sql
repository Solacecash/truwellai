-- Enable pg_cron and pg_net extensions if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Schedule health-intel-ingest to run every 6 hours
-- This calls the edge function via pg_net HTTP request
SELECT cron.schedule(
  'truwell-intel-ingest-6h',
  '0 */6 * * *',
  $$
  SELECT net.http_post(
    url := (
      SELECT value FROM vault.decrypted_secrets
      WHERE name = 'SUPABASE_URL'
      LIMIT 1
    ) || '/functions/v1/health-intel-ingest',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (
        SELECT value FROM vault.decrypted_secrets
        WHERE name = 'CRON_SECRET'
        LIMIT 1
      )
    ),
    body := '{}'::jsonb
  );
  $$
);

-- Schedule recall-matcher to run every 4 hours for all users
-- This runs after ingest has had time to populate new events
SELECT cron.schedule(
  'truwell-recall-matcher-4h',
  '30 */4 * * *',
  $$
  SELECT net.http_post(
    url := (
      SELECT value FROM vault.decrypted_secrets
      WHERE name = 'SUPABASE_URL'
      LIMIT 1
    ) || '/functions/v1/run-recall-matcher-all-users',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (
        SELECT value FROM vault.decrypted_secrets
        WHERE name = 'CRON_SECRET'
        LIMIT 1
      )
    ),
    body := '{}'::jsonb
  );
  $$
);

-- Also add source_url unique constraint if not exists
-- to ensure deduplication works correctly
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'health_intel_events_source_url_unique'
  ) THEN
    ALTER TABLE health_intel_events
      ADD CONSTRAINT health_intel_events_source_url_unique UNIQUE (source_url);
  END IF;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
