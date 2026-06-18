import { supabase } from '@/lib/supabase';

import { fetchIntelligenceSourcesFromDb } from './fetchIntelSources';
import type { IntelligenceFeedItem, IntelligenceFeedResponse } from './types';

export async function fetchIntelligenceFeed(
  tierPrefs?: Partial<{
    tier1GovernmentAndPrimaryLiterature: boolean;
    tier2GuidelinesBodies: boolean;
    tier3CommunitySignals: boolean;
  }>
): Promise<IntelligenceFeedResponse> {
  try {
    const { data, error } = await supabase.functions.invoke('intel-feed-proxy', {
      body: tierPrefs ?? {},
    });
    if (error) {
      const msg =
        typeof (data as { error?: string })?.error === 'string'
          ? (data as { error: string }).error
          : error.message;
      throw new Error(msg);
    }
    const out = data as IntelligenceFeedResponse;
    if (!out?.items || !Array.isArray(out.items) || typeof out.fetchedAtIso !== 'string') {
      throw new Error('Malformed intelligence feed response.');
    }
    return out;
  } catch (proxyErr) {
    if (__DEV__) console.warn('[Intelligence] proxy failed, using DB sources:', proxyErr);
    const rows = await fetchIntelligenceSourcesFromDb();
    const items: IntelligenceFeedItem[] = rows.map((row) => ({
      id: row.id,
      tier: (row.category === 'clinical' ? 1 : row.category === 'research' ? 2 : 3) as 1 | 2 | 3,
      title: row.title,
      summary: row.description ?? '',
      url: row.url ?? '',
      sourceType: row.category,
      sourceOrg: row.category,
      freshness: 'recent' as const,
      caveat: 'Educational reference only. Confirm with a licensed healthcare professional.',
    }));
    return { items, fetchedAtIso: new Date().toISOString() };
  }
}
