/**
 * Onboarding design tokens — re-exports spec theme (constants/onboardingTheme.ts).
 * Legacy aliases preserved for existing component imports.
 */

import { OB as SPEC_OB, gradients as SPEC_GRADIENTS, onboardingSpacing } from '@/constants/onboardingTheme';

export { SPEC_GRADIENTS as gradients, onboardingSpacing };

export const OB = {
  ...SPEC_OB,
  // Legacy aliases used across onboarding components
  ink: SPEC_OB.black,
  navy2: SPEC_OB.blue,
  goldLight: SPEC_OB.goldL,
  goldDark: SPEC_OB.goldD,
  goldGlow: 'rgba(201,168,76,0.35)',
  goldGlowBorder: 'rgba(201,168,76,0.25)',
  tealDark: SPEC_OB.blue,
  tealGlow: 'rgba(0,229,200,0.35)',
  sky: SPEC_OB.cyan,
  glass1: 'rgba(240,244,255,0.08)',
  glass2: 'rgba(240,244,255,0.05)',
  glassBorder: 'rgba(240,244,255,0.14)',
  t100: SPEC_OB.white,
  t70: SPEC_OB.w70,
  t45: SPEC_OB.w40,
  t20: 'rgba(240,244,255,0.20)',
  t10: 'rgba(240,244,255,0.10)',
  r12: 12,
  r16: onboardingSpacing.cardRadiusMin,
  r20: onboardingSpacing.cardRadiusMax,
  r24: 24,
  r99: 999,
} as const;

export const OB_FONTS = {
  display: SPEC_OB.fontHead,
  displayMedium: SPEC_OB.fontHead,
  body: SPEC_OB.fontBody,
  bodyMedium: SPEC_OB.fontBody,
  bodyHeavy: SPEC_OB.fontHead,
} as const;

export const WIZARD_PROMPTS = {
  user: [
    "Let's build your <strong>Guardian Profile</strong>. What should I call you?",
    "Tell me about your <strong>health history</strong>. I'll personalise every scan around it.",
    "What does your body <strong>react to</strong>? I'll flag these on every scan automatically.",
    "Some ingredients interact with <strong>medications</strong>. Tell me what you're taking, even optionally.",
    "Choose your <strong>guardian plan</strong>. You can always upgrade later.",
  ],
  expert: [
    "Welcome, clinician. Let's set up your <strong>professional dashboard</strong>. What should I call you?",
    "Your specialty shapes your dashboard. Tell me about your <strong>clinical credentials</strong>.",
    "Help me understand your <strong>patient population</strong> so I can surface the right alerts.",
    "Which <strong>clinical tools</strong> do you want activated from day one?",
    "Choose your <strong>professional plan</strong>. The first 500 experts get lifetime access free.",
  ],
} as const;

export const TICKER_NAMES = [
  'Amara K.',
  'James T.',
  'Priya S.',
  'Chen W.',
  'Fatima A.',
  'Lucas M.',
  'Zara O.',
  'Noah B.',
  'Aisha D.',
  'Ethan R.',
];
export const TICKER_PRODUCTS = [
  'sunscreen',
  'shampoo',
  'protein powder',
  'baby lotion',
  'face wash',
  'deodorant',
  'cereal',
];
export const TICKER_OUTCOMES = [
  'flagged 2 ingredients',
  'found a safer choice',
  'avoided a banned chemical',
  'got an A rating',
];
