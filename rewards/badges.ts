import type { Badge } from '@/stores/rewardStore';

export type BadgeRuleInput = {
  streakDays: number;
  scanCountLifetime: number;
  waterMlToday: number;
  breathSessionsToday: number;
  reputationScore: number;
  reviewCount: number;
};

export const BADGE_CATALOG: Record<
  string,
  { id: string; label: string; match: (i: BadgeRuleInput) => boolean }
> = {
  first_scan: {
    id: 'first_scan',
    label: 'First Scan',
    match: (i) => i.scanCountLifetime >= 1,
  },
  streak_7: {
    id: 'streak_7',
    label: '7-Day Streak',
    match: (i) => i.streakDays >= 7,
  },
  hydration_master: {
    id: 'hydration_master',
    label: 'Hydration Master',
    match: (i) => i.waterMlToday >= 2000,
  },
  breath_steady: {
    id: 'breath_steady',
    label: 'Breath Steady',
    match: (i) => i.breathSessionsToday >= 1,
  },
  contributor: {
    id: 'contributor',
    label: 'Contributor',
    match: (i) => i.reviewCount >= 1,
  },
  expert: {
    id: 'expert',
    label: 'Expert',
    match: (i) => i.reputationScore >= 25,
  },
  top_reviewer: {
    id: 'top_reviewer',
    label: 'Top Reviewer',
    match: (i) => i.reviewCount >= 5,
  },
};

export function computeBadgesFromRules(input: BadgeRuleInput): Badge[] {
  const out: Badge[] = [];
  const now = new Date().toISOString();
  for (const def of Object.values(BADGE_CATALOG)) {
    if (def.match(input)) {
      out.push({ id: def.id, label: def.label, unlockedAt: now });
    }
  }
  return out;
}
