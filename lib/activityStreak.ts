import { queryClient } from '@/lib/queryClient';
import { supabase } from '@/lib/supabase';

/**
 * Call after scan, water log, or breathing completion — idempotent per calendar day.
 * Increments current_streak in user_wellness if needed and updates last_active_date.
 */
export async function recordWellnessActivityDay(): Promise<void> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.user?.id) return;

  const uid   = session.user.id;
  const today = new Date().toISOString().slice(0, 10);

  const { data, error } = await supabase
    .from('user_wellness')
    .select('current_streak, last_active_date')
    .eq('user_id', uid)
    .maybeSingle();

  if (error) return;

  const last = (data?.last_active_date as string | null | undefined) ?? null;

  // Already recorded today — nothing to do
  if (last === today) return;

  const y = new Date();
  y.setUTCDate(y.getUTCDate() - 1);
  const yesterday = y.toISOString().slice(0, 10);

  const prev = typeof data?.current_streak === 'number' ? data.current_streak : 0;
  const next = last === yesterday ? prev + 1 : 1;

  const { error: upErr } = await supabase
    .from('user_wellness')
    .update({ current_streak: next, last_active_date: today })
    .eq('user_id', uid);

  if (!upErr) {
    void queryClient.invalidateQueries({ queryKey: ['rewards', uid] });
    void queryClient.invalidateQueries({ queryKey: ['user-wellness', uid] });
  }
}
