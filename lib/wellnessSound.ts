/**
 * Wellness reward sounds (in-app).
 *
 * Plays a short audio cue when the user logs a cup of water or finishes a
 * breathing exercise — a low-stakes "dopamine nudge" so the habit feels
 * rewarding. The sound choice mirrors what the user picked for push
 * notifications so the in-app feedback and push alert feel cohesive.
 *
 * ─── HOW TO ENABLE SOUNDS ────────────────────────────────────────────────
 *
 * Metro bundles `require('path/to/file')` calls at build time, so we can't
 * point at files that don't exist on disk or the whole dev server 500s.
 * By default every entry below is `null` and the module no-ops.
 *
 * When you're ready to wire up real audio:
 *   1. Create the folder `mobile/assets/sounds/` if it doesn't exist.
 *   2. Drop MP3 (or M4A) files matching the filenames referenced below.
 *   3. Replace the matching `null` entry with its `require(...)` line.
 *   4. Reload the bundler.
 *
 * Free sources: Pixabay, Freesound.org, Zapsplat.
 *
 * ─── PUSH NOTIFICATION SOUNDS (separate) ─────────────────────────────────
 *
 * Push reminders use OS notification sounds which must be registered in
 * `app.config.ts` via the `expo-notifications` plugin's `sounds` array
 * (WAV/CAF for iOS, WAV for Android). That's independent of the in-app
 * sounds here — they can share the same source file but are loaded by
 * different pipelines.
 */

import { createAudioPlayer, setAudioModeAsync } from 'expo-audio';

export type HydrationSoundId = 'water_drop' | 'bubble' | 'stream' | 'chime' | 'none';
export type BreathingSoundId = 'chime' | 'ocean' | 'zen' | 'bell' | 'none';

interface SoundOption<Id extends string> {
  id: Id;
  label: string;
  description: string;
}

export const HYDRATION_SOUNDS: SoundOption<HydrationSoundId>[] = [
  { id: 'water_drop', label: 'Water drop', description: 'Classic drip — crisp and clean' },
  { id: 'bubble',     label: 'Bubble pop', description: 'Playful underwater pop' },
  { id: 'stream',     label: 'Stream',     description: 'Short rushing brook' },
  { id: 'chime',      label: 'Chime',      description: 'Gentle crystalline ping' },
  { id: 'none',       label: 'Silent',     description: 'No sound, just haptics' },
];

export const BREATHING_SOUNDS: SoundOption<BreathingSoundId>[] = [
  { id: 'chime', label: 'Chime',     description: 'Soft meditation chime' },
  { id: 'ocean', label: 'Ocean wave', description: 'One slow rolling wave' },
  { id: 'zen',   label: 'Zen bowl',   description: 'Tibetan singing bowl' },
  { id: 'bell',  label: 'Temple bell', description: 'Deep resonant bell' },
  { id: 'none',  label: 'Silent',     description: 'No sound, just haptics' },
];

// ─── Asset map ────────────────────────────────────────────────────────────
//
// Set to the result of a `require(...)` call once the file is in place.
// Until then, `null` makes the sound a silent no-op (no bundler errors,
// no runtime errors — the user just gets haptics).

type SoundAsset = number | null;

const HYDRATION_SOUND_MAP: Record<HydrationSoundId, SoundAsset> = {
  water_drop: null, // e.g. require('@/assets/sounds/water-drop.mp3'),
  bubble:     null, // e.g. require('@/assets/sounds/water-bubble.mp3'),
  stream:     null, // e.g. require('@/assets/sounds/water-stream.mp3'),
  chime:      null, // e.g. require('@/assets/sounds/chime-soft.mp3'),
  none:       null,
};

const BREATHING_SOUND_MAP: Record<BreathingSoundId, SoundAsset> = {
  chime: null, // e.g. require('@/assets/sounds/chime-soft.mp3'),
  ocean: null, // e.g. require('@/assets/sounds/breathing-ocean.mp3'),
  zen:   null, // e.g. require('@/assets/sounds/breathing-zen.mp3'),
  bell:  null, // e.g. require('@/assets/sounds/breathing-bell.mp3'),
  none:  null,
};

// The ASMR gulp that plays on every cup tap — separate from the user's
// chosen hydration notification sound because this one is *always* the same
// (an unmistakable satisfying swallow) for that reliable dopamine hit.
//
// Drop `gulp.mp3` (or `gulp.m4a`) into `mobile/assets/sounds/` then
// replace the `null` below with:  require('@/assets/sounds/gulp.mp3')
const GULP_SOUND: SoundAsset = null;

// Reusable player for rapid taps — we keep ONE player alive so successive
// cup presses don't spin up new audio pipelines (which would lag on slower
// devices and cause the sound to overlap sloppily). When you tap again
// before the previous clip finishes, we restart from the top.
let gulpPlayer: ReturnType<typeof createAudioPlayer> | null = null;
function getGulpPlayer() {
  if (GULP_SOUND == null) return null;
  if (gulpPlayer) return gulpPlayer;
  try {
    gulpPlayer = createAudioPlayer(GULP_SOUND);
    gulpPlayer.volume = 1.0;
    return gulpPlayer;
  } catch {
    return null;
  }
}

// ─── Player ───────────────────────────────────────────────────────────────

let audioModeReady = false;
async function ensureAudioMode(): Promise<void> {
  if (audioModeReady) return;
  try {
    await setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: false,
      allowsRecording: false,
      interruptionMode: 'duckOthers',
      interruptionModeAndroid: 'duckOthers',
    });
    audioModeReady = true;
  } catch { /* best-effort */ }
}

async function playAsset(asset: SoundAsset, lifetimeMs: number): Promise<void> {
  if (asset == null) return;
  try {
    await ensureAudioMode();
    const player = createAudioPlayer(asset);
    player.volume = 0.9;
    player.play();
    setTimeout(() => { try { player.remove(); } catch { /* ignore */ } }, lifetimeMs);
  } catch { /* ignore */ }
}

/**
 * Fire-and-forget hydration reward sound. Safe to ignore the returned promise.
 */
export async function playHydrationSound(id: HydrationSoundId): Promise<void> {
  if (id === 'none') return;
  await playAsset(HYDRATION_SOUND_MAP[id], 3000);
}

export async function playBreathingSound(id: BreathingSoundId): Promise<void> {
  if (id === 'none') return;
  await playAsset(BREATHING_SOUND_MAP[id], 6000);
}

/**
 * Plays the ASMR gulp / swallow cue on every cup tap. Uses a single reused
 * player so rapid taps don't stutter. No-ops cleanly if the asset isn't
 * wired up yet (see `GULP_SOUND` above).
 */
export async function playGulpSound(): Promise<void> {
  const player = getGulpPlayer();
  if (!player) return;
  try {
    await ensureAudioMode();
    // Seek to 0 + replay so the sound restarts from the top on each tap.
    try { player.seekTo(0); } catch { /* ignore */ }
    player.play();
  } catch { /* ignore */ }
}
