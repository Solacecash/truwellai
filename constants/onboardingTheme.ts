/**
 * Spec onboarding theme — TruWell_AI_Onboarding_Cursor_Prompt.md lines 161–209, 553–567.
 * Overrides brand guide for conversion onboarding only.
 */

export const OB = {
  navy: '#0A1628',
  black: '#080E1A',
  gold: '#C9A84C',
  goldL: '#E8C96B',
  goldD: '#A8822A',
  teal: '#00E5C8',
  cyan: '#00B7FF',
  blue: '#0B3D91',
  white: '#F0F4FF',
  w70: 'rgba(240,244,255,0.70)',
  w40: 'rgba(240,244,255,0.40)',
  w12: 'rgba(240,244,255,0.12)',
  green: '#16A34A',
  red: '#ef4444',
  fontHead: 'Montserrat',
  fontBody: 'DM-Sans',
} as const;

export const gradients = {
  gold: ['#E8C96B', '#A8822A'] as const,
  teal: ['#00E5C8', '#0284C7'] as const,
  blue: ['#0B3D91', '#00B7FF'] as const,
};

/** Layout tokens from spec LAYOUT RULES (lines 553–567). */
export const onboardingSpacing = {
  horizontal: 22,
  top: 28,
  scrollBottom: 110,
  ctaHeight: 56,
  ctaRadius: 16,
  cardRadiusMin: 16,
  cardRadiusMax: 20,
  chipRadius: 100,
} as const;
