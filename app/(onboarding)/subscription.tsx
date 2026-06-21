import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useRouter, useFocusEffect } from 'expo-router';
import React, { useEffect, useState, useCallback } from 'react';
import {
  Dimensions,
  LayoutAnimation,
  Platform,
  UIManager,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Alert,
  ActivityIndicator,
  BackHandler,
} from 'react-native';
import Animated, {
  Easing,
  Extrapolate,
  FadeInDown,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';

import { trackOnboardingEvent } from '@/lib/onboardingAnalytics';
import { useOnboardingBack } from '@/lib/useOnboardingNavigation';
import { initRevenueCat } from '@/lib/adapty';
import { useOnboardingStore } from '@/stores/onboardingStore';
import {
  getAvailablePackages,
  purchaseMobileSubscription,
  PRODUCT_IDS,
  isAdaptyReady,
} from '@/lib/adapty';
import { ensureFamilyGroup } from '@/lib/familyPlan';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import type { AdaptyPaywallProduct } from 'react-native-adapty';

import { BootstrapLoading } from '@/components/BootstrapLoading';
import { StoreTrustBadges } from '@/components/subscription/StoreTrustBadges';
import { SubscriptionHeroTicker } from '@/components/subscription/SubscriptionHeroTicker';

import {
  DISPLAYED_PLANS,
  withFamilyPlanForBillingCycle,
  type SubscriptionPlan,
} from '@/lib/subscriptionPlans';

import { OB_COLORS, OB_FONTS, ONBOARDING_ROUTES } from '@/lib/_obShared';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const GUARDIAN_OUTCOMES = [
  'Daily AI guidance matched to your care goals',
  'Health monitoring checklists that adapt with you',
  'Product safety scanning for your household',
  'Unlimited access to your personalized care plan',
] as const;

const PRO_OUTCOMES = [
  'Clinical documentation in seconds, not hours',
  'Patient education tailored to each visit',
  'Workflow automation for follow-up care',
  'Practice intelligence that highlights priorities',
] as const;

const GUARDIAN_PREMIUM_OUTCOMES = [
  'Daily AI guidance matched to your care goals',
  'Health monitoring checklists that adapt with you',
  'Product safety scanning for your household',
  'Unlimited access to your personalized care plan',
] as const;

const GUARDIAN_FAMILY_OUTCOMES = [
  'Everything in Premium for up to 5 family members',
  'Shared family health dashboard',
  'Cross-profile AI insights and alerts',
  'Family coordinator tools and care summaries',
  'Priority support and dedicated onboarding',
] as const;

const GUARDIAN_FOUNDER_OUTCOMES = [
  'Lifetime access. Pay once, never again.',
  'All Premium and Family features included',
  'Founder badge and exclusive community access',
  'Direct input on TruWell AI product roadmap',
  'Early access to every new feature forever',
] as const;

const PRO_PREMIUM_OUTCOMES = [
  'Clinical documentation in seconds, not hours',
  'Patient education tailored to each visit',
  'Workflow automation for follow-up care',
  'Practice intelligence that highlights priorities',
] as const;

const PRO_FAMILY_OUTCOMES = [
  'Everything in Premium for up to 3 clinicians',
  'Shared practice dashboard and analytics',
  'Team workflow coordination tools',
  'Collaborative patient education library',
  'Priority clinical support channel',
] as const;

const PRO_FOUNDER_OUTCOMES = [
  'Lifetime clinical access. One payment, forever.',
  'All Premium and Team features included',
  'Founder recognition in the TruWell network',
  'Direct influence on clinical AI development',
  'Beta access to every clinical tool we build',
] as const;

const GUARDIAN_PREMIUM_FULL_PERKS = [
  'Unlimited AI health coaching sessions',
  'Product safety scanner, 1,300+ harmful ingredients',
  'Personalized nutrition guidance',
  'Daily habit tracking and streaks',
  'Weekly progress reports',
  'Health score monitoring',
  'Condition management guides',
] as const;

const GUARDIAN_FAMILY_FULL_PERKS = [
  'Everything in Premium for up to 5 family members',
  'Shared family health dashboard',
  'Cross-profile AI insights and alerts',
  'Family coordinator tools',
  'Each member gets their own health score',
  'Combined household product scanner',
  'Priority support and dedicated onboarding',
  'One plan protects your whole household',
] as const;

const GUARDIAN_FOUNDER_FULL_PERKS = [
  'Lifetime access. Pay once, use forever.',
  'All Premium and Family features included',
  'Founding member badge in the TruWell community',
  'Direct input on the TruWell AI product roadmap',
  'Early access to every new feature, forever',
  'Priority support · human response within 2 hours',
  'Locked-in pricing. Never affected by future price increases',
  'Exclusive founder-only health intelligence reports',
] as const;

const PRO_PREMIUM_FULL_PERKS = [
  'Unlimited clinical AI documentation assistance',
  'Patient education generator, instant condition summaries',
  'Workflow automation for follow-up care',
  'Practice intelligence dashboard',
  'Evidence-based care planning templates',
  'SOAP note generation',
  'Clinical research assistant',
] as const;

const PRO_FAMILY_FULL_PERKS = [
  'Everything in Premium for up to 3 clinicians',
  'Shared practice dashboard and analytics',
  'Team workflow coordination tools',
  'Collaborative patient education library',
  'Combined billing for the whole team',
  'Priority clinical support channel',
  'Team performance insights',
  'Multi-provider patient handoff tools',
] as const;

const PRO_FOUNDER_FULL_PERKS = [
  'Lifetime clinical access. One payment, forever.',
  'All Premium and Team features included',
  'Founder recognition in the TruWell clinical network',
  'Direct influence on clinical AI development priorities',
  'Beta access to every clinical tool we build',
  'Locked-in pricing for the practice',
  'Human support within 2 hours',
  'Exclusive clinical intelligence reports',
] as const;

const FOUNDER_SLOTS_TOTAL = 500;
const FOUNDER_SLOTS_REMAINING = 147;

function PulsingDot({ color, size = 7 }: { color: string; size?: number }) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);
  useEffect(() => {
    scale.value = withRepeat(
      withSequence(withTiming(1.4, { duration: 700 }), withTiming(1.0, { duration: 700 })),
      -1,
      false
    );
    opacity.value = withRepeat(
      withSequence(withTiming(0.4, { duration: 700 }), withTiming(1.0, { duration: 700 })),
      -1,
      false
    );
  }, [opacity, scale]);
  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));
  return (
    <Animated.View
      style={[
        style,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
        },
      ]}
    />
  );
}

