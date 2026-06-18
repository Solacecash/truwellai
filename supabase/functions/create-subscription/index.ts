/**
 * TruWell AI — Create Subscription / Payment Intent (Edge Function)
 *
 * Called by the mobile app when a user taps a paid plan on the subscription
 * screen. Returns a Stripe client_secret that the app uses to present the
 * native Payment Sheet.
 *
 * REQUIRED EDGE SECRETS (set via Supabase Dashboard → Edge Functions → Secrets):
 *   STRIPE_SECRET_KEY   — sk_test_... or sk_live_...
 *
 * REQUEST (POST):
 *   { priceId: string, userId: string, planId: string }
 *
 * RESPONSE:
 *   { clientSecret: string }
 *
 * PLAN STRATEGY:
 *   - lifetime  (one-time)          → Stripe PaymentIntent
 *   - pro_monthly / pro_yearly      → Stripe Subscription (default_incomplete)
 *     returns latest_invoice.payment_intent.client_secret
 *   - family    (one-time bundle)   → Stripe PaymentIntent
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Plans that are one-time purchases (PaymentIntent) vs recurring (Subscription)
const ONE_TIME_PLANS = new Set(['lifetime', 'family']);

// Hardcoded amounts in cents for PaymentIntent one-time plans.
// Subscriptions are priced by the Stripe Price object on the dashboard.
const ONE_TIME_AMOUNTS: Record<string, number> = {
  lifetime: 24900, // $249.00
  family: 16900,   // $169.00
};

async function stripePost(path: string, secret: string, params: Record<string, string>) {
  const res = await fetch(`https://api.stripe.com/v1/${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${secret}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams(params),
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const json = (await res.json()) as Record<string, any>;
  if (!res.ok) {
    const msg = (json.error as { message?: string } | undefined)?.message ?? 'stripe_error';
    throw new Error(msg);
  }
  return json;
}

async function stripeGet(path: string, secret: string) {
  const res = await fetch(`https://api.stripe.com/v1/${path}`, {
    headers: { Authorization: `Bearer ${secret}` },
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const json = (await res.json()) as Record<string, any>;
  if (!res.ok) {
    const msg = (json.error as { message?: string } | undefined)?.message ?? 'stripe_error';
    throw new Error(msg);
  }
  return json;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const respond = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  try {
    // ── Stripe key check ────────────────────────────────────────────────────
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY') ?? '';
    if (!stripeKey || stripeKey.startsWith('pk_')) {
      return respond(
        {
          error: 'stripe_not_configured',
          message:
            'Add STRIPE_SECRET_KEY (sk_test_… or sk_live_…) in Supabase Dashboard → Project Settings → Edge Functions → Secrets.',
        },
        503,
      );
    }

    // ── Auth ─────────────────────────────────────────────────────────────────
    const authHeader = req.headers.get('Authorization') ?? '';
    const token = authHeader.replace('Bearer ', '');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const { data: { user }, error: authErr } = await supabase.auth.getUser(token);
    if (authErr || !user) return respond({ error: 'Unauthorized' }, 401);

    // ── Parse body ──────────────────────────────────────────────────────────
    const { priceId, userId, planId } = (await req.json()) as {
      priceId?: string;
      userId?: string;
      planId?: string;
    };

    if (!planId) return respond({ error: 'planId is required' }, 400);

    // Guard: logged-in user must match the userId claim
    if (userId && userId !== user.id) {
      return respond({ error: 'userId mismatch' }, 403);
    }

    // ── Find or create Stripe customer ───────────────────────────────────────
    // Look for an existing stripe_customer_id stored in profiles
    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id, full_name, email')
      .eq('id', user.id)
      .maybeSingle();

    let stripeCustomerId: string = (profile as { stripe_customer_id?: string } | null)?.stripe_customer_id ?? '';

    if (!stripeCustomerId) {
      // Create a new Stripe customer and save the id
      const email = (profile as { email?: string } | null)?.email ?? user.email ?? '';
      const name = (profile as { full_name?: string } | null)?.full_name ?? '';
      const customer = await stripePost('customers', stripeKey, {
        email,
        name,
        'metadata[supabase_user_id]': user.id,
      });
      stripeCustomerId = customer.id as string;
      // Persist for future purchases
      await supabase
        .from('profiles')
        .update({ stripe_customer_id: stripeCustomerId })
        .eq('id', user.id);
    }

    let clientSecret: string;

    if (ONE_TIME_PLANS.has(planId)) {
      // ── One-time payment ─────────────────────────────────────────────────
      const amountCents = ONE_TIME_AMOUNTS[planId];
      if (!amountCents) return respond({ error: `Unknown one-time plan: ${planId}` }, 400);

      const pi = await stripePost('payment_intents', stripeKey, {
        amount: String(amountCents),
        currency: 'usd',
        customer: stripeCustomerId,
        'automatic_payment_methods[enabled]': 'true',
        'metadata[plan_id]': planId,
        'metadata[user_id]': user.id,
        description: `TruWell ${planId} plan`,
      });

      clientSecret = pi.client_secret as string;
    } else {
      // ── Recurring subscription ────────────────────────────────────────────
      if (!priceId) return respond({ error: 'priceId is required for recurring plans' }, 400);

      // Cancel any existing active/incomplete subscriptions for this customer
      // so we don't double-charge on re-attempts.
      const existing = await stripeGet(
        `subscriptions?customer=${stripeCustomerId}&status=incomplete&limit=5`,
        stripeKey,
      );
      const incompleteList = (existing.data as Array<{ id: string }>) ?? [];
      for (const sub of incompleteList) {
        await stripePost(`subscriptions/${sub.id}/cancel`, stripeKey, {});
      }

      // Create the subscription in default_incomplete state so the client
      // can confirm the first payment via the Payment Sheet.
      const sub = await stripePost('subscriptions', stripeKey, {
        customer: stripeCustomerId,
        'items[0][price]': priceId,
        payment_behavior: 'default_incomplete',
        'expand[]': 'latest_invoice.payment_intent',
        'metadata[plan_id]': planId,
        'metadata[user_id]': user.id,
      });

      // Drill into the nested object to get the payment intent secret
      const invoice = sub.latest_invoice as Record<string, unknown> | null;
      const paymentIntent = invoice?.payment_intent as Record<string, unknown> | null;
      const secret = paymentIntent?.client_secret as string | undefined;

      if (!secret) {
        throw new Error(
          'Stripe subscription created but no payment intent client_secret returned. ' +
          'Check that the Price is active and has automatic_payment_methods or a default payment method configured.',
        );
      }

      clientSecret = secret;
    }

    return respond({ clientSecret });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[create-subscription]', message);
    return respond({ error: message }, 500);
  }
});
