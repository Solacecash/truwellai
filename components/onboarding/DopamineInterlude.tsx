import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { OB_COLORS, OB_FONTS } from '@/lib/_obShared';

export type DopamineInterludeProps = {
  name: string;
  message: string;
  emoji: string;
  onDone: () => void;
  duration?: number;
};

const PARTICLES = [
  { top: '18%', left: '12%', size: 6 },
  { top: '28%', left: '78%', size: 4 },
  { top: '62%', left: '22%', size: 5 },
  { top: '72%', left: '68%', size: 7 },
  { top: '44%', left: '48%', size: 4 },
] as const;

function PulsingDot({ delay }: { delay: number }) {
  const scale = useSharedValue(0.6);
  const opacity = useSharedValue(0.35);

  useEffect(() => {
    const t = setTimeout(() => {
      scale.value = withRepeat(
        withSequence(withTiming(1, { duration: 500 }), withTiming(0.6, { duration: 500 })),
        -1,
        false
      );
      opacity.value = withRepeat(
        withSequence(withTiming(1, { duration: 500 }), withTiming(0.35, { duration: 500 })),
        -1,
        false
      );
    }, delay);
    return () => clearTimeout(t);
  }, [delay, opacity, scale]);

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return <Animated.View style={[styles.dot, style]} />;
}

export function DopamineInterlude({
  name,
  message,
  emoji,
  onDone,
  duration = 2800,
}: DopamineInterludeProps) {
  const phase = useSharedValue(0);
  const emojiScale = useSharedValue(0.3);
  const emojiOpacity = useSharedValue(0);
  const nameOpacity = useSharedValue(0);
  const nameY = useSharedValue(16);
  const msgOpacity = useSharedValue(0);
  const msgY = useSharedValue(12);

  useEffect(() => {
    const t1 = setTimeout(() => {
      phase.value = 1;
      emojiOpacity.value = withTiming(1, { duration: 280 });
      emojiScale.value = withSpring(1, { damping: 8, stiffness: 140 });
    }, 200);

    const t2 = setTimeout(() => {
      phase.value = 2;
      nameOpacity.value = withTiming(1, { duration: 400 });
      nameY.value = withSpring(0, { damping: 14, stiffness: 120 });
    }, 900);

    const t3 = setTimeout(() => {
      phase.value = 3;
      msgOpacity.value = withTiming(1, { duration: 400 });
      msgY.value = withSpring(0, { damping: 14, stiffness: 120 });
    }, 1600);

    const done = setTimeout(() => onDone(), duration);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(done);
    };
  }, [duration, emojiOpacity, emojiScale, message, msgOpacity, msgY, name, nameOpacity, nameY, onDone, phase]);

  const emojiStyle = useAnimatedStyle(() => ({
    opacity: emojiOpacity.value,
    transform: [{ scale: emojiScale.value }],
  }));

  const nameStyle = useAnimatedStyle(() => ({
    opacity: nameOpacity.value,
    transform: [{ translateY: nameY.value }],
  }));

  const msgStyle = useAnimatedStyle(() => ({
    opacity: msgOpacity.value,
    transform: [{ translateY: msgY.value }],
  }));

  return (
    <View style={styles.overlay}>
      {PARTICLES.map((p, i) => (
        <View
          key={i}
          style={[
            styles.particle,
            {
              top: p.top as `${number}%`,
              left: p.left as `${number}%`,
              width: p.size,
              height: p.size,
            },
          ]}
        />
      ))}

      <Animated.Text style={[styles.emoji, emojiStyle]}>{emoji}</Animated.Text>

      {name.trim().length > 0 ? (
        <Animated.Text style={[styles.name, nameStyle]}>{name}</Animated.Text>
      ) : null}

      <Animated.Text style={[styles.message, msgStyle]}>{message}</Animated.Text>

      <View style={styles.dotsRow}>
        <PulsingDot delay={0} />
        <PulsingDot delay={200} />
        <PulsingDot delay={400} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 100,
    backgroundColor: '#020A14',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  particle: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: 'rgba(201,168,76,0.35)',
  },
  emoji: { fontSize: 56, marginBottom: 20 },
  name: {
    fontFamily: OB_FONTS.bold,
    fontWeight: '700',
    fontSize: 32,
    color: OB_COLORS.gold,
    textAlign: 'center',
    marginBottom: 12,
  },
  message: {
    fontFamily: OB_FONTS.body,
    fontSize: 16,
    lineHeight: 24,
    color: OB_COLORS.white70,
    textAlign: 'center',
    maxWidth: 300,
  },
  dotsRow: {
    position: 'absolute',
    bottom: 48,
    flexDirection: 'row',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: OB_COLORS.gold,
  },
});
