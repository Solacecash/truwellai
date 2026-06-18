/**
 * Load / save the wellness reminder subset of `user_preferences`.
 *
 * Kept separate from the generic notification preferences UI so that the
 * wellness reminder screen can always operate against strongly-typed data
 * and remain resilient if the SQL migration hasn't been applied yet — in
 * that case we fall back to hard-coded defaults.
 */

import { supabase } from './supabase';
import { DEFAULT_WELLNESS_PREFS, type WellnessReminderPrefs } from './wellnessReminders';

const WELLNESS_COLUMNS =
  'hydration_reminder_enabled,' +
  'hydration_reminder_interval_min,' +
  'hydration_reminder_start_hour,' +
  'hydration_reminder_end_hour,' +
  'hydration_reminder_sound,' +
  'breathing_reminder_enabled,' +
  'breathing_reminder_times,' +
  'breathing_reminder_sound';

function coerce(row: Partial<WellnessReminderPrefs> | null): WellnessReminderPrefs {
  if (!row) return { ...DEFAULT_WELLNESS_PREFS };
  return {
    hydration_reminder_enabled:
      row.hydration_reminder_enabled ?? DEFAULT_WELLNESS_PREFS.hydration_reminder_enabled,
    hydration_reminder_interval_min:
      row.hydration_reminder_interval_min ?? DEFAULT_WELLNESS_PREFS.hydration_reminder_interval_min,
    hydration_reminder_start_hour:
      row.hydration_reminder_start_hour ?? DEFAULT_WELLNESS_PREFS.hydration_reminder_start_hour,
    hydration_reminder_end_hour:
      row.hydration_reminder_end_hour ?? DEFAULT_WELLNESS_PREFS.hydration_reminder_end_hour,
    hydration_reminder_sound:
      row.hydration_reminder_sound ?? DEFAULT_WELLNESS_PREFS.hydration_reminder_sound,
    breathing_reminder_enabled:
      row.breathing_reminder_enabled ?? DEFAULT_WELLNESS_PREFS.breathing_reminder_enabled,
    breathing_reminder_times: Array.isArray(row.breathing_reminder_times)
      ? row.breathing_reminder_times
      : DEFAULT_WELLNESS_PREFS.breathing_reminder_times,
    breathing_reminder_sound:
      row.breathing_reminder_sound ?? DEFAULT_WELLNESS_PREFS.breathing_reminder_sound,
  };
}

export async function loadWellnessPrefs(userId: string): Promise<WellnessReminderPrefs> {
  const { data, error } = await supabase
    .from('user_preferences')
    .select(WELLNESS_COLUMNS)
    .eq('user_id', userId)
    .maybeSingle();
  // If the columns don't exist yet (migration not applied), Supabase returns
  // a PostgREST "column not found" error. We fall back to defaults so the
  // UI still works and the user can save later.
  if (error) return { ...DEFAULT_WELLNESS_PREFS };
  return coerce(data as Partial<WellnessReminderPrefs> | null);
}

export async function saveWellnessPrefs(
  userId: string,
  prefs: WellnessReminderPrefs
): Promise<void> {
  const { error } = await supabase
    .from('user_preferences')
    .upsert(
      {
        user_id: userId,
        ...prefs,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    );
  if (error) throw new Error(error.message);
}
