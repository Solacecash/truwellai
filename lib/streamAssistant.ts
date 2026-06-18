import { env } from '@/lib/env';
import { supabase } from '@/lib/supabase';

function parseSseDataLine(trimmed: string, onDelta: (chunk: string) => void) {
  if (!trimmed.startsWith('data:')) return;
  const payload = trimmed.slice(5).trim();
  if (payload === '[DONE]' || !payload) return;
  try {
    const json = JSON.parse(payload) as {
      choices?: { delta?: { content?: string } }[];
    };
    const piece = json.choices?.[0]?.delta?.content;
    if (piece) onDelta(piece);
  } catch {
    /* ignore partial JSON */
  }
}

/**
 * Streams assistant tokens from `assistant-stream` (OpenAI SSE passthrough).
 * Falls back to non-streaming `assistant` invoke if the runtime has no body reader.
 */
export async function streamAssistantMessage(
  messages: { role: string; content: string }[],
  context: string | undefined,
  onDelta: (chunk: string) => void,
  opts?: { signal?: AbortSignal }
): Promise<{ usedStream: boolean }> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error('Not signed in');

  const origin = env.supabaseUrl.replace(/\/$/, '');
  if (!origin) throw new Error('Supabase URL is not configured.');
  const url = `${origin}/functions/v1/assistant-stream`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
      apikey: env.supabaseAnonKey,
    },
    body: JSON.stringify({ messages, ...(context ? { context } : {}) }),
    signal: opts?.signal,
  });

  if (!res.ok) {
    const t = await res.text();
    throw new Error(t || `Stream failed (${res.status})`);
  }

  const reader = res.body?.getReader?.();
  if (!reader) {
    return { usedStream: false };
  }

  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    if (opts?.signal?.aborted) {
      await reader.cancel().catch(() => {});
      throw new Error('Aborted');
    }
    const { done, value } = await reader.read();
    if (done) break;
    if (value) {
      buffer += decoder.decode(value, { stream: true });
      const parts = buffer.split('\n');
      buffer = parts.pop() ?? '';
      for (const line of parts) {
        parseSseDataLine(line.trim(), onDelta);
      }
    }
  }
  buffer += decoder.decode();
  if (buffer.trim()) {
    for (const line of buffer.split('\n')) {
      parseSseDataLine(line.trim(), onDelta);
    }
  }

  return { usedStream: true };
}
