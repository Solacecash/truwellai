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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: getCorsHeaders(req) });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Authenticate caller
    const authHeader = req.headers.get('Authorization') ?? '';
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authErr } = await supabase.auth.getUser(token);
    if (authErr || !user) throw new Error('Unauthorized');

    const {
      points,
      reason,
    } = await req.json() as {
      points: number;
      reason?: string;
    };

    if (typeof points !== 'number' || !Number.isFinite(points) || points <= 0 || points > 100) {
      throw new Error('Invalid points value');
    }

    const targetUserId = user.id;

    // Upsert guardian_points row
    const { data: existing } = await supabase
      .from('guardian_points')
      .select('points, level')
      .eq('user_id', targetUserId)
      .maybeSingle();

    const currentPoints = (existing as { points: number; level: number } | null)?.points ?? 0;
    const newPoints = currentPoints + points;
    const newLevel = Math.floor(newPoints / 100) + 1;

    const { error: upsertErr } = await supabase
      .from('guardian_points')
      .upsert(
        {
          user_id: targetUserId,
          points: newPoints,
          level: newLevel,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      );

    if (upsertErr) throw new Error(upsertErr.message);

    // Log award event
    await supabase.from('guardian_point_events').insert({
      user_id: targetUserId,
      points_awarded: points,
      reason: reason ?? 'manual_award',
      total_after: newPoints,
      created_at: new Date().toISOString(),
    }).then(() => null).catch(() => null);

    return new Response(
      JSON.stringify({ ok: true, total: newPoints, level: newLevel }),
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
