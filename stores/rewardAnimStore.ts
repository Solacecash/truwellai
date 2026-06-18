import { create } from 'zustand';

export type GlobalAnimType = 'breathing_complete' | 'xp_gained';

export interface GlobalAnimEvent {
  id:   string;
  type: GlobalAnimType;
  xp?:  number;
}

interface RewardAnimStore {
  queue:  GlobalAnimEvent[];
  push:   (e: Omit<GlobalAnimEvent, 'id'>) => void;
  remove: (id: string) => void;
}

export const useRewardAnimStore = create<RewardAnimStore>((set) => ({
  queue:  [],
  push:   (e) =>
    set((s) => ({
      queue: [...s.queue, { ...e, id: `anim-${Date.now()}-${Math.random()}` }],
    })),
  remove: (id) =>
    set((s) => ({ queue: s.queue.filter((a) => a.id !== id) })),
}));

/** Trigger the full-screen breathing-complete animation. */
export function triggerBreathingComplete(): void {
  useRewardAnimStore.getState().push({ type: 'breathing_complete' });
}

/** Trigger a floating "+N XP" animation at screen centre. */
export function triggerXpGained(xp: number): void {
  useRewardAnimStore.getState().push({ type: 'xp_gained', xp });
}
