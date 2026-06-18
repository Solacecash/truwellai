import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { OB } from '@/components/onboarding/tokens';

const AnimatedView = Animated.createAnimatedComponent(View);

type PulseRingsProps = {
  size: number;
  color?: string;
};

/**
 * Spec ai-processing background pulse rings — scale + opacity withRepeat (line 305).
 */
export function PulseRings({ size, color = OB.teal }: PulseRingsProps) {
  const rings = [1, 1.18, 1.36];

  return (
    <View style={[styles.wrap, { width: size * 1.6, height: size * 1.6 }]}>
      {rings.map((scaleBase, index) => (
        <PulseRing key={index} size={size} scaleBase={scaleBase} color={color} delayMs={index * 400} />
      ))}
    </View>
  );
}

function PulseRing({
  size,
  scaleBase,
  color,
  delayMs,
}: {
  size: number;
  scaleBase: number;
  color: string;
  delayMs: number;
}) {
  const scale = useSharedValue(scaleBase);
  const opacity = useSharedValue(0.35);

  useEffect(() => {
    const start = setTimeout(() => {
      scale.value = withRepeat(
        withSequence(
          withTiming(scaleBase * 1.08, { duration: 1400, easing: Easing.out(Easing.quad) }),
          withTiming(scaleBase, { duration: 1400, easing: Easing.in(Easing.quad) })
        ),
        -1,
        false
      );
      opacity.value = withRepeat(
        withSequence(
          withTiming(0.12, { duration: 1400 }),
          withTiming(0.35, { duration: 1400 })
        ),
        -1,
        false
      );
    }, delayMs);
    return () => clearTimeout(start);
  }, [delayMs, opacity, scale, scaleBase]);

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <AnimatedView
      style={[
        styles.ring,
        style,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          borderColor: color,
        },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    position: 'absolute',
    borderWidth: 1.5,
  },
});
