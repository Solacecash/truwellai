import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import React, { memo } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, ViewStyle } from 'react-native';

import type { OnboardingPathVariant } from '@/theme/truwellBrand';
import { SHADOWS, TRUWELL_COLORS } from '@/theme/truwellBrand';

export type PrimaryButtonProps = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: OnboardingPathVariant | 'gold';
  style?: ViewStyle;
};

const GRADIENTS: Record<PrimaryButtonProps['variant'] & string, readonly [string, string]> = {
  guardian: TRUWELL_COLORS.gradientGuardian,
  professional: TRUWELL_COLORS.gradientProfessional,
  neutral: TRUWELL_COLORS.gradientPrimary,
  gold: TRUWELL_COLORS.gradientGold,
};

const SHADOW_KEYS: Record<PrimaryButtonProps['variant'] & string, ViewStyle> = {
  guardian: SHADOWS.guardianButton,
  professional: SHADOWS.button,
  neutral: SHADOWS.button,
  gold: {
    shadowColor: TRUWELL_COLORS.gold,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
};

function PrimaryButtonInner({
  label,
  onPress,
  disabled = false,
  loading = false,
  variant = 'guardian',
  style,
}: PrimaryButtonProps) {
  const dim = disabled || loading;
  const grad = GRADIENTS[variant] ?? GRADIENTS.guardian;
  const shadow = SHADOW_KEYS[variant] ?? SHADOW_KEYS.guardian;

  return (
    <Pressable
      disabled={dim}
      onPress={() => {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        onPress();
      }}
      style={[styles.shell, shadow, dim && styles.dim, style]}
      accessibilityRole="button"
      accessibilityState={{ disabled: dim, busy: loading }}
    >
      <LinearGradient colors={[...grad]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.grad}>
        {loading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.label}>{label}</Text>
        )}
      </LinearGradient>
    </Pressable>
  );
}

export const PrimaryButton = memo(PrimaryButtonInner);

const styles = StyleSheet.create({
  shell: {
    width: '100%',
    borderRadius: 50,
    overflow: 'hidden',
  },
  dim: {
    opacity: 0.45,
  },
  grad: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
});
