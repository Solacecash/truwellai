import { SegmentedIndicator } from '@/components/ui/SegmentedIndicator';
import { TruWellShield } from '@/components/onboarding/TruWellShield';
import { getFounderSlotsRemaining } from '@/lib/quotaManager';
import {
  DISPLAYED_PLANS,
  getPlanById,
  isPro as isPlanPro,
  withFamilyPlanForBillingCycle,
  type PlanId,
  type PlanFeature,
  type SubscriptionPlan,
} from '@/lib/subscriptionPlans';
import { supabase } from '@/lib/supabase';
import {
  ENTITLEMENT_ID,
  getAvailablePackages,
  purchaseMobileSubscription,
  restorePurchases,
  PRODUCT_IDS,
  isRevenueCatReady,
} from '@/lib/adapty';
import type { AdaptyPaywallProduct } from 'react-native-adapty';
import { useAuthStore } from '@/stores/authStore';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useEffect, useRef, useState, useCallback } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Dimensions,
} from 'react-native';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Circle as SVGCircle, Path, Svg } from 'react-native-svg';
import { useQueryClient } from '@tanstack/react-query';
import { isExpoGo } from '@/lib/env';

function storeProductForPlan(planId: PlanId): string | null {
  switch (planId) {
    case 'pro_monthly':
      return PRODUCT_IDS.monthly;
    case 'pro_yearly':
      return PRODUCT_IDS.yearly;
    case 'family':
      return PRODUCT_IDS.family;
    case 'lifetime':
      return PRODUCT_IDS.lifetime;
    default:
      return null;
  }
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ROTATING_MESSAGES = [
  '47 databases. Your health comes first. Zero compromises.',
  'The EU banned 1,400 ingredients. The USA banned 11.',
  'Some ingredients banned abroad are still on shelves here.',
  'Know what is really in what you use, before you use it.',
  'Real protection for the people who depend on you.',
];

const TICKER_ITEMS = [
  'Trusted by families who want real answers',
  'Checked against global safety databases',
  'Built for the people you protect most',
  'Private, secure, and always yours',
];

const GOLD = '#C9A84C';
const TEAL = '#00E5C8';
const GREEN = '#2ED573';
const BLUE = '#1E90FF';
const RED = '#FF4757';
const BG_DARK = '#020A14';

// ---------------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------------

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
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[style, { width: size, height: size, borderRadius: size / 2, backgroundColor: color }]}
    />
  );
}

