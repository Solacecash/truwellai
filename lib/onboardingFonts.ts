import { Platform } from 'react-native';

import { OB } from '@/constants/onboardingTheme';

let onboardingFontsReady = false;

/** Set by `app/(onboarding)/_layout.tsx` after expo-font load completes. */
export function setOnboardingFontsReady(ready: boolean): void {
  onboardingFontsReady = ready;
}

export function areOnboardingFontsReady(): boolean {
  return onboardingFontsReady;
}

const SYSTEM_FALLBACK = Platform.select({
  ios: 'System',
  android: 'sans-serif',
  default: undefined,
});

/** Headline font — Montserrat when loaded, system fallback otherwise. */
export function onboardingFontHead(): string | undefined {
  return onboardingFontsReady ? OB.fontHead : SYSTEM_FALLBACK;
}

/** Body font — DM Sans when loaded, system fallback otherwise. */
export function onboardingFontBody(): string | undefined {
  return onboardingFontsReady ? OB.fontBody : SYSTEM_FALLBACK;
}

/** Medium body weight for labels and meta copy. */
export function onboardingFontBodyMedium(): string | undefined {
  return onboardingFontsReady ? 'DM-Sans-Medium' : SYSTEM_FALLBACK;
}
