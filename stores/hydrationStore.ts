import { create } from 'zustand';

export type HydrationLog = { id: string; ml: number; logged_at: string };

interface HydrationState {
  todayTotalMl: number;
  optimisticLogs: HydrationLog[];
  setTodayTotal: (ml: number) => void;
  addOptimisticLog: (log: HydrationLog) => void;
  clearOptimistic: () => void;
}

export const useHydrationStore = create<HydrationState>((set) => ({
  todayTotalMl: 0,
  optimisticLogs: [],
  setTodayTotal: (todayTotalMl) => set({ todayTotalMl }),
  addOptimisticLog: (log) =>
    set((s) => ({
      optimisticLogs: [log, ...s.optimisticLogs],
      todayTotalMl: s.todayTotalMl + log.ml,
    })),
  clearOptimistic: () => set({ optimisticLogs: [] }),
}));
