import { invokeGoogleTtsSynthesis, invokeTtsSynthesis } from '@/lib/edge';
import { writeAudioBase64ToCache } from '@/lib/voiceAudio';
import { useVoiceStore } from '@/stores/voiceStore';
import { setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import * as ExpoSpeech from 'expo-speech';
import { useCallback, useEffect, useRef, useState } from 'react';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Returns true when an error string looks like an API quota / rate-limit hit. */
function isQuotaError(msg: string): boolean {
  return /429|quota|rate.?limit|billing/i.test(msg);
}

/**
 * Speak `text` with the device's native TTS engine (last-resort fallback).
 * Returns a promise that resolves when speech completes.
 */
function speakNative(text: string): Promise<void> {
  return new Promise((resolve, reject) => {
    ExpoSpeech.speak(text, {
      rate: 0.95,
      pitch: 1.0,
      onDone: resolve,
      onError: (e) => reject(new Error(String(e))),
    });
  });
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SpeechPlayerApi {
  /** The message id currently being played (if any). */
  playingId: string | null;
  /** The message id we are currently synthesizing speech for (TTS in-flight). */
  loadingId: string | null;
  /** Error string, if the most recent attempt failed. */
  error: string | null;
  /** Start speaking a message. If `id` is already playing, it is stopped instead (toggle). */
  play: (id: string, text: string) => Promise<void>;
  /** Stop any active playback and clear state. */
  stop: () => void;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Owns a single `expo-audio` player that can speak any AI message.
 *
 * Priority chain (each tier is attempted before moving to the next):
 *   1. Google Cloud TTS Neural2  — `tts-google` Edge Function   (primary)
 *   2. OpenAI tts-1-hd           — `tts-synthesize` Edge Function (fallback)
 *   3. Device native TTS         — expo-speech                   (last resort)
 *
 * A quota / rate-limit (429) on tier N silently advances to tier N+1.
 * Any other error on tier 1 also advances to tier 2 to maximise resilience.
 */
export function useSpeechPlayer(): SpeechPlayerApi {
  const player = useAudioPlayer(null);
  const status = useAudioPlayerStatus(player);
  const voiceId = useVoiceStore((s) => s.voiceId);

  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Monotonic counter — incremented every time a new play/stop request arrives.
  // Guards against races when the user taps rapidly between messages.
  const activeReqRef = useRef<number>(0);

  // Configure audio mode once: play through silent-mode switch on iOS; duck
  // other audio rather than stopping it on Android.
  useEffect(() => {
    setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: false,
      allowsRecording: false,
      interruptionMode: 'duckOthers',
      interruptionModeAndroid: 'duckOthers',
    }).catch(() => { /* best-effort */ });
  }, []);

  // Mirror player status into `playingId`.
  useEffect(() => {
    if (!status.isLoaded) return;
    if (status.playing) return;
    const ended = status.duration > 0 && status.currentTime >= status.duration - 0.15;
    if (ended) setPlayingId(null);
  }, [status.playing, status.currentTime, status.duration, status.isLoaded]);

  const stop = useCallback(() => {
    try { player.pause(); player.seekTo(0); } catch { /* ignore */ }
    ExpoSpeech.stop().catch(() => { /* ignore */ });
    activeReqRef.current += 1;
    setLoadingId(null);
    setPlayingId(null);
    setError(null);
  }, [player]);

  const play = useCallback(async (id: string, text: string) => {
    // Toggle — tapping the same bubble that is playing stops it.
    if (playingId === id) { stop(); return; }

    const reqId = ++activeReqRef.current;
    try { player.pause(); } catch { /* ignore */ }
    setPlayingId(null);
    setError(null);
    setLoadingId(id);

    // ── Tier 1: Google Cloud TTS ──────────────────────────────────────────
    let audio_base64: string | null = null;
    try {
      const result = await invokeGoogleTtsSynthesis({ text, voice: voiceId });
      if (reqId !== activeReqRef.current) return;
      audio_base64 = result.audio_base64;
      if (__DEV__) console.log('[voice] Google TTS ok, chars =', result.chars);
    } catch (googleErr) {
      if (reqId !== activeReqRef.current) return;
      const gMsg = googleErr instanceof Error ? googleErr.message : String(googleErr);
      if (__DEV__) console.log('[voice] Google TTS failed, trying OpenAI fallback —', gMsg);

      // ── Tier 2: OpenAI TTS ──────────────────────────────────────────────
      try {
        const result = await invokeTtsSynthesis({ text, voice: voiceId });
        if (reqId !== activeReqRef.current) return;
        audio_base64 = result.audio_base64;
        if (__DEV__) console.log('[voice] OpenAI TTS ok (fallback), chars =', result.chars);
      } catch (openaiErr) {
        if (reqId !== activeReqRef.current) return;
        const oMsg = openaiErr instanceof Error ? openaiErr.message : String(openaiErr);
        if (__DEV__) console.log('[voice] OpenAI TTS failed, using device native —', oMsg);

        // ── Tier 3: Device native TTS ───────────────────────────────────
        setLoadingId(null);
        setPlayingId(id);
        try {
          await speakNative(text);
        } catch {
          /* native TTS failure is fully silent — audio is non-critical */
        } finally {
          if (reqId === activeReqRef.current) setPlayingId(null);
        }
        return;
      }
    }

    // We have base64 audio — play it through expo-audio.
    if (!audio_base64 || reqId !== activeReqRef.current) return;
    try {
      const uri = writeAudioBase64ToCache(audio_base64, 'mp3');
      player.replace(uri);
      player.play();
      setLoadingId(null);
      setPlayingId(id);
    } catch (playErr) {
      if (reqId !== activeReqRef.current) return;
      setLoadingId(null);
      setPlayingId(null);
      setError(playErr instanceof Error ? playErr.message : 'Unable to play audio.');
    }
  }, [player, playingId, stop, voiceId]);

  return { playingId, loadingId, error, play, stop };
}
