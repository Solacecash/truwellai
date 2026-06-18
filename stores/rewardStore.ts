import { create } from 'zustand';

export type Badge = { id: string; label: string; unlockedAt?: string };

export type DailyChallenge = {
  id: string;
  title: string;
  xp: number;
  done: boolean;
};

interface RewardState {
  xp: number;
  level: number;
  badges: Badge[];
  challenges: DailyChallenge[];
  streakDays: number;
  lastStreakAt: string | null;
  scanCountLifetime: number;
  setProgress: (xp: number, level: number) => void;
  setBadges: (b: Badge[]) => void;
  setChallenges: (c: DailyChallenge[]) => void;
  setStreak: (days: number, lastAt: string | null) => void;
  setScanCountLifetime: (n: number) => void;
  incrementScanCount: () => void;
  addXp: (amount: number) => void;
}

const xpForLevel = (level: number) => 100 + (level - 1) * 50;

export const useRewardStore = create<RewardState>((set, get) => ({
  xp: 0,
  level: 1,
  badges: [],
  challenges: [],
  streakDays: 0,
  lastStreakAt: null,
  scanCountLifetime: 0,
  setProgress: (xp, level) => set({ xp, level }),
  setBadges: (badges) => set({ badges }),
  setChallenges: (challenges) => set({ challenges }),
  setStreak: (streakDays, lastStreakAt) => set({ streakDays, lastStreakAt }),
  setScanCountLifetime: (scanCountLifetime) => set({ scanCountLifetime }),
  incrementScanCount: () =>
    set((s) => ({ scanCountLifetime: s.scanCountLifetime + 1 })),
  addXp: (amount) => {
    let { xp, level } = get();
    xp += amount;
    let need = xpForLevel(level);
    while (xp >= need) {
      xp -= need;
      level += 1;
      need = xpForLevel(level);
    }
    set({ xp, level });
  },
}));
