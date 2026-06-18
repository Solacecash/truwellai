import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import React, { memo, useCallback } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

import { OB } from '../tokens';

type Props = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  style?: ViewStyle;
  tall?: boolean;
  largeText?: boolean;
};

function CtaButtonInner({
  label,
  onPress,
  disabled = false,
  style,
  tall = false,
  largeText = false,
}: Props) {
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = useCallback(() => {
    if (disabled) return;
    scale.value = withTiming(0.97, { duration: 80 });
  }, [disabled, scale]);

  const handlePressOut = useCallback(() => {
    scale.value = withTiming(1, { duration: 220 });
  }, [scale]);

  const handlePress = useCallback(() => {
    if (disabled) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPress();
  }, [disabled, onPress]);

  const height = tall ? 62 : 56;
  const fontSize = largeText ? 17 : 16;

  return (
    <Animated.View style={[styles.outer, animStyle, style]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ disabled }}
        disabled={disabled}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handlePress}
        style={({ pressed }) => [
          styles.pressable,
          { opacity: disabled ? 0.4 : 1, height },
          pressed && !disabled ? styles.pressedShadow : null,
        ]}
      >
        <LinearGradient
          colors={[OB.goldLight, OB.gold, OB.goldDark]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          locations={[0, 0.4, 1]}
          style={[styles.gradient, { borderRadius: OB.r20 }]}
        >
          <View style={styles.row}>
            <Text
              style={[
                styles.label,
                { fontSize, letterSpacing: 0.15, color: OB.ink },
              ]}
              numberOfLines={1}
            >
              {label}
            </Text>
            <Svg width={18} height={18} viewBox="0 0 18 18">
              <Path
                d="M4 9h10M10 5l4 4-4 4"
                stroke={OB.ink}
                strokeWidth={2}
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          </View>
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
}

export const CtaButton = memo(CtaButtonInner);

const styles = StyleSheet.create({
  outer: {
    width: '100%',
    alignSelf: 'stretch',
  },
  pressable: {
    width: '100%',
    alignSelf: 'stretch',
    borderRadius: OB.r20,
    overflow: 'hidden',
    shadowColor: OB.gold,
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.45,
    shadowRadius: 20,
    elevation: 10,
  },
  pressedShadow: {
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  gradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 8,
  },
  label: {
    fontWeight: '800',
  },
});
