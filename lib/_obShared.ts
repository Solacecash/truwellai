import type { Href } from 'expo-router';

/** Local route map — matches lib/onboardingRoutePaths. */
export const OB_PATHS = {
  welcome: '/(onboarding)/welcome' as Href,
  role: '/(onboarding)/role' as Href,
  name: '/(onboarding)/name' as Href,
  goals: '/(onboarding)/goals' as Href,
  ageRange: '/(onboarding)/age-range' as Href,
  gender: '/(onboarding)/gender' as Href,
  conditions: '/(onboarding)/conditions' as Href,
  allergies: '/(onboarding)/allergies' as Href,
  dietType: '/(onboarding)/diet-type' as Href,
  productConcerns: '/(onboarding)/product-concerns' as Href,
  sleep: '/(onboarding)/sleep' as Href,
  lifestyle: '/(onboarding)/lifestyle' as Href,
  familyRole: '/(onboarding)/family-role' as Href,
  featurePreview: '/(onboarding)/feature-preview' as Href,
  aiProcessing: '/(onboarding)/ai-processing' as Href,
  scoreReveal: '/(onboarding)/score-reveal' as Href,
  prePaywall: '/(onboarding)/pre-paywall' as Href,
  /** @deprecated Use prePaywall — kept for account.tsx back navigation */
  blueprint: '/(onboarding)/pre-paywall' as Href,
  subscription: '/(onboarding)/subscription' as Href,
  account: '/(onboarding)/account' as Href,
  success: '/(onboarding)/success' as Href,
} as const;

export const OB_COLORS = {
  navy: '#0A1628',
  black: '#080E1A',
  gold: '#C9A84C',
  goldLight: '#E8C96B',
  goldDark: '#A8822A',
  teal: '#00E5C8',
  tealDark: '#0284C7',
  sky: '#0EA5E9',
  white: '#F0F4FF',
  white70: 'rgba(240,244,255,0.70)',
  white40: 'rgba(240,244,255,0.40)',
  white12: 'rgba(240,244,255,0.12)',
  white07: 'rgba(240,244,255,0.07)',
  green: '#16A34A',
  amber: '#F5A623',
  red: '#FF4444',
} as const;

/** Alias for spec compliance (local paths; lib file has duplicate export blocks). */
export const ONBOARDING_ROUTES = OB_PATHS;

export const OB_FONTS = {
  extraBold: 'Montserrat',
  semiBold: 'Montserrat-SemiBold',
  bold: 'Montserrat',
  body: 'DM-Sans',
  medium: 'DM-Sans-Medium',
} as const;