function FeatureRow({ feature, accentColor }: { feature: PlanFeature; accentColor: string }) {
  return (
    <View style={styles.featureRow}>
      <View
        style={[
          styles.featureCircle,
          feature.included
            ? { backgroundColor: `${accentColor}26`, borderColor: `${accentColor}4D` }
            : { backgroundColor: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.10)' },
        ]}
      >
        <Text
          style={{
            fontSize: 8,
            fontWeight: '800',
            color: feature.included ? accentColor : 'rgba(240,244,255,0.18)',
          }}
        >
          {feature.included ? '✓' : '�-'}
        </Text>
      </View>
      <View style={styles.featureTextRow}>
        <Text
          style={{
            fontSize: 12,
            fontWeight: feature.highlight ? '700' : '400',
            color: feature.included
              ? feature.highlight
                ? '#F0F4FF'
                : 'rgba(240,244,255,0.72)'
              : 'rgba(240,244,255,0.18)',
            textDecorationLine: feature.included ? 'none' : 'line-through',
            flex: 1,
          }}
        >
          {feature.text}
        </Text>
        {feature.badge && (
          <View style={styles.featureBadge}>
            <Text style={[styles.featureBadgeText, { color: accentColor }]}>{feature.badge}</Text>
          </View>
        )}
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Shimmer CTA button
// ---------------------------------------------------------------------------

function ShimmerButton({
  label,
  subtext,
  bgColor,
  textColor,
  height = 56,
  loading,
  onPress,
}: {
  label: string;
  subtext?: string;
  bgColor: string;
  textColor: string;
  height?: number;
  loading: boolean;
  onPress: () => void;
}) {
  const { width: screenWidth } = Dimensions.get('window');
  const shimmerX = useSharedValue(-screenWidth);
  const scale = useSharedValue(1);

  useEffect(() => {
    shimmerX.value = withRepeat(
      withTiming(screenWidth, { duration: 2500, easing: Easing.linear }),
      -1,
      false
    );
  }, []);

  const shimmerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shimmerX.value }],
  }));

  const scaleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.97, { damping: 20, stiffness: 300 });
  };
  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 20, stiffness: 300 });
  };

  return (
    <View>
      <Animated.View style={scaleStyle}>
        <TouchableOpacity
          activeOpacity={1}
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          disabled={loading}
          style={{ borderRadius: 14, overflow: 'hidden' }}
        >
          <View style={[{ height, borderRadius: 14, backgroundColor: bgColor, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }]}>
            <Text style={{ fontSize: 15, fontWeight: '800', color: textColor }}>
              {loading ? 'Processing...' : label}
            </Text>
            <Animated.View
              style={[
                StyleSheet.absoluteFillObject,
                shimmerStyle,
                { width: 80 },
              ]}
              pointerEvents="none"
            >
              <LinearGradient
                colors={['transparent', 'rgba(255,255,255,0.12)', 'transparent']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{ flex: 1 }}
              />
            </Animated.View>
          </View>
        </TouchableOpacity>
      </Animated.View>
      {subtext && (
        <Text style={styles.ctaSubtext}>{subtext}</Text>
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Plan cards
// ---------------------------------------------------------------------------

function LifetimeCard({
  plan,
  founderSlots,
  loading,
  onPress,
}: {
  plan: SubscriptionPlan;
  founderSlots: number;
  loading: boolean;
  onPress: () => void;
}) {
  const cardScale = useSharedValue(0.95);
  const cardOpacity = useSharedValue(0);
  const claimedCount = 500 - founderSlots;

  useEffect(() => {
    const timer = setTimeout(() => {
      cardScale.value = withSpring(1, { damping: 20, stiffness: 200 });
      cardOpacity.value = withTiming(1, { duration: 500 });
    }, 50);
    return () => clearTimeout(timer);
  }, []);

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: cardScale.value }],
    opacity: cardOpacity.value,
  }));

  return (
    <Animated.View style={[cardStyle, styles.lifetimeCard]}>
      {/* Top banner */}
      <View style={styles.lifetimeBanner}>
        <Text style={styles.lifetimeBannerLeft}>{plan.topBannerLabel}</Text>
        <Text style={styles.lifetimeBannerRight}>{plan.topBannerRight}</Text>
      </View>

      <View style={{ padding: 14 }}>
        {/* Price row */}
        <View style={styles.priceRowSplit}>
          <View>
            <Text style={styles.strikethrough}>{plan.strikethroughPrice}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 6 }}>
              <Text style={[styles.priceMain, { color: GOLD }]}>{plan.priceDisplay}</Text>
              <Text style={styles.pricePeriodMuted}>{plan.pricePeriod}</Text>
            </View>
            {plan.savingsBadgeText && (
              <View style={styles.goldBadgePill}>
                <Text style={[styles.savingsBadgeText, { color: GOLD }]}>{plan.savingsBadgeText}</Text>
              </View>
            )}
          </View>
          {/* Right stat box */}
          <View style={styles.lifetimeStatBox}>
            <Text style={[styles.lifetimeStatNum, { color: GOLD }]}>{claimedCount}</Text>
            <Text style={styles.lifetimeStatLabel}>CLAIMED</Text>
          </View>
        </View>

        {plan.equivalentText && (
          <Text style={styles.equivalentText}>{plan.equivalentText}</Text>
        )}

        {/* Founder slots indicator */}
        <View style={{ marginTop: 10, marginBottom: 8 }}>
          <View style={styles.slotRow}>
            <Text style={styles.slotLabel}>Founder slots</Text>
            <Text style={[styles.slotLabel, { color: GOLD }]}>{founderSlots}/500 available</Text>
          </View>
          <SegmentedIndicator
            value={Math.round((claimedCount / 500) * 100)}
            count={20}
            color={GOLD}
            height={5}
            gap={2}
            animated
          />
        </View>

        <View style={styles.divider} />

        {/* Features */}
        {plan.features.map((f) => (
          <FeatureRow key={f.text} feature={f} accentColor={GOLD} />
        ))}

        {plan.rationaleTitle && plan.rationaleBody && (
          <View
            style={{
              marginTop: 14,
              padding: 12,
              borderRadius: 12,
              backgroundColor: 'rgba(201,168,76,0.06)',
              borderWidth: 1,
              borderColor: 'rgba(201,168,76,0.18)',
            }}
          >
            <Text style={{ color: GOLD, fontSize: 12, fontWeight: '700', marginBottom: 4 }}>
              {plan.rationaleTitle}
            </Text>
            <Text style={{ color: 'rgba(240,244,255,0.65)', fontSize: 12, lineHeight: 17 }}>
              {plan.rationaleBody}
            </Text>
          </View>
        )}

        {/* CTA */}
        <View style={{ marginTop: 14 }}>
          <ShimmerButton
            label={plan.ctaLabel}
            subtext={plan.ctaSubtext}
            bgColor={GOLD}
            textColor={BG_DARK}
            loading={loading}
            onPress={onPress}
          />
        </View>

        {/* FOMO */}
        {plan.fomoText && (
          <View style={[styles.fomoStrip, { backgroundColor: 'rgba(255,71,87,0.06)' }]}>
            <PulsingDot color={RED} size={6} />
            <Text style={[styles.fomoText, { color: RED }]}>
              {founderSlots} founder slots - never restocked
            </Text>
          </View>
        )}
      </View>
    </Animated.View>
  );
}

