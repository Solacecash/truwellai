import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'npm:@supabase/supabase-js';

serve(async (req) => {
  const authHeader = req.headers.get('Authorization') ?? '';
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  const cronSecret = Deno.env.get('CRON_SECRET') ?? '';
  const isServiceKey = authHeader === `Bearer ${serviceKey}`;
  const isCronSecret = cronSecret && authHeader === `Bearer ${cronSecret}`;
  if (!isServiceKey && !isCronSecret) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  const { data: rows } = await supabase
    .from('user_wellness')
    .select('user_id, last_active_date, current_streak');

  let resetCount = 0;

  for (const row of rows ?? []) {
    const updates: Record<string, unknown> = {
      daily_water_cups: 0,
      breathing_sessions_today: 0,
      calories_consumed: 0,
      xp_today: 0,
      last_active_date: today,
    };

    if (row.last_active_date !== yesterday && row.last_active_date !== today) {
      updates.current_streak = 0;
    }

    await supabase
      .from('user_wellness')
      .update(updates)
      .eq('user_id', row.user_id);

    resetCount++;
  }

  return new Response(
    JSON.stringify({ success: true, users_reset: resetCount }),
    { headers: { 'Content-Type': 'application/json' } }
  );
});
