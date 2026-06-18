-- Reschedule intel cron jobs to authenticate with CRON_SECRET instead of
-- the service role key. Requires CRON_SECRET in vault (same value as the
-- Edge Function secret set in Dashboard → Edge Functions → Secrets).

SELECT cron.unschedule('truwell-intel-ingest-6h');
SELECT cron.unschedule('truwell-recall-matcher-4h');

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
