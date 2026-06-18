/**
 * Authenticated smoke test: scan-barcode, scan-ocr, assistant.
 * Usage: node scripts/smoke-edge.mjs
 * Requires mobile/.env with EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';

const __dirname = dirname(fileURLToPath(import.meta.url));

function loadEnv(path) {
  const out = {};
  try {
    const raw = readFileSync(path, 'utf8');
    for (const line of raw.split('\n')) {
      const t = line.trim();
      if (!t || t.startsWith('#')) continue;
      const i = t.indexOf('=');
      if (i === -1) continue;
      const k = t.slice(0, i).trim();
      let v = t.slice(i + 1).trim();
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'")))
        v = v.slice(1, -1);
      out[k] = v;
    }
  } catch (e) {
    console.error('Missing or unreadable .env:', path, e.message);
    process.exit(1);
  }
  return out;
}

const envPath = join(__dirname, '..', '.env');
const env = loadEnv(envPath);
const url = env.EXPO_PUBLIC_SUPABASE_URL;
const anon = env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
if (!url || !anon) {
  console.error('Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in mobile/.env');
  process.exit(1);
}

const baseUrl = url.replace(/\/$/, '');

/** Call Edge Functions with a logged-in user's access JWT (from app session). */
async function invokeAsUser(name, body, accessToken) {
  const res = await fetch(`${baseUrl}/functions/v1/${name}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
      apikey: anon,
    },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(`${name}: HTTP ${res.status} ${text.slice(0, 200)}`);
  }
  if (!res.ok) throw new Error(`${name}: HTTP ${res.status} ${JSON.stringify(data)}`);
  return data;
}

const userJwt = process.env.SMOKE_ACCESS_TOKEN;
let invoke;

if (userJwt) {
  console.log('Using SMOKE_ACCESS_TOKEN (user JWT from a logged-in app session).');
  invoke = (name, body) => invokeAsUser(name, body, userJwt);
} else {
  const supabase = createClient(url, anon);
  const email = process.env.SMOKE_TEST_EMAIL;
  const password = process.env.SMOKE_TEST_PASSWORD;

  if (email && password) {
    const signIn = await supabase.auth.signInWithPassword({ email, password });
    if (!signIn.data.session) {
      console.error('signInWithPassword failed:', signIn.error?.message ?? signIn.error);
      process.exit(1);
    }
    console.log('Signed in:', email);
  } else {
    const anonRes = await supabase.auth.signInAnonymously();
    if (anonRes.data.session) {
      console.log('Signed in anonymously');
    } else {
      const fallbackEmail = `truwellsmoke${Date.now()}@gmail.com`;
      const fallbackPassword = 'SmokeTest!234567';
      const signIn = await supabase.auth.signInWithPassword({
        email: fallbackEmail,
        password: fallbackPassword,
      });
      if (signIn.data.session) {
        console.log('Signed in:', fallbackEmail);
      } else {
        const signUp = await supabase.auth.signUp({
          email: fallbackEmail,
          password: fallbackPassword,
        });
        if (!signUp.data.session) {
          console.error(
            'Auth failed. Use one of:\n' +
              '  • SMOKE_ACCESS_TOKEN=<access_token from app while logged in>\n' +
              '  • SMOKE_TEST_EMAIL + SMOKE_TEST_PASSWORD (existing user)\n' +
              '  • Enable Anonymous sign-ins, or wait if email rate limit hit.\n' +
              `Details: signIn=${signIn.error?.message}; signUp=${signUp.error?.message}`
          );
          process.exit(1);
        }
        console.log('Signed up:', fallbackEmail);
      }
    }
  }

  invoke = async (name, body) => {
    const { data, error } = await supabase.functions.invoke(name, { body });
    if (error) throw new Error(`${name}: ${error.message}`);
    return data;
  };
}

// Nutella barcode — common on Open Food Facts
const BARCODE = '3017620422003';
const TINY_PNG =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

console.log('\n--- scan-barcode ---');
const barcodeRes = await invoke('scan-barcode', { barcode: BARCODE });
console.log(JSON.stringify(barcodeRes, null, 2).slice(0, 800));

console.log('\n--- scan-ocr ---');
const ocrRes = await invoke('scan-ocr', { imageBase64: TINY_PNG });
console.log(JSON.stringify(ocrRes, null, 2).slice(0, 800));

console.log('\n--- assistant ---');
const asstRes = await invoke('assistant', {
  messages: [
    { role: 'user', content: 'Say hi in one short sentence for a connectivity test.' },
  ],
});
console.log(JSON.stringify(asstRes, null, 2));

console.log('\nAll three invocations completed.');
