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
  if (!auth.user || !auth.supabase) {
    return new Response(JSON.stringify({ error: auth.error ?? 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = await req.json();
    const baseScore = Number(body.baseScore ?? 80);
    const ingredients: { name: string; traffic?: string }[] = Array.isArray(
      body.ingredients
    )
      ? body.ingredients
      : [];

    const { data: profile } = await auth.supabase
      .from('profiles')
      .select('health_profile')
      .eq('id', auth.user.id)
      .maybeSingle();

    const hp = (profile?.health_profile ?? {}) as {
      allergies?: string[];
      conditions?: string[];
      avoids?: string[];
    };

    const allergies = (hp.allergies ?? []).map((a) => a.toLowerCase());
    const avoids = (hp.avoids ?? []).map((a) => a.toLowerCase());

    let penalty = 0;
    const riskNotes: string[] = [];
    const highlighted: string[] = [];

    for (const ing of ingredients) {
      const n = ing.name.toLowerCase();
      if (allergies.some((a) => a && n.includes(a))) {
        penalty += 15;
        highlighted.push(ing.name);
        riskNotes.push(`“${ing.name}” may conflict with your allergy profile.`);
      } else if (ing.traffic === 'avoid' && avoids.some((a) => a && n.includes(a))) {
        penalty += 10;
        highlighted.push(ing.name);
      }
    }

    if ((hp.conditions ?? []).length) {
      riskNotes.push('Chronic conditions on file—double-check labels with your clinician.');
    }

    const personalizedScore = Math.max(0, Math.min(100, baseScore - penalty));

    return new Response(
      JSON.stringify({
        personalizedScore,
        highlighted,
        riskNotes,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: 'risk-profile failed' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
