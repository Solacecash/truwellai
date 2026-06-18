/**
 * Conversion onboarding primitives (dual-path funnel).
 * Visual tokens sourced from `@/theme/colors` conversionOnboarding palettes.
 */

import MaskedView from '@react-native-masked-view/masked-view';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import React, { createContext, useContext, useMemo } from 'react';
import {
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useColorScheme,
  type ViewStyle,
} from 'react-native';
import Svg, {
  Circle,
  Defs,
  Path,
  Stop,
  RadialGradient as SvgRadialGradient,
} from 'react-native-svg';
import Slider from '@react-native-community/slider';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { SegmentedIndicator } from '@/components/ui/SegmentedIndicator';
import { OnboardingHeader } from '@/components/onboarding/OnboardingHeader';
import { PrimaryButton } from '@/components/onboarding/PrimaryButton';
import { SelectionCard } from '@/components/onboarding/SelectionCard';
import { TruwellAtmosphere } from '@/components/onboarding/TruwellAtmosphere';
import type { ConversionRole } from '@/lib/conversionOnboardingTypes';
import {
  onboardingSkipEligible,
  useOnboardingBack,
  useOnboardingSkip,
} from '@/lib/useOnboardingNavigation';
import {
  ONBOARD_TOTAL_SEGMENTS,
  segmentsFilledForConversionStep,
} from '@/lib/onboardingProgress';
import { conversionOnboarding, colors } from '@/theme/colors';
import {
  TRUWELL_COLORS,
  eyebrowColor,
  onboardingScreenColors,
  type OnboardingPathVariant,
} from '@/theme/truwellBrand';

export { ONBOARD_TOTAL_SEGMENTS, segmentsFilledForConversionStep };

const { width: screenWidth } = Dimensions.get('window');

export const SPRING_CONFIG = { damping: 18, stiffness: 250 };
export const SPRING_SOFT = { damping: 22, stiffness: 180 };
export const SPRING_BOUNCY = { damping: 12, stiffness: 300 };

export type OnboardingVisualRole = ConversionRole | '' | 'professional' | 'guardian';

type OBScreenPalette = ReturnType<typeof onboardingScreenColors>;

const OBScreenPaletteContext = createContext<OBScreenPalette | null>(null);

export function useOBScreenPalette(): OBScreenPalette {
  const ctx = useContext(OBScreenPaletteContext);
  if (!ctx) {
    return onboardingScreenColors(true);
  }
  return ctx;
}

export function roleGradient(role: string): readonly [string, string, string] {
  if (role === 'professional') return conversionOnboarding.professional;
  if (role === 'guardian') return conversionOnboarding.guardian;
  return conversionOnboarding.neutral;
}

function pathVariant(role: string): OnboardingPathVariant {
  if (role === 'professional') return 'professional';
  if (role === 'guardian') return 'guardian';
  return 'neutral';
}

function accentFor(role: string): string {
  if (role === 'professional') return conversionOnboarding.professional[0];
  if (role === 'guardian') return conversionOnboarding.guardian[0];
  return conversionOnboarding.neutral[2];
}

export function OBProgressBar({
  conversionFlowStep,
  role,
  style,
}: {
  conversionFlowStep: number;
  role: string;
  style?: ViewStyle;
}) {
  const filled = segmentsFilledForConversionStep(conversionFlowStep);
  const value = (filled / ONBOARD_TOTAL_SEGMENTS) * 100;
  return (
    <SegmentedIndicator value={value} count={ONBOARD_TOTAL_SEGMENTS} color={accentFor(role)} animated style={style} />
  );
}

