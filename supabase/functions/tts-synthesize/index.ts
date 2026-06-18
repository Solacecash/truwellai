/**
 * TruWell AI — Text-to-Speech (Edge Function)
 *
 * Synthesizes AI responses to ultra-realistic speech using OpenAI's
 * `tts-1-hd` model (HD variant for premium audio quality).
 *
 * REQUIRED SECRETS:
 *   - OPENAI_API_KEY   (set via: supabase secrets set OPENAI_API_KEY=sk-...)
 *
 * REQUEST:
 *   POST { text: string, voice: 'alloy'|'echo'|'fable'|'onyx'|'nova'|'shimmer' }
 *
 * RESPONSE:
 *   { audio_base64: string, mime: 'audio/mpeg', chars: number }
 *
 * NOTES:
 *   - Returns base64 rather than streaming bytes because the mobile client
 *     uses expo-audio with a file URI; base64 -> FileSystem.writeAsString
 *     is the simplest cross-platform path.
 *   - Max input capped at 4000 chars (OpenAI's hard limit is 4096).
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { encode as b64encode } from 'https://deno.land/std@0.168.0/encoding/base64.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const ALLOWED_VOICES = new Set(['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer']);
const MAX_CHARS = 4000;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get('OPENAI_API_KEY');
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'Voice synthesis is not configured. OPENAI_API_KEY missing on the server.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body = (await req.json().catch(() => null)) as { text?: string; voice?: string } | null;
    if (!body?.text || typeof body.text !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Missing `text` in request body.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const voice = (body.voice ?? 'nova').toLowerCase();
    if (!ALLOWED_VOICES.has(voice)) {
      return new Response(
        JSON.stringify({ error: `Unsupported voice "${voice}". Allowed: ${[...ALLOWED_VOICES].join(', ')}.` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Sanitize: strip markdown characters that the TTS would read literally.
    const cleaned = body.text
      .replace(/[*_`#>]/g, ' ')
      .replace(/\[(.*?)\]\((.*?)\)/g, '$1')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, MAX_CHARS);

    if (cleaned.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Nothing to speak after cleaning the text.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const openAiRes = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'tts-1-hd',
        input: cleaned,
        voice,
        response_format: 'mp3',
        speed: 1.0,
      }),
    });

    if (!openAiRes.ok) {
      const errText = await openAiRes.text();
      return new Response(
        JSON.stringify({ error: `OpenAI TTS failed (${openAiRes.status}): ${errText.slice(0, 200)}` }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const audioBuf = new Uint8Array(await openAiRes.arrayBuffer());
    const audio_base64 = b64encode(audioBuf);

    return new Response(
      JSON.stringify({ audio_base64, mime: 'audio/mpeg', chars: cleaned.length }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return new Response(
      JSON.stringify({ error: `Unexpected error in tts-synthesize: ${msg}` }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
