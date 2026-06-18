import { create } from 'zustand';

import type { HealthBriefSections } from '@/lib/healthBrief/types';

interface ClinicalBriefUiState {
  draftSections: HealthBriefSections | null;
  setDraftSections: (s: HealthBriefSections | null) => void;

  consentAcknowledged: boolean;
  setConsentAcknowledged: (v: boolean) => void;

  /** Optional member notes included only in assembler bundle (never overwrites chats). */
  freeTextContext: string;
  setFreeTextContext: (t: string) => void;

  lastShareId: string | null;
  setLastShareId: (id: string | null) => void;

  resetBriefFlow: () => void;
}

const initial = {
  draftSections: null as HealthBriefSections | null,
  consentAcknowledged: false,
  freeTextContext: '',
  lastShareId: null as string | null,
};

export const useClinicalBriefUiStore = create<ClinicalBriefUiState>((set) => ({
  ...initial,

  setDraftSections: (draftSections) => set({ draftSections }),
  setConsentAcknowledged: (consentAcknowledged) => set({ consentAcknowledged }),
  setFreeTextContext: (freeTextContext) => set({ freeTextContext }),
  setLastShareId: (lastShareId) => set({ lastShareId }),

  resetBriefFlow: () => set(initial),
}));
