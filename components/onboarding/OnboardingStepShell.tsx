import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from 'react-native';
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { OB_COLORS, OB_FONTS } from '@/lib/_obShared';

export function OnboardingProgressBar({ percent }: { percent: number }) {
  const width = useSharedValue(0);

  useEffect(() => {
    width.value = withSpring(percent, { damping: 14, stiffness: 100 });
  }, [percent, width]);

  const fillStyle = useAnimatedStyle(() => ({ width: `${width.value}%` }));

  return (
    <View style={shellStyles.progressTrack}>
      <Animated.View style={[shellStyles.progressFill, fillStyle]} />
    </View>
  );
}

export function SelectChip({
  label,
  selected,
  onPress,
  icon,
  index = 0,
  style,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  icon?: string;
  index?: number;
  style?: ViewStyle;
}) {
  return (
    <Animated.View
      entering={FadeInDown.delay(index * 40).springify()}
      style={style}
    >
      <Pressable
        onPress={onPress}
        style={[
          shellStyles.chip,
          selected ? shellStyles.chipSelected : shellStyles.chipUnselected,
        ]}
      >
        {icon ? <Text style={shellStyles.chipIcon}>{icon}</Text> : null}
        <Text style={[shellStyles.chipLabel, selected && shellStyles.chipLabelSelected]}>
          {label}
        </Text>
        {selected ? <Text style={shellStyles.chipCheck}>✓</Text> : null}
      </Pressable>
    </Animated.View>
  );
}

type ShellProps = {
  progress: number;
  onBack?: () => void;
  showBack?: boolean;
  eyebrow?: string;
  title: React.ReactNode;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  scroll?: boolean;
  contentStyle?: ViewStyle;
};

export function OnboardingStepShell({
  progress,
  onBack,
  showBack = true,
  eyebrow,
  title,
  subtitle,
  children,
  footer,
  scroll = true,
  contentStyle,
}: ShellProps) {
  const body = (
    <>
      {eyebrow ? <Text style={shellStyles.eyebrow}>{eyebrow}</Text> : null}
      <Animated.View entering={FadeInDown.delay(80).springify()}>{title}</Animated.View>
      {subtitle ? (
        <Animated.Text entering={FadeInDown.delay(120).springify()} style={shellStyles.body}>
          {subtitle}
        </Animated.Text>
      ) : null}
      {children}
    </>
  );

  return (
    <SafeAreaView style={shellStyles.safe} edges={['top', 'bottom']}>
      <View style={shellStyles.headerRow}>
        {showBack && onBack ? (
          <Pressable onPress={onBack} style={shellStyles.backBtn} accessibilityRole="button">
            <Text style={shellStyles.backIcon}>{'\u2039'}</Text>
          </Pressable>
        ) : (
          <View style={shellStyles.backSpacer} />
        )}
        <View style={shellStyles.progressWrap}>
          <OnboardingProgressBar percent={progress} />
        </View>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 24}
      >
        {scroll ? (
          <ScrollView
            contentContainerStyle={[shellStyles.scroll, contentStyle]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
          >
            {body}
          </ScrollView>
        ) : (
          <View style={[shellStyles.scroll, contentStyle]}>{body}</View>
        )}
      </KeyboardAvoidingView>

      {footer}
    </SafeAreaView>
  );
}

export function OnboardingCta({
  label,
  onPress,
  disabled = false,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable onPress={onPress} disabled={disabled} accessibilityRole="button">
      <LinearGradient
        colors={[OB_COLORS.gold, OB_COLORS.goldLight]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[shellStyles.cta, disabled && shellStyles.ctaDisabled]}
      >
        <Text style={shellStyles.ctaText}>{label}</Text>
      </LinearGradient>
    </Pressable>
  );
}

export function OnboardingFooter({ children }: { children: React.ReactNode }) {
  return <View style={shellStyles.footer}>{children}</View>;
}

export function OnboardingTitle({ children }: { children: React.ReactNode }) {
  return <Text style={shellStyles.headline}>{children}</Text>;
}

export function OnboardingTitleGold({ children }: { children: React.ReactNode }) {
  return <Text style={shellStyles.headlineGold}>{children}</Text>;
}

const shellStyles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#020A14' },
  headerRow: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  backSpacer: { width: 40 },
  backIcon: { color: OB_COLORS.white70, fontSize: 28, lineHeight: 32 },
  progressWrap: { flex: 1 },
  progressTrack: {
    height: 3,
    backgroundColor: OB_COLORS.white12,
    borderRadius: 100,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 100,
    backgroundColor: OB_COLORS.gold,
  },
  scroll: { paddingHorizontal: 24, paddingBottom: 160, paddingTop: 8 },
  eyebrow: {
    fontFamily: OB_FONTS.semiBold,
    fontSize: 10,
    letterSpacing: 2,
    color: '#7A5F20',
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  headline: {
    fontFamily: OB_FONTS.bold,
    fontWeight: '700',
    fontSize: 30,
    lineHeight: 38,
    color: OB_COLORS.white,
    marginBottom: 8,
  },
  headlineGold: {
    fontFamily: OB_FONTS.bold,
    fontWeight: '700',
    fontSize: 30,
    lineHeight: 38,
    color: OB_COLORS.gold,
    marginBottom: 8,
  },
  body: {
    fontFamily: OB_FONTS.body,
    fontSize: 14,
    lineHeight: 22,
    color: OB_COLORS.white70,
    marginBottom: 24,
  },
  chip: {
    minHeight: 52,
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  chipSelected: {
    backgroundColor: 'rgba(201,168,76,0.14)',
    borderColor: OB_COLORS.gold,
  },
  chipUnselected: {
    backgroundColor: OB_COLORS.white07,
    borderColor: OB_COLORS.white12,
  },
  chipIcon: { fontSize: 18 },
  chipLabel: {
    flex: 1,
    fontFamily: OB_FONTS.body,
    fontSize: 14,
    color: OB_COLORS.white70,
  },
  chipLabelSelected: { color: OB_COLORS.gold, fontFamily: OB_FONTS.semiBold },
  chipCheck: { color: OB_COLORS.gold, fontSize: 14, fontWeight: '900' },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 24,
    backgroundColor: '#020A14',
    zIndex: 10,
  },
  cta: {
    height: 56,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaDisabled: { opacity: 0.4 },
  ctaText: {
    fontFamily: OB_FONTS.bold,
    fontWeight: '700',
    fontSize: 16,
    color: OB_COLORS.navy,
  },
});
