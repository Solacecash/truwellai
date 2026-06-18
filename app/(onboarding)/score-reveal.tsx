import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, {
  FadeInDown,
  runOnJS,
  useAnimatedProps,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { OnboardingProgressBar } from '@/components/onboarding/OnboardingStepShell';
import { ALLERGY_OPTIONS, DIET_OPTIONS, HEALTH_CONDITIONS } from '@/lib/onboardingStepData';
import { useOnboardingBack } from '@/lib/useOnboardingNavigation';
import { useOnboardingStore } from '@/stores/onboardingStore';
import { OB_COLORS, OB_FONTS, ONBOARDING_ROUTES } from '@/lib/_obShared';

const PROGRESS = 81;
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

type RiskItem = {
  icon: string;
  title: string;
  body: string;
  level: 'high' | 'medium' | 'watch';
};

const CONDITION_RISKS: Record<string, Omit<RiskItem, 'level'> & { level?: RiskItem['level'] }> = {
  type2_diabetes: {
    icon: '🩸',
    title: 'Hidden sugar risk activated',
    body: 'Products with high glycemic ingredients will be flagged before you buy.',
    level: 'high',
  },
  high_blood_pressure: {
    icon: '🧂',
    title: 'Sodium watch active',
    body: 'High-sodium foods and seasonings get instant caution grades.',
    level: 'high',
  },
  heart_disease: {
    icon: '❤️',
    title: 'Cardiac safety layer on',
    body: 'Trans fats, excess sodium, and inflammatory oils are prioritised in scans.',
    level: 'high',
  },
  asthma: {
    icon: '💨',
    title: 'Respiratory irritant filter',
    body: 'Fragrances, sulfates, and aerosol irritants trigger early warnings.',
    level: 'medium',
  },
  thyroid: {
    icon: '🦋',
    title: 'Thyroid-aware scanning',
    body: 'Goitrogen-heavy and iodine-conflicting ingredients are highlighted.',
    level: 'medium',
  },
  pcos: {
    icon: '⚖️',
    title: 'Hormone disruptor shield',
    body: 'Endocrine-disrupting additives get elevated scrutiny in your scans.',
    level: 'medium',
  },
  celiac: {
    icon: '🌾',
    title: 'Gluten cross-contact alert',
    body: 'Wheat derivatives and hidden gluten sources are flagged aggressively.',
    level: 'high',
  },
  kidney_disease: {
    icon: '🫘',
    title: 'Renal-safe filtering',
    body: 'Phosphorus, potassium, and sodium-heavy products get priority flags.',
    level: 'high',
  },
  obesity: {
    icon: '📉',
    title: 'Metabolic risk tracking',
    body: 'Ultra-processed foods and empty-calorie traps are surfaced first.',
    level: 'watch',
  },
  anxiety_depression: {
    icon: '🧠',
    title: 'Mood-linked nutrition watch',
    body: 'Caffeine spikes and inflammatory additives are tracked in your food log.',
    level: 'watch',
  },
  arthritis: {
    icon: '🦴',
    title: 'Inflammation monitor',
    body: 'Pro-inflammatory oils and additives are highlighted in product scans.',
    level: 'medium',
  },
};

const ALLERGY_RISKS: Record<string, Omit<RiskItem, 'level'>> = {
  peanuts: { icon: '🥜', title: 'Peanut allergen guard', body: 'Peanut derivatives trigger immediate red alerts on every scan.' },
  tree_nuts: { icon: '🌰', title: 'Tree nut protection', body: 'Almond, cashew, and walnut traces are caught before purchase.' },
  shellfish: { icon: '🦐', title: 'Shellfish alert active', body: 'Crustacean ingredients and cross-contact risks are flagged.' },
  dairy: { icon: '🥛', title: 'Dairy allergen shield', body: 'Milk proteins and lactose derivatives get instant warnings.' },
  wheat: { icon: '🌾', title: 'Gluten allergen watch', body: 'Wheat and gluten-containing ingredients are scanned on every label.' },
  eggs: { icon: '🥚', title: 'Egg allergen guard', body: 'Albumin and egg-derived additives trigger caution alerts.' },
  soy: { icon: '🫘', title: 'Soy allergen filter', body: 'Soy lecithin and protein isolates are flagged in products.' },
};

function buildRiskActivations(conditions: string[], allergies: string[], dietType: string): RiskItem[] {
  const items: RiskItem[] = [];
  const activeConds = conditions.filter((c) => c !== 'none');

  for (const id of activeConds) {
    const risk = CONDITION_RISKS[id];
    if (risk) {
      items.push({
        icon: risk.icon,
        title: risk.title,
        body: risk.body,
        level: risk.level ?? 'medium',
      });
    } else {
      const label = HEALTH_CONDITIONS.find((c) => c.id === id)?.label ?? id;
      items.push({
        icon: '⚠️',
        title: `${label} protection active`,
        body: 'Ingredient scans are calibrated to reduce risk for this condition.',
        level: 'medium',
      });
    }
  }

  const activeAllergies = allergies.filter((a) => a !== 'none');
  for (const id of activeAllergies) {
    const risk = ALLERGY_RISKS[id];
    if (risk) {
      items.push({ ...risk, level: 'high' });
    } else {
      const label = ALLERGY_OPTIONS.find((a) => a.id === id)?.label ?? id;
      items.push({
        icon: '🚨',
        title: `${label} alert armed`,
        body: 'This allergen triggers immediate warnings across all product scans.',
        level: 'high',
      });
    }
  }

  if (!items.length) {
    items.push({
      icon: '🛡️',
      title: 'Preventive protection baseline',
      body: 'No active conditions flagged. TruWell still scans for hidden toxins and recalls.',
      level: 'watch',
    });
  }
  const dietLabel = DIET_OPTIONS.find((d) => d.id === dietType)?.label ?? null;
  if (dietLabel && items.length < 4) {
    items.push({
      icon: '\uD83C\uDF7D\uFE0F',
      title: `${dietLabel} pattern recognised`,
      body: 'Every scan and meal log is checked against what fits your eating pattern, not a generic average.',
      level: 'watch',
    });
  }
  return items.slice(0, 4);
}

function levelColor(level: RiskItem['level']): string {
  if (level === 'high') return OB_COLORS.red ?? '#FF4444';
  if (level === 'medium') return OB_COLORS.amber;
  return OB_COLORS.teal;
}

function sofiaQuote(name: string, score: number, condCount: number): string {
  const who = name || 'there';
  if (condCount > 2) {
    return `${who}, your profile tells me prevention is critical right now. I will watch every product and meal for risks that compound over time.`;
  }
  if (score >= 75) {
    return `${who}, you are in a strong starting position. My job is to keep small daily choices from quietly eroding that advantage.`;
  }
  return `${who}, there is real upside in your baseline. A few targeted protections can shift your trajectory within weeks.`;
}

function ScoreRing({
  score,
  max,
  color,
  onComplete,
}: {
  score: number;
  max: number;
  color: string;
  onComplete?: () => void;
}) {
  const size = 168;
  const stroke = 12;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = useSharedValue(0);
  const bounce = useSharedValue(1);
  const [displayScore, setDisplayScore] = React.useState(0);

  useEffect(() => {
    progress.value = 0;
    setDisplayScore(0);
    progress.value = withTiming(Math.min(1, score / max), { duration: 1200 }, (finished) => {
      if (finished) {
        bounce.value = withSequence(withSpring(1.05), withSpring(1));
        if (onComplete) runOnJS(onComplete)();
      }
    });
  }, [bounce, max, onComplete, progress, score]);

  useAnimatedReaction(
    () => Math.round(progress.value * score),
    (val, prev) => {
      if (val !== prev) runOnJS(setDisplayScore)(val);
    },
    [score]
  );

  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ scale: bounce.value }],
  }));

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - progress.value),
  }));

  return (
    <Animated.View style={[styles.ringWrap, ringStyle]}>
      <Svg width={size} height={size}>
        <Circle cx={size / 2} cy={size / 2} r={radius} stroke={OB_COLORS.white12} strokeWidth={stroke} fill="none" />
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${circumference} ${circumference}`}
          animatedProps={animatedProps}
          rotation={-90}
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      <View style={StyleSheet.absoluteFillObject}>
        <View style={styles.ringCenter}>
          <Text style={styles.scoreValue}>{displayScore}</Text>
          <Text style={styles.scoreMax}>/ {max}</Text>
        </View>
      </View>
    </Animated.View>
  );
}

export default function ScoreReveal() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const userName = useOnboardingStore((s) => s.userName);
  const conditions = useOnboardingStore((s) => s.conditions);
  const allergies = useOnboardingStore((s) => s.allergies);
  const dietType = useOnboardingStore((s) => s.dietType);
  const healthScore = useOnboardingStore((s) => s.healthScore);
  const setConversionFlowStep = useOnboardingStore((s) => s.setConversionFlowStep);
  const setCompletionPercent = useOnboardingStore((s) => s.setCompletionPercent);
  const handleBack = useOnboardingBack(14);

  useEffect(() => {
    setCompletionPercent(PROGRESS);
    setConversionFlowStep(14);
  }, [setCompletionPercent, setConversionFlowStep]);

  const risks = useMemo(
    () => buildRiskActivations(conditions, allergies, dietType),
    [conditions, allergies, dietType]
  );

  const condCount = conditions.filter((c) => c !== 'none').length;
  const quote = useMemo(
    () => sofiaQuote(userName, healthScore, condCount),
    [userName, healthScore, condCount]
  );

  const onRingComplete = useCallback(() => {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, []);

  const onContinue = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setConversionFlowStep(15);
    router.push(ONBOARDING_ROUTES.prePaywall);
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.headerRow}>
        <Pressable onPress={handleBack} style={styles.backBtn} accessibilityRole="button" accessibilityLabel="Go back">
          <Text style={styles.backIcon}>{'\u2039'}</Text>
        </Pressable>
        <View style={styles.progressWrap}>
          <OnboardingProgressBar percent={PROGRESS} />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.eyebrow}>YOUR CARE REPORT</Text>
        <Animated.Text entering={FadeInDown.delay(120).springify()} style={styles.h1}>
          {userName ? `${userName}'s ` : 'Your '}
          <Text style={styles.h1Gold}>wellness baseline</Text>
        </Animated.Text>

        <Animated.View entering={FadeInDown.delay(200).springify()} style={styles.ringSection}>
          <ScoreRing score={healthScore} max={100} color={OB_COLORS.gold} onComplete={onRingComplete} />
        </Animated.View>
        <Text style={styles.scoreLabel}>TruWell Wellness Baseline</Text>

        <Animated.Text entering={FadeInDown.delay(360).springify()} style={styles.sectionTitle}>
          Risk protections activated
        </Animated.Text>
        {risks.map((risk, index) => (
          <Animated.View
            key={risk.title}
            entering={FadeInDown.delay(420 + index * 70).springify()}
            style={[styles.riskCard, { borderLeftColor: levelColor(risk.level) }]}
          >
            <Text style={styles.riskIcon}>{risk.icon}</Text>
            <View style={styles.riskCopy}>
              <Text style={styles.riskTitle}>{risk.title}</Text>
              <Text style={styles.riskBody}>{risk.body}</Text>
            </View>
          </Animated.View>
        ))}

        <Animated.View entering={FadeInDown.delay(700).springify()} style={styles.quoteBlock}>
          <Text style={styles.quoteLabel}>Sofia says</Text>
          <Text style={styles.quoteText}>{quote}</Text>
        </Animated.View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <Pressable onPress={onContinue} accessibilityRole="button">
          <LinearGradient
            colors={[OB_COLORS.gold, OB_COLORS.goldLight]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.cta}
          >
            <Text style={styles.ctaText}>Activate my full protection →</Text>
          </LinearGradient>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#020A14' },
  headerRow: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  backIcon: { color: OB_COLORS.white70, fontSize: 28, lineHeight: 32 },
  progressWrap: { flex: 1 },
  scroll: { paddingHorizontal: 24, paddingBottom: 120 },
  eyebrow: {
    fontFamily: OB_FONTS.semiBold,
    fontSize: 10,
    letterSpacing: 2,
    color: '#7A5F20',
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  h1: {
    fontFamily: OB_FONTS.bold,
    fontWeight: '700',
    fontSize: 28,
    lineHeight: 36,
    color: OB_COLORS.white,
    marginBottom: 8,
  },
  h1Gold: { color: OB_COLORS.gold },
  ringSection: { alignItems: 'center', marginVertical: 16 },
  ringWrap: { alignItems: 'center', justifyContent: 'center' },
  ringCenter: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scoreValue: { fontFamily: OB_FONTS.extraBold, fontWeight: '800', fontSize: 44, color: OB_COLORS.white },
  scoreMax: { fontFamily: OB_FONTS.body, fontSize: 12, color: OB_COLORS.white40, marginTop: 2 },
  scoreLabel: {
    fontFamily: OB_FONTS.medium,
    fontSize: 13,
    color: OB_COLORS.gold,
    textAlign: 'center',
    marginTop: -8,
    marginBottom: 20,
  },
  sectionTitle: {
    fontFamily: OB_FONTS.semiBold,
    fontSize: 14,
    color: OB_COLORS.white70,
    marginBottom: 12,
  },
  riskCard: {
    flexDirection: 'row',
    gap: 12,
    padding: 14,
    borderRadius: 12,
    backgroundColor: OB_COLORS.white07,
    borderWidth: 1,
    borderColor: OB_COLORS.white12,
    borderLeftWidth: 3,
    marginBottom: 10,
  },
  riskIcon: { fontSize: 18, marginTop: 2 },
  riskCopy: { flex: 1 },
  riskTitle: { fontFamily: OB_FONTS.semiBold, fontSize: 14, color: OB_COLORS.white, marginBottom: 4 },
  riskBody: { fontFamily: OB_FONTS.body, fontSize: 13, lineHeight: 18, color: OB_COLORS.white70 },
  quoteBlock: {
    marginTop: 8,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,229,200,0.25)',
    backgroundColor: 'rgba(0,229,200,0.08)',
  },
  quoteLabel: {
    fontFamily: OB_FONTS.semiBold,
    fontSize: 11,
    letterSpacing: 1.5,
    color: OB_COLORS.teal,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  quoteText: {
    fontFamily: OB_FONTS.body,
    fontSize: 14,
    lineHeight: 22,
    color: OB_COLORS.white,
    fontStyle: 'italic',
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 24,
    paddingTop: 12,
    backgroundColor: '#020A14',
  },
  cta: { height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  ctaText: { fontFamily: OB_FONTS.bold, fontWeight: '700', fontSize: 16, color: OB_COLORS.navy },
});
