/**
 * Verifies profiles onboarding columns exist in the linked Supabase project.
 * Usage: node scripts/verify-onboarding-migration.cjs
 */
const fs = require('fs');
const path = require('path');

function loadEnv(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const out = {};
  for (const line of fs.readFileSync(filePath, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    out[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim();
  }
  return out;
}

const REQUIRED = [
  'role',
  'care_goals',
  'health_conditions',
  'lifestyle_factors',
  'care_recipient',
  'commitment_level',
  'specialization',
  'practice_type',
  'patient_focus',
  'preferred_tools',
  'professional_goals',
  'wellness_plan_generated',
  'onboarding_complete',
  'onboarding_role_path',
];

const ANALYTICS_REQUIRED = ['onboarding_analytics_events'];

async function main() {
  const envPath = path.join(__dirname, '..', '.env');
  const env = loadEnv(envPath);
  const url = env.EXPO_PUBLIC_SUPABASE_URL;
  const key = env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    console.error('FAIL: EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY missing in mobile/.env');
    process.exit(1);
  }

  const headers = {
    apikey: key,
    Authorization: `Bearer ${key}`,
    'Content-Type': 'application/json',
  };

  // PostgREST: select one row with all onboarding columns (empty result OK; missing column = error)
  const selectCols = REQUIRED.join(',');
  const profilesRes = await fetch(`${url}/rest/v1/profiles?select=${selectCols}&limit=1`, { headers });
  if (!profilesRes.ok) {
    const body = await profilesRes.text();
    console.error('FAIL: profiles onboarding columns not queryable');
    console.error(`HTTP ${profilesRes.status}: ${body}`);
    console.error('\nApply migration: supabase/migrations/20260530120000_profiles_onboarding_fields.sql');
    process.exit(1);
  }

  console.log('PASS: profiles onboarding columns exist');
  for (const col of REQUIRED) {
    console.log(`  ✓ profiles.${col}`);
  }

  const analyticsRes = await fetch(
    `${url}/rest/v1/onboarding_analytics_events?select=id,event_name,created_at&limit=1`,
    { headers }
  );
  if (!analyticsRes.ok) {
    const body = await analyticsRes.text();
    console.warn('WARN: onboarding_analytics_events table not available');
    console.warn(`HTTP ${analyticsRes.status}: ${body}`);
    console.warn('Apply: supabase/migrations/20260530130000_onboarding_analytics_events.sql');
    process.exit(2);
  }

  console.log('PASS: onboarding_analytics_events table exists');
  for (const col of ANALYTICS_REQUIRED) {
    console.log(`  ✓ ${col}`);
  }
}

main().catch((err) => {
  console.error('FAIL:', err.message);
  process.exit(1);
});
