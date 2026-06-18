/**
 * Wellness reminders — hydration + breathing.
 *
 * Schedules recurring local notifications via `expo-notifications` using the
 * user's preferences (enabled flags, schedule windows, per-feature sound).
 * Hydration reminders are spread evenly across the user's chosen window
 * using multiple DAILY triggers. Breathing reminders fire at the explicit
 * HH:mm times the user chose.
 *
 * All reminders live in an isolated notification channel (Android) with the
 * appropriate sound file so the OS picks up the custom audio cue.
 */

import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import type { BreathingSoundId, HydrationSoundId } from './wellnessSound';

// ─── Types ────────────────────────────────────────────────────────────────

export interface WellnessReminderPrefs {
  hydration_reminder_enabled: boolean;
  hydration_reminder_interval_min: number;
  hydration_reminder_start_hour: number;
  hydration_reminder_end_hour: number;
  hydration_reminder_sound: HydrationSoundId;
  breathing_reminder_enabled: boolean;
  breathing_reminder_times: string[]; // 'HH:mm'
  breathing_reminder_sound: BreathingSoundId;
}

export const DEFAULT_WELLNESS_PREFS: WellnessReminderPrefs = {
  hydration_reminder_enabled: true,
  hydration_reminder_interval_min: 90,
  hydration_reminder_start_hour: 9,
  hydration_reminder_end_hour: 21,
  hydration_reminder_sound: 'water_drop',
  breathing_reminder_enabled: true,
  breathing_reminder_times: ['10:00', '15:00', '21:00'],
  breathing_reminder_sound: 'chime',
};

const HYDRATION_TAG = 'truwell.hydration';
const BREATHING_TAG = 'truwell.breathing';

// ─── Channels (Android) ───────────────────────────────────────────────────

/**
 * Creates / updates the Android notification channels. Channel sound cannot
 * be changed after creation — we therefore use distinct channel ids per
 * sound so switching sound takes effect immediately. Sound filename is used
 * verbatim; if the bundled asset isn't present the OS falls back to default.
 */
async function ensureChannels(
  hydrationSound: HydrationSoundId,
  breathingSound: BreathingSoundId
): Promise<{ hydrationChannelId: string; breathingChannelId: string }> {
  if (Platform.OS !== 'android') {
    return { hydrationChannelId: 'default', breathingChannelId: 'default' };
  }
  const hydrationChannelId = `truwell-hydration-${hydrationSound}`;
  const breathingChannelId = `truwell-breathing-${breathingSound}`;

  await Notifications.setNotificationChannelAsync(hydrationChannelId, {
    name: 'Hydration reminders',
    importance: Notifications.AndroidImportance.DEFAULT,
    sound: hydrationSound === 'none' ? null : `${hydrationSound}.wav`,
    vibrationPattern: [0, 120, 80, 120],
    lightColor: '#00E5C8',
  });
  await Notifications.setNotificationChannelAsync(breathingChannelId, {
    name: 'Breathing reminders',
    importance: Notifications.AndroidImportance.DEFAULT,
    sound: breathingSound === 'none' ? null : `${breathingSound}.wav`,
    vibrationPattern: [0, 200, 120, 200],
    lightColor: '#A78BFA',
  });
  return { hydrationChannelId, breathingChannelId };
}

// ─── Helpers ──────────────────────────────────────────────────────────────

/**
 * Returns evenly-spaced HH:mm times from `startHour` (inclusive) to
 * `endHour` (inclusive) spaced by `intervalMin` minutes. Capped at 10
 * reminders/day so we never DoS the user's notification tray.
 */
function spreadHydrationTimes(
  intervalMin: number,
  startHour: number,
  endHour: number
): { hour: number; minute: number }[] {
  const out: { hour: number; minute: number }[] = [];
  const windowMin = (endHour - startHour) * 60;
  const step = Math.max(30, Math.min(360, intervalMin));
  let tMin = 0;
  while (tMin <= windowMin) {
    const totalMin = startHour * 60 + tMin;
    out.push({ hour: Math.floor(totalMin / 60) % 24, minute: totalMin % 60 });
    tMin += step;
    if (out.length >= 10) break;
  }
  return out;
}

function parseHHmm(value: string): { hour: number; minute: number } | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(value.trim());
  if (!m) return null;
  const hour = parseInt(m[1], 10);
  const minute = parseInt(m[2], 10);
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;
  return { hour, minute };
}

const HYDRATION_COPY: { title: string; body: string }[] = [
  { title: 'Hydration check',   body: 'Quick sip of water — your body will thank you.' },
  { title: 'Water break',       body: 'Time for a glass of water. One cup, you got this.' },
  { title: 'Stay hydrated',     body: "Don't let brain fog sneak in — grab some water." },
  { title: 'Refill reminder',   body: 'A cup now keeps the 3pm slump away.' },
  { title: 'Sip now',           body: 'Water = energy, focus, glowy skin. Go get some.' },
];

