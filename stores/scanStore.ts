import { create } from 'zustand';

export type ScanMode = 'barcode' | 'ingredient' | 'calorie';

export type IngredientTraffic = 'safe' | 'moderate' | 'avoid';

export type GradedIngredient = {
  name: string;
  traffic: IngredientTraffic;
  note?: string;
};

export type ScanMethod = 'barcode' | 'qr' | 'ocr' | 'manual';

export type ScanBatchData = {
  gtin?: string;
  batchLot?: string;
  expiryDate?: string;
  productionDate?: string;
  serialNumber?: string;
  raw?: string;
};

export type ScanResultPayload = {
  grade: string;
  score: number;
  summary: string;
  ingredients: GradedIngredient[];
  productName?: string;
  barcode?: string;
  personalizedScore?: number;
  riskNotes?: string[];
  scanMethod?: ScanMethod;
  productType?: 'food' | 'cosmetic' | 'supplement' | 'household' | 'unknown';
  batchData?: ScanBatchData | null;
};

interface ScanState {
  mode: ScanMode;
  lastResult: ScanResultPayload | null;
  setMode: (m: ScanMode) => void;
  setLastResult: (r: ScanResultPayload | null) => void;
}

export const useScanStore = create<ScanState>((set) => ({
  mode: 'barcode',
  lastResult: null,
  setMode: (mode) => set({ mode }),
  setLastResult: (lastResult) => set({ lastResult }),
}));
