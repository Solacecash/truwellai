import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type EvidenceTier = 1 | 2 | 3;
type Freshness = 'recent' | 'updated' | 'historical';

type FeedItem = {
  id: string;
  tier: EvidenceTier;
  title: string;
  summary: string;
  url: string;
  sourceType: string;
  sourceOrg: string;
  freshness: Freshness;
  communitySignal?: boolean;
  caveat: string;
};

const CDC_WHO_STUBS: FeedItem[] = [
  {
    id: 'cdc-nutrition-landing',
    tier: 1,
    title: 'CDC Nutrition (evidence-based prevention resources)',
    summary:
      'Public guidance on nutrition, physical activity, and chronic disease prevention. Always verify citing the exact CDC publication date.',
    url: 'https://www.cdc.gov/nutrition/index.html',
    sourceType: 'government_guidance_index',
    sourceOrg: 'CDC',
    freshness: 'updated',
    caveat:
      'Index page may link to many programmes. Drill down to the specific guideline PDF before citing clinically.',
  },
  {
    id: 'who-nutrition-landing',
    tier: 1,
    title: 'WHO Nutrition health topics portal',
    summary:
      'Global nutrition statements and thematic briefs spanning undernutrition through obesity prevention.',
    url: 'https://www.who.int/health-topics/nutrition',
    sourceType: 'multilateral_guidance_index',
    sourceOrg: 'WHO',
    freshness: 'updated',
    caveat: 'Region-specific implementation differs; corroborate with national guidelines.',
  },
];

const MEDLINE_STUB: FeedItem = {
  id: 'medlineplus-health-topics',
  tier: 1,
  title: 'MedlinePlus trusted consumer health encyclopedia',
  summary:
    'NIH-maintained encyclopedic summaries with citations to biomedical literature subsets suitable for clinician quick orientation.',
  url: 'https://medlineplus.gov/',
  sourceType: 'nih_consumer_reference',
  sourceOrg: 'NIH MedlinePlus',
  freshness: 'updated',
  caveat: 'Consumer-facing wording; pair with PubMed abstracts for clinician depth.',
};

const TIER2_BODIES: FeedItem[] = [
  {
    id: 'nice-evidence-navigation',
    tier: 2,
    title: 'NICE guidance discovery (UK clinicians)',
    summary:
      'Authoritative guideline navigation for UK practice; relevance depends on locality and licensing.',
    url: 'https://www.nice.org.uk/guidance',
    sourceType: 'national_guideline_navigator',
    sourceOrg: 'NICE UK',
    freshness: 'updated',
    caveat: 'Jurisdiction-specific applicability; mirror with local guideline bodies elsewhere.',
  },
];

/** Tier 3 is explicitly non-authoritative trending chatter for signal detection ONLY. */
const COMMUNITY_STUB: FeedItem = {
  id: 'patient-forums-trends-placeholder',
  tier: 3,
  title: 'Community discussion trend sentinel (offline placeholder)',
  summary:
    'Demonstrates TruWell segregation of social signals versus PubMed-linked facts. Swap with audited partner APIs behind feature flags.',
  url: 'https://truwell.ai',
  sourceType: 'community_aggregate_stub',
  sourceOrg: 'TruWell signal sandbox',
  freshness: 'historical',
  communitySignal: true,
  caveat:
    'Community anecdotes are NEVER medical truth; they only highlight rumours or themes to investigate with Tier 1/2 citations.',
};

async function fetchPubMedSummaries(): Promise<FeedItem[]> {
  const term = encodeURIComponent('"hypertension"[MeSH Terms] guideline');
  const esearchUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&retmode=json&retmax=5&sort=relevance&term=${term}`;
  const er = await fetch(esearchUrl);
  if (!er.ok) return [];
  const es = (await er.json()) as {
    esearchresult?: { idlist?: string[] };
  };
  const ids = es.esearchresult?.idlist ?? [];
  if (!ids.length) return [];

  const idsParam = ids.join(',');
  const esummaryUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&retmode=json&id=${idsParam}`;
  const sr = await fetch(esummaryUrl);
  if (!sr.ok) return [];
  const sj = (await sr.json()) as {
    result?: Record<string, { title?: string; pubdate?: string; fulljournalname?: string }>;
    uids?: string[];
  };
  const uidList = sj.uids ?? [];
  const rows: FeedItem[] = [];

  for (const uid of uidList) {
    const entry = sj.result?.[uid];
    if (!entry?.title) continue;
    rows.push({
      id: `pubmed-${uid}`,
      tier: 1,
      title: entry.title.slice(0, 220),
      summary: `${entry.fulljournalname ?? 'PubMed article'} (${entry.pubdate ?? 'unknown date'}). Peer-reviewed biomedical literature.`,
      url: `https://pubmed.ncbi.nlm.nih.gov/${uid}/`,
      sourceType: 'pubmed_indexed_article',
      sourceOrg: 'PubMed/NCBI',
      freshness: 'recent',
      caveat: 'Population studies may not mirror individual physiology—clinical judgement applies.',
    });
  }

  return rows;
}

