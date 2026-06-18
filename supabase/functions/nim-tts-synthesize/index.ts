/**
 * TruWell AI — NVIDIA NIM Cloud TTS synthesis (Edge Function)
 *
 * REQUIRED SECRETS (set via `supabase secrets set ...`):
 *   NGC_API_KEY, NIM_TTS_URL, TRUWELL_TTS_ENABLED
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function sanitizeForSpeech(text: string): string {
  let s = text;
  s = s.replace(/```[\s\S]*?```/g, ' ');
  s = s.replace(/\*\*([\s\S]*?)\*\*/g, '$1');
  s = s.replace(/\*([\s\S]*?)\*/g, '$1');
  s = s.replace(/^#{1,6}\s?/gm, '');
  s = s.replace(/\[(.*?)]\(([^)]*)\)/g, '$1');
  s = s.replace(/^\s*[-*]+\s+/gm, '');
  s = s.replace(/\s+/g, ' ');
  return s.trim();
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    if (Deno.env.get('TRUWELL_TTS_ENABLED') !== 'true') {
      return new Response(JSON.stringify({ error: 'TTS is disabled' }), {
        status: 503,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const apiKey = Deno.env.get('NGC_API_KEY');
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'Voice unavailable' }), {
        status: 503,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const nimUrl = Deno.env.get('NIM_TTS_URL') ?? '';

    const body =
      (await req.json().catch(() => null)) as
      | { text?: string; voice?: string; languageCode?: string }
      | null;

    if (!body?.text || typeof body.text !== 'string' || body.text.trim().length === 0) {
      return new Response(JSON.stringify({ error: 'Text is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const sanitized = sanitizeForSpeech(body.text);
    if (sanitized.length === 0) {
      return new Response(JSON.stringify({ error: 'Text is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (sanitized.length > 500) {
      return new Response(JSON.stringify({ error: 'Text too long' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const voice = body.voice ?? 'Magpie-Multilingual.EN-US.Aria';
    const languageCode = body.languageCode ?? 'en-US';

    const nimRes = await fetch(`${nimUrl.replace(/\/$/, '')}/tts/synthesis`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        text: sanitized,
        voice_name: voice,
        language_code: languageCode,
        sample_rate_hz: 22050,
        audio_encoding: 'LINEAR_PCM',
      }),
      signal: AbortSignal.timeout(30000),
    });

    if (!nimRes.ok) {
      return new Response(JSON.stringify({ error: 'Voice is temporarily unavailable' }), {
        status: 503,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = (await nimRes.json().catch(() => null)) as {
      audio?: string;
      meta?: { duration_s?: number };
    } | null;

    if (!data?.audio) {
      return new Response(JSON.stringify({ error: 'Voice is temporarily unavailable' }), {
        status: 503,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const durS = typeof data.meta?.duration_s === 'number' ? data.meta.duration_s : 0;

    return new Response(
      JSON.stringify({
        audioContent: data.audio,
        contentType: 'audio/wav',
        durationMs: Math.round(durS * 1000),
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  } catch (_err) {
    return new Response(JSON.stringify({ error: 'Voice is temporarily unavailable' }), {
      status: 503,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
