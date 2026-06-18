/**
 * TruWell AI — Speech-to-Text (Edge Function)
 *
 * Transcribes voice recordings from the mobile client using OpenAI's
 * Whisper (whisper-1) model.
 *
 * REQUIRED SECRETS:
 *   - OPENAI_API_KEY   (set via: supabase secrets set OPENAI_API_KEY=sk-...)
 *
 * REQUEST:
 *   POST {
 *     audio_base64: string,       // raw audio file bytes, base64 encoded
 *     mime_type?: string,         // e.g. 'audio/m4a', 'audio/webm', 'audio/3gpp'
 *     filename?: string,          // hint for Whisper ('audio.m4a' etc.)
 *     language?: string,          // ISO 639-1 code; omit for auto-detect
 *   }
 *
 * RESPONSE:
 *   { text: string, duration_ms?: number }
 *
 * NOTES:
 *   - We rebuild a multipart/form-data body manually so we can use native
 *     Deno fetch without extra deps.
 *   - Default filename uses the mime_type extension so Whisper picks the
 *     correct decoder.
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { decode as b64decode } from 'https://deno.land/std@0.168.0/encoding/base64.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const ALLOWED_ORIGINS = [
  'https://truwellai.xyz',
  'capacitor://localhost',
  'http://localhost',
  'http://localhost:8081',
  'http://localhost:19006',
];

function getCorsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get('Origin') ?? '';
  const allowed = ALLOWED_ORIGINS.includes(origin)
    ? origin
    : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Headers':
      'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Vary': 'Origin',
  };
}

function extForMime(mime: string): string {
  const m = mime.toLowerCase();
  if (m.includes('mpeg') || m.includes('mp3')) return 'mp3';
  if (m.includes('mp4') || m.includes('m4a') || m.includes('aac')) return 'm4a';
  if (m.includes('wav')) return 'wav';
  if (m.includes('webm')) return 'webm';
  if (m.includes('ogg')) return 'ogg';
  if (m.includes('3gp') || m.includes('3gpp')) return '3gp';
  return 'm4a';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: getCorsHeaders(req) });
  }

  const incomingAuthHeader = req.headers.get('Authorization') ?? '';
  const incomingToken = incomingAuthHeader.replace('Bearer ', '');
  const authClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );
  const { data: callerAuth, error: callerAuthErr } =
    await authClient.auth.getUser(incomingToken);
  if (callerAuthErr || !callerAuth?.user) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized' }),
      { status: 401, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
    );
  }

  try {
    const apiKey = Deno.env.get('OPENAI_API_KEY');
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'Voice transcription is not configured. OPENAI_API_KEY missing on the server.' }),
        { status: 500, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
      );
    }

    const body = (await req.json().catch(() => null)) as {
      audio_base64?: string;
      mime_type?: string;
      filename?: string;
      language?: string;
    } | null;

    if (!body?.audio_base64 || typeof body.audio_base64 !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Missing `audio_base64` in request body.' }),
        { status: 400, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
      );
    }

    // Expo's recording uris produce base64 payloads roughly 1.33x the byte
    // size. Guard against absurdly large uploads (>8MB audio, ~64s HQ m4a).
    const rawSize = Math.floor((body.audio_base64.length * 3) / 4);
    if (rawSize > 8 * 1024 * 1024) {
      return new Response(
        JSON.stringify({ error: 'Recording is too long. Please keep messages under ~60 seconds.' }),
        { status: 413, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
      );
    }

    const audioBytes = b64decode(body.audio_base64);
    const mime = body.mime_type || 'audio/m4a';
    const ext = extForMime(mime);
    const filename = body.filename || `audio.${ext}`;

    const form = new FormData();
    form.append('file', new Blob([audioBytes], { type: mime }), filename);
    form.append('model', 'whisper-1');
    form.append('response_format', 'json');
    if (body.language) form.append('language', body.language);

    const whisperRes = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}` },
      body: form,
    });

    if (!whisperRes.ok) {
      const errText = await whisperRes.text();
      return new Response(
        JSON.stringify({ error: `Whisper transcription failed (${whisperRes.status}): ${errText.slice(0, 200)}` }),
        { status: 502, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
      );
    }

    const data = (await whisperRes.json()) as { text?: string; duration?: number };
    const text = (data.text ?? '').trim();

    return new Response(
      JSON.stringify({
        text,
        duration_ms: typeof data.duration === 'number' ? Math.round(data.duration * 1000) : undefined,
      }),
      { headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return new Response(
      JSON.stringify({ error: `Unexpected error in stt-transcribe: ${msg}` }),
      { status: 500, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
    );
  }
});
