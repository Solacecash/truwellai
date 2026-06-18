import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedProps,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import type { VisualProps } from './types';
import { PHASE_COLORS } from './types';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const RADIUS = 90;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/** Circular progress ring used for coherent breathing. */
export function RingVisual({
  phase,
  phaseDurationMs,
  size = 240,
}: VisualProps) {
  const progress = useSharedValue(0);
  const phaseShared = useSharedValue<string>('idle');

  useEffect(() => {
    cancelAnimation(progress);
    phaseShared.value = phase;
    progress.value = 0;
    if (phase === 'inhale' || phase === 'exhale') {
      progress.value = withTiming(1, {
        duration: phaseDurationMs,
        easing: Easing.linear,
      });
    } else {
      progress.value = withTiming(1, { duration: 200 });
    }
  }, [phase, phaseDurationMs, progress, phaseShared]);

  const ringProps = useAnimatedProps(() => {
    const dash = CIRCUMFERENCE * (1 - progress.value);
    const color =
      phaseShared.value === 'inhale'
        ? PHASE_COLORS.inhale
        : phaseShared.value === 'exhale'
        ? PHASE_COLORS.exhale
        : PHASE_COLORS.hold;
    return {
      strokeDashoffset: dash,
      stroke: color,
    };
  });

  const pinProps = useAnimatedProps(() => {
    // Place a traveling pin on the ring
    const angle = (-Math.PI / 2) + progress.value * Math.PI * 2;
    const cx = 110 + Math.cos(angle) * RADIUS;
    const cy = 110 + Math.sin(angle) * RADIUS;
    const color =
      phaseShared.value === 'inhale'
        ? PHASE_COLORS.inhale
        : phaseShared.value === 'exhale'
        ? PHASE_COLORS.exhale
        : PHASE_COLORS.hold;
    return { cx, cy, fill: color };
  });

  return (
    <View style={[styles.root, { width: size, height: size }]}>
      <Svg width={size} height={size} viewBox="0 0 220 220">
        <Circle
          cx="110"
          cy="110"
          r={RADIUS}
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={6}
          fill="transparent"
        />
        <AnimatedCircle
          cx="110"
          cy="110"
          r={RADIUS}
          strokeWidth={6}
          strokeLinecap="round"
          fill="transparent"
          strokeDasharray={CIRCUMFERENCE}
          animatedProps={ringProps}
          rotation={-90}
          origin="110, 110"
        />
        <AnimatedCircle r={8} animatedProps={pinProps} />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
