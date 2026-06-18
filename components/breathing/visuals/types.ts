import type { BreathPhase } from '@/stores/breathingStore';

/** Shared visual component props. */
export interface VisualProps {
  phase: BreathPhase;
  phaseDurationMs: number;
  cyclesCompleted: number;
  totalCycles: number;
  size?: number;
  onOrbPressIn?: () => void;
  onOrbPressOut?: () => void;
}

export const PHASE_COLORS = {
  inhale: '#00E5C8',
  hold: '#C9A84C',
  exhale: '#9B59B6',
  hold2: '#C9A84C',
  idle: '#5A7FA0',
} as const;
