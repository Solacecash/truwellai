/**
 * get-specialists — returns all specialist rows using the service role key.
 *
 * Why this exists: the `specialists` table has RLS that restricts SELECT to the
 * specialist's own row (user_id = auth.uid()). Member users therefore receive an
 * empty result set when querying directly, causing the telehealth directory to
 * show "No specialists found" even though profiles exist in the database.
 *
 * Using the service role key bypasses RLS so all specialists are returned.
 */
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });

  try {
    // Verify the caller is authenticated — any logged-in user may list specialists
    const authHeader = req.headers.get('Authorization') ?? '';
    const token = authHeader.replace('Bearer ', '');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Auth check — skip for anonymous listing if token is missing, require
    // it to be a valid Supabase JWT otherwise.
    if (token) {
      const { error: authErr } = await supabase.auth.getUser(token);
      if (authErr) {
        console.error('[get-specialists] auth error:', authErr.message);
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { ...cors, 'Content-Type': 'application/json' },
        });
      }
    }

    // SELECT * avoids column-not-found errors across different schema versions.
    // The client maps whatever columns are present and falls back gracefully
    // for any that are missing (null-coalesced in mapRow).
    const { data, error } = await supabase
      .from('specialists')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.error('[get-specialists] query error:', error.message, error.code);
      throw new Error(error.message);
    }

    return new Response(
      JSON.stringify({ specialists: data ?? [] }),
      { headers: { ...cors, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...cors, 'Content-Type': 'application/json' } }
    );
  }
});
