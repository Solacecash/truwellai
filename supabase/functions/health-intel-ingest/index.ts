import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Anthropic from 'npm:@anthropic-ai/sdk@0.39.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const anthropic = new Anthropic({
  apiKey: Deno.env.get('ANTHROPIC_API_KEY') ?? '',
});

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

// ── Standard event shape ─────────────────────────────────────────────────
interface IntelEvent {
  source: string;
  trust_score: number;
  event_type: string;
  product_name: string | null;
  ingredients: string[];
  countries: string[];
  severity: string;
  headline: string;
  summary: string | null;
  source_url: string;
  published_at: string;
}

// ── Severity inference ───────────────────────────────────────────────────
function inferSeverity(text: string, eventType: string): string {
  const t = text.toLowerCase();
  if (eventType === 'recall' && (t.includes('class i') || t.includes('class 1'))) return 'critical';
  if (t.includes('death') || t.includes('fatal') || t.includes('class i recall')) return 'critical';
  if (t.includes('hospitaliz') || t.includes('serious') || t.includes('class ii')) return 'high';
  if (t.includes('recall') || t.includes('ban') || t.includes('withdrawn')) return 'high';
  if (t.includes('warning') || t.includes('caution') || t.includes('adverse')) return 'medium';
  if (eventType === 'breakthrough' || eventType === 'approval') return 'informational';
  return 'medium';
}

// ── Country extraction from text ─────────────────────────────────────────
function extractCountries(text: string): string[] {
  const countries: string[] = [];
  const map: Record<string, string> = {
    'united states': 'US', 'u.s.': 'US', 'fda': 'US',
    'european': 'EU', 'ema': 'EU', 'europe': 'EU',
    'united kingdom': 'UK', 'mhra': 'UK', 'britain': 'UK',
    'canada': 'CA', 'australia': 'AU', 'tga': 'AU',
    'nigeria': 'NG', 'nafdac': 'NG',
    'japan': 'JP', 'india': 'IN', 'south africa': 'ZA',
  };
  const t = text.toLowerCase();
  for (const [key, code] of Object.entries(map)) {
    if (t.includes(key) && !countries.includes(code)) countries.push(code);
  }
  return countries.length > 0 ? countries : ['GLOBAL'];
}

// ── Ingredient extraction from text ──────────────────────────────────────
function extractIngredients(text: string): string[] {
  const watchList = [
    'aspartame', 'titanium dioxide', 'red dye 3', 'erythrosine',
    'pfas', 'metformin', 'ndma', 'acetaminophen', 'paracetamol',
    'ibuprofen', 'aspirin', 'sodium lauryl sulfate', 'bpa',
    'microplastics', 'lead', 'mercury', 'arsenic', 'cadmium',
    'glyphosate', 'nitrates', 'carrageenan', 'msg', 'maltodextrin',
  ];
  const t = text.toLowerCase();
  return watchList.filter((ing) => t.includes(ing));
}