export function OBBackBtn({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      onPress={() => {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
      hitSlop={12}
      style={styles.backRow}
    >
      <Text style={styles.backText}>‹ Back</Text>
    </Pressable>
  );
}

export function OBStepBadge({ conversionFlowStep }: { conversionFlowStep: number }) {
  if (conversionFlowStep <= 1) return null;
  const n = segmentsFilledForConversionStep(conversionFlowStep);
  return (
    <View style={styles.stepBadgeWrap}>
      <Text style={styles.stepBadge}>{`${n}/${ONBOARD_TOTAL_SEGMENTS}`}</Text>
    </View>
  );
}

export function OBScreen({
  children,
  conversionFlowStep,
  role,
  showBack = true,
  scrollable = true,
  translucent = false,
  hideAmbient = false,
  showSkip,
  onSkip,
  keyboardAvoiding = true,
  footer,
}: {
  children: React.ReactNode;
  conversionFlowStep: number;
  role: string;
  showBack?: boolean;
  scrollable?: boolean;
  translucent?: boolean;
  /** Omit built-in orbs overlay when outer screen renders its own world */
  hideAmbient?: boolean;
  showSkip?: boolean;
  onSkip?: () => void;
  keyboardAvoiding?: boolean;
  /** Fixed bottom CTA region (sits above keyboard on input screens). */
  footer?: React.ReactNode;
}) {
  const scheme = useColorScheme();
  const isDark = scheme !== 'light';
  const palette = useMemo(() => onboardingScreenColors(isDark), [isDark]);
  const variant = pathVariant(role);
  const handleBack = useOnboardingBack(conversionFlowStep);
  const defaultSkip = useOnboardingSkip();
  const skipVisible = showSkip ?? onboardingSkipEligible(conversionFlowStep);

  const scrollInner = scrollable ? (
    <ScrollView
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      contentContainerStyle={[styles.scrollContent, footer ? styles.scrollWithFooter : null]}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={styles.flexFill}>{children}</View>
  );

  const body = keyboardAvoiding ? (
    <KeyboardAvoidingView
      style={styles.flexFill}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}
    >
      {scrollInner}
    </KeyboardAvoidingView>
  ) : (
    scrollInner
  );

  const g = roleGradient(role);

  return (
    <OBScreenPaletteContext.Provider value={palette}>
      <View
        style={[
          styles.shellRoot,
          !translucent && { backgroundColor: palette.bg },
        ]}
      >
        {!hideAmbient ? <TruwellAtmosphere variant={variant} /> : null}
        {!hideAmbient ? (
          <View pointerEvents="none" style={[StyleSheet.absoluteFill, { opacity: role ? 0.18 : 0.06 }]}>
            <LinearGradient
              colors={[g[0], g[2], palette.bg]}
              locations={[0, 0.35, 1]}
              style={StyleSheet.absoluteFill}
            />
          </View>
        ) : null}
        <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
          {showBack ? (
            <OnboardingHeader
              conversionFlowStep={conversionFlowStep}
              onBack={handleBack}
              showSkip={skipVisible}
              onSkip={onSkip ?? defaultSkip}
              variant={variant}
              isDark={isDark}
            />
          ) : null}
          <View style={styles.shellBody}>{body}</View>
          {footer ? (
            <View
              style={[
                styles.footer,
                {
                  backgroundColor: palette.bg,
                  borderTopColor: palette.cardBorder,
                },
              ]}
            >
              {footer}
            </View>
          ) : null}
        </SafeAreaView>
      </View>
    </OBScreenPaletteContext.Provider>
  );
}

export function OBEyebrow({
  children,
  role = '',
}: {
  children: string;
  role?: string;
}) {
  const palette = useOBScreenPalette();
  const color = eyebrowColor(pathVariant(role), palette.isDark);
  return <Text style={[styles.eyebrow, { color }]}>{children}</Text>;
}

export function OBStepIntro({
  eyebrow,
  title,
  titleGradient,
  subtitle,
  role = '',
  centered,
}: {
  eyebrow?: string;
  title: string;
  titleGradient?: string;
  subtitle?: string;
  role?: string;
  centered?: boolean;
}) {
  return (
    <View style={styles.stepIntro}>
      {eyebrow ? <OBEyebrow role={role}>{eyebrow}</OBEyebrow> : null}
      <OBHeadline centered={centered}>{title}</OBHeadline>
      {titleGradient ? <OBHeadlineGradient role={role}>{titleGradient}</OBHeadlineGradient> : null}
      {subtitle ? <OBSub centered={centered}>{subtitle}</OBSub> : null}
    </View>
  );
}

export function OBSectionLabel({ children }: { children: string }) {
  const palette = useOBScreenPalette();
  return <Text style={[styles.sectionLabel, { color: palette.textPrimary }]}>{children}</Text>;
}

export function OBInsightCard({ children }: { children: string }) {
  const palette = useOBScreenPalette();
  return (
    <View style={[styles.insightCard, { backgroundColor: palette.cardBg, borderColor: palette.cardBorder }]}>
      <Text style={[styles.insightText, { color: palette.textPrimary }]}>{children}</Text>
    </View>
  );
}

export function OBRolePathCard({
  pathRole,
  selected,
  onPress,
  icon,
  tags,
  headline,
  body,
  features,
}: {
  pathRole: 'guardian' | 'professional';
  selected: boolean;
  onPress: () => void;
  icon: string;
  tags: string[];
  headline: string;
  body: string;
  features?: readonly string[];
}) {
  const palette = useOBScreenPalette();
  const accent =
    pathRole === 'professional' ? TRUWELL_COLORS.professional : TRUWELL_COLORS.guardian;
  const rgb = pathRole === 'professional' ? '0,123,255' : '0,168,120';

  return (
    <Pressable
      onPress={() => {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        onPress();
      }}
      style={[
        styles.roleCard,
        {
          backgroundColor: selected ? `rgba(${rgb},${palette.isDark ? 0.14 : 0.08})` : palette.cardBg,
          borderColor: selected ? accent : palette.cardBorder,
          shadowColor: selected ? accent : '#000',
          shadowOpacity: selected ? 0.28 : 0.08,
          shadowRadius: selected ? 18 : 6,
          shadowOffset: { width: 0, height: selected ? 6 : 2 },
          elevation: selected ? 6 : 2,
        },
      ]}
    >
      <OBRoleBadge role={pathRole} />
      <Text style={styles.roleIcon}>{icon}</Text>
      {tags.map((tag) => (
        <Text key={tag} style={[styles.roleTag, { color: palette.textMuted }]}>
          {tag}
        </Text>
      ))}
      <Text style={[styles.roleHeadline, { color: palette.textPrimary }]}>{headline}</Text>
      <Text style={[styles.roleBody, { color: palette.textSecondary }]}>{body}</Text>
      {selected && features?.length ? (
        <View style={styles.roleFeatures}>
          {features.map((f) => (
            <Text
              key={f}
              style={[
                styles.roleFeatChip,
                {
                  color: palette.textPrimary,
                  borderColor: palette.cardBorder,
                  backgroundColor: palette.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                },
              ]}
            >
              {f}
            </Text>
          ))}
        </View>
      ) : null}
    </Pressable>
  );
}

export function OBHeadline({
  children,
  delay: _delay,
  centered,
}: {
  children: string;
  delay?: number;
  centered?: boolean;
}) {
  const palette = useOBScreenPalette();
  return (
    <Text
      style={[
        styles.headline,
        { color: palette.textPrimary },
        centered && styles.centerText,
      ]}
    >
      {children}
    </Text>
  );
}

export function OBSub({
  children,
  delay: _delay,
  centered,
}: {
  children: string;
  delay?: number;
  centered?: boolean;
}) {
  const palette = useOBScreenPalette();
  return (
    <Text
      style={[
        styles.sub,
        { color: palette.textSecondary },
        centered && styles.centerText,
      ]}
    >
      {children}
    </Text>
  );
}

export function OBHeadlineGradient({ children, role = '' }: { children: string; role?: string }) {
  const g = roleGradient(role);
  const colorsGrad =
    role === 'professional'
      ? ([TRUWELL_COLORS.professional, TRUWELL_COLORS.primaryLight] as [string, string])
      : role === 'guardian'
        ? ([TRUWELL_COLORS.guardian, TRUWELL_COLORS.accentLight] as [string, string])
        : ([g[0], g[2]] as [string, string]);

  return (
    <MaskedView maskElement={<Text style={[styles.headline, styles.gradientMaskText]}>{children}</Text>}>
      <LinearGradient colors={colorsGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
        <Text style={[styles.headline, { opacity: 0 }]}>{children}</Text>
      </LinearGradient>
    </MaskedView>
  );
}

export function OBSelectCard({
  icon,
  label,
  sub,
  sel,
  role,
  onPress,
  fullWidth,
  compact,
}: {
  icon: string;
  label: string;
  sub?: string;
  sel: boolean;
  role: string;
  onPress: () => void;
  fullWidth?: boolean;
  /** Compact stacked tile for two-column grids */
  compact?: boolean;
}) {
  const palette = useOBScreenPalette();
  return (
    <View style={fullWidth ? { width: '100%' } : compact ? styles.selCardWrap : styles.selCardWrap}>
      <SelectionCard
        icon={icon}
        title={label}
        description={sub}
        selected={sel}
        onPress={onPress}
        variant={pathVariant(role)}
        isDark={palette.isDark}
        fullWidth={fullWidth || compact}
        layout={compact ? 'stack' : 'row'}
      />
    </View>
  );
}

export function OBChip({
  label,
  sel,
  role,
  onPress,
  fullWidth,
}: {
  label: string;
  sel: boolean;
  role: string;
  onPress: () => void;
  fullWidth?: boolean;
}) {
  const palette = useOBScreenPalette();
  const g = accentFor(role);
  const rgb = role === 'professional' ? '0,123,255' : '0,168,120';

  return (
    <Pressable
      onPress={() => {
        void Haptics.selectionAsync();
        onPress();
      }}
      style={[
        styles.chip,
        fullWidth && styles.chipFull,
        {
          borderColor: sel ? g : palette.cardBorder,
          backgroundColor: sel
            ? `rgba(${rgb},${palette.isDark ? 0.2 : 0.12})`
            : palette.cardBg,
        },
      ]}
    >
      <Text
        style={[
          styles.chipText,
          { color: sel ? palette.textPrimary : palette.textSecondary },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export function OBCTA({
  label,
  onPress,
  disabled,
  role,
  loading,
  subtext,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  role: string;
  loading?: boolean;
  subtext?: string;
}) {
  const palette = useOBScreenPalette();
  const variant = pathVariant(role);

  return (
    <View>
      <PrimaryButton
        label={loading ? 'Please wait…' : label}
        onPress={onPress}
        disabled={disabled}
        loading={loading}
        variant={variant === 'neutral' ? 'guardian' : variant}
      />
      {subtext ? (
        <Text
          style={[
            styles.ctaSub,
            { color: palette.textMuted },
            disabled && styles.ctaSubDim,
          ]}
        >
          {subtext}
        </Text>
      ) : null}
    </View>
  );
}

export function OBTrustPill({ text }: { text: string }) {
  const palette = useOBScreenPalette();
  return (
    <View style={[styles.trust, { backgroundColor: palette.cardBg, borderColor: palette.cardBorder }]}>
      <Text style={[styles.trustText, { color: palette.textSecondary }]}>{text}</Text>
    </View>
  );
}

export function OBAffirmCard({ text, visible, role }: { text: string; visible: boolean; role: string }) {
  const palette = useOBScreenPalette();
  const g = accentFor(role);
  return (
    <View
      style={[
        styles.affirm,
        {
          borderColor: g,
          backgroundColor: palette.cardBg,
          opacity: visible ? 1 : 0,
          marginTop: visible ? 16 : 0,
          maxHeight: visible ? undefined : 0,
        },
      ]}
    >
      {visible ? <Text style={[styles.affirmText, { color: palette.textPrimary }]}>{text}</Text> : null}
    </View>
  );
}

export function OBResponseCard({ icon, text, visible }: { icon: string; text: string; visible: boolean }) {
  const palette = useOBScreenPalette();
  return (
    <View
      style={[
        styles.response,
        {
          opacity: visible ? 1 : 0,
          backgroundColor: palette.cardBg,
          borderColor: palette.cardBorder,
          marginTop: visible ? 16 : 0,
        },
      ]}
    >
      {visible ? (
        <>
          <Text style={styles.responseIco}>{icon}</Text>
          <Text style={[styles.responseBody, { color: palette.textPrimary }]}>{text}</Text>
        </>
      ) : null}
    </View>
  );
}

export function OBRoleBadge({ role }: { role: string }) {
  const palette = useOBScreenPalette();
  const label =
    role === 'professional'
      ? 'HEALTH AUTHORITY'
      : role === 'guardian'
        ? 'FAMILY GUARDIAN'
        : '';
  if (!label) return null;
  return (
    <View style={[styles.rolePill, { backgroundColor: palette.cardBg, borderColor: palette.cardBorder }]}>
      <Text style={[styles.rolePillText, { color: palette.textPrimary }]}>{label}</Text>
    </View>
  );
}

export function OBOrbs({ role }: { role: string }) {
  const g = roleGradient(role);
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Svg width={screenWidth} height={420}>
        <Defs>
          <SvgRadialGradient id="orb1" cx="20%" cy="10%" rx="55%" ry="55%">
            <Stop offset="0%" stopColor={g[0]} stopOpacity={0.45} />
            <Stop offset="100%" stopColor={conversionOnboarding.bg} stopOpacity={0} />
          </SvgRadialGradient>
          <SvgRadialGradient id="orb2" cx="95%" cy="25%" rx="50%" ry="50%">
            <Stop offset="0%" stopColor={g[1]} stopOpacity={0.38} />
            <Stop offset="100%" stopColor={conversionOnboarding.bg} stopOpacity={0} />
          </SvgRadialGradient>
          <SvgRadialGradient id="orb3" cx="50%" cy="90%" rx="60%" ry="40%">
            <Stop offset="0%" stopColor={g[2]} stopOpacity={0.35} />
            <Stop offset="100%" stopColor={conversionOnboarding.bg} stopOpacity={0} />
          </SvgRadialGradient>
        </Defs>
        <Circle cx={screenWidth * 0.22} cy={90} r={120} fill="url(#orb1)" />
        <Circle cx={screenWidth * 0.88} cy={170} r={100} fill="url(#orb2)" />
        <Circle cx={screenWidth * 0.5} cy={440} r={140} fill="url(#orb3)" />
      </Svg>
    </View>
  );
}

const ARC_R = 110;
const ARC_CX = screenWidth / 2;
const ARC_CY = 200;

/** Polar angle in degrees (0° = east, clockwise) helper */
function arcPoint(cx: number, cy: number, r: number, deg: number) {
  const rad = (deg * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function describeArc(cx: number, cy: number, r: number, startAngle: number, endAngle: number) {
  const start = arcPoint(cx, cy, r, startAngle);
  const end = arcPoint(cx, cy, r, endAngle);
  const largeArc = Math.abs(endAngle - startAngle) > 180 ? 1 : 0;
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y}`;
}

export function OBCommitmentArc({
  minutes,
  role,
  onValueChange,
}: {
  minutes: number;
  role: string;
  onValueChange: (m: number) => void;
}) {
  const palette = useOBScreenPalette();
  const g = roleGradient(role);
  const t = Math.max(0, Math.min(1, (minutes - 5) / 55));
  const endAngle = -135 + t * 270;

  const trackStyle = describeArc(ARC_CX, ARC_CY, ARC_R, -135, 135);
  const activeStyle = describeArc(ARC_CX, ARC_CY, ARC_R, -135, endAngle);
  const trackColor = palette.isDark ? 'rgba(244,247,251,0.12)' : 'rgba(0,0,0,0.08)';

  return (
    <View style={styles.arcContainer}>
      <Svg width={screenWidth} height={220}>
        <Path d={trackStyle} stroke={trackColor} strokeWidth={18} strokeLinecap="round" fill="none" />
        <Path d={activeStyle} stroke={g[0]} strokeWidth={18} strokeLinecap="round" fill="none" />
      </Svg>
      <Text style={[styles.arcLabel, { color: palette.textPrimary }]}>{`${minutes}`}</Text>
      <Text style={[styles.arcMinutes, { color: palette.textMuted }]}>minutes / day</Text>
      <Slider
        style={{ width: screenWidth - 48, alignSelf: 'center', marginTop: 22 }}
        minimumValue={5}
        maximumValue={60}
        step={5}
        value={minutes}
        minimumTrackTintColor={g[0]}
        maximumTrackTintColor={trackColor}
        thumbTintColor={palette.textPrimary}
        onSlidingComplete={(v) => {
          void Haptics.selectionAsync();
          const snapped = Math.min(60, Math.max(5, Math.round(v / 5) * 5));
          onValueChange(snapped);
        }}
        onValueChange={(v) => {
          const snapped = Math.min(60, Math.max(5, Math.round(v / 5) * 5));
          onValueChange(snapped);
        }}
      />
    </View>
  );
}

export type CarouselFeatureItem = {
  icon: string;
  headline: string;
  body: string;
  stat: string;
  accent: readonly [string, string];
};

export function OBFeatureCarousel({ features }: { features: CarouselFeatureItem[] }) {
  return (
    <ScrollView
      horizontal
      pagingEnabled
      showsHorizontalScrollIndicator={false}
      decelerationRate="fast"
      snapToAlignment="center"
      scrollEventThrottle={16}
    >
      {features.map((item, idx) => (
        <View key={idx} style={styles.carouselPage}>
          <LinearGradient colors={item.accent as [string, string]} style={styles.carouselCard} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
            <Text style={styles.carouselIcon}>{item.icon}</Text>
            <Text style={styles.carouselHl}>{item.headline}</Text>
            <Text style={styles.carouselBody}>{item.body}</Text>
            <Text style={styles.carouselStat}>{item.stat}</Text>
          </LinearGradient>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  shellRoot: { flex: 1 },
  shellBody: { flex: 1, paddingHorizontal: 20 },
  flexFill: { flex: 1 },
  scrollContent: { paddingBottom: 36, gap: 12, paddingTop: 4 },
  scrollWithFooter: { paddingBottom: 32 },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 34 : 24,
    borderTopWidth: 1,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 2.5,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  stepIntro: {
    marginBottom: 8,
    gap: 2,
  },
  sectionLabel: {
    marginTop: 20,
    marginBottom: 10,
    fontWeight: '800',
    fontSize: 14,
  },
  insightCard: {
    marginTop: 20,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  insightText: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 22,
  },
  roleCard: {
    borderRadius: 22,
    borderWidth: 1.5,
    padding: 18,
    gap: 8,
    overflow: 'hidden',
  },
  roleIcon: { fontSize: 48, marginVertical: 4 },
  roleTag: { fontSize: 10, letterSpacing: 1.6, fontWeight: '900' },
  roleHeadline: { fontSize: 20, fontWeight: '900', marginTop: 4 },
  roleBody: { fontSize: 14, fontWeight: '500', lineHeight: 22 },
  roleFeatures: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  roleFeatChip: {
    fontSize: 11,
    fontWeight: '700',
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  selCardWrap: {
    flexGrow: 1,
    flexBasis: '42%',
    maxWidth: '48%',
  },
  safe: { flex: 1 },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    minHeight: 40,
    marginBottom: 2,
  },
  segmentRow: {
    paddingHorizontal: 14,
    marginBottom: 8,
    minHeight: 10,
    justifyContent: 'center',
  },
  backRow: { paddingHorizontal: 8, paddingVertical: 6 },
  backText: { color: colors.textMuted, fontSize: 14, fontWeight: '700' },
  headline: {
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -0.6,
    lineHeight: 35,
  },
  gradientMaskText: {
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -0.6,
    lineHeight: 35,
    backgroundColor: 'transparent',
  },
  centerText: { textAlign: 'center' },
  sub: {
    fontSize: 15,
    lineHeight: 22,
    marginTop: 8,
    fontWeight: '400',
  },
  stepBadgeWrap: {},
  stepBadge: { fontSize: 13, fontWeight: '900', color: colors.textMuted, letterSpacing: 0.4 },
  selCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    gap: 4,
    minHeight: 64,
    flexGrow: 1,
    flexBasis: '42%',
    maxWidth: '48%',
  },
  selEmoji: { fontSize: 22 },
  selTitle: { fontSize: 14, fontWeight: '700', color: colors.textMuted },
  selSub: { fontSize: 12, lineHeight: 17, fontWeight: '600', color: colors.textMuted },
  chip: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    marginRight: 8,
    marginBottom: 8,
    maxWidth: '100%',
  },
  chipFull: {
    width: '100%',
    borderRadius: 14,
    marginRight: 0,
  },
  chipText: { fontSize: 13, fontWeight: '600', lineHeight: 18 },
  ctaWrap: { borderRadius: 16, overflow: 'hidden', marginTop: 8 },
  ctaGrad: {
    paddingVertical: 17,
    paddingHorizontal: 18,
    alignItems: 'center',
    overflow: 'hidden',
  },
  ctaDim: { opacity: 0.45 },
  ctaShimmer: { ...StyleSheet.absoluteFillObject },
  ctaText: { color: colors.textPrimary, fontSize: 16, fontWeight: '900' },
  ctaSub: {
    marginTop: 12,
    textAlign: 'center',
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
  ctaSubDim: { opacity: 0.5 },
  trust: {
    alignSelf: 'flex-start',
    marginTop: 8,
    backgroundColor: 'rgba(244,247,251,0.06)',
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  trustText: { color: colors.textMuted, fontSize: 11, fontWeight: '700' },
  affirm: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginHorizontal: -4,
  },
  affirmText: { fontSize: 14, fontWeight: '600', lineHeight: 22 },
  response: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 8,
  },
  responseIco: { fontSize: 26 },
  responseBody: { fontSize: 14, fontWeight: '500', lineHeight: 22 },
  rolePill: {
    alignSelf: 'flex-start',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 999,
    borderWidth: 1,
  },
  rolePillText: { letterSpacing: 1.6, fontSize: 10, fontWeight: '900' },
  arcContainer: { alignItems: 'center', justifyContent: 'center', marginTop: 24, marginBottom: 8 },
  arcLabel: { marginTop: -72, marginBottom: 4, fontSize: 44, fontWeight: '900' },
  arcMinutes: { marginTop: 4, fontSize: 13, fontWeight: '700' },
  carouselPage: { width: 280 + 16, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8 },
  carouselCard: {
    width: 280,
    padding: 22,
    borderRadius: 20,
    minHeight: 320,
    justifyContent: 'flex-start',
    gap: 10,
  },
  carouselIcon: { fontSize: 40 },
  carouselHl: { fontSize: 18, fontWeight: '900', color: colors.textPrimary },
  carouselBody: { fontSize: 13, fontWeight: '600', color: colors.textPrimary, opacity: 0.97, lineHeight: 21 },
  carouselStat: { marginTop: 8, fontSize: 12, fontWeight: '800', color: colors.textPrimary, opacity: 0.92 },
});
