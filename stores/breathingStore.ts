import { create } from 'zustand';

// Extended breath phase: `hold2` is the optional second hold used by box /
// buteyko / somatic exercises. The existing BreathingOrb only branches on
// the first three so `hold2` is safely ignored there.
export type BreathPhase = 'inhale' | 'hold' | 'exhale' | 'hold2' | 'idle';
export type SessionState = 'idle' | 'checkin' | 'active' | 'reward' | 'panic';

export interface BreathExercise {
  id: string;
  name: string;
  category: 'calm' | 'focus' | 'energy' | 'recovery';
  categoryLabel: string;
  categoryColor: string;
  description: string;
  benefit: string;
  inhale: number;
  hold1: number;
  exhale: number;
  hold2: number;
  totalCycles: number;
  isPro: boolean;
  visualType: 'orb' | 'lungs' | 'pin' | 'ring' | 'military';
  militaryRank?: string;
  coachingCues: {
    inhale: string;
    hold: string;
    exhale: string;
    complete: string;
  };
}

export interface StressCheck {
  moodRating: number;
  moodTags: string[];
  symptoms: string[];
  stressScore: number;
}

export interface SessionReward {
  xpEarned: number;
  stressReduction: number;
  newRank?: string;
  badgeUnlocked?: string;
  streakCount: number;
  isNewRecord: boolean;
}

interface BreathingState {
  // ── Legacy fields (kept for BreathingOrb + existing inline flow) ──────
  phase: BreathPhase;
  cyclesCompleted: number;
  isActive: boolean;
  setPhase: (p: BreathPhase) => void;
  setActive: (v: boolean) => void;
  incrementCycle: () => void;
  resetSession: () => void;

  // ── New intelligence fields ───────────────────────────────────────────
  currentExercise: BreathExercise | null;
  setCurrentExercise: (ex: BreathExercise | null) => void;
  sessionState: SessionState;
  setSessionState: (s: SessionState) => void;
  currentPhase: BreathPhase;
  setCurrentPhase: (p: BreathPhase) => void;
  setCyclesCompleted: (n: number) => void;
  stressCheck: StressCheck | null;
  setStressCheck: (s: StressCheck | null) => void;
  sessionReward: SessionReward | null;
  setSessionReward: (r: SessionReward | null) => void;
  isPanicMode: boolean;
  setIsPanicMode: (v: boolean) => void;
  totalMinutesToday: number;
  setTotalMinutesToday: (n: number) => void;
  currentRank: string;
  setCurrentRank: (r: string) => void;
  rankPoints: number;
  setRankPoints: (n: number) => void;
  currentStreak: number;
  setCurrentStreak: (n: number) => void;
}

export const useBreathingStore = create<BreathingState>((set) => ({
  // Legacy fields
  phase: 'idle',
  cyclesCompleted: 0,
  isActive: false,
  setPhase: (phase) => set({ phase, currentPhase: phase }),
  setActive: (isActive) => set({ isActive }),
  incrementCycle: () =>
    set((s) => ({ cyclesCompleted: s.cyclesCompleted + 1 })),
  resetSession: () =>
    set({
      phase: 'idle',
      currentPhase: 'idle',
      cyclesCompleted: 0,
      isActive: false,
      sessionState: 'idle',
      stressCheck: null,
      sessionReward: null,
      isPanicMode: false,
      currentExercise: null,
    }),

  // New fields
  currentExercise: null,
  setCurrentExercise: (currentExercise) => set({ currentExercise }),
  sessionState: 'idle',
  setSessionState: (sessionState) => set({ sessionState }),
  currentPhase: 'idle',
  setCurrentPhase: (currentPhase) => set({ currentPhase, phase: currentPhase }),
  setCyclesCompleted: (cyclesCompleted) => set({ cyclesCompleted }),
  stressCheck: null,
  setStressCheck: (stressCheck) => set({ stressCheck }),
  sessionReward: null,
  setSessionReward: (sessionReward) => set({ sessionReward }),
  isPanicMode: false,
  setIsPanicMode: (isPanicMode) => set({ isPanicMode }),
  totalMinutesToday: 0,
  setTotalMinutesToday: (totalMinutesToday) => set({ totalMinutesToday }),
  currentRank: 'Recruit',
  setCurrentRank: (currentRank) => set({ currentRank }),
  rankPoints: 0,
  setRankPoints: (rankPoints) => set({ rankPoints }),
  currentStreak: 0,
  setCurrentStreak: (currentStreak) => set({ currentStreak }),
}));
