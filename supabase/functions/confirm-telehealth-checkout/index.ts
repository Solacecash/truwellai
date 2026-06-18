import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Stripe from 'npm:stripe@14.21.0';

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
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: getCorsHeaders(req) });
  }

  try {
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeKey) throw new Error('STRIPE_SECRET_KEY not configured');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceKey);
    const stripe = new Stripe(stripeKey, { apiVersion: '2023-10-16' });

    const authHeader = req.headers.get('Authorization') ?? '';
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authErr } = await supabase.auth.getUser(token);
    if (authErr || !user) throw new Error('Unauthorized');

    const { sessionId } = await req.json() as { sessionId: string };
    if (!sessionId) throw new Error('Missing sessionId');

    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (session.payment_status !== 'paid') {
      return new Response(
        JSON.stringify({ ok: false, error: 'payment_not_completed' }),
        { status: 400, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } },
      );
    }

    const meta = session.metadata ?? {};
    const appointmentId = meta.appointment_id;
    const bookingId = meta.booking_id;
    if (!appointmentId || !bookingId) {
      throw new Error('Checkout session missing appointment metadata');
    }

    const { data: appt } = await supabase
      .from('appointments')
      .select('user_id')
      .eq('id', appointmentId)
      .maybeSingle();

    if (!appt || (appt as { user_id: string }).user_id !== user.id) {
      throw new Error('Forbidden');
    }

    await supabase
      .from('telehealth_bookings')
      .update({ status: 'confirmed' })
      .eq('id', bookingId);
    await supabase
      .from('appointments')
      .update({ status: 'confirmed' })
      .eq('id', appointmentId);

    return new Response(
      JSON.stringify({ ok: true, appointmentId }),
      { headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return new Response(
      JSON.stringify({ ok: false, error: message }),
      { status: 500, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } },
    );
  }
});
