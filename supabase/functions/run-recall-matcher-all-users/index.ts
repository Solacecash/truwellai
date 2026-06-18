import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_KEY  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

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
    const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

    // Get all user IDs who have scan history
    const { data: users, error: usersErr } = await supabase
      .from('scans')
      .select('user_id')
      .not('user_id', 'is', null)
      .not('raw_payload', 'is', null);

    if (usersErr) throw usersErr;

    // Deduplicate user IDs
    const uniqueUserIds = [
      ...new Set((users ?? []).map((r: { user_id: string }) => r.user_id))
    ];

    if (!uniqueUserIds.length) {
      return new Response(
        JSON.stringify({ processed: 0, message: 'No users with scans' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let totalMatches = 0;
    let notificationsSent = 0;

    // Process each user
    for (const userId of uniqueUserIds) {
      try {
        // Call recall-matcher for this user
        const matchRes = await fetch(
          `${SUPABASE_URL}/functions/v1/recall-matcher`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${SERVICE_KEY}`,
            },
            body: JSON.stringify({ user_id: userId }),
          }
        );

        if (!matchRes.ok) continue;

        const matchData = await matchRes.json() as {
          matches: Array<{
            event: {
              id: string;
              headline: string;
              summary: string | null;
              severity: string;
              event_type: string;
              product_name: string | null;
            };
            matched_scan: {
              product_name: string;
              created_at: string;
            };
            match_type: 'product' | 'ingredient';
          }>;
        };

        const matches = matchData.matches ?? [];
        totalMatches += matches.length;

        if (!matches.length) continue;

        // Send push notification for each match
        for (const match of matches) {
          const { event, matched_scan, match_type } = match;

          // Build notification copy based on severity and match type
          const emoji = event.severity === 'critical' ? '🚨' :
                        event.severity === 'high'     ? '⚠️'  :
                        event.event_type === 'recall' ? '🔔'  : '📋';

          const title = event.severity === 'critical'
            ? `${emoji} Critical Safety Alert`
            : event.event_type === 'recall'
            ? `${emoji} Product Recall Alert`
            : `${emoji} Safety Notice`;

          const scannedDate = new Date(matched_scan.created_at)
            .toLocaleDateString('en-GB', {
              day: 'numeric', month: 'short', year: 'numeric'
            });

          const body = match_type === 'product'
            ? `A product you scanned on ${scannedDate} has been flagged: ${matched_scan.product_name}. ${event.headline.slice(0, 100)}`
            : `An ingredient in "${matched_scan.product_name}" (scanned ${scannedDate}) has a new safety alert. Tap to view details.`;

          // Fire send-notification
          const notifRes = await fetch(
            `${SUPABASE_URL}/functions/v1/send-notification`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${SERVICE_KEY}`,
              },
              body: JSON.stringify({
                user_id: userId,
                title,
                body,
                data: {
                  type: 'recall_match',
                  event_id: event.id,
                  event_type: event.event_type,
                  severity: event.severity,
                  product_name: matched_scan.product_name,
                  screen: 'safecircle',
                },
              }),
            }
          );

          if (notifRes.ok) notificationsSent++;

          // Rate limit — avoid hammering the notification API
          await new Promise((r) => setTimeout(r, 100));
        }

      } catch (userErr) {
        console.error(`[recall-matcher-all] Error for user ${userId}:`, userErr);
        continue;
      }

      // Small delay between users to avoid overload
      await new Promise((r) => setTimeout(r, 50));
    }

    return new Response(
      JSON.stringify({
        success: true,
        users_processed: uniqueUserIds.length,
        total_matches: totalMatches,
        notifications_sent: notificationsSent,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (e) {
    console.error('[recall-matcher-all]', e);
    return new Response(
      JSON.stringify({ error: String((e as Error)?.message ?? e) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
