import { create } from 'zustand';

/** Aggregates high-level wellness prefs; detail lives in diet/breath/hydration stores */
interface WellnessState {
  calorieTarget: number;
  waterDailyGoalMl: number;
  setCalorieTarget: (n: number) => void;
  setWaterDailyGoalMl: (n: number) => void;
}

export const useWellnessStore = create<WellnessState>((set) => ({
  calorieTarget: 2000,
  waterDailyGoalMl: 2500,
  setCalorieTarget: (calorieTarget) => set({ calorieTarget }),
  setWaterDailyGoalMl: (waterDailyGoalMl) => set({ waterDailyGoalMl }),
}));
