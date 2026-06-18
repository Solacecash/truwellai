import React, { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withSpring,
} from 'react-native-reanimated';
import { useTheme } from '@/theme/ThemeContext';

interface Props {
  value: number;
  count?: number;
  color: string;
  height?: number;
  gap?: number;
  animated?: boolean;
  style?: ViewStyle;
}

export interface SegmentedIndicatorRef {
  triggerAnimation: () => void;
}

interface SegmentProps {
  filled: boolean;
  color: string;
  emptyColor: string;
  height: number;
  animated: boolean;
  index: number;
  triggerRef: React.MutableRefObject<(() => void) | null>;
}

function Segment({ filled, color, emptyColor, height, animated, index, triggerRef }: SegmentProps) {
  const scaleX = useSharedValue(animated ? 0 : 1);

  const runAnimation = () => {
    scaleX.value = 0;
    scaleX.value = withDelay(
      index * 40,
      withSpring(1, { damping: 14, stiffness: 200 })
    );
  };

  useEffect(() => {
    if (animated) runAnimation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    triggerRef.current = runAnimation;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scaleX: scaleX.value }],
  }));

  return (
    <Animated.View
      style={[
        {
          flex: 1,
          height,
          borderRadius: 3,
          backgroundColor: filled ? color : emptyColor,
        },
        animated && animStyle,
      ]}
    />
  );
}

export const SegmentedIndicator = forwardRef<SegmentedIndicatorRef, Props>(
  ({ value, count = 10, color, height = 5, gap = 2, animated = true, style }, ref) => {
    const { theme } = useTheme();
    const filledCount = Math.round((value / 100) * count);
    const triggerRefs = useRef<Array<React.MutableRefObject<(() => void) | null>>>(
      Array.from({ length: count }, () => ({ current: null }))
    );

    useImperativeHandle(ref, () => ({
      triggerAnimation: () => {
        triggerRefs.current.forEach((r) => r.current?.());
      },
    }));

    return (
      <View style={[styles.row, { gap }, style]}>
        {Array.from({ length: count }).map((_, i) => (
          <Segment
            key={i}
            filled={i < filledCount}
            color={color}
            emptyColor={theme.bg3}
            height={height}
            animated={animated}
            index={i}
            triggerRef={triggerRefs.current[i]}
          />
        ))}
      </View>
    );
  }
);

SegmentedIndicator.displayName = 'SegmentedIndicator';

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
