import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { requireUser } from '../_shared/auth.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'POST only' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const auth = await requireUser(req);
  if (!auth.user) {
    return new Response(JSON.stringify({ error: auth.error ?? 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = await req.json();
    const messages = Array.isArray(body.messages) ? body.messages : [];

    const apiKey = Deno.env.get('OPENAI_API_KEY');
    if (!apiKey) {
      return new Response(
        JSON.stringify({
          reply:
            'Connect OPENAI_API_KEY on the project to enable live answers. For emergencies, contact local services.',
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: Deno.env.get('OPENAI_MODEL') ?? 'gpt-4o-mini',
        temperature: 0.4,
        messages: (() => {
          const tail = messages
            .filter((m: { role?: string }) => m.role !== 'system')
            .slice(-12);
          if (!tail.length) tail.push({ role: 'user', content: 'Hello' });
          return [
            {
              role: 'system',
              content:
                'You are TruWell AI, a friendly wellness guide. No diagnoses. Encourage professionals for serious concerns. Short paragraphs. Offer telehealth escalation only as a general suggestion.',
            },
            ...tail,
          ];
        })(),
      }),
    });

    if (!res.ok) {
      const t = await res.text();
      console.error('assistant openai', res.status, t);
      return new Response(JSON.stringify({ reply: 'Assistant is temporarily unavailable.' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await res.json();
    const reply = data.choices?.[0]?.message?.content ?? '…';
    return new Response(JSON.stringify({ reply }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: 'assistant failed' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
