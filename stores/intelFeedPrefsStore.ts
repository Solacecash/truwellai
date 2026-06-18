import { create } from 'zustand';

/** Which evidence tiers surface in the professional intelligence strip. Tier 3 defaults off. */
export interface IntelTierVisibility {
  tier1GovernmentAndPrimaryLiterature: boolean;
  tier2GuidelinesBodies: boolean;
  tier3CommunitySignals: boolean;
}

interface IntelFeedPrefsState extends IntelTierVisibility {
  setTierVisibility: (patch: Partial<IntelTierVisibility>) => void;
  reset: () => void;
}

const defaults: IntelTierVisibility = {
  tier1GovernmentAndPrimaryLiterature: true,
  tier2GuidelinesBodies: true,
  tier3CommunitySignals: false,
};

export const useIntelFeedPrefsStore = create<IntelFeedPrefsState>((set) => ({
  ...defaults,

  setTierVisibility: (patch) =>
    set((prev) => ({
      ...prev,
      ...patch,
    })),

  reset: () => set(defaults),
}));
