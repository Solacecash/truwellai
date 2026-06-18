import { useEffect, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

interface Props {
  count?: number;
  color?: string;
}

/** Ambient drifting dot field. Pure decoration. */
export function ParticleField({ count = 20, color = '#FFFFFF' }: Props) {
  const particles = useMemo(
    () =>
      Array.from({ length: count }).map(() => ({
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: 2 + Math.random() * 3,
        opacity: 0.03 + Math.random() * 0.05,
        duration: 8000 + Math.random() * 6000,
        delay: Math.random() * 4000,
        drift: (Math.random() - 0.5) * 40,
      })),
    [count]
  );
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {particles.map((p, i) => (
        <ParticleDot key={i} p={p} color={color} />
      ))}
    </View>
  );
}

function ParticleDot({
  p,
  color,
}: {
  p: {
    x: number;
    y: number;
    size: number;
    opacity: number;
    duration: number;
    delay: number;
    drift: number;
  };
  color: string;
}) {
  const t = useSharedValue(0);
  useEffect(() => {
    t.value = withDelay(
      p.delay,
      withRepeat(
        withTiming(1, { duration: p.duration, easing: Easing.inOut(Easing.sin) }),
        -1,
        true
      )
    );
  }, [p.delay, p.duration, t]);
  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: t.value * p.drift }],
    opacity: p.opacity * (0.6 + t.value * 0.4),
  }));
  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          left: `${p.x}%`,
          top: `${p.y}%`,
          width: p.size,
          height: p.size,
          borderRadius: p.size / 2,
          backgroundColor: color,
        },
        style,
      ]}
    />
  );
}
