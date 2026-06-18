import React, { memo } from 'react';
import { StyleSheet, View } from 'react-native';

import type { OnboardingPathVariant } from '@/theme/truwellBrand';
import { TRUWELL_COLORS } from '@/theme/truwellBrand';

type Props = {
  variant?: OnboardingPathVariant;
};

function TruwellAtmosphereInner({ variant = 'neutral' }: Props) {
  const palette = {
    guardian: [TRUWELL_COLORS.guardian, TRUWELL_COLORS.primary] as const,
    professional: [TRUWELL_COLORS.professional, TRUWELL_COLORS.primaryDark] as const,
    neutral: [TRUWELL_COLORS.primary, TRUWELL_COLORS.guardian] as const,
  };
  const [c1, c2] = palette[variant];

  return (
    <>
      <View
        pointerEvents="none"
        style={[styles.orb, styles.orbTopRight, { backgroundColor: c1 }]}
      />
      <View
        pointerEvents="none"
        style={[styles.orb, styles.orbBottomLeft, { backgroundColor: c2 }]}
      />
      <View pointerEvents="none" style={[styles.orb, styles.orbCenter, { backgroundColor: TRUWELL_COLORS.accentLight }]} />
    </>
  );
}

export const TruwellAtmosphere = memo(TruwellAtmosphereInner);

const styles = StyleSheet.create({
  orb: {
    position: 'absolute',
    borderRadius: 9999,
  },
  orbTopRight: {
    width: 350,
    height: 350,
    opacity: 0.08,
    top: -80,
    right: -80,
  },
  orbBottomLeft: {
    width: 280,
    height: 280,
    opacity: 0.06,
    bottom: 80,
    left: -60,
  },
  orbCenter: {
    width: 160,
    height: 160,
    opacity: 0.04,
    top: '40%',
    left: '50%',
    marginLeft: -80,
  },
});
