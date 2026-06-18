import React, { forwardRef, useCallback, useImperativeHandle, useState } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { OB } from '../tokens';

const COLORS = [
  OB.gold,
  OB.goldLight,
  OB.teal,
  OB.green,
  OB.goldDark,
  OB.sky,
  OB.red,
  '#fff',
];

export type BurstEffectRef = {
  burst: (originX: number, originY: number) => void;
  megaBurst: () => void;
};

type Particle = {
  id: string;
  ox: number;
  oy: number;
  dx: number;
  dy: number;
  size: number;
  color: string;
  duration: number;
  delay: number;
};

function randomBetween(a: number, b: number): number {
  return a + Math.random() * (b - a);
}

let idSeq = 0;

export const BurstEffect = forwardRef<BurstEffectRef, object>(function BurstEffect(
  _props,
  ref
) {
  const [particles, setParticles] = useState<Particle[]>([]);

  const prune = useCallback((id: string) => {
    setParticles((p) => p.filter((x) => x.id !== id));
  }, []);

  const burst = useCallback((originX: number, originY: number) => {
    const next: Particle[] = [];
    for (let i = 0; i < 18; i += 1) {
      idSeq += 1;
      const angle = (Math.PI * 2 * i) / 18 + randomBetween(-0.2, 0.2);
      const dist = randomBetween(70, 125);
      next.push({
        id: `b-${idSeq}-${i}`,
        ox: originX,
        oy: originY,
        dx: Math.cos(angle) * dist,
        dy: Math.sin(angle) * dist,
        size: randomBetween(3, 9),
        color: COLORS[Math.floor(Math.random() * COLORS.length)] ?? OB.gold,
        duration: randomBetween(900, 1700),
        delay: randomBetween(0, 140),
      });
    }
    setParticles((p) => [...p, ...next]);
  }, []);

  const megaBurst = useCallback(() => {
    const { width, height } = Dimensions.get('window');
    const ox = width / 2;
    const oy = height * 0.2;
    const next: Particle[] = [];
    for (let i = 0; i < 44; i += 1) {
      idSeq += 1;
      const angle = randomBetween(0, Math.PI * 2);
      const dist = randomBetween(90, 290);
      next.push({
        id: `m-${idSeq}-${i}`,
        ox,
        oy,
        dx: Math.cos(angle) * dist,
        dy: Math.sin(angle) * dist,
        size: randomBetween(3, 9),
        color: COLORS[Math.floor(Math.random() * COLORS.length)] ?? OB.gold,
        duration: randomBetween(1000, 1700),
        delay: randomBetween(0, 140),
      });
    }
    setParticles((p) => [...p, ...next]);
  }, []);

  useImperativeHandle(ref, () => ({ burst, megaBurst }), [burst, megaBurst]);

  return (
    <View style={styles.layer} pointerEvents="none">
      {particles.map((p) => (
        <BurstParticle key={p.id} p={p} onEnd={prune} />
      ))}
    </View>
  );
});

function BurstParticle({
  p,
  onEnd,
}: {
  p: Particle;
  onEnd: (id: string) => void;
}) {
  const progress = useSharedValue(0);

  React.useEffect(() => {
    const t = setTimeout(() => {
      progress.value = withTiming(
        1,
        {
          duration: p.duration,
          easing: Easing.bezier(0.4, 0, 0.2, 1),
        },
        (finished) => {
          if (finished) runOnJS(onEnd)(p.id);
        }
      );
    }, p.delay);
    return () => clearTimeout(t);
  }, [onEnd, p.delay, p.duration, p.id, progress]);

  const style = useAnimatedStyle(() => ({
    opacity: 1 - progress.value,
    transform: [
      { translateX: p.dx * progress.value },
      { translateY: p.dy * progress.value },
      { scale: 1 - progress.value * 0.9 },
    ],
  }));

  const half = p.size / 2;

  return (
    <Animated.View
      style={[
        styles.particle,
        {
          width: p.size,
          height: p.size,
          borderRadius: half,
          backgroundColor: p.color,
          left: p.ox - half,
          top: p.oy - half,
        },
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  layer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 500,
  },
  particle: {
    position: 'absolute',
  },
});
