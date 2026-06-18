/**
 * TruWell AI — NVIDIA NIM TTS availability probe (Edge Function)
 *
 * REQUIRED SECRETS: NGC_API_KEY, NIM_TTS_URL, TRUWELL_TTS_ENABLED
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const ts = new Date().toISOString();

  try {
    if (Deno.env.get('TRUWELL_TTS_ENABLED') !== 'true') {
      return new Response(JSON.stringify({ ready: false, ttsEnabled: false }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const apiKey = Deno.env.get('NGC_API_KEY');
    if (!apiKey) {
      return new Response(JSON.stringify({ ready: false, ttsEnabled: false }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const nimUrl = (Deno.env.get('NIM_TTS_URL') ?? '').replace(/\/$/, '');

    const nimRes = await fetch(`${nimUrl}/tts/synthesis`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        text: 'test',
        voice_name: 'Magpie-Multilingual.EN-US.Aria',
        language_code: 'en-US',
        sample_rate_hz: 22050,
        audio_encoding: 'LINEAR_PCM',
      }),
      signal: AbortSignal.timeout(8000),
    });

    if (nimRes.ok) {
      return new Response(
        JSON.stringify({ ready: true, ttsEnabled: true, timestamp: ts }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    return new Response(
      JSON.stringify({ ready: false, ttsEnabled: true, timestamp: ts }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (_err) {
    return new Response(
      JSON.stringify({ ready: false, ttsEnabled: true, timestamp: ts }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
