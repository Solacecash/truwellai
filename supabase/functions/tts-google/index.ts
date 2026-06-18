/**
 * TruWell AI — Google Cloud Text-to-Speech (Edge Function)
 *
 * Synthesizes text to ultra-realistic speech using Google Cloud TTS
 * Neural2 voices. This is the *primary* TTS engine; the existing
 * `tts-synthesize` (OpenAI) function is the fallback.
 *
 * REQUIRED SECRETS:
 *   supabase secrets set GOOGLE_TTS_API_KEY=AIza...
 *
 * REQUEST:
 *   POST { text: string, voice?: string }
 *   `voice` should be one of the six OpenAI-style names the app uses
 *   (alloy | echo | fable | onyx | nova | shimmer).  Each is mapped to a
 *   matching Google Neural2 voice below.
 *
 * RESPONSE:
 *   { audio_base64: string, mime: 'audio/mpeg', chars: number }
 *
 * VOICE MAP (OpenAI → Google Neural2 en-US):
 *   alloy   → en-US-Neural2-C  (female, warm/neutral)
 *   echo    → en-US-Neural2-D  (male, clear/natural)
 *   fable   → en-US-Neural2-I  (male, expressive)
 *   onyx    → en-US-Neural2-J  (male, deep/authoritative)
 *   nova    → en-US-Neural2-F  (female, confident/professional)
 *   shimmer → en-US-Neural2-G  (female, soft/friendly)
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const VOICE_MAP: Record<string, string> = {
  alloy:   'en-US-Neural2-C',
  echo:    'en-US-Neural2-D',
  fable:   'en-US-Neural2-I',
  onyx:    'en-US-Neural2-J',
  nova:    'en-US-Neural2-F',
  shimmer: 'en-US-Neural2-G',
};

const DEFAULT_VOICE = 'en-US-Neural2-F';
const MAX_CHARS = 5000; // Google Cloud TTS limit per request is much higher than OpenAI's

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });

  try {
    const apiKey = Deno.env.get('GOOGLE_TTS_API_KEY');
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'GOOGLE_TTS_API_KEY not configured on the server.' }),
        { status: 500, headers: { ...cors, 'Content-Type': 'application/json' } }
      );
    }

    const body = (await req.json().catch(() => null)) as { text?: string; voice?: string } | null;
    if (!body?.text || typeof body.text !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Missing `text` in request body.' }),
        { status: 400, headers: { ...cors, 'Content-Type': 'application/json' } }
      );
    }

    // Strip markdown symbols that TTS would read literally.
    const cleaned = body.text
      .replace(/[*_`#>]/g, ' ')
      .replace(/\[(.*?)\]\((.*?)\)/g, '$1')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, MAX_CHARS);

    if (cleaned.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Nothing to speak after cleaning the text.' }),
        { status: 400, headers: { ...cors, 'Content-Type': 'application/json' } }
      );
    }

    const voiceName = VOICE_MAP[(body.voice ?? 'nova').toLowerCase()] ?? DEFAULT_VOICE;

    const gRes = await fetch(
      `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input: { text: cleaned },
          voice: { languageCode: 'en-US', name: voiceName },
          audioConfig: {
            audioEncoding: 'MP3',
            speakingRate: 1.0,
            pitch: 0.0,
            volumeGainDb: 0.0,
            effectsProfileId: ['headphone-class-device'],
          },
        }),
      }
    );

    if (!gRes.ok) {
      const errText = await gRes.text();
      return new Response(
        JSON.stringify({ error: `Google TTS failed (${gRes.status}): ${errText.slice(0, 300)}` }),
        { status: 502, headers: { ...cors, 'Content-Type': 'application/json' } }
      );
    }

    const data = (await gRes.json()) as { audioContent?: string; error?: { message: string } };

    if (data.error) {
      return new Response(
        JSON.stringify({ error: `Google TTS error: ${data.error.message}` }),
        { status: 502, headers: { ...cors, 'Content-Type': 'application/json' } }
      );
    }

    if (!data.audioContent) {
      return new Response(
        JSON.stringify({ error: 'Google TTS returned no audio content.' }),
        { status: 502, headers: { ...cors, 'Content-Type': 'application/json' } }
      );
    }

    // Google returns base64 MP3 directly in `audioContent`.
    return new Response(
      JSON.stringify({ audio_base64: data.audioContent, mime: 'audio/mpeg', chars: cleaned.length }),
      { headers: { ...cors, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return new Response(
      JSON.stringify({ error: `Unexpected error in tts-google: ${msg}` }),
      { status: 500, headers: { ...cors, 'Content-Type': 'application/json' } }
    );
  }
});
