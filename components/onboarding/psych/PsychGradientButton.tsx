import { LinearGradient } from 'expo-linear-gradient';
import React, { memo } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  type GestureResponderEvent,
} from 'react-native';

import { psychBrand } from '@/theme/colors';

type Props = {
  label: string;
  disabled?: boolean;
  loading?: boolean;
  onPress: (e: GestureResponderEvent) => void;
};

function PsychGradientButtonInner({
  label,
  disabled,
  loading,
  onPress,
}: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled || loading }}
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => [
        styles.outer,
        pressed && !disabled && styles.pressed,
        (disabled || loading) && styles.dim,
      ]}
    >
      <LinearGradient
        colors={[psychBrand.gradient[0], psychBrand.gradient[1]]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={styles.grad}
      >
        {loading ? (
          <ActivityIndicator color="#050F1A" />
        ) : (
          <Text style={styles.label}>{label}</Text>
        )}
      </LinearGradient>
    </Pressable>
  );
}

export const PsychGradientButton = memo(PsychGradientButtonInner);

const styles = StyleSheet.create({
  outer: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  grad: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 16,
    fontWeight: '800',
    color: '#050F1A',
    letterSpacing: -0.3,
  },
  pressed: { opacity: 0.92 },
  dim: { opacity: 0.45 },
});
