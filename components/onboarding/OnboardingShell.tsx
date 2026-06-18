/**
 * Rebuilt conversion onboarding shell — glassmorphism, dark-first, step-based nav.
 */

import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useMemo } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { CircuitTexture } from '@/components/onboarding/CircuitTexture';
import { ProgressBar } from '@/components/onboarding/ProgressBar';
import { OB, gradients } from '@/components/onboarding/tokens';
import {
  onboardingSkipEligible,
  useOnboardingBack,
  useOnboardingSkip,
} from '@/lib/useOnboardingNavigation';
import {
  progressBarPercentForStep,
  progressBarVariantForRole,
} from '@/lib/onboardingProgress';
import type { ConversionRole } from '@/lib/conversionOnboardingTypes';
import { onboardingSpacing } from '@/constants/onboardingTheme';

type ShellProps = {
  step: number;
  role?: ConversionRole | '';
  children: React.ReactNode;
  footer?: React.ReactNode;
  showBack?: boolean;
  showSkip?: boolean;
  scrollable?: boolean;
  keyboardAvoiding?: boolean;
  style?: ViewStyle;
};

type OnboardingPathVariant = 'guardian' | 'professional' | 'neutral';

export function OnboardingShell({
  step,
  role = '',
  children,
  footer,
  showBack = true,
  showSkip,
  scrollable = true,
  keyboardAvoiding = true,
  style,
}: ShellProps) {
  const insets = useSafeAreaInsets();
  const handleBack = useOnboardingBack(step);
  const defaultSkip = useOnboardingSkip();
  const skipVisible = showSkip ?? onboardingSkipEligible(step);
  const progressPercent = progressBarPercentForStep(step);
  const progressVariant = progressBarVariantForRole(role);

  const body = scrollable ? (
    <ScrollView
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      contentContainerStyle={[styles.scroll, footer ? styles.scrollFooter : null, style]}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.flex, style]}>{children}</View>
  );

  const wrapped = keyboardAvoiding ? (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}
    >
      {body}
    </KeyboardAvoidingView>
  ) : (
    body
  );

  return (
    <View style={styles.root}>
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        <LinearGradient colors={[OB.navy, OB.black, OB.navy]} style={StyleSheet.absoluteFill} />
        <CircuitTexture />
        <View style={[styles.glow, styles.glowCyan, { shadowColor: OB.teal }]} />
        <View style={[styles.glow, styles.glowBlue, { shadowColor: OB.cyan }]} />
      </View>

      <SafeAreaView style={styles.flex} edges={['top', 'left', 'right']}>
        <View style={[styles.header, { paddingTop: Math.max(insets.top > 0 ? 0 : 8, 4) }]}>
          <View style={styles.headerRow}>
            {showBack ? (
              <Pressable
                onPress={() => {
                  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  handleBack();
                }}
                style={styles.backBtn}
                accessibilityRole="button"
                accessibilityLabel="Go back"
              >
                <Text style={styles.backIcon}>‹</Text>
              </Pressable>
            ) : (
              <View style={styles.backBtn} />
            )}
            {skipVisible ? (
              <Pressable
                onPress={() => {
                  void Haptics.selectionAsync();
                  defaultSkip();
                }}
                style={styles.skipBtn}
              >
                <Text style={styles.skipText}>Skip</Text>
              </Pressable>
            ) : (
              <View style={styles.backBtn} />
            )}
          </View>

          {progressPercent != null ? (
            <ProgressBar
              percent={progressPercent}
              variant={progressVariant}
              eta={step === 3 || step === 4 ? `Step ${step - 2} of 7 · ${progressPercent}%` : `${progressPercent}% complete`}
            />
          ) : null}
        </View>

        <View style={styles.content}>{wrapped}</View>

        {footer ? (
          <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>{footer}</View>
        ) : null}
      </SafeAreaView>
    </View>
  );
}

export function OnboardingTitle({
  eyebrow,
  title,
  subtitle,
  delay = 0,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  delay?: number;
}) {
  return (
    <Animated.View entering={FadeInDown.delay(delay).springify()} style={styles.titleBlock}>
      {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </Animated.View>
  );
}

export function OnboardingPrimaryButton({
  label,
  onPress,
  disabled,
  variant = 'guardian',
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  variant?: OnboardingPathVariant;
}) {
  const colors =
    variant === 'professional'
      ? ([...gradients.blue] as [string, string])
      : variant === 'guardian'
        ? ([...gradients.teal] as [string, string])
        : ([...gradients.gold] as [string, string]);

  return (
    <Pressable
      disabled={disabled}
      pointerEvents={disabled ? 'none' : 'auto'}
      onPress={() => {
        if (disabled) return;
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        onPress();
      }}
      style={[styles.ctaWrap, disabled && styles.ctaDim]}
      accessibilityState={{ disabled: !!disabled }}
    >
      <LinearGradient colors={colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.ctaGrad}>
        <Text style={styles.ctaLabel}>{label}</Text>
      </LinearGradient>
    </Pressable>
  );
}

export function GlassCard({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return <View style={[styles.glassCard, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: OB.navy },
  flex: { flex: 1 },
  glow: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 9999,
    opacity: 0.22,
    shadowOpacity: 0.45,
    shadowRadius: 80,
    elevation: 0,
  },
  glowCyan: { top: -40, left: -60, backgroundColor: 'rgba(0,229,200,0.15)' },
  glowBlue: { top: 120, right: -80, backgroundColor: 'rgba(0,183,255,0.12)' },
  header: { paddingHorizontal: onboardingSpacing.horizontal, paddingBottom: 8 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: OB.glassBorder,
    backgroundColor: OB.glass1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: { color: OB.t100, fontSize: 22, fontWeight: '700', marginTop: -2 },
  skipBtn: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 50,
    borderWidth: 1,
    borderColor: OB.glassBorder,
    backgroundColor: OB.glass1,
  },
  skipText: { color: OB.t45, fontSize: 13, fontWeight: '600' },
  stepMeta: {
    marginTop: 6,
    textAlign: 'right',
    color: OB.t45,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.6,
  },
  content: { flex: 1, paddingHorizontal: onboardingSpacing.horizontal },
  scroll: { paddingBottom: onboardingSpacing.top, gap: 14 },
  scrollFooter: { paddingBottom: 16 },
  footer: {
    paddingHorizontal: onboardingSpacing.horizontal,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: OB.glassBorder,
    backgroundColor: 'rgba(10,22,40,0.92)',
  },
  titleBlock: { marginBottom: 8, gap: 8 },
  eyebrow: {
    color: OB.gold,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 2.2,
    textTransform: 'uppercase',
    fontFamily: OB.fontHead,
  },
  title: {
    color: OB.t100,
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -0.6,
    lineHeight: 34,
    fontFamily: OB.fontHead,
  },
  subtitle: {
    color: OB.t70,
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '500',
    fontFamily: OB.fontBody,
  },
  ctaWrap: { borderRadius: onboardingSpacing.ctaRadius, overflow: 'hidden' },
  ctaDim: { opacity: 0.4 },
  ctaGrad: {
    minHeight: onboardingSpacing.ctaHeight,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  ctaLabel: { color: '#FFFFFF', fontSize: 16, fontWeight: '800', fontFamily: OB.fontHead },
  glassCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: OB.glassBorder,
    backgroundColor: OB.glass1,
    padding: 16,
  },
});
