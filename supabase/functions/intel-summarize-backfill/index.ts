import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Anthropic from 'npm:@anthropic-ai/sdk@0.39.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

const anthropic = new Anthropic({
  apiKey: Deno.env.get('ANTHROPIC_API_KEY') ?? '',
});

serve(async (req) => {
  if (req.method === 'OPTIONS')
    return new Response('ok', { headers: corsHeaders });

  // Verify this is called by cron or a service key
  const authHeader = req.headers.get('Authorization') ?? '';
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  const cronSecret = Deno.env.get('CRON_SECRET') ?? '';

  const isServiceKey = authHeader === `Bearer ${serviceKey}`;
  const isCronSecret = authHeader === `Bearer ${cronSecret}`;

  if (!isServiceKey && !isCronSecret) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    const { limit = 20 } = await req.json().catch(() => ({})) as
      { limit?: number };

    // Fetch unsummarized active events
    const { data: events, error } = await supabase
      .from('health_intel_events')
      .select('id, headline, summary, event_type, source, severity')
      .eq('is_active', true)
      .eq('ai_summarized', false)
      .order('published_at', { ascending: false })
      .limit(Math.min(limit, 50));

    if (error) throw error;
    if (!events?.length) {
      return new Response(
        JSON.stringify({ success: true, processed: 0,
          message: 'All events already summarized' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let processed = 0;
    for (const event of events) {
      try {
        const prompt = `You are a consumer health safety writer for TruWell AI.
Convert this regulatory/medical alert into plain consumer language.

SOURCE: ${event.source}
TYPE: ${event.event_type}
SEVERITY: ${event.severity}
HEADLINE: ${event.headline}
DETAILS: ${event.summary ?? 'No additional details.'}

Write exactly:
CONSUMER_SUMMARY: 2 plain-language sentences. No jargon. What is the product/ingredient and what is the concern and what should the person do.
RISK_NOTE: 1 sentence on who this affects most.

Format:
CONSUMER_SUMMARY: [2 sentences]
RISK_NOTE: [1 sentence]`;

        const msg = await anthropic.messages.create({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 300,
          messages: [{ role: 'user', content: prompt }],
        });

        const text = msg.content
          .filter((b) => b.type === 'text')
          .map((b) => (b as { type: 'text'; text: string }).text)
          .join('');

        const summaryMatch = text.match(/CONSUMER_SUMMARY:\s*(.+?)(?=RISK_NOTE:|$)/s);
        const riskMatch    = text.match(/RISK_NOTE:\s*(.+?)$/s);

        await supabase
          .from('health_intel_events')
          .update({
            consumer_summary: summaryMatch?.[1]?.trim() ?? event.headline,
            risk_note:        riskMatch?.[1]?.trim() ??
              'Check with a healthcare professional if concerned.',
            ai_summarized: true,
          })
          .eq('id', event.id);

        processed++;
        await new Promise((r) => setTimeout(r, 300));
      } catch (e) {
        console.error(`Failed to summarize ${event.id}:`, e);
        continue;
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        processed,
        remaining: (events.length - processed),
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (e) {
    return new Response(
      JSON.stringify({ error: String((e as Error)?.message ?? e) }),
      { status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
