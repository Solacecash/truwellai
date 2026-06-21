import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { requireUser } from '../_shared/auth.ts';
import { gradeWithOpenAI } from '../_shared/grade.ts';

type OffProduct = {
  product_name?: string;
  product_name_en?: string;
  brands?: string;
  ingredients_text?: string;
  ingredients_text_en?: string;
};

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
    const barcode = String(body.barcode ?? '').replace(/\D/g, '');
    if (!barcode || barcode.length < 8) {
      return new Response(JSON.stringify({ error: 'Invalid barcode' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const offRes = await fetch(
      `https://world.openfoodfacts.org/api/v2/product/${barcode}.json`
    );
    const offJson = await offRes.json();
    const offStatus = offJson?.status;
    const p: OffProduct = offJson?.product ?? {};

    if (offStatus !== 1) {
      return new Response(
        JSON.stringify({
          needs_ocr: true,
          message: 'This product is not in our databases. Scan the ingredient label to analyse it.',
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const productName =
      p.product_name_en || p.product_name || `Product ${barcode}`;
    const brands = p.brands ?? '';
    const ingredientText =
      p.ingredients_text_en || p.ingredients_text || '';

    let grade = await gradeWithOpenAI({ productName, ingredientText });

    const usdaKey = Deno.env.get('USDA_API_KEY');
    if (usdaKey && !ingredientText) {
      const u = new URL('https://api.nal.usda.gov/fdc/v1/foods/search');
      u.searchParams.set('api_key', usdaKey);
      u.searchParams.set('query', productName);
      u.searchParams.set('pageSize', '3');
      const usda = await fetch(u);
      if (usda.ok) {
        const uj = await usda.json();
        const desc = uj?.foods?.[0]?.description;
        if (desc) grade = await gradeWithOpenAI({ productName, ingredientText: desc });
      }
    }

    if (offStatus === 1) {
      await auth.supabase.from('products').upsert(
        {
          barcode,
          name: productName,
          brand: brands || null,
          meta: { source: 'openfoodfacts' },
        },
        { onConflict: 'barcode' }
      );
    }

    const personalized = await personalizeScore(auth.user.id, grade, auth.supabase);

    await auth.supabase.from('scans').insert({
      user_id: auth.user.id,
      mode: 'barcode',
      raw_payload: { barcode, offStatus },
      grade: personalized.grade,
      score: personalized.score,
      result_summary: {
        ...personalized,
        productName,
        barcode,
      },
    });

    return new Response(JSON.stringify({ ...personalized, productName, barcode }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: 'scan-barcode failed' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function personalizeScore(
  userId: string,
  grade: Awaited<ReturnType<typeof gradeWithOpenAI>>,
  supabase: NonNullable<Awaited<ReturnType<typeof requireUser>>['supabase']>
) {
  const { data: profile } = await supabase
    .from('profiles')
    .select('health_profile')
    .eq('id', userId)
    .maybeSingle();

  const hp = (profile?.health_profile ?? {}) as {
    allergies?: string[];
    avoids?: string[];
  };
  const allergies = (hp.allergies ?? []).map((a) => a.toLowerCase());
  const avoids = (hp.avoids ?? []).map((a) => a.toLowerCase());

  let penalty = 0;
  const riskNotes: string[] = [];
  for (const ing of grade.ingredients) {
    const n = ing.name.toLowerCase();
    if (allergies.some((a) => a && n.includes(a))) {
      penalty += 12;
      riskNotes.push(`Matches your listed sensitivity around “${ing.name}”.`);
    }
    if (avoids.some((a) => a && n.includes(a))) {
      penalty += 8;
    }
  }

  const score = Math.max(0, Math.min(100, grade.score - penalty));
  let g = grade.grade;
  if (penalty >= 20) g = 'D';
  else if (penalty >= 10) g = 'C';

  return {
    grade: g,
    score,
    summary: grade.summary,
    ingredients: grade.ingredients,
    personalizedScore: score,
    riskNotes,
  };
}
