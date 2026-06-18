import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';
import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

type Props = {
  goalMl: number;
  currentMl: number;
};

export function WaterBottle({ goalMl, currentMl }: Props) {
  const fill = useSharedValue(0);
  const ratio = goalMl > 0 ? Math.min(1, currentMl / goalMl) : 0;

  useEffect(() => {
    fill.value = withTiming(ratio, { duration: 450, easing: Easing.out(Easing.cubic) });
  }, [ratio, fill]);

  const bottleHeight = 180;
  const liquidStyle = useAnimatedStyle(() => ({
    height: fill.value * bottleHeight,
  }));

  const glow = ratio;
  return (
    <View style={styles.wrap}>
      <View
        style={[
          styles.bottleOuter,
          {
            shadowOpacity: 0.25 + glow * 0.55,
            shadowRadius: 10 + glow * 28,
            borderColor: `rgba(6, 182, 212, ${0.35 + glow * 0.45})`,
          },
        ]}
      >
        <View style={[styles.bottle, { height: bottleHeight }]}>
          <Animated.View style={[styles.liquid, liquidStyle]}>
            <View style={styles.shine} />
          </Animated.View>
        </View>
      </View>
      <Text style={[typography.caption, styles.label]}>
        {Math.round(currentMl)} / {goalMl} ml
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center' },
  bottleOuter: {
    borderRadius: 22,
    padding: 2,
    shadowColor: colors.tealGlow,
    shadowOffset: { width: 0, height: 0 },
    elevation: 8,
  },
  bottle: {
    width: 88,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'rgba(0, 229, 200, 0.2)',
    backgroundColor: colors.cardBg,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  liquid: {
    width: '100%',
    backgroundColor: colors.water,
    opacity: 0.9,
    shadowColor: colors.tealGlow,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
  },
  shine: {
    position: 'absolute',
    left: 8,
    top: 12,
    width: 8,
    height: '40%',
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.28)',
  },
  label: { marginTop: 10, color: colors.water },
});
