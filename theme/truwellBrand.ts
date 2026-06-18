/**
 * TruWell onboarding brand identity — derived from product logo and app theme.
 * Consumed by conversion onboarding (`app/onboarding/*`) and shared OB primitives.
 */

import type { ViewStyle } from 'react-native';

import { darkTheme, lightTheme } from './index';

export const TRUWELL_COLORS = {
  /** Electric Intelligence Blue */
  primary: '#00B7FF',
  /** Deep Tech Blue */
  primaryDark: '#0B3D91',
  primaryLight: '#35D6FF',

  /** Energy Cyan */
  accent: '#35D6FF',
  accentLight: '#35D6FF',
  accentDark: '#0B3D91',

  /** Premium Gold */
  gold: '#D4AF37',
  goldLight: '#E8C96B',
  goldDark: '#A8822A',

  /** Guardian path uses energy cyan glow */
  guardian: '#35D6FF',
  guardianBg: 'rgba(53,214,255,0.12)',
  guardianBorder: 'rgba(53,214,255,0.35)',

  /** Professional path uses electric blue */
  professional: '#00B7FF',
  professionalBg: 'rgba(0,183,255,0.12)',
  professionalBorder: 'rgba(0,183,255,0.35)',

  /** Midnight Navy shell */
  bgPrimary: '#0A1630',
  bgSecondary: '#0B3D91',
  bgTertiary: '#1A1A1A',
  bgCard: 'rgba(255,255,255,0.06)',
  bgCardBorder: 'rgba(255,255,255,0.10)',

  graphite: '#1A1A1A',
  neutralWhite: '#FFFFFF',
  neutralMist: '#E8EEF5',
  neutralSlate: '#A0A8B8',

  bgPrimaryLight: '#F0F4FF',
  bgSecondaryLight: '#FFFFFF',
  bgTertiaryLight: '#E8EEF8',
  bgCardLight: 'rgba(0,0,0,0.04)',
  bgCardBorderLight: 'rgba(0,0,0,0.12)',

  textPrimary: '#FFFFFF',
  textSecondary: 'rgba(232,238,245,0.72)',
  textMuted: '#A0A8B8',
  textAccent: '#35D6FF',

  textPrimaryLight: '#0A0F1E',
  textSecondaryLight: 'rgba(10,15,30,0.70)',
  textMutedLight: 'rgba(10,15,30,0.50)',
  textAccentLight: '#005F45',

  eyebrowGuardianLight: '#005F45',
  eyebrowProfessionalLight: '#004A99',
  eyebrowNeutralLight: '#007BFF',

  gradientPrimary: ['#00B7FF', '#0B3D91'] as const,
  gradientGuardian: ['#35D6FF', '#0B3D91'] as const,
  gradientProfessional: ['#0B3D91', '#00B7FF'] as const,
  gradientGold: ['#D4AF37', '#E8C96B'] as const,
  gradientHero: ['#0A1630', '#1A1A1A', '#0A1630'] as const,

  glass1: 'rgba(255,255,255,0.055)',
  glass2: 'rgba(255,255,255,0.09)',
  glassBorder: 'rgba(255,255,255,0.10)',
  glowCyan: 'rgba(53,214,255,0.30)',
  glowBlue: 'rgba(0,183,255,0.35)',
  glowGold: 'rgba(212,175,55,0.40)',

  success: '#00C97A',
  error: '#FF4757',
  warning: '#FFB830',
  info: '#00A8FF',
} as const;

export const TRUWELL_TYPE = {
  xs: 11,
  sm: 13,
  base: 15,
  md: 17,
  lg: 20,
  xl: 24,
  xxl: 30,
  hero: 38,
  lineHeight: {
    tight: 1.15,
    normal: 1.5,
    relaxed: 1.7,
  },
  letterSpacing: {
    tight: -0.5,
    normal: 0,
    wide: 0.5,
    wider: 1.5,
    widest: 3.0,
  },
} as const;

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  screenH: 20,
  screenV: 24,
} as const;

export const RADIUS = {
  sm: 8,
  md: 14,
  lg: 20,
  xl: 28,
  pill: 50,
  full: 9999,
} as const;

export const SHADOWS = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  button: {
    shadowColor: '#00B7FF',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  guardianButton: {
    shadowColor: '#35D6FF',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
} satisfies Record<string, ViewStyle>;

export type OnboardingPathVariant = 'guardian' | 'professional' | 'neutral';

export function onboardingScreenColors(isDark: boolean) {
  return {
    isDark,
    bg: isDark ? TRUWELL_COLORS.bgPrimary : TRUWELL_COLORS.bgPrimaryLight,
    bgSecondary: isDark ? TRUWELL_COLORS.bgSecondary : TRUWELL_COLORS.bgSecondaryLight,
    textPrimary: isDark ? TRUWELL_COLORS.textPrimary : TRUWELL_COLORS.textPrimaryLight,
    textSecondary: isDark ? TRUWELL_COLORS.textSecondary : TRUWELL_COLORS.textSecondaryLight,
    textMuted: isDark ? TRUWELL_COLORS.textMuted : TRUWELL_COLORS.textMutedLight,
    cardBg: isDark ? TRUWELL_COLORS.bgCard : TRUWELL_COLORS.bgCardLight,
    cardBorder: isDark ? TRUWELL_COLORS.bgCardBorder : TRUWELL_COLORS.bgCardBorderLight,
    segmentEmpty: isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.10)',
    backBtnBg: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)',
    backBtnBorder: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)',
    backIcon: isDark ? TRUWELL_COLORS.textPrimary : TRUWELL_COLORS.textPrimaryLight,
    theme: isDark ? darkTheme : lightTheme,
  };
}

export function accentForVariant(variant: OnboardingPathVariant): string {
  if (variant === 'guardian') return TRUWELL_COLORS.guardian;
  if (variant === 'professional') return TRUWELL_COLORS.professional;
  return TRUWELL_COLORS.accentLight;
}

export function eyebrowColor(variant: OnboardingPathVariant, isDark: boolean): string {
  if (isDark) return accentForVariant(variant);
  if (variant === 'guardian') return TRUWELL_COLORS.eyebrowGuardianLight;
  if (variant === 'professional') return TRUWELL_COLORS.eyebrowProfessionalLight;
  return TRUWELL_COLORS.eyebrowNeutralLight;
}
