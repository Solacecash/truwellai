import React, { useCallback } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withSpring,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/theme/ThemeContext';

interface Props {
  value: number;
  onChange?: (rating: number) => void;
  size?: number;
  readonly?: boolean;
}

function Star({
  filled,
  size,
  color,
  emptyColor,
  onPress,
}: {
  filled: boolean;
  size: number;
  color: string;
  emptyColor: string;
  onPress?: () => void;
}) {
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = () => {
    scale.value = withSequence(
      withSpring(1.25, { damping: 8, stiffness: 300 }),
      withSpring(1.0, { damping: 10, stiffness: 300 })
    );
    Haptics.selectionAsync();
    onPress?.();
  };

  const starPath =
    'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z';

  const content = (
    <Animated.View style={animStyle}>
      <Svg width={size} height={size} viewBox="0 0 24 24">
        <Path
          d={starPath}
          fill={filled ? color : 'none'}
          stroke={filled ? color : emptyColor}
          strokeWidth={1.5}
          strokeLinejoin="round"
        />
      </Svg>
    </Animated.View>
  );

  if (!onPress) return content;

  return (
    <TouchableOpacity onPress={handlePress} activeOpacity={0.8}>
      {content}
    </TouchableOpacity>
  );
}

export function StarRating({ value, onChange, size = 36, readonly = false }: Props) {
  const { theme } = useTheme();

  const handleStar = useCallback(
    (index: number) => {
      onChange?.(index + 1);
    },
    [onChange]
  );

  return (
    <View style={styles.row}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          filled={i < value}
          size={size}
          color={theme.gold}
          emptyColor={theme.border}
          onPress={readonly ? undefined : () => handleStar(i)}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 4,
    alignItems: 'center',
  },
});
