import { create } from 'zustand';

import type { FamilyGroupInfo } from '@/lib/familyPlan';

interface FamilyState {
  groupInfo: FamilyGroupInfo | null;
  loading: boolean;
  setGroupInfo: (info: FamilyGroupInfo | null) => void;
  setLoading: (v: boolean) => void;
}

export const useFamilyStore = create<FamilyState>((set) => ({
  groupInfo: null,
  loading: false,
  setGroupInfo: (groupInfo) => set({ groupInfo }),
  setLoading: (loading) => set({ loading }),
}));
