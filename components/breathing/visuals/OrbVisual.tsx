import { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import type { VisualProps } from './types';

/** Signature breathing orb. Scales, glows, and shifts color across the session. */
export function OrbVisual({
  phase,
  phaseDurationMs,
  cyclesCompleted,
  totalCycles,
  size = 240,
  onOrbPressIn,
  onOrbPressOut,
}: VisualProps) {
  const scale = useSharedValue(1);
  const glow = useSharedValue(0.55);
  const touched = useSharedValue(0);
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(
      Math.min(1, cyclesCompleted / Math.max(1, totalCycles)),
      { duration: 600 }
    );
  }, [cyclesCompleted, totalCycles, progress]);

  useEffect(() => {
    cancelAnimation(scale);
    cancelAnimation(glow);
    if (phase === 'inhale') {
      scale.value = withTiming(1.4, {
        duration: phaseDurationMs,
        easing: Easing.bezier(0.4, 0, 0.2, 1),
      });
      glow.value = withTiming(1, { duration: phaseDurationMs });
    } else if (phase === 'hold' || phase === 'hold2') {
      scale.value = withRepeat(
        withSequence(
          withTiming(1.42, { duration: 800, easing: Easing.inOut(Easing.quad) }),
          withTiming(1.4, { duration: 800, easing: Easing.inOut(Easing.quad) })
        ),
        -1,
        true
      );
      glow.value = withTiming(0.85, { duration: 400 });
    } else if (phase === 'exhale') {
      scale.value = withTiming(1.0, {
        duration: phaseDurationMs,
        easing: Easing.bezier(0.4, 0, 0.2, 1),
      });
      glow.value = withTiming(0.5, { duration: phaseDurationMs });
    } else {
      scale.value = withTiming(1.0, { duration: 400 });
      glow.value = withTiming(0.55, { duration: 400 });
    }
  }, [phase, phaseDurationMs, scale, glow]);

  const innerStyle = useAnimatedStyle(() => {
    const baseColor = interpolateColor(
      progress.value,
      [0, 0.5, 1],
      ['rgba(255,71,87,0.85)', '#00E5C8', '#2ED573']
    );
    return {
      transform: [{ scale: scale.value }],
      backgroundColor: baseColor,
      opacity: 0.9 + touched.value * 0.1,
    };
  });

  const middleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value * 1.18 }],
    opacity: 0.4 + glow.value * 0.3,
  }));

  const outerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value * 1.45 }],
    opacity: 0.12 + glow.value * 0.18,
  }));

  const handlePressIn = () => {
    touched.value = withTiming(1, { duration: 120 });
    onOrbPressIn?.();
  };
  const handlePressOut = () => {
    touched.value = withTiming(0, { duration: 180 });
    onOrbPressOut?.();
  };

  return (
    <View style={[styles.root, { width: size * 1.8, height: size * 1.8 }]}>
      <Animated.View
        pointerEvents="none"
        style={[
          styles.circle,
          { width: size, height: size, borderRadius: size / 2, backgroundColor: '#00E5C8' },
          outerStyle,
        ]}
      />
      <Animated.View
        pointerEvents="none"
        style={[
          styles.circle,
          {
            width: size * 0.85,
            height: size * 0.85,
            borderRadius: (size * 0.85) / 2,
            borderColor: 'rgba(255,255,255,0.25)',
            borderWidth: 1,
          },
          middleStyle,
        ]}
      />
      <Pressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={styles.pressable}
      >
        <Animated.View
          style={[
            styles.circle,
            {
              width: size * 0.7,
              height: size * 0.7,
              borderRadius: (size * 0.7) / 2,
            },
            innerStyle,
          ]}
        >
          <View style={[styles.highlight, { top: size * 0.12, left: size * 0.12 }]} />
        </Animated.View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  circle: {
    position: 'absolute',
    shadowColor: '#00E5C8',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 22,
    elevation: 12,
  },
  pressable: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  highlight: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.55)',
    position: 'absolute',
  },
});
