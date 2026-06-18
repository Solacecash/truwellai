import React, { memo, useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

type Props = {
  size: number;
  color: string;
  /** Legacy: delay in seconds before pulse starts. */
  delay?: number;
  /** Preferred: delay in milliseconds. Overrides `delay` when set. */
  delayMs?: number;
  durationMs?: number;
  scaleStart?: number;
  scaleEnd?: number;
  opacityStart?: number;
  opacityEnd?: number;
};

function PulseRingInner({
  size,
  color,
  delay = 0,
  delayMs,
  durationMs = 3000,
  scaleStart = 0.85,
  scaleEnd = 1.35,
  opacityStart = 0.8,
  opacityEnd = 0,
}: Props) {
  const scale = useSharedValue(scaleStart);
  const opacity = useSharedValue(opacityStart);

  const startAfter = delayMs !== undefined ? delayMs : delay * 1000;

  useEffect(() => {
    const start = setTimeout(() => {
      const ease = Easing.out(Easing.quad);
      scale.value = withRepeat(
        withSequence(
          withTiming(scaleEnd, { duration: durationMs, easing: ease }),
          withTiming(scaleStart, { duration: 1 })
        ),
        -1,
        false
      );
      opacity.value = withRepeat(
        withSequence(
          withTiming(opacityEnd, { duration: durationMs, easing: ease }),
          withTiming(opacityStart, { duration: 1 })
        ),
        -1,
        false
      );
    }, startAfter);
    return () => clearTimeout(start);
  }, [
    delay,
    delayMs,
    durationMs,
    opacity,
    opacityEnd,
    opacityStart,
    scale,
    scaleEnd,
    scaleStart,
    startAfter,
  ]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const half = size / 2;

  return (
    <Animated.View
      style={[
        styles.ring,
        {
          width: size,
          height: size,
          borderRadius: half,
          borderWidth: 1.5,
          borderColor: color,
          marginTop: -half,
          marginLeft: -half,
        },
        animatedStyle,
      ]}
      pointerEvents="none"
    />
  );
}

export const PulseRing = memo(PulseRingInner);

const styles = StyleSheet.create({
  ring: {
    position: 'absolute',
    top: '55%',
    left: '50%',
  },
});
