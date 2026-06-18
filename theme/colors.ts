/** TruWell brand tokens — Primary Navy, Circuit Gold, Teal Glow, Void Black */

import { darkTheme } from './index';

/** Psychological onboarding (TruWell): use only for `(auth)/psych/*` flows */
export const psychBrand = {
  primary: '#00A878',
  secondary: '#007BFF',
  accent: '#FF6B35',
  background: '#050F1A',
  gradient: ['#00A878', '#007BFF', '#00D4AA'] as const,
  trustPillBg: 'rgba(0,168,120,0.12)',
  tealBorder: 'rgba(0,168,120,0.45)',
} as const;

/** Conversion onboarding palettes (dual-path Guardian / Professional) */
export const conversionOnboarding = {
  /** Aligned with TRUWELL brand shell */
  bg: '#070B14',
  /** Same stops as legacy psych onboarding gradient */
  guardian: psychBrand.gradient,
  /** Dashboard purple ladder + amber circuit warmth (Expert path) */
  professional: [darkTheme.purple, '#A78BFA', darkTheme.amber] as const,
  /** Shell depth aligned with darkTheme surfaces */
  neutral: [darkTheme.bg1, darkTheme.bg2, darkTheme.bg4] as const,
} as const;

export const colors = {
  background: '#0A1628',
  accentGold: '#C9A84C',
  circuitGold: '#C9A84C',
  tealGlow: '#00E5C8',
  dark: '#080E1A',
  voidBlack: '#080E1A',
  textPrimary: '#F4F7FB',
  textMuted: 'rgba(244, 247, 251, 0.62)',
  cardBorder: 'rgba(0, 229, 200, 0.18)',
  cardBg: 'rgba(8, 14, 26, 0.72)',
  diet: '#16A34A',
  breathing: '#0EA5E9',
  water: '#06B6D4',
  safe: '#22C55E',
  moderate: '#EAB308',
  avoid: '#EF4444',
} as const;

/** Feature-carousel accent pairs (conversion platform intro) */
export const conversionPlatformCardAccents = {
  scanner: [psychBrand.gradient[0], psychBrand.gradient[2]] as const,
  aiDoctor: [psychBrand.secondary, colors.tealGlow] as const,
  guardianShield: [psychBrand.primary, colors.accentGold] as const,
  telehealth: [darkTheme.green, psychBrand.secondary] as const,
  transformation: [psychBrand.accent, darkTheme.amber] as const,
} as const;

export type ColorKey = keyof typeof colors;

export * from './index';
export * from './truwellBrand';
