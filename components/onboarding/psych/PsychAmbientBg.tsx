import React, { memo } from 'react';
import { StyleSheet, View } from 'react-native';

import { psychBrand } from '@/theme/colors';

function PsychAmbientBgInner() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <View style={[styles.orb, styles.orbTeal]} />
      <View style={[styles.orb, styles.orbBlue]} />
    </View>
  );
}

export const PsychAmbientBg = memo(PsychAmbientBgInner);

const styles = StyleSheet.create({
  orb: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    opacity: 0.35,
  },
  orbTeal: {
    top: -80,
    right: -40,
    backgroundColor: psychBrand.primary,
  },
  orbBlue: {
    bottom: 40,
    left: -100,
    backgroundColor: psychBrand.secondary,
  },
});