function FounderCountdown() {
  const [seconds, setSeconds] = useState(() => Math.floor(Math.random() * (14400 - 3600 + 1)) + 3600);
  useEffect(() => {
    const id = setInterval(() => setSeconds((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
  }, []);
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return (
    <Text style={founderStyles.timer}>
      {h}:{String(m).padStart(2, '0')}:{String(s).padStart(2, '0')}
    </Text>
  );
}

function FounderSlotBar() {
  const claimed = FOUNDER_SLOTS_TOTAL - FOUNDER_SLOTS_REMAINING;
  const pct = claimed / FOUNDER_SLOTS_TOTAL;
  const fillWidth = useSharedValue(0);
  useEffect(() => {
    fillWidth.value = withTiming(pct, { duration: 1200, easing: Easing.out(Easing.cubic) });
  }, [fillWidth, pct]);
  const fillStyle = useAnimatedStyle(() => ({
    width: `${fillWidth.value * 100}%`,
  }));
  return (
    <View style={founderStyles.slotWrap}>
      <View style={founderStyles.slotRow}>
        <Text style={founderStyles.slotLabel}>Founder slots claimed</Text>
        <Text style={founderStyles.slotCount}>
          {claimed}/{FOUNDER_SLOTS_TOTAL}
        </Text>
      </View>
      <View style={founderStyles.slotTrack}>
        <Animated.View style={[founderStyles.slotFill, fillStyle]} />
      </View>
      <View style={founderStyles.slotRow}>
        <Text style={founderStyles.slotRemain}>
          <Text style={{ color: '#f87171' }}>{FOUNDER_SLOTS_REMAINING} remaining</Text>
          {' '}. Never restocked
        </Text>
        <FounderCountdown />
      </View>
    </View>
  );
}

function CollapsiblePerks({
  perks,
  accentColor,
  missingPerks,
}: {
  perks: readonly string[];
  accentColor: string;
  missingPerks?: readonly string[];
}) {
  const [open, setOpen] = useState(false);
  const toggleOpen = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpen((v) => !v);
  };
  return (
    <View style={perkStyles.wrap}>
      <Pressable onPress={toggleOpen} style={perkStyles.toggleRow}>
        <Text style={[perkStyles.toggleLabel, { color: accentColor }]}>
          {open ? '▲ Hide full feature list' : `▼ See all ${perks.length} features included`}
        </Text>
      </Pressable>
      {open && (
        <View style={perkStyles.list}>
          {perks.map((p) => (
            <View key={p} style={perkStyles.perkRow}>
              <Text style={[perkStyles.perkCheck, { color: accentColor }]}>✓</Text>
              <Text style={perkStyles.perkText}>{p}</Text>
            </View>
          ))}
          {missingPerks && missingPerks.length > 0 && (
            <View style={perkStyles.missingSection}>
              <Text style={perkStyles.missingLabel}>Not included in this plan:</Text>
              {missingPerks.map((p) => (
                <View key={p} style={perkStyles.perkRow}>
                  <Text style={perkStyles.perkCross}>�-</Text>
                  <Text style={perkStyles.perkMissing}>{p}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      )}
    </View>
  );
}

function ShimmerCTA({
  label,
  colors,
  textColor,
  onPress,
}: {
  label: string;
  colors: readonly [string, string];
  textColor: string;
  onPress: () => void;
}) {
  const { width: screenWidth } = Dimensions.get('window');
  const shimmerX = useSharedValue(-screenWidth);
  const scale = useSharedValue(1);
  useEffect(() => {
    shimmerX.value = withRepeat(
      withTiming(screenWidth, { duration: 2400, easing: Easing.linear }),
      -1,
      false
    );
  }, [screenWidth, shimmerX]);
  const shimmerStyle = useAnimatedStyle(() => ({ transform: [{ translateX: shimmerX.value }] }));
  const scaleStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <Animated.View style={scaleStyle}>
      <Pressable
        onPress={onPress}
        onPressIn={() => {
          scale.value = withSpring(0.97, { damping: 20, stiffness: 300 });
        }}
        onPressOut={() => {
          scale.value = withSpring(1, { damping: 20, stiffness: 300 });
        }}
        style={ctaStyles.wrap}
      >
        <LinearGradient colors={[...colors]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={ctaStyles.gradient}>
          <Text style={[ctaStyles.label, { color: textColor }]}>{label}</Text>
          <Animated.View style={[StyleSheet.absoluteFillObject, shimmerStyle, { width: 80 }]} pointerEvents="none">
            <LinearGradient
              colors={['transparent', 'rgba(255,255,255,0.15)', 'transparent']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{ flex: 1 }}
            />
          </Animated.View>
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
}

const tickerStyles = StyleSheet.create({
  wrap: {
    minHeight: 44,
  },
  text: {
    fontSize: 12,
    fontWeight: '700',
    color: 'rgba(240,244,255,0.88)',
    fontFamily: OB_FONTS.semiBold,
    textAlign: 'center',
    lineHeight: 17,
  },
});
const founderStyles = StyleSheet.create({
  slotWrap: { marginTop: 4, marginBottom: 4 },
  slotRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  slotLabel: { fontSize: 10, color: 'rgba(240,244,255,0.40)', fontFamily: OB_FONTS.body },
  slotCount: { fontSize: 10, color: OB_COLORS.gold, fontFamily: OB_FONTS.semiBold },
  slotTrack: { height: 5, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 100, overflow: 'hidden', marginBottom: 4 },
  slotFill: { height: '100%', backgroundColor: OB_COLORS.gold, borderRadius: 100 },
  slotRemain: { fontSize: 10, color: 'rgba(240,244,255,0.35)', fontFamily: OB_FONTS.body, flex: 1 },
  timer: { fontSize: 11, color: '#f87171', fontFamily: OB_FONTS.semiBold, fontVariant: ['tabular-nums'] },
});

const perkStyles = StyleSheet.create({
  wrap: { marginTop: 4 },
  toggleRow: { paddingVertical: 8 },
  toggleLabel: { fontFamily: OB_FONTS.semiBold, fontSize: 11 },
  list: { gap: 6, paddingTop: 4 },
  perkRow: { flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
  perkCheck: { fontSize: 12, fontWeight: '800', lineHeight: 18, flexShrink: 0 },
  perkText: { flex: 1, fontFamily: OB_FONTS.body, fontSize: 12, color: OB_COLORS.white70, lineHeight: 18 },
  missingSection: { marginTop: 8, paddingTop: 8, borderTopWidth: 0.5, borderTopColor: 'rgba(255,255,255,0.08)', gap: 5 },
  missingLabel: { fontFamily: OB_FONTS.semiBold, fontSize: 10, color: 'rgba(240,244,255,0.30)', marginBottom: 2 },
  perkCross: { fontSize: 12, color: 'rgba(240,244,255,0.20)', lineHeight: 18, flexShrink: 0 },
  perkMissing: { flex: 1, fontFamily: OB_FONTS.body, fontSize: 12, color: 'rgba(240,244,255,0.25)', lineHeight: 18, textDecorationLine: 'line-through' },
});

const ctaStyles = StyleSheet.create({
  wrap: { borderRadius: 16, overflow: 'hidden' },
  gradient: { height: 58, alignItems: 'center', justifyContent: 'center', borderRadius: 16 },
  label: { fontFamily: OB_FONTS.bold, fontWeight: '700', fontSize: 16 },
});

const trustStyles = StyleSheet.create({
  wrap: { paddingHorizontal: 0, paddingVertical: 12 },
  label: { fontFamily: OB_FONTS.semiBold, fontSize: 9, letterSpacing: 3, color: OB_COLORS.teal, textAlign: 'center', marginBottom: 10 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  card: { width: '47.5%', backgroundColor: 'rgba(255,255,255,0.025)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', borderRadius: 12, padding: 10, alignItems: 'center' },
  icon: { fontSize: 16, marginBottom: 4 },
  title: { fontFamily: OB_FONTS.semiBold, fontSize: 11, color: OB_COLORS.white70, marginBottom: 2, textAlign: 'center' },
  sub: { fontFamily: OB_FONTS.body, fontSize: 9, color: OB_COLORS.white40, textAlign: 'center' },
});

export default function SubscriptionScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const selectedRole = useOnboardingStore((s) => s.selectedRole);
  const setConversionFlowStep = useOnboardingStore((s) => s.setConversionFlowStep);
  const handleBack = useOnboardingBack(10);

  useFocusEffect(
    useCallback(() => {
      const sub = BackHandler.addEventListener('hardwareBackPress', () => {
        handleBack();
        return true;
      });
      return () => sub.remove();
    }, [handleBack])
  );

  const [selectedPlan, setSelectedPlan] = useState<'premium' | 'family' | 'founder'>('family');
  const [purchasing, setPurchasing] = useState(false);
  const [rcPackages, setRcPackages] = useState<AdaptyPaywallProduct[]>([]);
  const session = useAuthStore((s) => s.session);
  const userId = session?.user?.id;

  const founderSlotsQuery = useQuery({
    queryKey: ['founder-slots'],
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data } = await supabase
        .from('founder_slots')
        .select('total_slots, slots_claimed')
        .eq('id', 1)
        .maybeSingle();
      if (!data) return 373;
      return Math.max(
        0,
        (data.total_slots as number) -
        (data.slots_claimed as number)
      );
    },
  });

  const founderSlotsLeft =
    founderSlotsQuery.data ?? 373;

  const accent = OB_COLORS.teal;
  const headline = 'Care With Confidence';

  const tabHintAnim = useSharedValue(0);
  useEffect(() => {
    const t = setTimeout(() => {
      tabHintAnim.value = withSequence(
        withTiming(1, { duration: 300 }),
        withTiming(0, { duration: 300 }),
        withTiming(1, { duration: 300 }),
        withTiming(0, { duration: 300 })
      );
    }, 1500);
    return () => clearTimeout(t);
  }, [tabHintAnim]);

  const premiumTabHintStyle = useAnimatedStyle(() => ({
    opacity: interpolate(tabHintAnim.value, [0, 1], [1, 0.4], Extrapolate.CLAMP),
    transform: [{ scale: interpolate(tabHintAnim.value, [0, 1], [1, 0.94], Extrapolate.CLAMP) }],
  }));

  useEffect(() => {
    setConversionFlowStep(10);
    void trackOnboardingEvent('paywall_viewed', { role: selectedRole || 'unknown' });
  }, [selectedRole, setConversionFlowStep]);

  useEffect(() => {
    getAvailablePackages().then(setRcPackages).catch(() => {});
  }, []);

  const handlePricingCTA = async () => {
    if (purchasing) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    await handlePurchase();
  };

  const ensureSessionForPaywall = async (): Promise<boolean> => {
    const {
      data: { session: liveSession },
    } = await supabase.auth.getSession();
    return !!liveSession?.user?.id;
  };

  const handlePurchase = async () => {
    if (purchasing) return;
    if (!(await ensureSessionForPaywall())) return;

    const {
      data: { session: purchaseSession },
    } = await supabase.auth.getSession();
    if (purchaseSession?.user?.id) {
      try {
        await initRevenueCat(purchaseSession.user.id);
      } catch {
        /* non-fatal */
      }
    }

    const productIdMap: Record<'premium' | 'family' | 'founder', string> = {
      premium: PRODUCT_IDS.monthly,
      family: PRODUCT_IDS.family,
      founder: PRODUCT_IDS.lifetime,
    };
    const targetProductId = productIdMap[selectedPlan];

    const matchingPackage = rcPackages.find((pkg) => pkg.vendorProductId === targetProductId);

    setPurchasing(true);
    try {
      if (matchingPackage && isAdaptyReady()) {
        const result = await purchaseMobileSubscription(matchingPackage);

        if (!result.success) {
          if (result.reason === 'cancelled') return;
          Alert.alert(
            'Purchase failed',
            result.error ?? 'Something went wrong. Please try again.'
          );
          return;
        }

        if (selectedPlan === 'family' && userId) {
          await ensureFamilyGroup(userId);
        }

        void trackOnboardingEvent('purchase_completed', {
          plan: selectedPlan,
          role: selectedRole || 'unknown',
        });
      } else {
        let activeUserId = userId;
        if (!activeUserId) {
          if (!(await ensureSessionForPaywall())) return;
          const {
            data: { session: devSession },
          } = await supabase.auth.getSession();
          activeUserId = devSession?.user?.id;
          if (!activeUserId) return;
        }

        const tierMap: Record<'premium' | 'family' | 'founder', string> = {
          premium: 'pro',
          family: 'family',
          founder: 'lifetime',
        };
        const planMap: Record<'premium' | 'family' | 'founder', string> = {
          premium: 'pro_monthly',
          family: 'family',
          founder: 'lifetime',
        };

        const { error } = await supabase
          .from('profiles')
          .update({
            subscription_tier: tierMap[selectedPlan],
            subscription_plan: planMap[selectedPlan],
          })
          .eq('id', activeUserId);

        if (error) {
          Alert.alert('Error', error.message);
          return;
        }

        if (selectedPlan === 'family') {
          await ensureFamilyGroup(activeUserId);
        }

        void trackOnboardingEvent('purchase_completed_dev', {
          plan: selectedPlan,
          role: selectedRole || 'unknown',
        });
      }

      setConversionFlowStep(11);
      router.push(ONBOARDING_ROUTES.success);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Purchase failed. Please try again.';
      if (__DEV__) console.error('[Pricing CTA]', msg);
      Alert.alert('Could not open plan', msg);
    } finally {
      setPurchasing(false);
    }
  };

  const goToAccount = () => {
    void handlePricingCTA();
  };

  const goFree = async () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    useOnboardingStore.getState().setConversionFlowComplete(true);
    void useOnboardingStore.getState().persistConversionSnapshot();
    setConversionFlowStep(11);
    router.push(ONBOARDING_ROUTES.success);
  };

  const proMonthly = DISPLAYED_PLANS.find((p) => p.id === 'pro_monthly')!;
  const proYearly = DISPLAYED_PLANS.find((p) => p.id === 'pro_yearly')!;
  const familyPlan = DISPLAYED_PLANS.find((p) => p.id === 'family')!;
  const lifetimePlan = DISPLAYED_PLANS.find((p) => p.id === 'lifetime')!;
  const familyMonthlyPlan: SubscriptionPlan = withFamilyPlanForBillingCycle(familyPlan, 'monthly');
  const plan: SubscriptionPlan =
    selectedPlan === 'founder'
      ? lifetimePlan
      : selectedPlan === 'family'
        ? familyMonthlyPlan
        : proMonthly;

  const plans = {
    premium: {
      name: 'TruWell Premium',
      price: proMonthly.priceDisplay,
      period: proMonthly.pricePeriod,
      trialLine: '7-day free trial · No charge today',
      accentColor: accent,
      ctaColors: [OB_COLORS.teal, OB_COLORS.tealDark],
      ctaTextColor: '#020A14',
      ctaLabel: 'Start Free 7-Day Trial →',
      outcomes: GUARDIAN_PREMIUM_OUTCOMES,
      fullPerks: GUARDIAN_PREMIUM_FULL_PERKS,
      missingPerks: ['Family member profiles', 'Shared household dashboard', 'Lifetime pricing lock'],
    },
    family: {
      name: 'TruWell Family',
      price: familyMonthlyPlan.priceDisplay,
      period: familyMonthlyPlan.pricePeriod,
      trialLine: '7-day free trial · No charge today',
      accentColor: OB_COLORS.teal,
      ctaColors: [OB_COLORS.teal, OB_COLORS.tealDark] as [string, string],
      ctaTextColor: '#020A14',
      ctaLabel: 'Start Family Trial →',
      outcomes: GUARDIAN_FAMILY_OUTCOMES,
      fullPerks: GUARDIAN_FAMILY_FULL_PERKS,
      missingPerks: ['Lifetime pricing lock', 'Founder community access', 'Roadmap input'],
    },
    founder: {
      name: 'Founder Access',
      price: lifetimePlan.priceDisplay,
      period: ` ${lifetimePlan.pricePeriod}`,
      trialLine: '30-day money-back guarantee · Pay once, yours forever',
      accentColor: OB_COLORS.gold,
      ctaColors: [OB_COLORS.gold, OB_COLORS.goldLight] as [string, string],
      ctaTextColor: '#020A14',
      ctaLabel: 'Claim My Founder Spot →',
      outcomes: GUARDIAN_FOUNDER_OUTCOMES,
      fullPerks: GUARDIAN_FOUNDER_FULL_PERKS,
      missingPerks: [],
    },
  };

  const active = plans[selectedPlan];

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        <Pressable onPress={handleBack} style={styles.backBtn} accessibilityRole="button" accessibilityLabel="Go back">
          <Text style={styles.backIcon}>‹</Text>
        </Pressable>

        <Animated.View entering={FadeInDown.delay(60).springify()}>
          <Text style={styles.eyebrow}>UNLOCK YOUR HEALTH INTELLIGENCE</Text>
          <Text style={styles.h1}>{headline}</Text>
          <Text style={styles.body}>
            Try everything free for 7 days. Your health plan is already built.{' '}
            <Text style={styles.bodyGoldCTA}>Just unlock it.</Text>
          </Text>
        </Animated.View>

        <View style={{ marginBottom: 4 }}>
          <SubscriptionHeroTicker
            style={tickerStyles.wrap}
            textStyle={tickerStyles.text}
          />
        </View>

        <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.freeTrialBanner}>
          <Text style={styles.freeTrialIcon}>🎁</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.freeTrialTitle}>7 Days completely free</Text>
            <Text style={styles.freeTrialSub}>
              Full access · No credit card charged · Cancel with one tap
            </Text>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(120).springify()}>
          <View style={styles.popularFloatRow}>
            <View style={styles.popularFloatSpacer} />
            <View style={styles.popularFloatBadge}>
              <Text style={styles.popularFloatText}>★ MOST POPULAR</Text>
            </View>
            <View style={styles.popularFloatSpacer} />
          </View>

          <View style={styles.tabRow}>
            <Animated.View style={[styles.tabOuter, selectedPlan === 'premium' ? {} : premiumTabHintStyle]}>
              <Pressable
                onPress={() => { void Haptics.selectionAsync(); setSelectedPlan('premium'); }}
                style={[
                  styles.tab,
                  selectedPlan === 'premium' && { borderColor: accent, backgroundColor: `${accent}18` },
                ]}
                accessibilityRole="button"
              >
                <Text style={[styles.tabText, selectedPlan === 'premium' && { color: accent }]}>
                  Premium
                </Text>
                <Text style={[styles.tabPrice, selectedPlan === 'premium' && { color: accent }]}>
                  {proMonthly.priceDisplay}
                </Text>
              </Pressable>
            </Animated.View>

            <View style={styles.tabOuter}>
              <Pressable
                onPress={() => { void Haptics.selectionAsync(); setSelectedPlan('family'); }}
                style={[
                  styles.tab,
                  styles.tabFeatured,
                  selectedPlan === 'family' && { borderColor: OB_COLORS.teal, backgroundColor: 'rgba(0,229,200,0.14)' },
                  selectedPlan !== 'family' && { borderColor: 'rgba(0,229,200,0.35)', backgroundColor: 'rgba(0,229,200,0.07)' },
                ]}
                accessibilityRole="button"
              >
                <Text style={[
                  styles.tabText,
                  { color: selectedPlan === 'family' ? OB_COLORS.teal : 'rgba(0,229,200,0.75)' },
                ]}>
                  Family
                </Text>
                <Text style={[
                  styles.tabPrice,
                  { color: selectedPlan === 'family' ? OB_COLORS.teal : 'rgba(0,229,200,0.60)' },
                ]}>
                  {familyMonthlyPlan.priceDisplay}
                </Text>
              </Pressable>
            </View>

            <View style={styles.tabOuter}>
              <Pressable
                onPress={() => { void Haptics.selectionAsync(); setSelectedPlan('founder'); }}
                style={[
                  styles.tab,
                  selectedPlan === 'founder' && { borderColor: OB_COLORS.gold, backgroundColor: 'rgba(201,168,76,0.12)' },
                ]}
                accessibilityRole="button"
              >
                <Text style={[styles.tabText, selectedPlan === 'founder' && { color: OB_COLORS.gold }]}>
                  Founder
                </Text>
                <Text style={[styles.tabPrice, selectedPlan === 'founder' && { color: OB_COLORS.gold }]}>
                  {lifetimePlan.priceDisplay}
                </Text>
              </Pressable>
            </View>
          </View>
        </Animated.View>

        <Animated.View key={selectedPlan} entering={FadeInDown.duration(300)}>
          <View style={[styles.planCard, { borderColor: active.accentColor }]}>

            {selectedPlan === 'family' && (
              <View style={[styles.planTopBanner, { backgroundColor: OB_COLORS.teal }]}>
                <Text style={styles.planTopBannerText}>★ MOST POPULAR · BEST VALUE FOR FAMILIES</Text>
              </View>
            )}

            {selectedPlan === 'founder' && (
              <View style={[styles.planTopBanner, { backgroundColor: '#f87171' }]}>
                <Text style={styles.planTopBannerText}>
                  🔥 LIMITED · {FOUNDER_SLOTS_REMAINING} OF {FOUNDER_SLOTS_TOTAL} SPOTS LEFT
                </Text>
              </View>
            )}

            <View style={styles.planCardInner}>

              <Text style={styles.planName}>{active.name}</Text>
              <View style={styles.priceRow}>
                <Text style={[styles.priceAmount, { color: active.accentColor }]}>{active.price}</Text>
                <Text style={styles.pricePeriod}>{active.period}</Text>
              </View>
              <Text style={styles.trialLine}>{active.trialLine}</Text>

              {(plan.id === 'lifetime' || plan.fomoText) && (
                <Text style={styles.planFomoText}>
                  {plan.id === 'lifetime'
                    ? `Only ${founderSlotsLeft} founder slots left · price rises to $249`
                    : plan.fomoText}
                </Text>
              )}

              <View style={styles.divider} />

              {active.outcomes.map((line) => (
                <View key={line} style={styles.outcomeRow}>
                  <Text style={[styles.outcomeCheck, { color: active.accentColor }]}>✓</Text>
                  <Text style={styles.outcomeText}>{line}</Text>
                </View>
              ))}

              {selectedPlan === 'founder' && <FounderSlotBar />}

              <CollapsiblePerks
                perks={active.fullPerks}
                accentColor={active.accentColor}
                missingPerks={active.missingPerks.length > 0 ? active.missingPerks : undefined}
              />

              <View style={styles.divider} />

              {purchasing ? (
                <View style={styles.purchasingBtn}>
                  <ActivityIndicator color="#020A14" size="small" />
                  <Text style={styles.purchasingText}>Processing...</Text>
                </View>
              ) : (
                <ShimmerCTA
                  label={active.ctaLabel}
                  colors={active.ctaColors as [string, string]}
                  textColor={active.ctaTextColor}
                  onPress={goToAccount}
                />
              )}

              <View style={styles.guaranteeRow}>
                <Text style={styles.guaranteeIcon}>🛡️</Text>
                <Text style={styles.guaranteeText}>
                  {selectedPlan === 'founder'
                    ? '30-day money-back guarantee · One payment · Yours forever'
                    : 'No charge for 7 days · Cancel anytime · No questions asked'}
                </Text>
              </View>

            </View>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(200).springify()}>
          <StoreTrustBadges />
        </Animated.View>

        <Text style={styles.legalText}>
          Subscriptions auto-renew unless cancelled at least 24 hours before the end of the
          current period. Manage or cancel anytime in your iOS Settings or Google Play account.
          Payment is charged to your store account at confirmation. Lifetime purchase is a
          one-time payment with no recurring charges.
        </Text>

      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <Pressable onPress={goFree} style={styles.ctaSecondary} accessibilityRole="button">
          <Text style={styles.ctaSecondaryText}>
            Continue free for now. Upgrade anytime from your profile
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: OB_COLORS.black },
  scroll: { paddingHorizontal: 24, paddingBottom: 120 },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  backIcon: { color: OB_COLORS.white70, fontSize: 28, lineHeight: 32 },
  eyebrow: { fontFamily: OB_FONTS.semiBold, fontSize: 10, letterSpacing: 2, color: OB_COLORS.gold, marginBottom: 6 },
  h1: { fontFamily: OB_FONTS.bold, fontWeight: '700', fontSize: 26, lineHeight: 32, color: OB_COLORS.white, marginBottom: 6 },
  body: { fontFamily: OB_FONTS.body, fontSize: 14, lineHeight: 21, color: OB_COLORS.white70, marginBottom: 16 },
  bodyGoldCTA: {
    fontFamily: OB_FONTS.bold,
    fontWeight: '700',
    fontSize: 14,
    color: OB_COLORS.gold,
  },

  freeTrialBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: 'rgba(22,163,74,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(22,163,74,0.25)',
    borderRadius: 14,
    marginBottom: 16,
  },
  freeTrialIcon: { fontSize: 22 },
  freeTrialTitle: { fontFamily: OB_FONTS.semiBold, fontSize: 13, color: '#2ED573', marginBottom: 2 },
  freeTrialSub: { fontFamily: OB_FONTS.body, fontSize: 11, color: OB_COLORS.white40 },

  tabRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
    alignItems: 'stretch',
  },
  tabOuter: {
    flex: 1,
  },
  tab: {
    flex: 1,
    height: 58,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: OB_COLORS.white12,
    backgroundColor: OB_COLORS.white07,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  tabFeatured: {
    borderColor: 'rgba(0,229,200,0.35)',
    backgroundColor: 'rgba(0,229,200,0.07)',
  },
  tabText: {
    fontFamily: OB_FONTS.semiBold,
    fontSize: 12,
    color: OB_COLORS.white40,
  },
  tabPrice: {
    fontFamily: OB_FONTS.bold,
    fontWeight: '700',
    fontSize: 13,
    color: OB_COLORS.white40,
  },
  popularFloatRow: {
    flexDirection: 'row',
    marginBottom: 4,
    alignItems: 'flex-end',
  },
  popularFloatSpacer: {
    flex: 1,
  },
  popularFloatBadge: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: OB_COLORS.teal,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 6,
    marginBottom: -2,
  },
  popularFloatText: {
    fontFamily: OB_FONTS.semiBold,
    fontSize: 8,
    color: '#020A14',
    letterSpacing: 0.8,
  },

  planCard: {
    borderWidth: 2,
    borderRadius: 20,
    backgroundColor: OB_COLORS.white07,
    marginBottom: 16,
    overflow: 'hidden',
  },
  planTopBanner: {
    paddingVertical: 7,
    paddingHorizontal: 14,
    alignItems: 'center',
  },
  planTopBannerText: { fontFamily: OB_FONTS.semiBold, fontSize: 9, color: '#020A14', letterSpacing: 1.5 },
  planCardInner: { padding: 18, gap: 10 },
  planName: { fontFamily: OB_FONTS.bold, fontWeight: '700', fontSize: 18, color: OB_COLORS.white },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 3 },
  priceAmount: { fontFamily: OB_FONTS.bold, fontWeight: '700', fontSize: 34 },
  pricePeriod: { fontFamily: OB_FONTS.body, fontSize: 14, color: OB_COLORS.white40 },
  trialLine: { fontFamily: OB_FONTS.medium, fontSize: 13, color: OB_COLORS.green },
  planFomoText: { fontFamily: OB_FONTS.semiBold, fontSize: 11, color: '#f87171', lineHeight: 16 },
  divider: { height: 1, backgroundColor: OB_COLORS.white12, marginVertical: 2 },
  outcomeRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  outcomeCheck: { fontSize: 14, lineHeight: 20, fontWeight: '800', flexShrink: 0 },
  outcomeText: { flex: 1, fontFamily: OB_FONTS.body, fontSize: 14, lineHeight: 20, color: OB_COLORS.white },

  guaranteeRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  guaranteeIcon: { fontSize: 16 },
  guaranteeText: { flex: 1, fontFamily: OB_FONTS.body, fontSize: 12, color: OB_COLORS.white40, lineHeight: 17 },

  legalText: {
    fontFamily: OB_FONTS.body,
    fontSize: 10,
    lineHeight: 15,
    color: 'rgba(240,244,255,0.25)',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 8,
  },

  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 24,
    paddingTop: 12,
    backgroundColor: OB_COLORS.black,
  },
  ctaSecondary: { alignItems: 'center', paddingVertical: 14 },
  ctaSecondaryText: { fontFamily: OB_FONTS.body, fontSize: 13, color: OB_COLORS.white40, textAlign: 'center' },
  purchasingBtn: {
    height: 58,
    borderRadius: 16,
    backgroundColor: 'rgba(201,168,76,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  purchasingText: {
    fontFamily: OB_FONTS.semiBold,
    fontSize: 15,
    color: '#020A14',
  },
});
