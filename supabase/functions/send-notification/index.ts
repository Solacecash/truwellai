import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const ALLOWED_ORIGINS = [
  'https://truwellai.xyz',
  'capacitor://localhost',
  'http://localhost',
  'http://localhost:8081',
  'http://localhost:19006',
];

function getCorsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get('Origin') ?? '';
  const allowed = ALLOWED_ORIGINS.includes(origin)
    ? origin
    : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Headers':
      'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Vary': 'Origin',
  };
}

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: getCorsHeaders(req) });
  }

  // Only allow service-role callers — never allow
  // client-side JWT to trigger notifications for
  // arbitrary user_ids
  const authHeader = req.headers.get('Authorization') ?? '';
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

  if (authHeader !== `Bearer ${serviceKey}`) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized' }),
      { status: 401,
        headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const {
      user_id,
      title,
      body,
      data,
    } = await req.json() as {
      user_id?: string;
      title: string;
      body: string;
      data?: Record<string, unknown>;
    };

    if (!title || !body) throw new Error('title and body are required');

    const results: unknown[] = [];

    if (user_id) {
      // Look up user's push token(s)
      const { data: tokens } = await supabase
        .from('push_tokens')
        .select('token')
        .eq('user_id', user_id)
        .eq('active', true);

      const pushTokens = (tokens ?? []).map((r: { token: string }) => r.token);

      if (pushTokens.length > 0) {
        const messages = pushTokens.map((token) => ({
          to: token,
          sound: 'default',
          title,
          body,
          data: data ?? {},
        }));

        const res = await fetch(EXPO_PUSH_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify(messages),
        });

        const json = await res.json();
        results.push(json);
      }
    }

    // Log notification in DB
    await supabase.from('notification_log').insert({
      user_id: user_id ?? null,
      title,
      body,
      data: data ?? null,
      sent_at: new Date().toISOString(),
    }).then(() => null).catch(() => null);

    return new Response(
      JSON.stringify({ ok: true, results }),
      { headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
    );
  }
});
