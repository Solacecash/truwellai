import React, { memo, useEffect } from 'react';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

type Props = {
  active: boolean;
  delayMs: number;
  children: React.ReactNode;
  style?: object;
};

function AnimateUpInner({ active, delayMs, children, style }: Props) {
  const ty = useSharedValue(26);
  const op = useSharedValue(0);

  useEffect(() => {
    if (active) {
      ty.value = withDelay(
        delayMs,
        withTiming(0, { duration: 550, easing: Easing.bezier(0.4, 0, 0.2, 1) })
      );
      op.value = withDelay(
        delayMs,
        withTiming(1, { duration: 550, easing: Easing.bezier(0.4, 0, 0.2, 1) })
      );
    } else {
      ty.value = 26;
      op.value = 0;
    }
  }, [active, delayMs, op, ty]);

  const st = useAnimatedStyle(() => ({
    opacity: op.value,
    transform: [{ translateY: ty.value }],
  }));

  return <Animated.View style={[st, style]}>{children}</Animated.View>;
}

export const AnimateUp = memo(AnimateUpInner);
