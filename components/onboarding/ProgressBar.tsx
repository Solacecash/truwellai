import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { OB, onboardingSpacing } from '@/constants/onboardingTheme';

export interface ProgressBarProps {
  percent: number;
  variant: 'teal' | 'blue';
  eta?: string;
}

/**
 * Spec ProgressBar — TruWell_AI_Onboarding_Cursor_Prompt.md lines 505–539.
 */
export function ProgressBar({ percent, variant, eta }: ProgressBarProps) {
  const width = useSharedValue(0);

  useEffect(() => {
    width.value = withSpring(percent, { damping: 14, stiffness: 100 });
  }, [percent, width]);

  const animStyle = useAnimatedStyle(() => ({
    width: `${width.value}%`,
  }));

  const color = variant === 'teal' ? OB.teal : OB.cyan;

  return (
    <View style={styles.wrap}>
      <View style={styles.track}>
        <Animated.View style={[styles.fill, { backgroundColor: color }, animStyle]} />
      </View>
      {eta ? <Text style={styles.eta}>{eta}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: onboardingSpacing.horizontal,
  },
  track: {
    height: 3,
    backgroundColor: OB.w12,
    borderRadius: 100,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 100,
  },
  eta: {
    marginTop: 6,
    color: OB.w40,
    fontSize: 11,
    fontWeight: '600',
    fontFamily: OB.fontBody,
  },
});
