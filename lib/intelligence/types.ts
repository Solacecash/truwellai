/** Evidence tiers for clinician intelligence feeds. */
export type EvidenceTierNumber = 1 | 2 | 3;

export type IntelFreshness = 'recent' | 'updated' | 'historical';

export interface IntelligenceFeedItem {
  id: string;
  tier: EvidenceTierNumber;
  title: string;
  summary: string;
  url: string;
  sourceType: string;
  sourceOrg: string;
  freshness: IntelFreshness;
  communitySignal?: boolean;
  caveat: string;
}

export interface IntelligenceFeedResponse {
  items: IntelligenceFeedItem[];
  fetchedAtIso: string;
}
