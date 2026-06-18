import { TextStyle } from 'react-native';
import { colors } from './colors';

export const typography = {
  headline: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 24,
    lineHeight: 30,
    color: colors.textPrimary,
    letterSpacing: -0.3,
  } satisfies TextStyle,
  headlineSm: {
    fontFamily: 'Montserrat_600SemiBold',
    fontSize: 18,
    lineHeight: 24,
    color: colors.textPrimary,
  } satisfies TextStyle,
  body: {
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    lineHeight: 22,
    color: colors.textMuted,
  } satisfies TextStyle,
  bodyStrong: {
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    lineHeight: 22,
    color: colors.textPrimary,
  } satisfies TextStyle,
  caption: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    lineHeight: 18,
    color: colors.textMuted,
  } satisfies TextStyle,
  tabLabel: {
    fontFamily: 'Montserrat_600SemiBold',
    fontSize: 11,
    letterSpacing: 0.2,
  } satisfies TextStyle,
};

// New design-system scale (from theme/index.ts) — use these going forward
export const typographyScale = {
  hero:       { fontSize: 32, fontWeight: '900' as const, letterSpacing: -1.5 },
  display:    { fontSize: 26, fontWeight: '900' as const, letterSpacing: -0.7 },
  title:      { fontSize: 22, fontWeight: '900' as const, letterSpacing: -0.5 },
  heading:    { fontSize: 17, fontWeight: '800' as const, letterSpacing: -0.3 },
  subheading: { fontSize: 15, fontWeight: '700' as const, letterSpacing: -0.2 },
  body:       { fontSize: 13, fontWeight: '400' as const, lineHeight: 20 },
  bodyMedium: { fontSize: 13, fontWeight: '600' as const, lineHeight: 20 },
  caption:    { fontSize: 11, fontWeight: '600' as const, letterSpacing: 0.2 },
  label:      { fontSize: 10, fontWeight: '800' as const, letterSpacing: 1.0 },
  micro:      { fontSize: 9,  fontWeight: '700' as const, letterSpacing: 0.6 },
};
