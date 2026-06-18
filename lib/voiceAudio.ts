/**
 * Voice/audio helpers for the AI chat.
 *
 * Responsibilities:
 *   - Write TTS base64 responses to cache so expo-audio can play them.
 *   - Read a recording file back as base64 so we can POST it to Whisper.
 *   - Infer a reasonable MIME type for the recorded file.
 */

import { File, Paths } from 'expo-file-system';
import { Platform } from 'react-native';

/**
 * Writes a base64-encoded audio blob to the app's cache directory and returns
 * the resulting file:// URI that can be fed into `useAudioPlayer(uri)`.
 *
 * @param base64  The raw base64 payload (NO `data:` prefix).
 * @param ext     File extension — defaults to `mp3` since OpenAI TTS returns MP3.
 */
export function writeAudioBase64ToCache(base64: string, ext: string = 'mp3'): string {
  const name = `tts-${Date.now()}.${ext}`;
  const file = new File(Paths.cache, name);
  // Calling `create` on a fresh File reference is a no-op if it already exists
  // in the cache folder. Wrap in try/catch in case the cache is absent on the
  // very first launch.
  try {
    file.create({ intermediates: true });
  } catch {
    /* file may already exist, which is fine */
  }
  file.write(base64, { encoding: 'base64' });
  return file.uri;
}

/**
 * Reads the recording at `uri` back as a base64 string, ready to ship to
 * Whisper via the stt-transcribe Edge Function.
 */
export async function readRecordingAsBase64(uri: string): Promise<string> {
  const f = new File(uri);
  return f.base64();
}

/**
 * Best-effort MIME-type inference for a recording URI. expo-audio defaults to
 * an m4a/AAC container on iOS and Android, but we fall back based on suffix.
 */
export function guessAudioMime(uri: string): string {
  const u = uri.toLowerCase();
  if (u.endsWith('.mp3'))  return 'audio/mpeg';
  if (u.endsWith('.wav'))  return 'audio/wav';
  if (u.endsWith('.m4a'))  return 'audio/m4a';
  if (u.endsWith('.aac'))  return 'audio/aac';
  if (u.endsWith('.webm')) return 'audio/webm';
  if (u.endsWith('.3gp'))  return 'audio/3gpp';
  // Platform defaults for expo-audio HIGH_QUALITY preset:
  return Platform.OS === 'ios' ? 'audio/m4a' : 'audio/m4a';
}

/**
 * Suggested default filename for Whisper given a MIME type. Whisper uses the
 * extension to pick a decoder when the upload has no other hints.
 */
export function filenameForMime(mime: string): string {
  const m = mime.toLowerCase();
  if (m.includes('mpeg')) return 'audio.mp3';
  if (m.includes('wav'))  return 'audio.wav';
  if (m.includes('webm')) return 'audio.webm';
  if (m.includes('3gp'))  return 'audio.3gp';
  if (m.includes('aac'))  return 'audio.aac';
  return 'audio.m4a';
}