function FamilyCard({
  plan,
  loading,
  onPress,
}: {
  plan: SubscriptionPlan;
  loading: boolean;
  onPress: () => void;
}) {
  const cardScale = useSharedValue(0.96);
  const cardOpacity = useSharedValue(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      cardScale.value = withSpring(1, { damping: 20, stiffness: 200 });
      cardOpacity.value = withTiming(1, { duration: 500 });
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: cardScale.value }],
    opacity: cardOpacity.value,
  }));

  return (
    <Animated.View style={[cardStyle, styles.familyCard]}>
      {/* Floating badge */}
      <View style={styles.floatingBadgeTeal}>
        <Text style={[styles.floatingBadgeText, { color: TEAL }]}>{plan.floatingBadge}</Text>
      </View>

      <View style={{ padding: 14, paddingTop: 8 }}>
        {/* Sub-header */}
        <View style={styles.subHeaderRow}>
          <View style={styles.subHeaderLeft}>
            <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
              <Path
                d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"
                stroke={TEAL}
                strokeWidth={2}
                strokeLinecap="round"
              />
              <SVGCircle cx={9} cy={7} r={4} stroke={TEAL} strokeWidth={2} />
              <Path
                d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"
                stroke={TEAL}
                strokeWidth={2}
                strokeLinecap="round"
              />
            </Svg>
            <Text style={[styles.subHeaderTitle, { color: TEAL }]}>Family Guardian</Text>
          </View>
          <View style={styles.peopleChip}>
            <Text style={[styles.peopleChipText, { color: TEAL }]}>5 People</Text>
          </View>
        </View>

        {plan.subheadline && (
          <Text style={{ color: 'rgba(240,244,255,0.55)', fontSize: 12, marginBottom: 8, lineHeight: 17 }}>
            {plan.subheadline}
          </Text>
        )}

        {/* Price */}
        <Text style={styles.strikethrough}>{plan.strikethroughPrice}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 4 }}>
          <Text style={[styles.priceMain, { color: TEAL }]}>{plan.priceDisplay}</Text>
          <Text style={styles.pricePeriodMuted}>/month</Text>
        </View>
        {plan.savingsBadgeText && (
          <View style={[styles.goldBadgePill, { backgroundColor: 'rgba(46,213,115,0.10)', borderColor: 'rgba(46,213,115,0.22)' }]}>
            <Text style={[styles.savingsBadgeText, { color: GREEN }]}>{plan.savingsBadgeText}</Text>
          </View>
        )}
        {plan.equivalentText && (
          <Text style={styles.equivalentText}>{plan.equivalentText}</Text>
        )}

        <View style={styles.divider} />

        {/* Features */}
        {plan.features.map((f) => (
          <FeatureRow key={f.text} feature={f} accentColor={TEAL} />
        ))}

        {/* CTA */}
        <View style={{ marginTop: 14 }}>
          <ShimmerButton
            label={plan.ctaLabel}
            bgColor={TEAL}
            textColor={BG_DARK}
            loading={loading}
            onPress={onPress}
          />
        </View>

        {/* FOMO */}
        {plan.fomoText && (
          <View style={[styles.fomoStrip, { backgroundColor: 'rgba(0,229,200,0.06)' }]}>
            <PulsingDot color={TEAL} size={6} />
            <Text style={[styles.fomoText, { color: TEAL }]}>{plan.fomoText}</Text>
          </View>
        )}
      </View>
    </Animated.View>
  );
}

function ProYearlyCard({
  plan,
  loading,
  onPress,
}: {
  plan: SubscriptionPlan;
  loading: boolean;
  onPress: () => void;
}) {
  const cardScale = useSharedValue(0.96);
  const cardOpacity = useSharedValue(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      cardScale.value = withSpring(1, { damping: 20, stiffness: 200 });
      cardOpacity.value = withTiming(1, { duration: 500 });
    }, 150);
    return () => clearTimeout(timer);
  }, []);

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: cardScale.value }],
    opacity: cardOpacity.value,
  }));

  return (
    <Animated.View style={[cardStyle, styles.proYearlyCard]}>
      {/* Floating badge */}
      <View style={styles.floatingBadgeGreen}>
        <Text style={[styles.floatingBadgeText, { color: GREEN }]}>{plan.floatingBadge}</Text>
      </View>

      {/* Savings bar */}
      <View style={styles.savingsBar}>
        <Text style={styles.savingsBarText}>{plan.savingsBarLeft}</Text>
        <Text style={styles.savingsBarText}>{plan.savingsBarRight}</Text>
      </View>

      <View style={{ padding: 14, paddingTop: 10 }}>
        <Text style={{ color: GREEN, fontSize: 13, fontWeight: '700', marginBottom: 6 }}>
          {plan.name}
        </Text>
        {/* Price */}
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 4 }}>
          <Text style={[styles.priceMain, { color: GREEN, fontSize: 36 }]}>{plan.priceDisplay}</Text>
          <Text style={styles.pricePeriodMuted}>/month</Text>
        </View>
        {plan.priceBilledAs && (
          <Text style={styles.billedAs}>{plan.priceBilledAs}</Text>
        )}
        {plan.savingsBadgeText && (
          <View style={[styles.goldBadgePill, { backgroundColor: 'rgba(46,213,115,0.10)', borderColor: 'rgba(46,213,115,0.22)' }]}>
            <Text style={[styles.savingsBadgeText, { color: GREEN }]}>{plan.savingsBadgeText}</Text>
          </View>
        )}
        {plan.equivalentText && (
          <Text style={styles.equivalentText}>{plan.equivalentText}</Text>
        )}

        {/* Comparison nudge */}
        <View style={styles.nudgeBox}>
          <Text style={[styles.nudgeText, { color: GREEN }]}>2 months free vs paying monthly</Text>
        </View>

        <View style={styles.divider} />

        {/* Features */}
        {plan.features.map((f) => (
          <FeatureRow key={f.text} feature={f} accentColor={GREEN} />
        ))}

        {/* CTA */}
        <View style={{ marginTop: 14 }}>
          <ShimmerButton
            label={plan.ctaLabel}
            bgColor={GREEN}
            textColor={BG_DARK}
            loading={loading}
            onPress={onPress}
          />
        </View>

        {/* FOMO */}
        {plan.fomoText && (
          <View style={[styles.fomoStrip, { backgroundColor: 'rgba(46,213,115,0.06)' }]}>
            <PulsingDot color={GREEN} size={6} />
            <Text style={[styles.fomoText, { color: GREEN }]}>{plan.fomoText}</Text>
          </View>
        )}
      </View>
    </Animated.View>
  );
}

