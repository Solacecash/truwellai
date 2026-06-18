import { create } from 'zustand';
import type { PlanId } from '@/lib/subscriptionPlans';

const FREE_HOURLY_LIMIT = 20;
const PRO_HOURLY_LIMIT = 100;

interface UiState {
  // Timestamps (ms) of AI requests in the current rolling 1-hour window
  aiRequestTimestamps: number[];

  // Returns true if the request is allowed, false if rate-limited
  checkAndRecordAiRequest: (tier: PlanId) => boolean;

  getRemainingRequests: (tier: PlanId) => number;
}

function pruneOldTimestamps(timestamps: number[]): number[] {
  const cutoff = Date.now() - 60 * 60 * 1000;
  return timestamps.filter((t) => t > cutoff);
}

function limitForTier(tier: PlanId): number {
  return tier === 'free' ? FREE_HOURLY_LIMIT : PRO_HOURLY_LIMIT;
}

export const useUiStore = create<UiState>((set, get) => ({
  aiRequestTimestamps: [],

  checkAndRecordAiRequest: (tier) => {
    const pruned = pruneOldTimestamps(get().aiRequestTimestamps);
    const limit = limitForTier(tier);
    if (pruned.length >= limit) {
      set({ aiRequestTimestamps: pruned });
      return false;
    }
    set({ aiRequestTimestamps: [...pruned, Date.now()] });
    return true;
  },

  getRemainingRequests: (tier) => {
    const pruned = pruneOldTimestamps(get().aiRequestTimestamps);
    return Math.max(0, limitForTier(tier) - pruned.length);
  },
}));
