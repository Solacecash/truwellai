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
    const excludeBarcode = body.excludeBarcode ? String(body.excludeBarcode) : null;
    const brandFilter = body.brand ? String(body.brand).trim() : null;
    const priceBand = body.priceBand ? String(body.priceBand).trim() : null;

    let q = auth.supabase
      .from('products')
      .select('id, name, brand, barcode, price_band, image_url, meta')
      .limit(12);

    if (excludeBarcode) {
      q = q.neq('barcode', excludeBarcode);
    }
    if (brandFilter) {
      q = q.ilike('brand', `%${brandFilter}%`);
    }
    if (priceBand) {
      q = q.eq('price_band', priceBand);
    }

    const { data: rows, error } = await q;
    if (error) throw error;

    type Row = {
      id: string;
      name: string;
      brand: string | null;
      meta: unknown;
      price_band: string | null;
      image_url: string | null;
    };
    const items = (rows ?? []).map((r: Row) => ({
      id: r.id,
      name: r.name,
      brand: r.brand ?? '',
      grade: (r.meta as { grade?: string })?.grade ?? 'B',
      score: (r.meta as { score?: number })?.score ?? 88,
      priceBand: r.price_band ?? undefined,
      imageUrl: r.image_url ?? undefined,
    }));

    return new Response(JSON.stringify({ items }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: 'alternatives-search failed' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
