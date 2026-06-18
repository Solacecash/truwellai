import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
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

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: getCorsHeaders(req) });

  const authHeader = req.headers.get('Authorization') ?? '';
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  const cronSecret = Deno.env.get('CRON_SECRET') ?? '';
  const isServiceKey = authHeader === `Bearer ${serviceKey}`;
  const isCronSecret = cronSecret && authHeader === `Bearer ${cronSecret}`;
  if (!isServiceKey && !isCronSecret) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized' }),
      { status: 401, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
    );
  }

  try {
    const {
      user_id,
      health_profile,
    } = await req.json() as {
      user_id: string;
      health_profile?: {
        conditions?: string[];
        allergies?: string[];
        productConcerns?: string[];
        familyRole?: string;
      } | null;
    };
    if (!user_id) throw new Error('user_id required');

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Get user's scan history ingredients
    const { data: rawScans } = await supabase
      .from('scans')
      .select('id, raw_payload, result_summary, created_at')
      .eq('user_id', user_id)
      .order('created_at', { ascending: false })
      .limit(200);

    // Normalise: extract product_name and ingredients
    // from raw_payload JSON since scans table stores
    // all product data inside the raw_payload column
    const scans = (rawScans ?? []).map((s: {
      id: string;
      raw_payload: Record<string, unknown> | null;
      result_summary: string | null;
      created_at: string;
    }) => {
      const p = s.raw_payload ?? {};
      const productName =
        (p.productName as string | undefined) ??
        (p.product_name as string | undefined) ??
        (p.name as string | undefined) ??
        (s.result_summary as string | undefined) ??
        'Unknown product';
      const ingredients: string[] = Array.isArray(p.ingredients)
        ? (p.ingredients as string[])
        : Array.isArray(p.ingredientsList)
        ? (p.ingredientsList as string[])
        : Array.isArray(p.detected_ingredients)
        ? (p.detected_ingredients as string[])
        : [];
      return {
        product_name: productName,
        ingredients_detected: ingredients,
        created_at: s.created_at,
      };
    }).filter((s) => s.product_name !== 'Unknown product' || s.ingredients_detected.length > 0);

    if (!scans?.length) {
      return new Response(JSON.stringify({ matches: [] }), {
        headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' },
      });
    }

    // Get user's already-sent alerts to avoid duplicates
    const { data: existingAlerts } = await supabase
      .from('user_health_alerts')
      .select('event_id')
      .eq('user_id', user_id);
    const sentEventIds = new Set((existingAlerts ?? []).map((a: { event_id: string }) => a.event_id));

    // Get recent active recalls and bans (last 30 days)
    const { data: events } = await supabase
      .from('health_intel_events')
      .select('id, headline, summary, event_type, ingredients, product_name, severity, published_at')
      .eq('is_active', true)
      .in('event_type', ['recall', 'ban', 'safety_alert'])
      .gte('published_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      .order('published_at', { ascending: false });

    if (!events?.length) {
      return new Response(JSON.stringify({ matches: [] }), {
        headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' },
      });
    }

    const conditions = health_profile?.conditions ?? [];
    const allergies = health_profile?.allergies ?? [];
    const concerns = health_profile?.productConcerns ?? [];

    function getPersonalizedRisk(event: typeof events[0]): string | null {
      const text = (
        (event.headline ?? '') + ' ' + (event.summary ?? '')
      ).toLowerCase();
      const ings = (event.ingredients ?? []).map((i: string) => i.toLowerCase());

      if (conditions.includes('pregnancy') &&
          (text.includes('pregnant') || text.includes('fetal') ||
           text.includes('birth') || ings.some((i) => ['caffeine','retinol','salicylic'].some((r) => i.includes(r))))) {
        return 'High personal risk — you flagged pregnancy in your health profile.';
      }

      const allergyMatch = allergies.find((a) =>
        ings.some((i) => i.includes(a.toLowerCase())) ||
        text.includes(a.toLowerCase())
      );
      if (allergyMatch) {
        return `Personal risk — this involves ${allergyMatch}, which you flagged as an allergy.`;
      }

      const concernMatch = concerns.find((c) =>
        ings.some((i) => i.includes(c.toLowerCase())) ||
        text.includes(c.toLowerCase().replace(/_/g, ' '))
      );
      if (concernMatch) {
        return `Matches your flagged concern: ${concernMatch.replace(/_/g, ' ')}.`;
      }

      if (conditions.includes('diabetes') &&
          (text.includes('sugar') || text.includes('glucose') ||
           text.includes('sweetener') || text.includes('insulin'))) {
        return 'Relevant to your diabetes profile — monitor closely.';
      }

      return null;
    }

    // Match events to user scans
    const matches: Array<{
      event: typeof events[0];
      matched_scan: typeof scans[0];
      match_type: 'product' | 'ingredient';
      personalized_risk: string | null;
    }> = [];

    for (const event of events) {
      if (sentEventIds.has(event.id)) continue;

      for (const scan of scans) {
        // Product name match
        if (event.product_name && scan.product_name) {
          const eventProd = event.product_name.toLowerCase();
          const scanProd = (scan.product_name as string).toLowerCase();
          if (eventProd.includes(scanProd) || scanProd.includes(eventProd)) {
            matches.push({
              event,
              matched_scan: scan,
              match_type: 'product',
              personalized_risk: getPersonalizedRisk(event),
            });
            break;
          }
        }

        // Ingredient match
        if (event.ingredients?.length && scan.ingredients_detected) {
          const scanIngs = ((scan.ingredients_detected as string[]) ?? []).map((i: string) => i.toLowerCase());
          const eventIngs = event.ingredients.map((i: string) => i.toLowerCase());
          const hasMatch = eventIngs.some((ei) => scanIngs.some((si) => si.includes(ei) || ei.includes(si)));
          if (hasMatch) {
            matches.push({
              event,
              matched_scan: scan,
              match_type: 'ingredient',
              personalized_risk: getPersonalizedRisk(event),
            });
            break;
          }
        }
      }
    }

    // Write matched alerts to user_health_alerts
    if (matches.length > 0) {
      const inserts = matches.map((m) => ({
        user_id,
        event_id: m.event.id,
        alert_type: 'recall_match',
      }));
      await supabase.from('user_health_alerts').insert(inserts).select();
    }

    return new Response(
      JSON.stringify({
        matches: matches.map((m) => ({
          event: m.event,
          matched_scan: m.matched_scan,
          match_type: m.match_type,
          personalized_risk: m.personalized_risk,
        })),
      }),
      { headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
    );
  } catch (e) {
    console.error('[recall-matcher]', e);
    return new Response(
      JSON.stringify({ error: String((e as Error)?.message ?? e) }),
      { status: 500, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
    );
  }
});
