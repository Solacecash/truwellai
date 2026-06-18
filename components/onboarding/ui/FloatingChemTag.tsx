import React, { memo, useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { OB } from '../tokens';

type Props = {
  label: string;
  top?: string | number;
  bottom?: string | number;
  left?: string | number;
  right?: string | number;
  rotation?: number;
  /** Seconds before float loop starts (legacy). */
  delay?: number;
  /** Extra delay in ms before the float animation begins (stagger). */
  animationDelayMs?: number;
  variant?: 'default' | 'red';
  fontSize?: number;
};

function FloatingChemTagInner({
  label,
  top,
  bottom,
  left,
  right,
  rotation = 0,
  delay = 0,
  animationDelayMs = 0,
  variant = 'default',
  fontSize = 8.5,
}: Props) {
  const y = useSharedValue(0);

  useEffect(() => {
    const baseDelay = delay * 1000 + animationDelayMs;
    const t = setTimeout(() => {
      y.value = withRepeat(
        withSequence(
          withTiming(-9, { duration: 1500, easing: Easing.inOut(Easing.quad) }),
          withTiming(0, { duration: 1500, easing: Easing.inOut(Easing.quad) })
        ),
        -1,
        false
      );
    }, baseDelay);
    return () => clearTimeout(t);
  }, [animationDelayMs, delay, y]);

  const anim = useAnimatedStyle(() => ({
    transform: [{ translateY: y.value }, { rotate: `${rotation}deg` }],
  }));

  const borderColor =
    variant === 'red' ? 'rgba(255,71,87,0.3)' : OB.glassBorder;
  const textColor = variant === 'red' ? '#FF6B78' : OB.t70;

  const pos: Record<string, string | number | undefined> = {};
  if (top !== undefined) pos.top = top;
  if (bottom !== undefined) pos.bottom = bottom;
  if (left !== undefined) pos.left = left;
  if (right !== undefined) pos.right = right;

  return (
    <Animated.View
      style={[
        styles.tag,
        pos,
        {
          borderColor,
        },
        anim,
      ]}
      pointerEvents="none"
    >
      <Text style={[styles.text, { color: textColor, fontSize: Math.max(11, fontSize) }]}>
        {label}
      </Text>
    </Animated.View>
  );
}

export const FloatingChemTag = memo(FloatingChemTagInner);

const styles = StyleSheet.create({
  tag: {
    position: 'absolute',
    backgroundColor: 'rgba(8,20,34,0.7)',
    borderWidth: 1,
    borderRadius: OB.r99,
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
  text: {
    fontWeight: '600',
  },
});