function ProMonthlyCard({
  plan,
  loading,
  onPress,
  hideYearlyNudge = false,
}: {
  plan: SubscriptionPlan;
  loading: boolean;
  onPress: () => void;
  hideYearlyNudge?: boolean;
}) {
  const cardScale = useSharedValue(0.96);
  const cardOpacity = useSharedValue(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      cardScale.value = withSpring(1, { damping: 20, stiffness: 200 });
      cardOpacity.value = withTiming(1, { duration: 500 });
    }, 150);
    return () => clearTimeout(timer);
  }, []);

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: cardScale.value }],
    opacity: cardOpacity.value,
  }));

  return (
    <Animated.View style={[cardStyle, styles.proMonthlyCard]}>
      <View style={{ padding: 14 }}>
        <Text style={{ color: BLUE, fontSize: 13, fontWeight: '700', marginBottom: 4 }}>
          {plan.name}
        </Text>
        <Text style={styles.premonthlyNote}>
          {hideYearlyNudge ? 'Monthly membership' : 'Or start monthly - no commitment'}
        </Text>

        {/* Price */}
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 4 }}>
          <Text style={[styles.priceMain, { color: BLUE, fontSize: 32 }]}>{plan.priceDisplay}</Text>
          <Text style={styles.pricePeriodMuted}>/month</Text>
        </View>
        {plan.priceBilledAs && (
          <Text style={styles.billedAs}>{plan.priceBilledAs}</Text>
        )}

        {/* Nudge box */}
        {!hideYearlyNudge ? (
        <View style={[styles.nudgeBox, { marginTop: 10 }]}>
          <Text style={[styles.nudgeText, { color: GREEN }]}>Save $39.89/year by choosing yearly above</Text>
        </View>
        ) : null}

        <View style={styles.divider} />

        {/* Features */}
        {plan.features.map((f) => (
          <FeatureRow key={f.text} feature={f} accentColor={BLUE} />
        ))}

        {/* CTA - deliberately shorter */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={onPress}
          disabled={loading}
          style={[styles.monthlyCtaBtn, { backgroundColor: loading ? 'rgba(30,144,255,0.45)' : 'rgba(30,144,255,0.85)' }]}
        >
          <Text style={styles.monthlyCtaText}>{loading ? 'Processing...' : plan.ctaLabel}</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

function FreeCard({ onContinue }: { onContinue: () => void }) {
  return (
    <View style={styles.freeCard}>
      <View style={styles.freeCardRow}>
        <View>
          <Text style={styles.freePlanTitle}>Explore Guardian</Text>
          <Text style={styles.freePlanSub}>Get started at no cost. Upgrade anytime for premium features.</Text>
        </View>
        <TouchableOpacity onPress={onContinue} hitSlop={8}>
          <Text style={styles.freeContinueText}>Continue →</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.freePlanNote}>10 scans · 3 reports · 20 AI questions included.</Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Trust badges
// ---------------------------------------------------------------------------

function TrustBadges() {
  const items = [
    { icon: '+', title: 'Easy to use', sub: 'Set up in minutes' },
    { icon: '👨‍👩‍👧‍👦', title: 'Built for families', sub: 'Up to 5 profiles' },
    { icon: '★', title: 'Personalised', sub: 'For every member' },
    { icon: '🔒', title: 'Private & secure', sub: 'App Store · Google Play' },
    { icon: '✓', title: 'Cancel anytime', sub: 'No questions asked' },
    { icon: '⚡', title: 'Instant access', sub: 'Active right after purchase' },
  ];

  return (
    <View style={{ paddingHorizontal: 12, paddingBottom: 10 }}>
      <Text style={styles.trustSectionLabel}>WHY THOUSANDS TRUST US</Text>
      <View style={styles.trustGrid}>
        {items.map((item) => (
          <View key={item.title} style={styles.trustCard}>
            <View style={styles.trustIconCircle}>
              <Text style={{ fontSize: 12, color: TEAL }}>{item.icon}</Text>
            </View>
            <Text style={styles.trustTitle}>{item.title}</Text>
            <Text style={styles.trustSub}>{item.sub}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Social proof ticker
// ---------------------------------------------------------------------------

function SocialProofTicker({ founderSlots }: { founderSlots: number }) {
  const claimedCount = 500 - founderSlots;
  const founderSlotItem = `${claimedCount} of 500 founder slots claimed`;
  const allItems = [...TICKER_ITEMS, founderSlotItem, ...TICKER_ITEMS, founderSlotItem];
  const translateX = useSharedValue(0);
  const [totalWidth, setTotalWidth] = useState(0);

  useEffect(() => {
    if (totalWidth === 0) return;
    translateX.value = 0;
    translateX.value = withRepeat(
      withTiming(-(totalWidth / 2), { duration: 16000, easing: Easing.linear }),
      -1,
      false
    );
  }, [totalWidth]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <View style={styles.tickerContainer}>
      <Animated.View
        style={[{ flexDirection: 'row', alignItems: 'center' }, animStyle]}
        onLayout={(e) => setTotalWidth(e.nativeEvent.layout.width)}
      >
        {allItems.map((item, i) => (
          <View key={i} style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={styles.tickerText}>{item}</Text>
            <Text style={[styles.tickerDot, { color: GOLD }]}> · </Text>
          </View>
        ))}
      </Animated.View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Urgency bar
// ---------------------------------------------------------------------------

function UrgencyBar({ founderSlots }: { founderSlots: number }) {
  const [seconds, setSeconds] = useState(() => Math.floor(Math.random() * (28800 - 7200 + 1)) + 7200);

  useEffect(() => {
    const id = setInterval(() => setSeconds((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
  }, []);

  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const timeStr = `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;

  return (
    <View style={styles.urgencyBar}>
      <PulsingDot color={RED} size={7} />
      <Text style={styles.urgencyText} numberOfLines={1}>
        {founderSlots} of 500 lifetime founder slots remaining
      </Text>
      <Text style={styles.urgencyTimer}>{timeStr}</Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Main subscription screen (native IAP via store + Adapty).
export type SubscriptionScreenVariant = 'settings' | 'onboarding';

export type SubscriptionScreenContentProps = {
  variant?: SubscriptionScreenVariant;
  /** Onboarding: advance funnel when user skips via Free plan. */
  onContinueFree?: () => void;
  /** Onboarding: advance funnel after successful purchase. */
  onPurchaseSuccess?: () => void;
};

export function SubscriptionScreenContent({
  variant = 'settings',
  onContinueFree,
  onPurchaseSuccess,
}: SubscriptionScreenContentProps = {}) {
  const isOnboarding = variant === 'onboarding';
  const router = useRouter();
  const queryClient = useQueryClient();
  const session = useAuthStore((s) => s.session);
  const userId = session?.user?.id;

  const [billingCycle, setBillingCycle] = useState<'yearly' | 'monthly'>(isOnboarding ? 'monthly' : 'yearly');
  const [loadingPlanId, setLoadingPlanId] = useState<PlanId | null>(null);
  const [founderSlots, setFounderSlots] = useState(373);
  const [successPlanId, setSuccessPlanId] = useState<PlanId | null>(null);
  const [rcPackages, setRcPackages] = useState<AdaptyPaywallProduct[]>([]);
  const [restoring, setRestoring] = useState(false);

  // Rotating hero message
  const [msgIdx, setMsgIdx] = useState(0);
  const rotOpacity = useSharedValue(1);

  useEffect(() => {
    const interval = setInterval(() => {
      rotOpacity.value = withTiming(0, { duration: 300 }, () => {
        runOnJS(setMsgIdx)((prev) => (prev + 1) % ROTATING_MESSAGES.length);
        rotOpacity.value = withTiming(1, { duration: 300 });
      });
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const rotStyle = useAnimatedStyle(() => ({ opacity: rotOpacity.value }));

  // Load founder slots
  useEffect(() => {
    getFounderSlotsRemaining().then(setFounderSlots).catch(() => {});
  }, []);

  // Load paywall products on mount (non-blocking)
  useEffect(() => {
    getAvailablePackages()
      .then(setRcPackages)
      .catch(() => {});
  }, []);

  // Restore purchases — e.g. after device wipe or app reinstall.
  const handleRestorePurchases = useCallback(async () => {
    if (!userId) return;
    setRestoring(true);
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const result = await restorePurchases();
      if (result.success) {
        const ent = result.customerInfo?.entitlements.active[ENTITLEMENT_ID];
        if (ent?.isActive) {
          void queryClient.invalidateQueries({ queryKey: ['subscription', userId] });
          void queryClient.invalidateQueries({ queryKey: ['subscription-tier', userId] });
          void queryClient.invalidateQueries({ queryKey: ['profile', userId] });
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          Alert.alert('Purchases Restored', 'Your TruWell AI subscription has been restored.');
        } else {
          Alert.alert('Nothing to Restore', 'No active subscription was found for this account.');
        }
      } else if (result.error) {
        Alert.alert('Restore Failed', result.error);
      }
    } catch (err) {
      Alert.alert('Restore Failed', 'Please try again or contact support.');
    } finally {
      setRestoring(false);
    }
  }, [userId, queryClient]);

  // Purchase handler — App Store / Google Play IAP.
  // Falls back to dev/Expo-Go direct update if no packages are loaded.
  const handlePurchase = useCallback(
    async (planId: PlanId) => {
      if (!userId) {
        Alert.alert('Sign in required', 'Please sign in to upgrade your plan.');
        return;
      }

      if (planId === 'free') {
        router.back();
        return;
      }

      setLoadingPlanId(planId);
      try {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

        const storePid = storeProductForPlan(planId);
        const matchingPackage = storePid
          ? rcPackages.find((pkg) => pkg.vendorProductId === storePid)
          : undefined;

        if (matchingPackage) {
          const result = await purchaseMobileSubscription(matchingPackage);
          if (!result.success) {
            if (result.reason !== 'cancelled' && result.error) {
              Alert.alert('Purchase failed', result.error);
            }
            return;
          }
        } else if (isExpoGo() || !isRevenueCatReady()) {
          // Dev / Expo-Go: no store packages — direct profile update only
          const { error: profileErr } = await supabase
            .from('profiles')
            .update({ subscription_plan: planId })
            .eq('id', userId);
          if (profileErr) throw new Error(profileErr.message);

          await supabase.from('subscription_events').insert({
            user_id: userId,
            event_type: 'subscription_started',
            plan: planId,
            currency: 'usd',
          });
        } else {
          Alert.alert(
            'Plan unavailable',
            'This plan could not be loaded from the store. Try again shortly or open Subscription from Profile.',
          );
          return;
        }

        void queryClient.invalidateQueries({ queryKey: ['subscription', userId] });
        void queryClient.invalidateQueries({ queryKey: ['subscription-tier', userId] });
        void queryClient.invalidateQueries({ queryKey: ['profile', userId] });

        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setSuccessPlanId(planId);
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Purchase failed. Please try again.';
        Alert.alert('Purchase error', msg);
      } finally {
        setLoadingPlanId(null);
      }
    },
    [userId, queryClient, router, rcPackages]
  );

  const finishAfterPurchase = useCallback(() => {
    setSuccessPlanId(null);
    if (onPurchaseSuccess) {
      onPurchaseSuccess();
      return;
    }
    router.back();
  }, [onPurchaseSuccess, router]);

  const continueWithFree = useCallback(() => {
    if (onContinueFree) {
      onContinueFree();
      return;
    }
    router.back();
  }, [onContinueFree, router]);

  // Filter plans based on billing toggle (onboarding: lifetime, family, monthly, free).
  const plansToShow = DISPLAYED_PLANS.filter((p) => {
    if (isOnboarding) {
      return (
        p.id === 'lifetime' ||
        p.id === 'family' ||
        p.id === 'pro_monthly' ||
        p.id === 'free'
      );
    }
    if (p.id === 'pro_monthly') return billingCycle === 'monthly';
    if (p.id === 'pro_yearly') return billingCycle === 'yearly';
    return true;
  });

  if (successPlanId) {
    const plan = getPlanById(successPlanId);
    return (
      <PurchaseSuccessView
        plan={plan}
        onContinue={finishAfterPurchase}
        founderSlots={founderSlots}
      />
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TruWellShield size={40} animated={false} />
          <Text style={styles.headline}>
            {isOnboarding ? (
              <>
                Choose how fast you get your{' '}
                <Text style={{ color: GOLD }}>results</Text>
              </>
            ) : (
              <>
                Protect What{' '}
                <Text style={{ color: GOLD }}>Matters Most</Text>
              </>
            )}
          </Text>
          {!isOnboarding && (
            <Text style={{ color: 'rgba(240,244,255,0.55)', fontSize: 13, textAlign: 'center', marginTop: 4, marginBottom: 2 }}>
              Personalised wellness support for you and the people you love.
            </Text>
          )}
          <Animated.Text style={[styles.rotatingMsg, rotStyle]}>
            {isOnboarding
              ? 'Founder Lifetime, Family Guardian, and monthly Pro unlock unlimited scans, reports, and AI coaching.'
              : ROTATING_MESSAGES[msgIdx]}
          </Animated.Text>
          {!isOnboarding && (
            <View style={{ flexDirection: 'row', gap: 14, marginTop: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
              <Text style={{ color: 'rgba(240,244,255,0.55)', fontSize: 12, fontWeight: '600' }}>
                ⭐ Trusted by thousands
              </Text>
              <Text style={{ color: 'rgba(240,244,255,0.55)', fontSize: 12, fontWeight: '600' }}>
                🔒 Private & Secure
              </Text>
              <Text style={{ color: 'rgba(240,244,255,0.55)', fontSize: 12, fontWeight: '600' }}>
                👨‍👩‍👧‍👦 Built for families
              </Text>
            </View>
          )}
        </View>

        {/* Social proof ticker */}
        <SocialProofTicker founderSlots={founderSlots} />

        {/* Urgency bar */}
        <UrgencyBar founderSlots={founderSlots} />

        {/* Billing toggle — settings only (onboarding shows lifetime, family, monthly, free) */}
        {!isOnboarding ? (
        <View style={styles.toggleSection}>
          <View style={styles.togglePill}>
            <TouchableOpacity
              onPress={() => setBillingCycle('monthly')}
              style={[styles.toggleBtn, billingCycle === 'monthly' && styles.toggleBtnActive]}
            >
              <Text style={[styles.toggleBtnText, billingCycle === 'monthly' && styles.toggleBtnTextActive]}>
                Monthly
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setBillingCycle('yearly')}
              style={[styles.toggleBtn, billingCycle === 'yearly' && styles.toggleBtnActive]}
            >
              <Text style={[styles.toggleBtnText, billingCycle === 'yearly' && styles.toggleBtnTextActive]}>
                Yearly
              </Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.toggleSaveText}>Save 33% yearly - 2 months free</Text>
        </View>
        ) : null}

        {/* No separate promo row here: plans render directly below */}

        {/* Plan cards */}
        <View style={styles.cardsContainer}>
          {plansToShow.map((plan) => {
            const familyCycle =
              isOnboarding && plan.id === 'family' ? 'yearly' : billingCycle;
            const displayPlan = withFamilyPlanForBillingCycle(plan, familyCycle);
            const isLoading = loadingPlanId === plan.id;

            if (plan.id === 'lifetime') {
              return (
                <LifetimeCard
                  key={plan.id}
                  plan={plan}
                  founderSlots={founderSlots}
                  loading={isLoading}
                  onPress={() => void handlePurchase('lifetime')}
                />
              );
            }
            if (plan.id === 'family') {
              return (
                <FamilyCard
                  key={plan.id}
                  plan={displayPlan}
                  loading={isLoading}
                  onPress={() => void handlePurchase('family')}
                />
              );
            }
            if (plan.id === 'pro_yearly') {
              return (
                <ProYearlyCard
                  key={plan.id}
                  plan={displayPlan}
                  loading={isLoading}
                  onPress={() => void handlePurchase('pro_yearly')}
                />
              );
            }
            if (plan.id === 'pro_monthly') {
              return (
                <ProMonthlyCard
                  key={plan.id}
                  plan={displayPlan}
                  loading={isLoading}
                  onPress={() => void handlePurchase('pro_monthly')}
                  hideYearlyNudge={isOnboarding}
                />
              );
            }
            if (plan.id === 'free') {
              return <FreeCard key={plan.id} onContinue={continueWithFree} />;
            }
            return null;
          })}
        </View>

        {/* Trust badges */}
        <TrustBadges />

        {/* Restore purchases */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => void handleRestorePurchases()}
          disabled={restoring}
          style={styles.restoreBtn}
        >
          <Text style={styles.restoreBtnText}>
            {restoring ? 'Restoring...' : 'Restore Purchases'}
          </Text>
        </TouchableOpacity>

        {/* Subscription legal notes — required by App Store guidelines */}
        <Text style={styles.subLegal}>
          Subscriptions auto-renew unless cancelled at least 24 hours before the end
          of the current period. Manage or cancel anytime in your iOS Settings or
          Google Play account. Payment is charged to your store account at confirmation
          of purchase.
        </Text>

        {/* Bottom spacer */}
        <View style={{ height: 16 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Purchase success view (inline, not a modal per spec requirements)
// ---------------------------------------------------------------------------

function PurchaseSuccessView({
  plan,
  onContinue,
  founderSlots,
}: {
  plan: SubscriptionPlan;
  onContinue: () => void;
  founderSlots: number;
}) {
  const contentScale = useSharedValue(0.8);
  const contentOpacity = useSharedValue(0);

  useEffect(() => {
    contentScale.value = withSpring(1, { damping: 15, stiffness: 180 });
    contentOpacity.value = withTiming(1, { duration: 400 });
  }, []);

  const contentStyle = useAnimatedStyle(() => ({
    transform: [{ scale: contentScale.value }],
    opacity: contentOpacity.value,
  }));

  const claimedNow = 500 - founderSlots;
  const bodyText: Record<string, string> = {
    lifetime:
      `You are now Founder #${claimedNow}. Your protection is permanent. Every scan, every report, every future feature - yours forever.`,
    family:
      'Five profiles unlocked. Unlimited scans for your household. What hides in the label no longer hides from you.',
    pro_yearly: 'Unlimited protection activated. Scan anything. Know everything.',
    pro_monthly: 'Unlimited protection activated. Scan anything. Know everything.',
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: BG_DARK, justifyContent: 'center' }]} edges={['top']}>
      <Animated.View style={[{ alignItems: 'center', paddingHorizontal: 28, gap: 16 }, contentStyle]}>
        <TruWellShield size={80} showCheckmark animated={false} />

          <Text style={styles.successHeadline}>
            You are now {plan.name}
          </Text>
        <Text style={styles.successBody}>
          {bodyText[plan.id] ?? 'Unlimited protection activated. Scan anything. Know everything.'}
        </Text>

        <TouchableOpacity
          onPress={onContinue}
          style={styles.successBtn}
          activeOpacity={0.85}
        >
          <Text style={styles.successBtnText}>Continue</Text>
        </TouchableOpacity>
      </Animated.View>
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG_DARK },
  scroll: { paddingBottom: 20 },

  // Header
  header: { alignItems: 'center', paddingTop: 20, paddingBottom: 14, paddingHorizontal: 20, gap: 8 },
  headline: { fontSize: 22, fontWeight: '900', letterSpacing: -0.5, color: '#F0F4FF', textAlign: 'center' },
  rotatingMsg: { fontSize: 11, color: 'rgba(240,244,255,0.45)', fontStyle: 'italic', textAlign: 'center' },

  // Ticker
  tickerContainer: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    paddingVertical: 7,
    overflow: 'hidden',
  },
  tickerText: { fontSize: 10, color: 'rgba(240,244,255,0.45)', fontWeight: '700', paddingHorizontal: 8 },
  tickerDot: { fontSize: 10, fontWeight: '700' },

  // Urgency bar
  urgencyBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,71,87,0.09)',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(255,71,87,0.20)',
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  urgencyText: { fontSize: 11, color: RED, fontWeight: '700', flex: 1 },
  urgencyTimer: { fontSize: 11, color: RED, fontWeight: '800', fontVariant: ['tabular-nums'] },

  // Billing toggle
  toggleSection: { alignItems: 'center', paddingVertical: 10, paddingBottom: 4 },
  togglePill: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.09)',
    borderRadius: 999,
    padding: 3,
  },
  toggleBtn: { paddingHorizontal: 20, paddingVertical: 8, borderRadius: 999 },
  toggleBtnActive: { backgroundColor: TEAL },
  toggleBtnText: { fontSize: 13, fontWeight: '700', color: 'rgba(240,244,255,0.40)' },
  toggleBtnTextActive: { color: BG_DARK },
  toggleSaveText: { fontSize: 10, color: GREEN, fontWeight: '700', marginTop: 6 },

  // Cards container
  cardsContainer: { paddingHorizontal: 12, paddingTop: 10, gap: 10 },

  // Lifetime card
  lifetimeCard: {
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: 'rgba(201,168,76,0.40)',
    backgroundColor: '#080D08',
    overflow: 'hidden',
  },
  lifetimeBanner: {
    backgroundColor: GOLD,
    paddingHorizontal: 14,
    paddingVertical: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lifetimeBannerLeft: { fontSize: 10, fontWeight: '800', color: BG_DARK, letterSpacing: 2 },
  lifetimeBannerRight: { fontSize: 8, fontWeight: '700', color: 'rgba(2,10,20,0.65)', letterSpacing: 1 },

  // Family card
  familyCard: {
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: 'rgba(0,229,200,0.30)',
    backgroundColor: '#050D12',
    overflow: 'hidden',
    paddingTop: 14,
  },
  floatingBadgeTeal: {
    position: 'absolute',
    top: -1,
    alignSelf: 'center',
    backgroundColor: 'rgba(0,229,200,0.12)',
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: 'rgba(0,229,200,0.28)',
    borderBottomLeftRadius: 9,
    borderBottomRightRadius: 9,
    paddingHorizontal: 12,
    paddingVertical: 4,
    zIndex: 1,
  },
  floatingBadgeText: { fontSize: 9, fontWeight: '800', letterSpacing: 1.5 },

  // Pro yearly card
  proYearlyCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(46,213,115,0.25)',
    backgroundColor: '#020A14',
    overflow: 'hidden',
    paddingTop: 12,
  },
  floatingBadgeGreen: {
    position: 'absolute',
    top: -1,
    alignSelf: 'center',
    backgroundColor: 'rgba(46,213,115,0.10)',
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: 'rgba(46,213,115,0.22)',
    borderBottomLeftRadius: 9,
    borderBottomRightRadius: 9,
    paddingHorizontal: 12,
    paddingVertical: 4,
    zIndex: 1,
  },
  savingsBar: {
    backgroundColor: 'rgba(46,213,115,0.07)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(46,213,115,0.12)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  savingsBarText: { fontSize: 9, fontWeight: '800', color: GREEN, letterSpacing: 1.2 },

  // Pro monthly card
  proMonthlyCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(30,144,255,0.22)',
    backgroundColor: '#020A14',
  },
  premonthlyNote: { fontSize: 10, color: 'rgba(240,244,255,0.30)', fontStyle: 'italic', marginBottom: 5 },
  monthlyCtaBtn: {
    marginTop: 14,
    height: 50,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthlyCtaText: { fontSize: 14, fontWeight: '800', color: '#F0F4FF' },

  // Free card
  freeCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  freeCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    paddingHorizontal: 14,
  },
  freePlanTitle: { fontSize: 13, fontWeight: '600', color: 'rgba(240,244,255,0.38)' },
  freePlanSub: { fontSize: 10, color: 'rgba(240,244,255,0.20)', marginTop: 2 },
  freeContinueText: { fontSize: 11, fontWeight: '700', color: 'rgba(240,244,255,0.30)' },
  freePlanNote: {
    fontSize: 9,
    color: 'rgba(240,244,255,0.18)',
    textAlign: 'center',
    fontStyle: 'italic',
    paddingHorizontal: 14,
    paddingBottom: 10,
  },

  // Shared card elements
  priceRowSplit: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  strikethrough: { fontSize: 12, color: 'rgba(240,244,255,0.30)', textDecorationLine: 'line-through' },
  priceMain: { fontSize: 38, fontWeight: '800', letterSpacing: -1.5 },
  pricePeriodMuted: { fontSize: 12, color: 'rgba(240,244,255,0.50)', marginBottom: 6 },
  goldBadgePill: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(201,168,76,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(201,168,76,0.22)',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 3,
    marginTop: 4,
  },
  savingsBadgeText: { fontSize: 9, fontWeight: '800' },
  billedAs: { fontSize: 10, color: 'rgba(240,244,255,0.35)', fontStyle: 'italic', marginTop: 2 },
  equivalentText: { fontSize: 10, color: 'rgba(240,244,255,0.30)', fontStyle: 'italic', marginTop: 4 },
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.06)', marginVertical: 10 },
  nudgeBox: {
    backgroundColor: 'rgba(46,213,115,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(46,213,115,0.14)',
    borderRadius: 10,
    padding: 7,
    paddingHorizontal: 10,
    marginTop: 8,
  },
  nudgeText: { fontSize: 10, fontWeight: '700' },
  ctaSubtext: { fontSize: 9, color: 'rgba(240,244,255,0.30)', textAlign: 'center', marginTop: 5 },

  // Lifetime stat box
  lifetimeStatBox: {
    backgroundColor: 'rgba(201,168,76,0.09)',
    borderWidth: 1,
    borderColor: 'rgba(201,168,76,0.22)',
    borderRadius: 10,
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lifetimeStatNum: { fontSize: 18, fontWeight: '800', letterSpacing: -0.5 },
  lifetimeStatLabel: { fontSize: 7, color: 'rgba(201,168,76,0.60)', fontWeight: '700', letterSpacing: 1 },

  // Slot indicator
  slotRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  slotLabel: { fontSize: 10, color: 'rgba(240,244,255,0.35)' },

  // Feature row
  featureRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 6 },
  featureCircle: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: 1,
  },
  featureTextRow: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6 },
  featureBadge: {
    backgroundColor: 'rgba(201,168,76,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(201,168,76,0.25)',
    borderRadius: 999,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  featureBadgeText: { fontSize: 8, fontWeight: '800' },

  // Sub-header (family card)
  subHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  subHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  subHeaderTitle: { fontSize: 12, fontWeight: '700' },
  peopleChip: {
    backgroundColor: 'rgba(0,229,200,0.09)',
    borderWidth: 1,
    borderColor: 'rgba(0,229,200,0.18)',
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 3,
  },
  peopleChipText: { fontSize: 9, fontWeight: '800' },

  // FOMO strip
  fomoStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 7,
    marginTop: 8,
  },
  fomoText: { fontSize: 10, fontWeight: '700' },

  // Trust badges
  trustSectionLabel: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 3,
    color: TEAL,
    textAlign: 'center',
    paddingVertical: 10,
    paddingBottom: 4,
  },
  trustGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  trustCard: {
    width: '47.5%',
    backgroundColor: 'rgba(255,255,255,0.025)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    borderRadius: 12,
    padding: 9,
    paddingHorizontal: 11,
    alignItems: 'center',
  },
  trustIconCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(0,229,200,0.09)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  trustTitle: { fontSize: 11, fontWeight: '700', color: 'rgba(240,244,255,0.65)', marginBottom: 1, textAlign: 'center' },
  trustSub: { fontSize: 9, color: 'rgba(240,244,255,0.30)', textAlign: 'center' },

  restoreBtn: {
    alignSelf: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginTop: 8,
  },
  restoreBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(240,244,255,0.45)',
    textDecorationLine: 'underline',
  },

  // Subscription legal copy (required by App Store / Play Store)
  subLegal: {
    marginHorizontal: 24,
    marginTop: 12,
    fontSize: 10,
    lineHeight: 15,
    color: 'rgba(240,244,255,0.28)',
    textAlign: 'center',
  },

  // Purchase success view
  successHeadline: { fontSize: 24, fontWeight: '900', color: '#F0F4FF', textAlign: 'center', letterSpacing: -0.5 },
  successBody: { fontSize: 15, color: 'rgba(240,244,255,0.65)', textAlign: 'center', lineHeight: 22 },
  successBtn: {
    marginTop: 8,
    width: '100%',
    height: 56,
    borderRadius: 14,
    backgroundColor: TEAL,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successBtnText: { fontSize: 16, fontWeight: '800', color: BG_DARK },
});

export default function SubscriptionScreen() {
  return <SubscriptionScreenContent />;
}
