import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Line, G } from 'react-native-svg';
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

// Pin travels clockwise on a 200x200 track centered at (100,100), radius 78.
// 12 o'clock = 0deg (top). Inhale: 0→90deg, hold: 90, exhale: 90→180 or 270,
// hold2: destination.

function angleFor(phase: string, progress: number): number {
  // progress is 0..1 within the current phase
  const twoPi = Math.PI * 2;
  if (phase === 'inhale') {
    // from top (270deg) to right (0deg) clockwise → 270 → 360
    return ((270 + progress * 90) % 360) * (twoPi / 360);
  }
  if (phase === 'hold') {
    return (0) * (twoPi / 360); // 3 o'clock (right)
  }
  if (phase === 'exhale') {
    // right to bottom (90deg) or left (180deg); use 90deg for standard
    return (progress * 90) * (twoPi / 360);
  }
  if (phase === 'hold2') {
    return (90) * (twoPi / 360);
  }
  return (270) * (twoPi / 360);
}

export function PinVisual({
  phase,
  phaseDurationMs,
  size = 240,
}: VisualProps) {
  const pinProgress = useSharedValue(0);
  const phaseShared = useSharedValue<string>('idle');

  useEffect(() => {
    cancelAnimation(pinProgress);
    phaseShared.value = phase;
    pinProgress.value = 0;
    if (phase === 'inhale' || phase === 'exhale') {
      pinProgress.value = withTiming(1, {
        duration: phaseDurationMs,
        easing: Easing.linear,
      });
    } else {
      pinProgress.value = withTiming(0, { duration: 200 });
    }
  }, [phase, phaseDurationMs, pinProgress, phaseShared]);

  const pinProps = useAnimatedProps(() => {
    const a = angleFor(phaseShared.value, pinProgress.value);
    const cx = 100 + Math.cos(a) * 78;
    const cy = 100 + Math.sin(a) * 78;
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
      <Svg width={size} height={size} viewBox="0 0 200 200">
        <Circle
          cx="100"
          cy="100"
          r="78"
          stroke="rgba(255,255,255,0.18)"
          strokeWidth={2}
          fill="transparent"
        />
        {/* Tick marks at 12/3/6/9 */}
        <G>
          <Line x1="100" y1="18" x2="100" y2="28" stroke="#C9A84C" strokeWidth={2} />
          <Line x1="172" y1="100" x2="182" y2="100" stroke="#C9A84C" strokeWidth={2} />
          <Line x1="100" y1="172" x2="100" y2="182" stroke="#C9A84C" strokeWidth={2} />
          <Line x1="18" y1="100" x2="28" y2="100" stroke="#C9A84C" strokeWidth={2} />
        </G>
        <AnimatedCircle r={9} animatedProps={pinProps} />
      </Svg>

      {/* Label rings positioned around the SVG */}
      <Text style={[styles.label, styles.labelTop]}>INHALE</Text>
      <Text style={[styles.label, styles.labelRight]}>HOLD</Text>
      <Text style={[styles.label, styles.labelBottom]}>EXHALE</Text>
      <Text style={[styles.label, styles.labelLeft]}>HOLD</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  label: {
    position: 'absolute',
    color: 'rgba(255,255,255,0.55)',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 2,
  },
  labelTop: { top: 0, alignSelf: 'center' },
  labelRight: { right: 0, top: '48%' },
  labelBottom: { bottom: 0, alignSelf: 'center' },
  labelLeft: { left: 0, top: '48%' },
});
