import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Path, Circle, Ellipse } from 'react-native-svg';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import type { VisualProps } from './types';
import { PHASE_COLORS } from './types';

const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedEllipse = Animated.createAnimatedComponent(Ellipse);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

// Simplified lung silhouettes centered around (100, 120).
const LEFT_LUNG = 'M88 60 C 70 60, 52 80, 52 115 C 52 150, 62 175, 80 180 C 92 180, 96 160, 96 130 L 96 72 C 96 64, 92 60, 88 60 Z';
const RIGHT_LUNG = 'M112 60 C 130 60, 148 80, 148 115 C 148 150, 138 175, 120 180 C 108 180, 104 160, 104 130 L 104 72 C 104 64, 108 60, 112 60 Z';

interface Particle {
  angle: number;
  radius: number;
}

const PARTICLES: Particle[] = Array.from({ length: 8 }).map((_, i) => ({
  angle: (i / 8) * Math.PI * 2,
  radius: 90,
}));

export function LungsVisual({ phase, phaseDurationMs, size = 260 }: VisualProps) {
  const scale = useSharedValue(0.88);
  const color = useSharedValue(0); // 0 inhale, 1 hold, 2 exhale
  const particleMotion = useSharedValue(0);

  useEffect(() => {
    cancelAnimation(scale);
    cancelAnimation(particleMotion);

    if (phase === 'inhale') {
      scale.value = withTiming(1.0, {
        duration: phaseDurationMs,
        easing: Easing.bezier(0.4, 0, 0.2, 1),
      });
      color.value = withTiming(0, { duration: 400 });
      particleMotion.value = 0;
      particleMotion.value = withTiming(1, { duration: phaseDurationMs });
    } else if (phase === 'hold' || phase === 'hold2') {
      scale.value = withRepeat(
        withSequence(
          withTiming(1.02, { duration: 700, easing: Easing.inOut(Easing.sin) }),
          withTiming(1.0, { duration: 700, easing: Easing.inOut(Easing.sin) })
        ),
        -1,
        true
      );
      color.value = withTiming(1, { duration: 400 });
    } else if (phase === 'exhale') {
      scale.value = withTiming(0.85, {
        duration: phaseDurationMs,
        easing: Easing.bezier(0.4, 0, 0.2, 1),
      });
      color.value = withTiming(2, { duration: 400 });
      particleMotion.value = 1;
      particleMotion.value = withTiming(0, { duration: phaseDurationMs });
    } else {
      scale.value = withTiming(0.88, { duration: 400 });
    }
  }, [phase, phaseDurationMs, scale, color, particleMotion]);

  const lungProps = useAnimatedProps(() => {
    const c =
      color.value < 0.5
        ? PHASE_COLORS.inhale
        : color.value < 1.5
        ? PHASE_COLORS.hold
        : PHASE_COLORS.exhale;
    return { fill: c, opacity: 0.9 };
  });

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const glowProps = useAnimatedProps(() => {
    const c =
      color.value < 0.5
        ? PHASE_COLORS.inhale
        : color.value < 1.5
        ? PHASE_COLORS.hold
        : PHASE_COLORS.exhale;
    return { fill: c, opacity: 0.08 };
  });

  return (
    <View style={[styles.root, { width: size, height: size }]}>
      {/* Particles are rendered outside the scale container so they
          travel in and out independently of the lung expansion. */}
      <Svg width={size} height={size} viewBox="0 0 200 200" style={StyleSheet.absoluteFill}>
        {PARTICLES.map((p, i) => (
          <ParticleDot key={i} particle={p} motion={particleMotion} phase={phase} />
        ))}
      </Svg>
      <Animated.View style={[styles.svgWrap, containerStyle]}>
        <Svg width={size} height={size} viewBox="0 0 200 200">
          <AnimatedEllipse cx="100" cy="120" rx="80" ry="75" animatedProps={glowProps} />
          <AnimatedPath d={LEFT_LUNG} animatedProps={lungProps} />
          <AnimatedPath d={RIGHT_LUNG} animatedProps={lungProps} />
        </Svg>
      </Animated.View>
    </View>
  );
}

function ParticleDot({
  particle,
  motion,
  phase,
}: {
  particle: Particle;
  motion: SharedValue<number>;
  phase: string;
}) {
  const props = useAnimatedProps(() => {
    // motion: 0 = far, 1 = near center
    const r = particle.radius * (1 - motion.value * 0.7);
    const cx = 100 + Math.cos(particle.angle) * r;
    const cy = 100 + Math.sin(particle.angle) * r;
    const opacity =
      phase === 'inhale' || phase === 'exhale'
        ? 0.15 + motion.value * 0.4
        : 0.15;
    return { cx, cy, opacity };
  });
  return (
    <AnimatedCircle r={2.6} fill="#00E5C8" animatedProps={props} />
  );
}

const styles = StyleSheet.create({
  root: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  svgWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
