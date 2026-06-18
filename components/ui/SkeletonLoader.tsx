import React, { useEffect } from 'react';
import { ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  interpolateColor,
} from 'react-native-reanimated';
import { useTheme } from '@/theme/ThemeContext';

interface Props {
  width: number | string;
  height: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export function SkeletonLoader({ width, height, borderRadius = 8, style }: Props) {
  const { theme } = useTheme();
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withRepeat(withTiming(1, { duration: 1200 }), -1, true);
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      progress.value,
      [0, 1],
      [theme.bg2, theme.bg3]
    ),
  }));

  return (
    <Animated.View
      style={[
        { width: width as number, height, borderRadius },
        animStyle,
        style,
      ]}
    />
  );
}
