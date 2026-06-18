import { colors } from '@/theme/colors';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

type Props = { size?: number };

/** Teal orbit stroke — brand loader motif */
export function OrbitLoader({ size = 28 }: Props) {
  const rot = useSharedValue(0);
  useEffect(() => {
    rot.value = withRepeat(withTiming(360, { duration: 900, easing: Easing.linear }), -1, false);
  }, [rot]);

  const spin = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rot.value}deg` }],
  }));

  const r = size / 2;
  return (
    <Animated.View style={[styles.wrap, { width: size, height: size }, spin]}>
      <View
        style={[
          styles.arc,
          {
            width: size,
            height: size,
            borderRadius: r,
            borderTopColor: colors.tealGlow,
            borderRightColor: 'rgba(0, 229, 200, 0.35)',
          },
        ]}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center' },
  arc: {
    borderWidth: 2,
    borderColor: 'transparent',
    borderBottomColor: 'transparent',
    borderLeftColor: 'transparent',
  },
});
