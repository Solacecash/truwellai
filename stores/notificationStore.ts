import { create } from 'zustand';

interface NotificationStore {
  unreadCount: number;
  setUnreadCount: (n: number) => void;
  increment: () => void;
  decrement: () => void;
}

export const useNotificationStore = create<NotificationStore>((set) => ({
  unreadCount: 0,
  setUnreadCount: (n) => set({ unreadCount: Math.max(0, n) }),
  increment:      ()  => set((s) => ({ unreadCount: s.unreadCount + 1 })),
  decrement:      ()  => set((s) => ({ unreadCount: Math.max(0, s.unreadCount - 1) })),
}));
