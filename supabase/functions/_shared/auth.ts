import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

export async function requireUser(req: Request) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return { user: null as null, error: 'Missing authorization' };

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } }
  );

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) return { user: null as null, error: error?.message ?? 'Unauthorized' };
  return { user, error: null as null, supabase };
}