// ── AI Consumer Summary Generator ─────────────────────────────────────────
async function generateConsumerSummary(
  headline: string,
  summary: string | null,
  eventType: string,
  source: string,
  severity: string,
): Promise<{ consumer_summary: string; risk_note: string }> {
  const prompt = `You are a consumer health safety writer for TruWell AI.
Convert this regulatory/medical alert into plain consumer language.

SOURCE: ${source}
TYPE: ${eventType}
SEVERITY: ${severity}
HEADLINE: ${headline}
DETAILS: ${summary ?? 'No additional details available.'}

Write exactly two outputs:

CONSUMER_SUMMARY: A 2-sentence plain-language explanation a non-medical person can instantly understand. No jargon. No technical terms. Start with what the product/ingredient is, then what the concern is and what the person should do.

RISK_NOTE: One short sentence describing who this is most relevant to (e.g. "Most relevant to people with diabetes or those taking blood pressure medication." or "Affects anyone who uses this type of medical device." or "Relevant to parents of young children."). If it applies to everyone equally say "Relevant to all consumers."

Format your response as exactly:
CONSUMER_SUMMARY: [your 2 sentences here]
RISK_NOTE: [your 1 sentence here]

Keep each part under 120 words. Be factual. Never exaggerate. If it is a breakthrough or approval write positively.`;

  try {
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

    return {
      consumer_summary: summaryMatch?.[1]?.trim() ?? headline,
      risk_note:        riskMatch?.[1]?.trim()    ?? 'Relevant to all consumers.',
    };
  } catch (err) {
    console.error('[intel-ingest] AI summary error:', err);
    // Graceful fallback — use original text
    return {
      consumer_summary: summary ?? headline,
      risk_note: 'Check with a healthcare professional if concerned.',
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════
// SOURCE FETCHERS
// ═══════════════════════════════════════════════════════════════════════

// FDA Drug Recalls
async function fetchFDADrugRecalls(): Promise<IntelEvent[]> {
  try {
    const r = await fetch('https://api.fda.gov/drug/enforcement.json?limit=10&sort=report_date:desc');
    if (!r.ok) return [];
    const j = await r.json() as { results?: Array<{
      recall_number: string; product_description: string;
      reason_for_recall: string; report_date: string;
      voluntary_mandated: string; recalling_firm: string;
      distribution_pattern: string;
    }>};
    return (j.results ?? []).map((item) => ({
      source: 'FDA',
      trust_score: 100,
      event_type: 'recall',
      product_name: item.product_description?.slice(0, 200) ?? null,
      ingredients: extractIngredients(item.product_description + ' ' + item.reason_for_recall),
      countries: ['US'],
      severity: inferSeverity(item.reason_for_recall + ' ' + item.product_description, 'recall'),
      headline: `FDA Recall: ${item.product_description?.slice(0, 120) ?? 'Drug product'}`,
      summary: `${item.reason_for_recall?.slice(0, 400) ?? ''}. Firm: ${item.recalling_firm ?? ''}. Distribution: ${item.distribution_pattern?.slice(0, 100) ?? 'Unknown'}.`,
      source_url: `https://www.fda.gov/safety/recalls-market-withdrawals-safety-alerts#${item.recall_number}`,
      published_at: item.report_date
        ? new Date(item.report_date.replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3')).toISOString()
        : new Date().toISOString(),
    }));
  } catch { return []; }
}

// FDA Device Recalls
async function fetchFDADeviceRecalls(): Promise<IntelEvent[]> {
  try {
    const r = await fetch('https://api.fda.gov/device/enforcement.json?limit=5&sort=report_date:desc');
    if (!r.ok) return [];
    const j = await r.json() as { results?: Array<{
      recall_number: string; product_description: string;
      reason_for_recall: string; report_date: string;
    }>};
    return (j.results ?? []).map((item) => ({
      source: 'FDA',
      trust_score: 100,
      event_type: 'recall',
      product_name: item.product_description?.slice(0, 200) ?? null,
      ingredients: [],
      countries: ['US'],
      severity: inferSeverity(item.reason_for_recall ?? '', 'recall'),
      headline: `FDA Device Recall: ${item.product_description?.slice(0, 120) ?? 'Medical device'}`,
      summary: item.reason_for_recall?.slice(0, 400) ?? null,
      source_url: `https://www.fda.gov/medical-devices/medical-device-recalls#${item.recall_number}`,
      published_at: item.report_date
        ? new Date(item.report_date.replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3')).toISOString()
        : new Date().toISOString(),
    }));
  } catch { return []; }
}

// FDA Adverse Events (FAERS)
async function fetchFDAAdverseEvents(): Promise<IntelEvent[]> {
  try {
    const r = await fetch('https://api.fda.gov/drug/event.json?limit=5&sort=receivedate:desc');
    if (!r.ok) return [];
    const j = await r.json() as { results?: Array<{
      safetyreportid: string;
      receivedate: string;
      patient?: {
        drug?: Array<{ medicinalproduct?: string; drugindication?: string }>;
        reaction?: Array<{ reactionmeddrapt?: string; reactionoutcome?: string }>;
      };
    }>};
    return (j.results ?? []).map((item) => {
      const drugs = (item.patient?.drug ?? []).map((d) => d.medicinalproduct).filter(Boolean).slice(0, 3);
      const reactions = (item.patient?.reaction ?? []).map((r) => r.reactionmeddrapt).filter(Boolean).slice(0, 3);
      const headline = `Adverse event: ${drugs.join(', ') || 'Unknown drug'} — ${reactions.join(', ') || 'Adverse reaction reported'}`;
      return {
        source: 'FDA FAERS',
        trust_score: 90,
        event_type: 'adverse_event',
        product_name: drugs[0] ?? null,
        ingredients: extractIngredients(drugs.join(' ')),
        countries: ['US'],
        severity: inferSeverity(reactions.join(' '), 'adverse_event'),
        headline: headline.slice(0, 250),
        summary: `Reactions: ${reactions.join(', ')}. These are individual reports — not confirmed causation. Patterns across many reports determine regulatory action.`,
        source_url: `https://www.fda.gov/safety/medwatch-fda-safety-information-and-adverse-event-reporting-program`,
        published_at: item.receivedate
          ? new Date(item.receivedate.replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3')).toISOString()
          : new Date().toISOString(),
      };
    });
  } catch { return []; }
}

// ClinicalTrials.gov — terminated and suspended trials
async function fetchClinicalTrials(): Promise<IntelEvent[]> {
  try {
    const url = 'https://clinicaltrials.gov/api/v2/studies?format=json&pageSize=5&sort=LastUpdatePostDate:desc&filter.overallStatus=TERMINATED,SUSPENDED';
    const r = await fetch(url);
    if (!r.ok) return [];
    const j = await r.json() as { studies?: Array<{
      protocolSection?: {
        identificationModule?: { nctId?: string; briefTitle?: string };
        statusModule?: { whyStopped?: string; overallStatus?: string; lastUpdatePostDateStruct?: { date?: string } };
        conditionsModule?: { conditions?: string[] };
        interventionsModule?: { interventions?: Array<{ name?: string }> };
      };
    }>};
    return (j.studies ?? []).map((s) => {
      const id = s.protocolSection?.identificationModule?.nctId ?? 'unknown';
      const title = s.protocolSection?.identificationModule?.briefTitle ?? 'Clinical trial update';
      const status = s.protocolSection?.statusModule?.overallStatus ?? 'TERMINATED';
      const reason = s.protocolSection?.statusModule?.whyStopped ?? '';
      const conditions = (s.protocolSection?.conditionsModule?.conditions ?? []).slice(0, 2).join(', ');
      const drugs = (s.protocolSection?.interventionsModule?.interventions ?? []).map((i) => i.name).filter(Boolean).slice(0, 2).join(', ');
      const dateStr = s.protocolSection?.statusModule?.lastUpdatePostDateStruct?.date;
      return {
        source: 'ClinicalTrials.gov',
        trust_score: 95,
        event_type: 'trial_update',
        product_name: drugs || null,
        ingredients: extractIngredients(drugs + ' ' + title),
        countries: extractCountries(title + ' ' + reason),
        severity: inferSeverity(reason + ' ' + title, 'trial_update'),
        headline: `Trial ${status.toLowerCase()}: ${title.slice(0, 160)}`,
        summary: `${conditions ? `Condition: ${conditions}. ` : ''}${drugs ? `Intervention: ${drugs}. ` : ''}${reason ? `Reason: ${reason}` : ''}`.trim() || null,
        source_url: `https://clinicaltrials.gov/study/${id}`,
        published_at: dateStr ? new Date(dateStr).toISOString() : new Date().toISOString(),
      };
    });
  } catch { return []; }
}

// PubMed — search for recent safety and breakthrough papers
async function fetchPubMed(): Promise<IntelEvent[]> {
  const queries = [
    '"drug safety"[MeSH] recall ban warning 2026',
    '"clinical trial"[pt] "safety" "terminated" 2026',
    '"FDA approved" OR "EMA approved" 2026',
    'breakthrough therapy cancer obesity alzheimer 2026',
  ];
  const events: IntelEvent[] = [];
  for (const term of queries) {
    try {
      const esearchUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&retmode=json&retmax=3&sort=date&term=${encodeURIComponent(term)}`;
      const er = await fetch(esearchUrl);
      if (!er.ok) continue;
      const es = await er.json() as { esearchresult?: { idlist?: string[] } };
      const ids = es.esearchresult?.idlist ?? [];
      if (!ids.length) continue;
      const esummaryUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&retmode=json&id=${ids.join(',')}`;
      const sr = await fetch(esummaryUrl);
      if (!sr.ok) continue;
      const sj = await sr.json() as {
        result?: Record<string, { title?: string; pubdate?: string; fulljournalname?: string; source?: string }>;
        uids?: string[];
      };
      for (const uid of (sj.uids ?? [])) {
        const entry = sj.result?.[uid];
        if (!entry?.title) continue;
        const isBT = /approved|breakthrough|success|efficacy|cure/i.test(entry.title);
        events.push({
          source: entry.fulljournalname ?? entry.source ?? 'PubMed',
          trust_score: 95,
          event_type: isBT ? 'breakthrough' : 'journal_finding',
          product_name: null,
          ingredients: extractIngredients(entry.title),
          countries: extractCountries(entry.title),
          severity: isBT ? 'informational' : inferSeverity(entry.title, 'journal_finding'),
          headline: entry.title.slice(0, 250),
          summary: `Published in ${entry.fulljournalname ?? 'PubMed-indexed journal'} (${entry.pubdate ?? 'recent'}). Peer-reviewed biomedical literature.`,
          source_url: `https://pubmed.ncbi.nlm.nih.gov/${uid}/`,
          published_at: new Date().toISOString(),
        });
      }
      await new Promise((resolve) => setTimeout(resolve, 150));
    } catch { continue; }
  }
  return events;
}

// WHO RSS — outbreaks and alerts
async function fetchWHORSS(): Promise<IntelEvent[]> {
  try {
    const r = await fetch('https://www.who.int/feeds/entity/csr/don/en/rss.xml');
    if (!r.ok) return [];
    const text = await r.text();
    const items = text.match(/<item>([\s\S]*?)<\/item>/g) ?? [];
    return items.slice(0, 5).map((item) => {
      const title = item.match(/<title><!\[CDATA\[(.*?)\]\]>/)?.[1] ?? item.match(/<title>(.*?)<\/title>/)?.[1] ?? 'WHO Alert';
      const desc = item.match(/<description><!\[CDATA\[(.*?)\]\]>/)?.[1] ?? item.match(/<description>(.*?)<\/description>/)?.[1] ?? '';
      const link = item.match(/<link>(.*?)<\/link>/)?.[1] ?? 'https://www.who.int';
      const pubDate = item.match(/<pubDate>(.*?)<\/pubDate>/)?.[1];
      return {
        source: 'WHO',
        trust_score: 98,
        event_type: 'outbreak',
        product_name: null,
        ingredients: [],
        countries: extractCountries(title + ' ' + desc),
        severity: inferSeverity(title + ' ' + desc, 'outbreak'),
        headline: title.slice(0, 250),
        summary: desc.replace(/<[^>]*>/g, '').slice(0, 400) || null,
        source_url: link,
        published_at: pubDate ? new Date(pubDate).toISOString() : new Date().toISOString(),
      };
    });
  } catch { return []; }
}

// MHRA UK Atom feed
async function fetchMHRA(): Promise<IntelEvent[]> {
  try {
    const r = await fetch('https://www.gov.uk/drug-device-alerts.atom');
    if (!r.ok) return [];
    const text = await r.text();
    const entries = text.match(/<entry>([\s\S]*?)<\/entry>/g) ?? [];
    return entries.slice(0, 5).map((entry) => {
      const title = entry.match(/<title[^>]*>(.*?)<\/title>/)?.[1]?.replace(/&amp;/g, '&') ?? 'MHRA Alert';
      const summary = entry.match(/<summary[^>]*>(.*?)<\/summary>/)?.[1]?.replace(/<[^>]*>/g, '') ?? '';
      const link = entry.match(/href="([^"]+)"/)?.[1] ?? 'https://www.gov.uk/drug-device-alerts';
      const updated = entry.match(/<updated>(.*?)<\/updated>/)?.[1];
      return {
        source: 'MHRA',
        trust_score: 98,
        event_type: title.toLowerCase().includes('recall') ? 'recall' : 'safety_alert',
        product_name: null,
        ingredients: extractIngredients(title + ' ' + summary),
        countries: ['UK'],
        severity: inferSeverity(title + ' ' + summary, 'safety_alert'),
        headline: title.slice(0, 250),
        summary: summary.slice(0, 400) || null,
        source_url: link,
        published_at: updated ? new Date(updated).toISOString() : new Date().toISOString(),
      };
    });
  } catch { return []; }
}

// Health Canada recalls JSON
async function fetchHealthCanada(): Promise<IntelEvent[]> {
  try {
    const r = await fetch('https://recalls-rappels.canada.ca/en/alert-recall/json');
    if (!r.ok) return [];
    const j = await r.json() as Array<{
      title?: string; description?: string; url?: string;
      date_published?: string; category?: string;
    }>;
    return (j ?? []).slice(0, 5).map((item) => ({
      source: 'Health Canada',
      trust_score: 90,
      event_type: 'recall',
      product_name: null,
      ingredients: extractIngredients((item.title ?? '') + ' ' + (item.description ?? '')),
      countries: ['CA'],
      severity: inferSeverity((item.title ?? '') + ' ' + (item.description ?? ''), 'recall'),
      headline: (item.title ?? 'Health Canada Recall').slice(0, 250),
      summary: item.description?.slice(0, 400) ?? null,
      source_url: item.url ?? 'https://recalls-rappels.canada.ca',
      published_at: item.date_published ? new Date(item.date_published).toISOString() : new Date().toISOString(),
    }));
  } catch { return []; }
}

// NEJM RSS — new articles
async function fetchNEJMRSS(): Promise<IntelEvent[]> {
  try {
    const r = await fetch('https://www.nejm.org/action/showFeed?jc=nejm&type=etoc&feed=rss');
    if (!r.ok) return [];
    const text = await r.text();
    const items = text.match(/<item>([\s\S]*?)<\/item>/g) ?? [];
    return items.slice(0, 5).map((item) => {
      const title = item.match(/<title><!\[CDATA\[(.*?)\]\]>/)?.[1] ?? item.match(/<title>(.*?)<\/title>/)?.[1] ?? 'NEJM Article';
      const desc = item.match(/<description><!\[CDATA\[(.*?)\]\]>/)?.[1] ?? '';
      const link = item.match(/<link>(.*?)<\/link>/)?.[1] ?? 'https://www.nejm.org';
      const pubDate = item.match(/<pubDate>(.*?)<\/pubDate>/)?.[1];
      const isBT = /trial|approved|breakthrough|efficacy|phase 3|cure/i.test(title);
      return {
        source: 'NEJM',
        trust_score: 95,
        event_type: isBT ? 'breakthrough' : 'journal_finding',
        product_name: null,
        ingredients: extractIngredients(title),
        countries: extractCountries(title + ' ' + desc),
        severity: isBT ? 'informational' : 'low',
        headline: title.slice(0, 250),
        summary: desc.replace(/<[^>]*>/g, '').slice(0, 400) || `New England Journal of Medicine article. Peer-reviewed.`,
        source_url: link,
        published_at: pubDate ? new Date(pubDate).toISOString() : new Date().toISOString(),
      };
    });
  } catch { return []; }
}

// ═══════════════════════════════════════════════════════════════════════
// MAIN INGEST HANDLER
// ═══════════════════════════════════════════════════════════════════════

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

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
    // Run all fetchers concurrently with individual error isolation
    const [
      fdaDrug, fdaDevice, fdaAE, clinTrials,
      pubmed, who, mhra, canada, nejm
    ] = await Promise.allSettled([
      fetchFDADrugRecalls(),
      fetchFDADeviceRecalls(),
      fetchFDAAdverseEvents(),
      fetchClinicalTrials(),
      fetchPubMed(),
      fetchWHORSS(),
      fetchMHRA(),
      fetchHealthCanada(),
      fetchNEJMRSS(),
    ]);

    // Collect successful results
    const allEvents: IntelEvent[] = [
      ...(fdaDrug.status === 'fulfilled' ? fdaDrug.value : []),
      ...(fdaDevice.status === 'fulfilled' ? fdaDevice.value : []),
      ...(fdaAE.status === 'fulfilled' ? fdaAE.value : []),
      ...(clinTrials.status === 'fulfilled' ? clinTrials.value : []),
      ...(pubmed.status === 'fulfilled' ? pubmed.value : []),
      ...(who.status === 'fulfilled' ? who.value : []),
      ...(mhra.status === 'fulfilled' ? mhra.value : []),
      ...(canada.status === 'fulfilled' ? canada.value : []),
      ...(nejm.status === 'fulfilled' ? nejm.value : []),
    ].filter((e) => e.source_url && e.headline);

    if (!allEvents.length) {
      return new Response(
        JSON.stringify({ inserted: 0, message: 'No events fetched' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Upsert — ON CONFLICT (source_url) DO NOTHING for deduplication
    const { data, error } = await supabase
      .from('health_intel_events')
      .upsert(
        allEvents.map((e) => ({
          ...e,
          is_active: true,
          ingested_at: new Date().toISOString(),
        })),
        { onConflict: 'source_url', ignoreDuplicates: true }
      )
      .select('id, headline, summary, event_type, source, severity, ai_summarized');

    if (error) {
      console.error('[health-intel-ingest] Upsert error:', error);
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const inserted = data?.length ?? 0;
    console.log(`[health-intel-ingest] Inserted ${inserted} new events from ${allEvents.length} fetched`);

    // ── Generate AI summaries for newly inserted events ──────────────────────
    // Only process events that were actually inserted (not duplicates)
    // and haven't been summarized yet. Process up to 10 per run to
    // stay within edge function timeout limits.
    const newEvents = (data ?? []).filter(
      (e): e is {
        id: string;
        headline: string;
        summary: string | null;
        event_type: string;
        source: string;
        severity: string;
        ai_summarized: boolean;
      } => !e.ai_summarized
    ).slice(0, 10);

    let summarized = 0;
    for (const event of newEvents) {
      try {
        const { consumer_summary, risk_note } = await generateConsumerSummary(
          event.headline,
          event.summary,
          event.event_type,
          event.source,
          event.severity,
        );

        await supabase
          .from('health_intel_events')
          .update({
            consumer_summary,
            risk_note,
            ai_summarized: true,
          })
          .eq('id', event.id);

        summarized++;

        // Rate limit — avoid hammering Anthropic API
        await new Promise((r) => setTimeout(r, 200));
      } catch (summaryErr) {
        console.error(`[intel-ingest] Failed to summarize event ${event.id}:`, summaryErr);
        continue;
      }
    }

    console.log(`[health-intel-ingest] AI summarized ${summarized} of ${newEvents.length} new events`);

    // Update country health status aggregates
    const countryCounts: Record<string, { recalls: number; alerts: number; outbreaks: number }> = {};
    for (const event of allEvents) {
      for (const country of event.countries) {
        if (!countryCounts[country]) countryCounts[country] = { recalls: 0, alerts: 0, outbreaks: 0 };
        if (event.event_type === 'recall') countryCounts[country].recalls++;
        else if (event.event_type === 'outbreak') countryCounts[country].outbreaks++;
        else countryCounts[country].alerts++;
      }
    }
    for (const [code, counts] of Object.entries(countryCounts)) {
      const total = counts.recalls + counts.alerts + counts.outbreaks;
      const riskLevel = total >= 5 ? 'elevated' : total >= 10 ? 'critical' : 'normal';
      await supabase.from('country_health_status').upsert({
        country_code: code,
        active_recalls: counts.recalls,
        active_alerts: counts.alerts,
        outbreaks: counts.outbreaks,
        risk_level: riskLevel,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'country_code' });
    }

    return new Response(
      JSON.stringify({
        success: true,
        inserted,
        summarized,
        fetched: allEvents.length,
        sources: {
          fda_drug: fdaDrug.status === 'fulfilled' ? fdaDrug.value.length : 'error',
          fda_device: fdaDevice.status === 'fulfilled' ? fdaDevice.value.length : 'error',
          fda_ae: fdaAE.status === 'fulfilled' ? fdaAE.value.length : 'error',
          clinical_trials: clinTrials.status === 'fulfilled' ? clinTrials.value.length : 'error',
          pubmed: pubmed.status === 'fulfilled' ? pubmed.value.length : 'error',
          who: who.status === 'fulfilled' ? who.value.length : 'error',
          mhra: mhra.status === 'fulfilled' ? mhra.value.length : 'error',
          health_canada: canada.status === 'fulfilled' ? canada.value.length : 'error',
          nejm: nejm.status === 'fulfilled' ? nejm.value.length : 'error',
        },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (e) {
    console.error('[health-intel-ingest]', e);
    return new Response(
      JSON.stringify({ error: String((e as Error)?.message ?? e) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
