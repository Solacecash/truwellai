import { File, Paths } from 'expo-file-system';

/**
 * Strip Markdown — string replace operations only — for cloud TTS payloads.
 */
export function sanitizeForSpeech(text: string): string {
  let s = text;
  s = s.replace(/```[\s\S]*?```/g, ' ');
  s = s.replace(/\*\*([\s\S]*?)\*\*/g, '$1');
  s = s.replace(/\*([\s\S]*?)\*/g, '$1');
  s = s.replace(/^#{1,6}\s?/gm, '');
  s = s.replace(/\[(.*?)]\([^)]*\)/g, '$1');
  s = s.replace(/^\s*[-*]+\s+/gm, '');
  s = s.replace(/\s+/g, ' ');
  return s.trim();
}

/**
 * Split at sentence endings so each chunk is under maxChars while never emitting empty output.
 */
export function splitIntoChunks(text: string, maxChars = 200): string[] {
  const t = text.trim();
  if (t.length === 0) return [''];
  if (t.length <= maxChars) return [t];

  const splits = t.split(/(?<=[.!?])\s+/).filter(Boolean);
  if (splits.length <= 1) {
    const chunk = t.slice(0, maxChars);
    return chunk.length > 0 ? [chunk] : [t.slice(0, Math.min(maxChars, t.length))];
  }

  const out: string[] = [];
  let buf = '';

  function flush(forceSlice = false) {
    let piece = buf.trim();
    if (forceSlice && piece.length > maxChars) {
      piece = piece.slice(0, maxChars);
    }
    if (piece.length > 0) out.push(piece);
    buf = '';
  }

  for (const part of splits) {
    const candidate = buf ? `${buf} ${part}` : part;
    if (candidate.length <= maxChars) {
      buf = candidate;
    } else {
      flush(true);
      if (part.length <= maxChars) {
        buf = part;
      } else {
        for (let i = 0; i < part.length; i += maxChars) {
          const slice = part.slice(i, i + maxChars).trim();
          if (slice.length > 0) out.push(slice);
        }
      }
    }
  }
  flush(false);

  if (out.length === 0 && t.length > 0) {
    return [t.slice(0, maxChars)];
  }
  return out;
}

/**
 * Write WAV base64 to cache and return a file:// URI playable by expo-audio.
 */
export async function base64ToUri(base64: string, fileExtension = 'wav'): Promise<string> {
  const name = `nim-tts-${Date.now()}-${Math.random().toString(16).slice(2)}.${fileExtension}`;
  const file = new File(Paths.cache, name);
  try {
    file.create({ intermediates: true });
  } catch {
    /* may already exist */
  }
  file.write(base64, { encoding: 'base64' });
  return file.uri;
}

export async function releaseUri(uri: string): Promise<void> {
  if (!uri.startsWith('file://')) return;
  try {
    new File(uri).delete();
  } catch {
    /* idempotent best-effort */
  }
}