const BREATHING_COPY: { title: string; body: string }[] = [
  { title: 'Pause to breathe',  body: '60 seconds of slow breaths resets your whole day.' },
  { title: 'Reset your breath', body: 'One short session — exhale the tension.' },
  { title: 'Calm check-in',     body: 'Your lungs want a slow, easy breath. Open TruWell.' },
];

function pick<T>(arr: T[], seed: number): T {
  return arr[Math.abs(seed) % arr.length];
}

// ─── Cancel existing ──────────────────────────────────────────────────────

async function cancelTagged(tag: string): Promise<void> {
  try {
    const all = await Notifications.getAllScheduledNotificationsAsync();
    await Promise.all(
      all
        .filter((n) => (n.content?.data as { tag?: string } | null)?.tag === tag)
        .map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier))
    );
  } catch { /* ignore */ }
}

// ─── Public API ───────────────────────────────────────────────────────────

/**
 * Cancels existing hydration + breathing reminders, then schedules new ones
 * based on the provided prefs. Safe to call repeatedly — always leaves the
 * OS scheduler in sync with the latest prefs.
 *
 * Returns the number of reminders scheduled so the caller can surface UX
 * feedback ("5 hydration reminders set for today").
 */
export async function applyWellnessReminderPrefs(
  prefs: WellnessReminderPrefs
): Promise<{ hydrationCount: number; breathingCount: number }> {
  if (Platform.OS === 'web') return { hydrationCount: 0, breathingCount: 0 };

  // Permission gate.
  try {
    const perm = await Notifications.getPermissionsAsync();
    if (!perm.granted) {
      const req = await Notifications.requestPermissionsAsync();
      if (!req.granted) return { hydrationCount: 0, breathingCount: 0 };
    }
  } catch { /* ignore */ }

  const { hydrationChannelId, breathingChannelId } = await ensureChannels(
    prefs.hydration_reminder_sound,
    prefs.breathing_reminder_sound
  );

  await cancelTagged(HYDRATION_TAG);
  await cancelTagged(BREATHING_TAG);

  let hydrationCount = 0;
  if (prefs.hydration_reminder_enabled) {
    const times = spreadHydrationTimes(
      prefs.hydration_reminder_interval_min,
      prefs.hydration_reminder_start_hour,
      prefs.hydration_reminder_end_hour
    );
    for (let i = 0; i < times.length; i += 1) {
      const { hour, minute } = times[i];
      const copy = pick(HYDRATION_COPY, i);
      try {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: copy.title,
            body: copy.body,
            sound: prefs.hydration_reminder_sound === 'none'
              ? undefined
              : `${prefs.hydration_reminder_sound}.wav`,
            data: { tag: HYDRATION_TAG, type: 'hydration' },
          },
          trigger: Platform.OS === 'android'
            ? {
                type: Notifications.SchedulableTriggerInputTypes.DAILY,
                hour,
                minute,
                channelId: hydrationChannelId,
              }
            : {
                type: Notifications.SchedulableTriggerInputTypes.DAILY,
                hour,
                minute,
              },
        });
        hydrationCount += 1;
      } catch { /* ignore individual failures */ }
    }
  }

  let breathingCount = 0;
  if (prefs.breathing_reminder_enabled) {
    const parsed = prefs.breathing_reminder_times
      .map(parseHHmm)
      .filter((x): x is { hour: number; minute: number } => x !== null)
      .slice(0, 6);
    for (let i = 0; i < parsed.length; i += 1) {
      const { hour, minute } = parsed[i];
      const copy = pick(BREATHING_COPY, i);
      try {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: copy.title,
            body: copy.body,
            sound: prefs.breathing_reminder_sound === 'none'
              ? undefined
              : `${prefs.breathing_reminder_sound}.wav`,
            data: { tag: BREATHING_TAG, type: 'breathing' },
          },
          trigger: Platform.OS === 'android'
            ? {
                type: Notifications.SchedulableTriggerInputTypes.DAILY,
                hour,
                minute,
                channelId: breathingChannelId,
              }
            : {
                type: Notifications.SchedulableTriggerInputTypes.DAILY,
                hour,
                minute,
              },
        });
        breathingCount += 1;
      } catch { /* ignore */ }
    }
  }

  return { hydrationCount, breathingCount };
}

/** Cancels ALL wellness-tagged reminders (used on sign-out or full disable). */
export async function cancelAllWellnessReminders(): Promise<void> {
  await cancelTagged(HYDRATION_TAG);
  await cancelTagged(BREATHING_TAG);
}
