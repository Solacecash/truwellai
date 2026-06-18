import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
} from 'react-native-reanimated';
import { useTheme } from '@/theme/ThemeContext';

function Dot({ delay }: { delay: number }) {
  const { theme } = useTheme();
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    opacity.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 400 }),
          withTiming(0.3, { duration: 400 }),
        ),
        -1,
      ),
    );
  }, [delay, opacity]);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[styles.dot, { backgroundColor: theme.teal }, animStyle]}
    />
  );
}

export function TypingIndicator() {
  return (
    <View style={styles.row}>
      <Dot delay={0} />
      <Dot delay={200} />
      <Dot delay={400} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 6, paddingVertical: 8, paddingHorizontal: 4 },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