async function fetchFDARecalls(): Promise<FeedItem[]> {
  try {
    const url = 'https://api.fda.gov/drug/enforcement.json?limit=5&sort=report_date:desc';
    const res = await fetch(url);
    if (!res.ok) return [];
    const json = await res.json() as { results?: Array<{ recall_number: string; product_description: string; reason_for_recall: string; report_date: string; voluntary_mandated: string }> };
    return (json.results ?? []).map((r) => ({
      id: `fda-recall-${r.recall_number}`,
      tier: 1 as EvidenceTier,
      title: r.product_description?.slice(0, 200) ?? 'FDA Drug Recall',
      summary: r.reason_for_recall?.slice(0, 400) ?? '',
      url: `https://www.fda.gov/safety/recalls-market-withdrawals-safety-alerts`,
      sourceType: 'fda_recall',
      sourceOrg: 'FDA',
      freshness: 'recent' as Freshness,
      caveat: `${r.voluntary_mandated ?? 'Voluntary recall'} · Report date: ${r.report_date ?? 'unknown'}`,
    }));
  } catch {
    return [];
  }
}

async function fetchFDAAdverseEvents(): Promise<FeedItem[]> {
  try {
    const url = 'https://api.fda.gov/drug/event.json?limit=3&sort=receivedate:desc';
    const res = await fetch(url);
    if (!res.ok) return [];
    const json = await res.json() as { results?: Array<{ safetyreportid: string; patient?: { drug?: Array<{ medicinalproduct?: string }>; reaction?: Array<{ reactionmeddrapt?: string }> }; receivedate: string }> };
    return (json.results ?? []).map((r) => {
      const drug = r.patient?.drug?.[0]?.medicinalproduct ?? 'Unknown drug';
      const reactions = (r.patient?.reaction ?? []).map((rx) => rx.reactionmeddrapt).filter(Boolean).slice(0, 3).join(', ');
      return {
        id: `fda-ae-${r.safetyreportid}`,
        tier: 1 as EvidenceTier,
        title: `Adverse event report: ${drug}`,
        summary: reactions ? `Reported reactions: ${reactions}` : 'Adverse event reported to FDA FAERS.',
        url: 'https://www.fda.gov/safety/medwatch-fda-safety-information-and-adverse-event-reporting-program',
        sourceType: 'fda_adverse_event',
        sourceOrg: 'FDA FAERS',
        freshness: 'recent' as Freshness,
        caveat: 'Individual adverse event reports are not confirmed causation. Statistical patterns across many reports determine signal.',
      };
    });
  } catch {
    return [];
  }
}

async function fetchClinicalTrials(): Promise<FeedItem[]> {
  try {
    const url = 'https://clinicaltrials.gov/api/v2/studies?format=json&pageSize=3&sort=LastUpdatePostDate:desc&filter.overallStatus=TERMINATED,SUSPENDED';
    const res = await fetch(url);
    if (!res.ok) return [];
    const json = await res.json() as { studies?: Array<{ protocolSection?: { identificationModule?: { nctId?: string; briefTitle?: string }; statusModule?: { whyStopped?: string; overallStatus?: string }; conditionsModule?: { conditions?: string[] } } }> };
    return (json.studies ?? []).map((s) => {
      const id = s.protocolSection?.identificationModule?.nctId ?? 'unknown';
      const title = s.protocolSection?.identificationModule?.briefTitle ?? 'Clinical trial update';
      const reason = s.protocolSection?.statusModule?.whyStopped ?? '';
      const status = s.protocolSection?.statusModule?.overallStatus ?? '';
      const conditions = (s.protocolSection?.conditionsModule?.conditions ?? []).slice(0, 2).join(', ');
      return {
        id: `ct-${id}`,
        tier: 1 as EvidenceTier,
        title: `Trial ${status.toLowerCase()}: ${title.slice(0, 160)}`,
        summary: `${conditions ? `Condition: ${conditions}. ` : ''}${reason ? `Reason stopped: ${reason}` : ''}`.trim() || 'Clinical trial status change.',
        url: `https://clinicaltrials.gov/study/${id}`,
        sourceType: 'clinical_trial',
        sourceOrg: 'ClinicalTrials.gov',
        freshness: 'recent' as Freshness,
        caveat: 'Trial termination may reflect business, regulatory, or safety reasons. Review full record for context.',
      };
    });
  } catch {
    return [];
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    let bodyTier: Partial<Record<'tier1GovernmentAndPrimaryLiterature' | 'tier2GuidelinesBodies' | 'tier3CommunitySignals', boolean>> =
      {};
    if (req.method === 'POST') {
      try {
        bodyTier = await req.json();
      } catch {
        bodyTier = {};
      }
    }

    const t1 =
      bodyTier.tier1GovernmentAndPrimaryLiterature !== undefined
        ? bodyTier.tier1GovernmentAndPrimaryLiterature
        : true;
    const t2 =
      bodyTier.tier2GuidelinesBodies !== undefined ? bodyTier.tier2GuidelinesBodies : true;
    const t3 = bodyTier.tier3CommunitySignals === true;

    const tier1Extras = t1 ? await fetchPubMedSummaries().catch(() => []) : [];

    const [fdaRecalls, fdaAE, clinTrials] = await Promise.all([
      t1 ? fetchFDARecalls().catch(() => []) : Promise.resolve([]),
      t1 ? fetchFDAAdverseEvents().catch(() => []) : Promise.resolve([]),
      t1 ? fetchClinicalTrials().catch(() => []) : Promise.resolve([]),
    ]);

    let items: FeedItem[] = [];
    if (t1) items = [...CDC_WHO_STUBS, MEDLINE_STUB, ...tier1Extras, ...fdaRecalls, ...fdaAE, ...clinTrials];
    if (t2) items = [...items, ...TIER2_BODIES];
    if (t3) items = [...items, COMMUNITY_STUB];

    return new Response(JSON.stringify({ items, fetchedAtIso: new Date().toISOString() }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (e) {
    console.error('[intel-feed-proxy]', e);
    return new Response(
      JSON.stringify({ error: String((e as Error)?.message ?? e) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
