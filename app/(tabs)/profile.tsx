import { TruWellErrorBoundary, RootErrorBoundary } from '@/components/TruWellErrorBoundary';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
import { SegmentedIndicator } from '@/components/ui/SegmentedIndicator';
import { signOutGoogle } from '@/lib/googleAuth';
import { supabase } from '@/lib/supabase';
import { hapticLight } from '@/lib/haptics';
import { requestAccountDeletion } from '@/lib/accountDeletion';
import { getQuotaStatus, type QuotaStatus } from '@/lib/quotaManager';
import { restorePurchases } from '@/lib/adapty';
import { pickAndUploadProfileAvatar } from '@/lib/profileAvatarUpload';
import { getFamilyGroupForOwner, type FamilyGroupInfo } from '@/lib/familyPlan';
import { buildReferralJoinUrl, buildReferralShareMessage } from '@/lib/referralLink';
import { isPro as isPlanPro, type PlanId } from '@/lib/subscriptionPlans';
import * as Clipboard from 'expo-clipboard';
import Constants from 'expo-constants';
import * as Haptics from 'expo-haptics';
import { useAuthStore } from '@/stores/authStore';
import { useOnboardingStore } from '@/stores/onboardingStore';
import { useRewardStore } from '@/stores/rewardStore';
import { HealthProfile, useUserProfileStore } from '@/stores/userProfileStore';
import { useTheme } from '@/theme/ThemeContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
  ScrollView,
  Share,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, {
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Path as SvgPath } from 'react-native-svg';
import type { SegmentedIndicatorRef } from '@/components/ui/SegmentedIndicator';

export { TruWellErrorBoundary as ErrorBoundary };

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SubscriptionRow {
  tier: 'free' | 'pro' | 'premium';
  expires_at: string | null;
}

interface UserPreferences {
  smart_alerts: boolean;
}

type ProfileOnboardingRow = {
  display_name: string | null;
  avatar_url: string | null;
  role: string | null;
  care_goals: string[] | null;
  health_conditions: string[] | null;
  lifestyle_factors: string[] | null;
  specialization: string | null;
  practice_type: string | null;
  patient_focus: string[] | null;
  preferred_tools: string[] | null;
  professional_goals: string[] | null;
  commitment_level: string | null;
  wellness_plan_generated: boolean | null;
  onboarding_role_path: string | null;
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const TIER_LABEL: Record<SubscriptionRow['tier'], string> = {
  free: 'Free',
  pro: 'Pro',
  premium: 'Premium',
};

const TIER_COLOR_KEY: Record<SubscriptionRow['tier'], 'text3' | 'teal' | 'gold'> = {
  free: 'text3',
  pro: 'teal',
  premium: 'gold',
};

function getInitials(name: string | null | undefined): string {
  if (!name) return '?';
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function formatMemberSince(iso: string | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

function countryFromLocale(locale: string | null | undefined): string | null {
  if (!locale) return null;
  const parts = locale.split(/[-_]/);
  const code = parts.length > 1 ? parts[parts.length - 1] : parts[0];
  if (code.length === 2) return code.toUpperCase();
  return null;
}

function scoreFromSleep(v: string | undefined): number {
  switch (v) {
    case 'Excellent':
      return 85;
    case 'Good':
      return 65;
    case 'Poor':
      return 45;
    case 'Very Poor':
      return 25;
    default:
      return 50;
  }
}

function scoreFromActivity(v: string | undefined): number {
  switch (v) {
    case 'Active':
      return 80;
    case 'Moderate':
      return 60;
    case 'Light':
      return 40;
    case 'Sedentary':
      return 25;
    default:
      return 50;
  }
}

function scoreFromStress(v: string | undefined): number {
  switch (v) {
    case 'Low':
      return 75;
    case 'Moderate':
      return 55;
    case 'High':
      return 35;
    default:
      return 50;
  }
}

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

function LongevityScoreCard({
  theme,
  dietPreference,
  assessmentAnswers,
  scansUsed,
  alertsCaught,
  healthScore,
}: {
  theme: ReturnType<typeof useTheme>['theme'];
  dietPreference?: string;
  assessmentAnswers: Record<string, string>;
  scansUsed: number;
  alertsCaught: number;
  healthScore: number;
}) {
  const storeScore = healthScore || 0;
  const nutrition = dietPreference ? 70 : 40;
  const sleep = scoreFromSleep(assessmentAnswers.sleep);
  const activity = scoreFromActivity(assessmentAnswers.activity);
  const stress = scoreFromStress(assessmentAnswers.stress);
  const scanSafety =
    scansUsed > 0 && alertsCaught / scansUsed < 0.3 ? 80 : 50;

  const dimensions = [
    { label: 'Nutrition', value: nutrition, color: theme.teal },
    { label: 'Sleep', value: sleep, color: theme.amber },
    { label: 'Activity', value: activity, color: theme.purple },
    { label: 'Stress', value: stress, color: theme.red },
    { label: 'Scan safety', value: scanSafety, color: '#3B82F6' },
  ];

  const composite = Math.round(
    dimensions.reduce((sum, d) => sum + d.value, 0) / dimensions.length
  );
  const displayScore = composite || 0;

  const ringProgress = useSharedValue(0);
  useEffect(() => {
    ringProgress.value = withTiming(displayScore / 100, { duration: 1200 });
  }, [displayScore, ringProgress]);

  const R = 42;
  const C = 2 * Math.PI * R;
  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: C * (1 - ringProgress.value),
  }));

  return (
    <View style={[cardStyles.block, { backgroundColor: theme.bg1, borderColor: theme.border }]}>
      <View style={cardStyles.headerRow}>
        <View>
          <Text style={[cardStyles.blockTitle, { color: theme.text1 }]}>Longevity Score</Text>
          <Text style={[cardStyles.updatedTag, { color: theme.text3, marginTop: 2 }]}>
            Assessment baseline: {storeScore}
          </Text>
        </View>
        <Text style={[cardStyles.updatedTag, { color: theme.text3 }]}>Updated today</Text>
      </View>

      <View style={cardStyles.ringRow}>
        <View style={cardStyles.ringWrap}>
          <Svg width={100} height={100}>
            <Circle
              cx={50}
              cy={50}
              r={R}
              stroke={`${theme.teal}20`}
              strokeWidth={8}
              fill="none"
            />
            <AnimatedCircle
              cx={50}
              cy={50}
              r={R}
              stroke={theme.teal}
              strokeWidth={8}
              fill="none"
              strokeDasharray={`${C} ${C}`}
              strokeLinecap="round"
              rotation={-90}
              origin="50, 50"
              animatedProps={animatedProps}
            />
          </Svg>
          <View style={cardStyles.ringCenter}>
            <Text style={[cardStyles.ringScore, { color: theme.text1 }]}>{displayScore}</Text>
          </View>
        </View>

        <View style={cardStyles.barsCol}>
          {dimensions.map((d) => (
            <View key={d.label} style={cardStyles.barRow}>
              <Text style={[cardStyles.barLabel, { color: theme.text3 }]}>{d.label}</Text>
              <View style={[cardStyles.barTrack, { backgroundColor: theme.bg3 }]}>
                <View
                  style={[
                    cardStyles.barFill,
                    { width: `${d.value}%`, backgroundColor: d.color },
                  ]}
                />
              </View>
              <Text style={[cardStyles.barVal, { color: theme.text2 }]}>{d.value}</Text>
            </View>
          ))}
        </View>
      </View>

      <Text style={[cardStyles.disclaimer, { color: theme.text3 }]}>
        This score is for wellness guidance only. It is not a medical diagnosis. Consult a
        qualified health professional for medical decisions.
      </Text>
    </View>
  );
}

function ProfileChip({
  label,
  theme,
  empty,
  onPress,
}: {
  label: string;
  theme: ReturnType<typeof useTheme>['theme'];
  empty?: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      activeOpacity={0.75}
      onPress={onPress}
      style={[
        cardStyles.chip,
        empty
          ? { backgroundColor: theme.bg3, borderColor: theme.border }
          : { backgroundColor: `${theme.teal}12`, borderColor: `${theme.teal}30` },
      ]}
    >
      <Text
        style={[
          cardStyles.chipText,
          { color: empty ? theme.text3 : theme.teal },
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function SettingsGroup({
  title,
  theme,
  children,
}: {
  title: string;
  theme: ReturnType<typeof useTheme>['theme'];
  children: ReactNode;
}) {
  return (
    <View style={[cardStyles.block, { backgroundColor: theme.bg1, borderColor: theme.border }]}>
      <Text style={[cardStyles.groupTitle, { color: theme.text3 }]}>{title}</Text>
      {children}
    </View>
  );
}

function SettingsNavRow({
  icon,
  label,
  sub,
  theme,
  onPress,
  last,
}: {
  icon: string;
  label: string;
  sub?: string;
  theme: ReturnType<typeof useTheme>['theme'];
  onPress: () => void;
  last?: boolean;
}) {
  return (
    <TouchableOpacity
      style={[cardStyles.settingsRow, last && cardStyles.settingsRowLast, { borderBottomColor: theme.border }]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <Text style={cardStyles.rowIcon}>{icon}</Text>
      <View style={cardStyles.rowLeft}>
        <Text style={[cardStyles.rowLabel, { color: theme.text1 }]}>{label}</Text>
        {sub ? <Text style={[cardStyles.rowSub, { color: theme.text3 }]}>{sub}</Text> : null}
      </View>
      <Text style={[cardStyles.rowChev, { color: theme.text3 }]}>›</Text>
    </TouchableOpacity>
  );
}

const cardStyles = StyleSheet.create({
  block: {
    marginHorizontal: 16,
    marginTop: 14,
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  blockTitle: { fontSize: 15, fontWeight: '800', letterSpacing: -0.2 },
  updatedTag: { fontSize: 10, fontWeight: '600' },
  ringRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  ringWrap: { width: 100, height: 100, alignItems: 'center', justifyContent: 'center' },
  ringCenter: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  ringScore: { fontSize: 28, fontWeight: '900', letterSpacing: -1 },
  barsCol: { flex: 1, gap: 6 },
  barRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  barLabel: { width: 72, fontSize: 9, fontWeight: '600' },
  barTrack: { flex: 1, height: 5, borderRadius: 3, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 3 },
  barVal: { width: 22, fontSize: 9, fontWeight: '800', textAlign: 'right' },
  disclaimer: { fontSize: 10, lineHeight: 15, marginTop: 12 },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  chip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 100, borderWidth: 1 },
  chipText: { fontSize: 11, fontWeight: '700' },
  promptLink: { fontSize: 12, fontWeight: '700', marginTop: 10 },
  groupTitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 44,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 10,
  },
  settingsRowLast: { borderBottomWidth: 0, paddingBottom: 6 },
  rowIcon: { fontSize: 16, width: 22, textAlign: 'center' },
  rowLeft: { flex: 1 },
  rowLabel: { fontSize: 14, fontWeight: '600' },
  rowSub: { fontSize: 11, fontWeight: '500', marginTop: 2 },
  rowChev: { fontSize: 20, fontWeight: '300' },
  milestoneRow: { flexDirection: 'row', gap: 12, minHeight: 44 },
  milestoneLine: { width: 2, flex: 1, marginLeft: 11, marginTop: -2, marginBottom: -2 },
  milestoneDot: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 2 },
  milestoneBody: { flex: 1, paddingBottom: 14 },
  milestoneTitle: { fontSize: 13, fontWeight: '700' },
  milestoneXp: { fontSize: 10, fontWeight: '700', marginTop: 2 },
  referralHeader: { borderTopLeftRadius: 18, borderTopRightRadius: 18, padding: 14, margin: -14, marginBottom: 12 },
  referralCode: { fontSize: 28, fontWeight: '900', letterSpacing: 4, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', textAlign: 'center', marginVertical: 10 },
  referralActions: { flexDirection: 'row', gap: 10 },
  referralBtn: { flex: 1, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  tierRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, gap: 10, borderBottomWidth: StyleSheet.hairlineWidth },
  shareBtnPrimary: { height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginTop: 10 },
  shareBtnSecondary: { height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginTop: 8, borderWidth: 1 },
});

const familyStyles = StyleSheet.create({
  hubBanner: {
    marginHorizontal: 16,
    marginTop: 10,
    borderRadius: 16,
    borderWidth: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
    gap: 0,
  },
  hubBannerLeft: {
    width: 56,
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
  },
  hubBannerIcon: { fontSize: 22 },
  hubBannerText: {
    flex: 1,
    padding: 12,
    gap: 2,
  },
  hubBannerTitle: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  hubBannerSub: {
    fontSize: 11,
    fontWeight: '600',
  },
  hubBannerAction: {
    fontSize: 10,
    fontWeight: '700',
    marginTop: 3,
  },
  memberCountBadge: {
    marginRight: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
  },
  memberCountNum: {
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  nudgeBanner: {
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 12,
    borderWidth: 1,
    padding: 10,
  },
  nudgeText: {
    fontSize: 11,
    fontWeight: '600',
    lineHeight: 16,
    textAlign: 'center',
  },
});

function SectionLabel({
  title,
  theme,
}: {
  title: string;
  theme: ReturnType<typeof useTheme>['theme'];
}) {
  return (
    <Text style={[styles.sectionLabel, { color: theme.text3 }]}>{title}</Text>
  );
}

// ---------------------------------------------------------------------------
// Subscription status card
// ---------------------------------------------------------------------------

function SubscriptionStatusCard({
  planId,
  quotaStatus,
  expiresAt,
  onUpgrade,
  onManage,
  theme,
}: {
  planId: PlanId;
  quotaStatus: QuotaStatus | null;
  expiresAt: string | null;
  onUpgrade: () => void;
  onManage: () => void;
  theme: ReturnType<typeof useTheme>['theme'];
}) {
  const isProPlan = isPlanPro(planId);

  if (planId === 'lifetime') {
    return (
      <View style={[subStyles.card, { backgroundColor: 'rgba(201,168,76,0.08)', borderColor: 'rgba(201,168,76,0.35)' }]}>
        <View style={[subStyles.accentStrip, { backgroundColor: '#C9A84C' }]} />
        <View style={subStyles.cardRow}>
          <Text style={{ fontSize: 18 }}>👑</Text>
          <View style={{ flex: 1 }}>
            <Text style={[subStyles.planName, { color: '#C9A84C' }]}>Lifetime Founder</Text>
            <Text style={[subStyles.planSub, { color: theme.text3 }]}>Unlimited everything · Forever</Text>
          </View>
        </View>
      </View>
    );
  }

  if (planId === 'family') {
    return (
      <View style={[subStyles.card, { backgroundColor: `${theme.teal}08`, borderColor: `${theme.teal}25` }]}>
        <View style={[subStyles.accentStrip, { backgroundColor: theme.teal }]} />
        <View style={subStyles.cardRow}>
          <View style={{ flex: 1 }}>
            <View style={subStyles.titleRow}>
              <Text style={[subStyles.planName, { color: theme.teal }]}>Family Guardian</Text>
              <View style={[subStyles.activePill, { backgroundColor: `${theme.green}18`, borderColor: `${theme.green}40` }]}>
                <Text style={[subStyles.activePillText, { color: theme.green }]}>Active</Text>
              </View>
            </View>
            <Text style={[subStyles.planSub, { color: theme.text3 }]}>Up to 5 family members · Unlimited scans · One subscription</Text>
            <Text style={[subStyles.planNote, { color: theme.text3 }]}>
              Your family members join using your invite code — this is separate from referring friends.
            </Text>
          </View>
        </View>
        <TouchableOpacity onPress={onManage} hitSlop={8}>
          <Text style={[subStyles.manageLink, { color: theme.teal }]}>Manage subscription</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (isProPlan) {
    return (
      <View style={[subStyles.card, { backgroundColor: `${theme.teal}05`, borderColor: `${theme.teal}25` }]}>
        <View style={[subStyles.accentStrip, { backgroundColor: theme.teal }]} />
        <View style={subStyles.cardRow}>
          <View style={{ flex: 1 }}>
            <View style={subStyles.titleRow}>
              <Text style={[subStyles.planName, { color: theme.teal }]}>
                {planId === 'pro_yearly' ? 'TruWell Pro Yearly' : 'TruWell Pro'}
              </Text>
              <View style={[subStyles.activePill, { backgroundColor: `${theme.green}18`, borderColor: `${theme.green}40` }]}>
                <Text style={[subStyles.activePillText, { color: theme.green }]}>Active</Text>
              </View>
            </View>
            <Text style={[subStyles.planSub, { color: theme.text3 }]}>Unlimited scans · Full protection</Text>
            {expiresAt && (
              <Text style={[subStyles.renewText, { color: theme.text3 }]}>
                Renews {new Date(expiresAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </Text>
            )}
          </View>
        </View>
        <TouchableOpacity onPress={onManage} hitSlop={8}>
          <Text style={[subStyles.manageLink, { color: theme.teal }]}>Manage subscription</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Free plan — show quota bars + upgrade CTA
  const scansUsed = quotaStatus?.scansUsed ?? 0;
  const reportsUsed = quotaStatus?.reportsUsed ?? 0;
  const resetDate = quotaStatus?.resetDate ?? 'end of month';

  return (
    <View style={[subStyles.card, { backgroundColor: `${theme.gold}0A`, borderColor: `${theme.gold}25` }]}>
      <View style={subStyles.cardRow}>
        <View style={[subStyles.freeBadge, { backgroundColor: `${theme.text3}14`, borderColor: `${theme.text3}30` }]}>
          <Text style={[subStyles.freeBadgeText, { color: theme.text3 }]}>Guardian Free</Text>
        </View>
        <TouchableOpacity onPress={onUpgrade} hitSlop={8}>
          <Text style={[subStyles.upgradeLink, { color: theme.gold }]}>Upgrade</Text>
        </TouchableOpacity>
      </View>

      <View style={{ marginTop: 10, gap: 6 }}>
        <View style={subStyles.quotaRow}>
          <Text style={[subStyles.quotaLabel, { color: theme.text2 }]}>Scans this month</Text>
          <Text style={[subStyles.quotaCount, { color: theme.text3 }]}>{scansUsed} of 10 used</Text>
        </View>
        <SegmentedIndicator value={Math.round((scansUsed / 10) * 100)} count={10} color={theme.gold} height={5} />

        <View style={[subStyles.quotaRow, { marginTop: 4 }]}>
          <Text style={[subStyles.quotaLabel, { color: theme.text2 }]}>Reports this month</Text>
          <Text style={[subStyles.quotaCount, { color: theme.text3 }]}>{reportsUsed} of 5 used</Text>
        </View>
        <SegmentedIndicator value={Math.round((reportsUsed / 5) * 100)} count={10} color={theme.gold} height={5} />

        <Text style={[subStyles.resetNote, { color: theme.text3 }]}>Resets {resetDate}</Text>
        <Text style={[subStyles.planNote, { color: theme.text3 }]}>
          Family plan members: enter an invite code in the Family Plan section below to get Premium access without upgrading here.
        </Text>
      </View>

      <TouchableOpacity onPress={onUpgrade} activeOpacity={0.85} style={[subStyles.upgradeCta, { backgroundColor: theme.gold }]}>
        <Text style={[subStyles.upgradeCtaText, { color: theme.bg0 }]}>Upgrade to Pro — Unlimited Protection</Text>
      </TouchableOpacity>
    </View>
  );
}

const subStyles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
    paddingLeft: 18,
    position: 'relative',
    overflow: 'hidden',
  },
  accentStrip: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    borderTopLeftRadius: 4,
    borderBottomLeftRadius: 4,
  },
  cardRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  planName: { fontSize: 14, fontWeight: '700', letterSpacing: -0.2 },
  planSub: { fontSize: 11, marginTop: 2 },
  renewText: { fontSize: 10, marginTop: 2 },
  activePill: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999, borderWidth: 1 },
  activePillText: { fontSize: 9, fontWeight: '800' },
  manageLink: { fontSize: 12, fontWeight: '700', marginTop: 8 },
  freeBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, borderWidth: 1 },
  freeBadgeText: { fontSize: 11, fontWeight: '700' },
  upgradeLink: { fontSize: 13, fontWeight: '800' },
  quotaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  quotaLabel: { fontSize: 12, fontWeight: '600' },
  quotaCount: { fontSize: 11 },
  resetNote: { fontSize: 10, marginTop: 2 },
  planNote: { fontSize: 11, marginTop: 8, lineHeight: 16 },
  upgradeCta: { marginTop: 12, height: 50, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  upgradeCtaText: { fontSize: 14, fontWeight: '800' },
});

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

function ProfileScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const queryClient = useQueryClient();
  const session = useAuthStore((s) => s.session);
  const userId = session?.user?.id;
  const profile = useUserProfileStore((s) => s.profile);
  const streakDaysLocal = useRewardStore((s) => s.streakDays) ?? 0;
  const streakQuery = useQuery({
    queryKey: ['best-streak', userId],
    enabled: !!userId,
    staleTime: 60 * 1000,
    queryFn: async () => {
      try {
        const { data } = await supabase
          .from('user_rewards')
          .select('streak_days, best_streak')
          .eq('user_id', userId!)
          .maybeSingle();
        if (!data) return streakDaysLocal;
        const d = data as {
          streak_days?: number;
          best_streak?: number;
        };
        return Math.max(
          d.best_streak ?? 0,
          d.streak_days ?? 0,
          streakDaysLocal
        );
      } catch {
        return streakDaysLocal;
      }
    },
  });
  const streakDays = streakQuery.data ?? streakDaysLocal;
  const scanLocal = useRewardStore((s) => s.scanCountLifetime) ?? 0;
  const guardianGoals = useOnboardingStore((s) => s.guardianGoals);
  const assessmentAnswers = useOnboardingStore((s) => s.assessmentAnswers);
  const healthScore = useOnboardingStore((s) => s.healthScore);
  const onboardingUserName = useOnboardingStore((s) => s.userName);

  const goHealthProfile = useCallback(() => {
    hapticLight();
    router.push('/settings/health-profile' as never);
  }, [router]);

  const scanSegRef = useRef<SegmentedIndicatorRef | null>(null);
  const streakSegRef = useRef<SegmentedIndicatorRef | null>(null);

  // ── Subscription plan ─────────────────────────────────────────────────────
  const subQuery = useQuery<{ plan: PlanId; expires_at: string | null } | null>({
    queryKey: ['subscription', userId],
    enabled: !!userId,
    staleTime: 10 * 60 * 1000,
    queryFn: async () => {
      const { data } = await supabase
        .from('profiles')
        .select('subscription_plan, subscription_expires_at')
        .eq('id', userId!)
        .maybeSingle();
      if (!data) return null;
      return {
        plan: ((data as { subscription_plan: string }).subscription_plan ?? 'free') as PlanId,
        expires_at: (data as { subscription_expires_at: string | null }).subscription_expires_at ?? null,
      };
    },
  });

  const familyProfileQuery = useQuery<{
    subscription_tier: string | null;
    family_group_id: string | null;
    family_role: string | null;
  } | null>({
    queryKey: ['family-profile', userId],
    enabled: !!userId,
    staleTime: 30 * 1000,
    queryFn: async () => {
      const { data } = await supabase
        .from('profiles')
        .select('subscription_tier, family_group_id, family_role')
        .eq('id', userId!)
        .maybeSingle();
      return data as {
        subscription_tier: string | null;
        family_group_id: string | null;
        family_role: string | null;
      } | null;
    },
  });

  const isFamilyOwner =
    (familyProfileQuery.data?.subscription_tier === 'family' &&
      familyProfileQuery.data?.family_role === 'owner') ||
    (subQuery.data?.plan === 'family' &&
      familyProfileQuery.data?.family_role !== 'member');

  const isFamilyMember =
    familyProfileQuery.data?.subscription_tier === 'family' &&
    familyProfileQuery.data?.family_role === 'member';

  const familyGroupQuery = useQuery({
    queryKey: ['family-group-owner', userId],
    enabled: !!userId && isFamilyOwner,
    staleTime: 30 * 1000,
    queryFn: () => getFamilyGroupForOwner(userId!),
  });

  const familyMemberInfoQuery = useQuery<{ ownerName: string | null }>({
    queryKey: ['family-member-info', userId],
    enabled:
      !!userId &&
      familyProfileQuery.data?.subscription_tier === 'family' &&
      familyProfileQuery.data?.family_role === 'member',
    staleTime: 30 * 1000,
    queryFn: async () => {
      const groupId = familyProfileQuery.data?.family_group_id;
      if (!groupId) return { ownerName: null };
      const { data: group } = await supabase
        .from('family_groups')
        .select('owner_id')
        .eq('id', groupId)
        .maybeSingle();
      if (!group) return { ownerName: null };
      const { data: owner } = await supabase
        .from('profiles')
        .select('display_name')
        .eq('id', (group as { owner_id: string }).owner_id)
        .maybeSingle();
      return {
        ownerName: (owner as { display_name: string | null } | null)?.display_name ?? 'Plan owner',
      };
    },
  });

  // ── Quota status ──────────────────────────────────────────────────────────
  const [quotaStatus, setQuotaStatus] = useState<QuotaStatus | null>(null);
  useEffect(() => {
    if (!userId) return;
    getQuotaStatus(userId).then(setQuotaStatus).catch(() => {});
  }, [userId]);

  // ── Stats: scans count ────────────────────────────────────────────────────
  const scansQuery = useQuery({
    queryKey: ['scans-count', userId],
    enabled: !!userId,
    staleTime: 30 * 1000,
    queryFn: async () => {
      // scans table is the primary store (scan-ocr + barcode)
      // scan_history is legacy — check both and take max
      const [a, b] = await Promise.all([
        supabase
          .from('scans')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', userId!),
        supabase
          .from('scan_history')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', userId!),
      ]);
      return Math.max(a.count ?? 0, b.count ?? 0);
    },
  });

  // ── Stats: alerts caught ────────────────────────────────────────────────
  const alertsQuery = useQuery({
    queryKey: ['alerts-caught', userId],
    enabled: !!userId,
    staleTime: 30 * 1000,
    queryFn: async () => {
      try {
        // Primary: scans table — grade C, D or F means alert
        const { count, error } = await supabase
          .from('scans')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', userId!)
          .in('grade', ['C', 'D', 'F']);
        if (!error && count !== null) return count;

        // Fallback: scan_results table
        const { count: count2, error: err2 } = await supabase
          .from('scan_results')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', userId!)
          .eq('has_warnings', true);
        if (err2) return 0;
        return count2 ?? 0;
      } catch {
        return 0;
      }
    },
  });

  // ── Stats: watchlist count ──────────────────────────────────────────────
  const watchlistQuery = useQuery({
    queryKey: ['watchlist-count', userId],
    enabled: !!userId,
    staleTime: 30 * 1000,
    queryFn: async () => {
      try {
        const { count, error } = await supabase
          .from('ingredient_watchlist')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', userId!);
        if (error) return 0;
        return count ?? 0;
      } catch {
        return 0;
      }
    },
  });

  // ── Referral code ───────────────────────────────────────────────────────
  const referralQuery = useQuery<string>({
    queryKey: ['referral-code', userId],
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data } = await supabase
        .from('profiles')
        .select('referral_code')
        .eq('id', userId!)
        .maybeSingle();
      let code = (data as { referral_code: string | null } | null)?.referral_code ?? null;
      if (!code && userId) {
        code = `TRW${userId.slice(0, 5).toUpperCase()}`;
        await supabase.from('profiles').update({ referral_code: code }).eq('id', userId);
      }
      return code ?? `TRW${userId!.slice(0, 5).toUpperCase()}`;
    },
  });

  const referralsStatsQuery = useQuery({
    queryKey: ['referrals-stats', userId],
    enabled: !!userId,
    staleTime: 60 * 1000,
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('referrals')
          .select('status')
          .eq('referrer_id', userId!);
        if (error || !data) return { invited: 0, joined: 0, xp: 0 };
        const invited = data.length;
        const joined = data.filter((r: { status: string }) => r.status === 'joined').length;
        return { invited, joined, xp: joined * 200 };
      } catch {
        return { invited: 0, joined: 0, xp: 0 };
      }
    },
  });

  // ── User preferences ──────────────────────────────────────────────────────
  const prefsQuery = useQuery<UserPreferences>({
    queryKey: ['user-preferences', userId],
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data } = await supabase
        .from('user_preferences')
        .select('smart_alerts')
        .eq('user_id', userId!)
        .maybeSingle();
      return { smart_alerts: (data as { smart_alerts: boolean } | null)?.smart_alerts ?? true };
    },
  });

  // ── Health profile from user_health_profiles ─────────────────────────────
  const hpQuery = useQuery<HealthProfile>({
    queryKey: ['user-health-profile', userId],
    enabled: !!userId,
    staleTime: 10 * 60 * 1000,
    queryFn: async () => {
      const { data } = await supabase
        .from('user_health_profiles')
        .select('allergies, avoids, conditions, diet_preference')
        .eq('user_id', userId!)
        .maybeSingle();
      if (!data) return {};
      return {
        allergies: (data as any).allergies ?? [],
        avoids: (data as any).avoids ?? [],
        conditions: (data as any).conditions ?? [],
        dietPreference: (data as any).diet_preference ?? undefined,
      } as HealthProfile;
    },
  });

  // ── Local edit state ──────────────────────────────────────────────────────
  const [smartAlerts, setSmartAlerts] = useState(true);
  const [familyGroupInfo, setFamilyGroupInfo] = useState<FamilyGroupInfo | null>(null);
  const [restoring, setRestoring] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarOverride, setAvatarOverride] = useState<string | null>(null);

  const profileRowQ = useQuery<ProfileOnboardingRow | null>({
    queryKey: ['profile-onboarding-row', userId],
    enabled: !!userId,
    staleTime: 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select(
          'display_name, avatar_url, care_goals, health_conditions'
        )
        .eq('id', userId!)
        .maybeSingle();
      if (error) throw error;
      return (data ?? null) as ProfileOnboardingRow | null;
    },
  });

  useEffect(() => {
    if (prefsQuery.data) setSmartAlerts(prefsQuery.data.smart_alerts);
  }, [prefsQuery.data]);

  // ── Animate segments on data load and tab focus ───────────────────────────
  useEffect(() => {
    if (scansQuery.data !== undefined) {
      setTimeout(() => scanSegRef.current?.triggerAnimation(), 300);
    }
  }, [scansQuery.data]);

  useEffect(() => {
    setTimeout(() => streakSegRef.current?.triggerAnimation(), 500);
  }, [streakDays]);

  useFocusEffect(
    useCallback(() => {
      setTimeout(() => {
        scanSegRef.current?.triggerAnimation();
        streakSegRef.current?.triggerAnimation();
      }, 150);
      void queryClient.invalidateQueries({ queryKey: ['profile-onboarding-row', userId] });
      void queryClient.invalidateQueries({ queryKey: ['scans-count', userId] });
      void queryClient.invalidateQueries({ queryKey: ['alerts-caught', userId] });
      void queryClient.invalidateQueries({ queryKey: ['watchlist-count', userId] });
      void queryClient.invalidateQueries({ queryKey: ['referral-code', userId] });
      void queryClient.invalidateQueries({ queryKey: ['referrals-stats', userId] });
      void queryClient.invalidateQueries({ queryKey: ['subscription', userId] });
      void queryClient.invalidateQueries({ queryKey: ['family-profile', userId] });
      void queryClient.invalidateQueries({ queryKey: ['family-group-owner', userId] });
      void queryClient.invalidateQueries({ queryKey: ['patient-prescriptions', userId] });
      if (userId && isFamilyOwner) {
        void getFamilyGroupForOwner(userId).then(setFamilyGroupInfo);
      }
    }, [queryClient, userId, isFamilyOwner])
  );

  useEffect(() => {
    if (familyGroupQuery.data) {
      setFamilyGroupInfo(familyGroupQuery.data);
    }
  }, [familyGroupQuery.data]);

  // ── Toggle smart alerts ───────────────────────────────────────────────────
  const toggleSmartAlerts = async (value: boolean) => {
    hapticLight();
    setSmartAlerts(value);
    if (!userId) return;
    await supabase
      .from('user_preferences')
      .upsert({ user_id: userId, smart_alerts: value }, { onConflict: 'user_id' });
    void queryClient.invalidateQueries({ queryKey: ['user-preferences', userId] });
  };

  const handleExportData = () => {
    if (!userId) return;
    Alert.alert(
      'Export your data',
      'Under applicable data protection law including GDPR where applicable, you have the right to receive a copy of your personal data. We will prepare your data export. This includes your profile, scan history, health data, and preferences.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Export JSON',
          onPress: async () => {
            hapticLight();
            const { data: profileData } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', userId)
              .maybeSingle();
            const { data: healthData } = await supabase
              .from('user_health_profiles')
              .select('*')
              .eq('user_id', userId)
              .maybeSingle();
            const payload = {
              exported_at: new Date().toISOString(),
              profile: profileData,
              health_profile: healthData,
            };
            await Share.share({
              message: JSON.stringify(payload, null, 2),
              title: 'TruWell AI Data Export',
            });
          },
        },
      ]
    );
  };

  const handleRestorePurchases = async () => {
    hapticLight();
    setRestoring(true);
    try {
      const result = await restorePurchases();
      if (result.success) {
        Alert.alert('Restored', 'Your purchases have been restored.');
        void queryClient.invalidateQueries({ queryKey: ['subscription', userId] });
      } else if (result.reason !== 'cancelled') {
        Alert.alert('Restore failed', result.error ?? 'No purchases found to restore.');
      }
    } finally {
      setRestoring(false);
    }
  };

  const shareJourneyProgress = async () => {
    const scans = Math.max(scanLocal, scansQuery.data ?? 0);
    const alerts = alertsQuery.data ?? 0;
    hapticLight();
    await Share.share({
      message: `I'm on day ${streakDays} of my wellness journey on TruWell AI! I've scanned ${scans} products and caught ${alerts} ingredient warnings personalised to my health profile. Join me: https://truwellai.xyz`,
    });
  };

  const shareInviteFriend = async () => {
    const code = referralQuery.data;
    if (!code) return;
    hapticLight();
    await Share.share({ message: buildReferralShareMessage(code) });
  };

  const copyReferralCode = async () => {
    const code = referralQuery.data;
    if (!code) return;
    await Clipboard.setStringAsync(buildReferralJoinUrl(code));
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  // ── Sign out ──────────────────────────────────────────────────────────────
  const signOut = async () => {
    hapticLight();
    // Reset onboarding state so the AHA screen is not shown on the next
    // visit to /welcome (the flag persists in-memory across the session).
    useOnboardingStore.getState().reset();
    await signOutGoogle();
    await supabase.auth.signOut();
  };

  const pulseDot = useSharedValue(1);
  useEffect(() => {
    pulseDot.value = withRepeat(
      withSequence(withTiming(1.3, { duration: 600 }), withTiming(1, { duration: 600 })),
      -1,
      false
    );
  }, [pulseDot]);
  const pulseDotStyle = useAnimatedStyle(() => ({ transform: [{ scale: pulseDot.value }] }));

  const scanCount = Math.max(scanLocal, scansQuery.data ?? 0);
  const healthProfileData = profile?.health_profile ?? hpQuery.data ?? {};
  const dietPref = healthProfileData.dietPreference ?? hpQuery.data?.dietPreference;
  const familyMemberCount = familyGroupQuery.data?.memberCount ?? 0;

  const profileChipFields = useMemo(() => {
    const chips: { label: string; empty?: boolean }[] = [];
    guardianGoals.forEach((g) => chips.push({ label: g }));
    if (guardianGoals.length === 0) chips.push({ label: '+ Add goals', empty: true });
    if (assessmentAnswers.age) chips.push({ label: `Age ${assessmentAnswers.age}` });
    else chips.push({ label: '+ Add age', empty: true });
    if (assessmentAnswers.sleep) chips.push({ label: `Sleep: ${assessmentAnswers.sleep}` });
    else chips.push({ label: '+ Add sleep', empty: true });
    if (assessmentAnswers.energy) chips.push({ label: `Energy: ${assessmentAnswers.energy}` });
    else chips.push({ label: '+ Add energy', empty: true });
    if (assessmentAnswers.activity) chips.push({ label: `Activity: ${assessmentAnswers.activity}` });
    else chips.push({ label: '+ Add activity', empty: true });
    (healthProfileData.allergies ?? []).forEach((a) => chips.push({ label: `Allergy: ${a}` }));
    if (!(healthProfileData.allergies?.length)) chips.push({ label: '+ Add allergies', empty: true });
    (healthProfileData.conditions ?? []).forEach((c) => chips.push({ label: c }));
    if (!(healthProfileData.conditions?.length)) chips.push({ label: '+ Add conditions', empty: true });
    (healthProfileData.avoids ?? []).forEach((a) => chips.push({ label: `Avoid: ${a}` }));
    if (!(healthProfileData.avoids?.length)) chips.push({ label: '+ Add avoids', empty: true });
    return chips;
  }, [guardianGoals, assessmentAnswers, healthProfileData]);

  const filledProfileCount = useMemo(() => {
    let n = 0;
    if (guardianGoals.length) n++;
    if (assessmentAnswers.age) n++;
    if (assessmentAnswers.sleep) n++;
    if (assessmentAnswers.energy) n++;
    if (assessmentAnswers.activity) n++;
    if (healthProfileData.allergies?.length) n++;
    if (healthProfileData.conditions?.length) n++;
    if (healthProfileData.avoids?.length) n++;
    if (dietPref) n++;
    return n;
  }, [guardianGoals, assessmentAnswers, healthProfileData, dietPref]);

  const healthProfileComplete =
    [
      healthProfileData.allergies?.length,
      healthProfileData.conditions?.length,
      healthProfileData.avoids?.length,
      dietPref,
    ].filter(Boolean).length >= 2;

  const milestones = useMemo(
    () => [
      {
        id: 'joined',
        title: 'Joined TruWell AI',
        xp: 50,
        complete: !!session?.user?.created_at,
        progress: 1,
        inProgress: false,
      },
      {
        id: 'first-scan',
        title: 'First scan completed',
        xp: 100,
        complete: scanCount > 0,
        progress: scanCount > 0 ? 1 : 0,
        inProgress: false,
      },
      {
        id: 'health-profile',
        title: 'Health profile complete',
        xp: 200,
        complete: healthProfileComplete,
        progress: healthProfileComplete ? 1 : 0,
        inProgress: false,
      },
      {
        id: 'streak-7',
        title: '7-day streak',
        xp: 200,
        complete: streakDays >= 7,
        progress: Math.min(1, streakDays / 7),
        inProgress: streakDays > 0 && streakDays < 7,
      },
      {
        id: 'family',
        title: 'Invited first family member',
        xp: 300,
        complete: familyMemberCount >= 1,
        progress: familyMemberCount >= 1 ? 1 : 0,
        inProgress: false,
      },
      {
        id: 'scans-100',
        title: '100 products scanned',
        xp: 500,
        complete: scanCount >= 100,
        progress: Math.min(1, scanCount / 100),
        inProgress: scanCount > 0 && scanCount < 100,
      },
    ],
    [session?.user?.created_at, scanCount, healthProfileComplete, streakDays, familyMemberCount]
  );

  // ── Derived values ────────────────────────────────────────────────────────
  const meta = session?.user?.user_metadata as Record<string, unknown> | undefined;
  const metaFullName = typeof meta?.full_name === 'string' ? meta.full_name : undefined;
  const metaName = typeof meta?.name === 'string' ? meta.name : undefined;

  const displayName =
    profileRowQ.data?.display_name ??
    profile?.display_name ??
    metaFullName ??
    metaName ??
    (onboardingUserName || undefined) ??
    'User';
  const avatarUrl =
    avatarOverride ??
    profileRowQ.data?.avatar_url ??
    (session?.user?.user_metadata?.avatar_url as string | undefined) ??
    null;

  const handlePickProfilePicture = async () => {
    if (!userId || uploadingAvatar) return;
    setUploadingAvatar(true);
    try {
      const url = await pickAndUploadProfileAvatar(userId);
      if (url) {
        setAvatarOverride(url);
        void queryClient.invalidateQueries({ queryKey: ['profile-onboarding-row', userId] });
      }
    } catch (err) {
      Alert.alert(
        'Upload failed',
        err instanceof Error ? err.message : 'Could not upload photo.'
      );
    } finally {
      setUploadingAvatar(false);
    }
  };

  const planId = subQuery.data?.plan ?? 'free';
  const subExpiresAt = subQuery.data?.expires_at ?? null;
  const isProPlan = isPlanPro(planId);
  const tierColor = planId === 'lifetime' ? theme.gold : isProPlan ? theme.teal : theme.text3;
  const alertsCaught = alertsQuery.data ?? 0;
  const watchListed = watchlistQuery.data ?? 0;
  const scanSegCount = Math.min(10, Math.round((scanCount / 100) * 10));
  const streakSegCount = Math.min(10, Math.round((streakDays / 30) * 10));
  const memberSince = formatMemberSince(session?.user?.created_at);
  const countryCode = countryFromLocale(profile?.locale);
  const referralStats = referralsStatsQuery.data ?? { invited: 0, joined: 0, xp: 0 };
  const referralCode = referralQuery.data ?? '';
  const appVersion = Constants.expoConfig?.version ?? '2.0';
  const localeLabel = profile?.locale ?? 'System default';
  const familyOwnerName = familyMemberInfoQuery.data?.ownerName ?? 'Plan owner';

  if (!session) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg0 }]} edges={['top']}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <SkeletonLoader width={200} height={20} borderRadius={10} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg0 }]} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* ── Avatar + name + tier ──────────────────────────────────────── */}
        <View style={styles.avatarSection}>
          <TouchableOpacity
            onPress={() => void handlePickProfilePicture()}
            disabled={uploadingAvatar}
            activeOpacity={0.85}
            style={styles.avatarTouchable}
          >
            <View style={[styles.avatarWrap, { borderColor: `${theme.teal}40` }]}>
              {avatarUrl ? (
                <Image source={{ uri: avatarUrl }} style={styles.avatar} contentFit="cover" />
              ) : (
                <View style={[styles.avatarFallback, { backgroundColor: `${theme.teal}18` }]}>
                  <Text style={[styles.initials, { color: theme.teal }]}>
                    {getInitials(displayName)}
                  </Text>
                </View>
              )}
              {uploadingAvatar ? (
                <View style={styles.avatarUploadOverlay}>
                  <ActivityIndicator color={theme.teal} />
                </View>
              ) : null}
            </View>
            <View style={[styles.avatarEditBadge, { backgroundColor: theme.teal }]}>
              <Text style={styles.avatarEditIcon}>✏️</Text>
            </View>
          </TouchableOpacity>
          <View style={styles.nameBlock}>
            <Text style={[styles.displayName, { color: theme.text1 }]} numberOfLines={1}>
              {displayName}
            </Text>
            <Text style={[styles.memberMeta, { color: theme.text3 }]}>
              Member since {memberSince}
              {countryCode ? ` · ${countryCode}` : ''}
            </Text>
            <View style={styles.badgeRow}>
              <View style={[styles.tierBadge, { backgroundColor: `${tierColor}14`, borderColor: `${tierColor}30` }]}>
                <Text style={[styles.tierText, { color: tierColor }]}>
                  {planId === 'lifetime' ? 'Founder' : planId === 'family' ? 'Family' : isProPlan ? 'Pro' : 'Free'}
                </Text>
              </View>
              {streakDays > 0 ? (
                <View style={[styles.streakBadge, { backgroundColor: `${theme.amber}18`, borderColor: `${theme.amber}40` }]}>
                  <Text style={[styles.streakBadgeText, { color: theme.amber }]}>🔥 {streakDays}d streak</Text>
                </View>
              ) : null}
            </View>
          </View>
        </View>

        <LongevityScoreCard
          theme={theme}
          dietPreference={dietPref}
          assessmentAnswers={assessmentAnswers}
          scansUsed={scanCount}
          alertsCaught={alertsCaught}
          healthScore={healthScore || 0}
        />

        {/* ── Your health profile ───────────────────────────────────────── */}
        <View style={[cardStyles.block, { backgroundColor: theme.bg1, borderColor: theme.border }]}>
          <View style={cardStyles.headerRow}>
            <Text style={[cardStyles.blockTitle, { color: theme.text1 }]}>Your health profile</Text>
            <TouchableOpacity onPress={goHealthProfile} hitSlop={8}>
              <Text style={[cardStyles.promptLink, { color: theme.teal, marginTop: 0 }]}>Edit</Text>
            </TouchableOpacity>
          </View>
          <View style={cardStyles.chipWrap}>
            {profileChipFields.map((chip) => (
              <ProfileChip
                key={chip.label}
                label={chip.label}
                theme={theme}
                empty={chip.empty}
                onPress={goHealthProfile}
              />
            ))}
          </View>
          {filledProfileCount < 3 ? (
            <TouchableOpacity onPress={goHealthProfile}>
              <Text style={[cardStyles.promptLink, { color: theme.teal }]}>
                Complete your profile for personalised AI responses →
              </Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {/* ── 4-stat grid ───────────────────────────────────────────────── */}
        <View style={[styles.statsGrid, { backgroundColor: theme.bg1, borderColor: theme.border }]}>
          <View style={[styles.statCell, { borderRightColor: theme.border }]}>
            {scansQuery.isLoading ? (
              <SkeletonLoader width={32} height={20} borderRadius={6} />
            ) : (
              <Text style={[styles.statValue, { color: theme.teal }]}>{scanCount}</Text>
            )}
            <Text style={[styles.statLabel, { color: theme.text3 }]}>Scans</Text>
            <SegmentedIndicator
              ref={scanSegRef}
              value={scanSegCount}
              count={10}
              color={theme.teal}
              height={3}
              style={styles.statSeg}
            />
          </View>

          <View style={[styles.statCell, { borderRightColor: theme.border }]}>
            <Text style={[styles.statValue, { color: theme.purple }]}>{streakDays}d</Text>
            <Text style={[styles.statLabel, { color: theme.text3 }]}>Best Streak</Text>
            <SegmentedIndicator
              ref={streakSegRef}
              value={streakSegCount}
              count={10}
              color={theme.purple}
              height={3}
              style={styles.statSeg}
            />
          </View>

          <View style={[styles.statCell, { borderRightColor: theme.border }]}>
            {alertsQuery.isLoading ? (
              <SkeletonLoader width={32} height={20} borderRadius={6} />
            ) : (
              <Text style={[styles.statValue, { color: theme.amber }]}>{alertsCaught}</Text>
            )}
            <Text style={[styles.statLabel, { color: theme.text3 }]}>Alerts Caught</Text>
            <SegmentedIndicator
              value={Math.min(10, alertsCaught)}
              count={10}
              color={theme.amber}
              height={3}
              style={styles.statSeg}
            />
          </View>

          <View style={styles.statCell}>
            {watchlistQuery.isLoading ? (
              <SkeletonLoader width={32} height={20} borderRadius={6} />
            ) : (
              <Text style={[styles.statValue, { color: theme.gold }]}>{watchListed}</Text>
            )}
            <Text style={[styles.statLabel, { color: theme.text3 }]}>Watch Listed</Text>
            <SegmentedIndicator
              value={Math.min(10, watchListed)}
              count={10}
              color={theme.gold}
              height={3}
              style={styles.statSeg}
            />
          </View>
        </View>

        {/* ── Subscription status card ──────────────────────────────────── */}
        <SubscriptionStatusCard
          planId={planId}
          quotaStatus={quotaStatus}
          expiresAt={subExpiresAt}
          onUpgrade={() => { hapticLight(); router.push('/settings/subscription'); }}
          onManage={() => { hapticLight(); router.push('/settings/subscription'); }}
          theme={theme}
        />

        {/* ── AI Health Assistant shortcut ──────────────────────────────── */}
        <TouchableOpacity
          activeOpacity={0.85}
          style={[styles.aiCard, { backgroundColor: `${theme.purple}14`, borderColor: `${theme.purple}30` }]}
          onPress={() => {
            hapticLight();
            router.push('/assistant' as never);
          }}
        >
          <View>
            <Text style={[styles.aiTitle, { color: theme.purple }]}>AI Health Assistant</Text>
            <Text style={[styles.aiSub, { color: theme.text3 }]}>
              Ask about ingredients, products, or your health profile
            </Text>
          </View>
          <Text style={[styles.aiArrow, { color: theme.purple }]}>›</Text>
        </TouchableOpacity>

        {/* ── My wellness journey ───────────────────────────────────────── */}
        <View style={[cardStyles.block, { backgroundColor: theme.bg1, borderColor: theme.border }]}>
          <View style={cardStyles.headerRow}>
            <Text style={[cardStyles.blockTitle, { color: theme.text1 }]}>My wellness journey</Text>
            <TouchableOpacity onPress={() => void shareJourneyProgress()} hitSlop={8}>
              <Text style={[cardStyles.promptLink, { color: theme.teal }]}>Share progress</Text>
            </TouchableOpacity>
          </View>
          {milestones.map((m, idx) => {
            const isLast = idx === milestones.length - 1;
            return (
              <View key={m.id}>
                <View style={cardStyles.milestoneRow}>
                  <View style={styles.milestoneCol}>
                    {m.complete ? (
                      <View style={[cardStyles.milestoneDot, { backgroundColor: `${theme.teal}20`, borderColor: theme.teal }]}>
                        <Text style={{ color: theme.teal, fontSize: 12, fontWeight: '900' }}>✓</Text>
                      </View>
                    ) : m.inProgress ? (
                      <Animated.View
                        style={[
                          cardStyles.milestoneDot,
                          { backgroundColor: `${theme.teal}20`, borderColor: theme.teal },
                          pulseDotStyle,
                        ]}
                      >
                        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: theme.teal }} />
                      </Animated.View>
                    ) : (
                      <View style={[cardStyles.milestoneDot, { backgroundColor: theme.bg2, borderColor: theme.border }]} />
                    )}
                    {!isLast ? (
                      <View style={[cardStyles.milestoneLine, { backgroundColor: theme.border }]} />
                    ) : null}
                  </View>
                  <View style={cardStyles.milestoneBody}>
                    <Text style={[cardStyles.milestoneTitle, { color: m.complete ? theme.text1 : theme.text2 }]}>
                      {m.title}
                      {m.inProgress ? ` (${Math.round(m.progress * 7)}/7)` : ''}
                      {m.id === 'scans-100' && m.inProgress ? ` (${scanCount}/100)` : ''}
                    </Text>
                    <Text style={[cardStyles.milestoneXp, { color: theme.gold }]}>+{m.xp} XP</Text>
                  </View>
                </View>
              </View>
            );
          })}
        </View>

        <SectionLabel title="Invite friends" theme={theme} />

        {/* ── Referral card (invite friends — not family plan) ──────────── */}
        <View style={[cardStyles.block, { backgroundColor: theme.bg1, borderColor: theme.border, overflow: 'hidden' }]}>
          <View style={[cardStyles.referralHeader, { backgroundColor: theme.bg0 }]}>
            <Text style={[cardStyles.blockTitle, { color: theme.text1 }]}>Invite friends to TruWell AI</Text>
            <Text style={[cardStyles.rowSub, { color: theme.text3, marginTop: 4 }]}>
              Share health intelligence alerts and earn rewards when friends join
            </Text>
          </View>

          <Text style={[cardStyles.referralCode, { color: theme.gold }]}>
            {referralCode || '······'}
          </Text>
          <View style={cardStyles.referralActions}>
            <TouchableOpacity
              style={[cardStyles.referralBtn, { borderColor: theme.border, backgroundColor: theme.bg2 }]}
              onPress={() => void copyReferralCode()}
            >
              <Text style={[cardStyles.rowLabel, { color: theme.text1 }]}>Copy link</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[cardStyles.referralBtn, { borderColor: `${theme.teal}40`, backgroundColor: `${theme.teal}15` }]}
              onPress={() => void shareInviteFriend()}
            >
              <Text style={[cardStyles.rowLabel, { color: theme.teal }]}>Share</Text>
            </TouchableOpacity>
          </View>

          <View style={[styles.statsGrid, { marginHorizontal: 0, marginTop: 12 }]}>
            <View style={[styles.statCell, { borderRightColor: theme.border }]}>
              <Text style={[styles.statValue, { color: theme.text1, fontSize: 16 }]}>{referralStats.invited}</Text>
              <Text style={[styles.statLabel, { color: theme.text3 }]}>Invited</Text>
            </View>
            <View style={[styles.statCell, { borderRightColor: theme.border }]}>
              <Text style={[styles.statValue, { color: theme.teal, fontSize: 16 }]}>{referralStats.joined}</Text>
              <Text style={[styles.statLabel, { color: theme.text3 }]}>Joined</Text>
            </View>
            <View style={styles.statCell}>
              <Text style={[styles.statValue, { color: theme.gold, fontSize: 16 }]}>{referralStats.xp}</Text>
              <Text style={[styles.statLabel, { color: theme.text3 }]}>XP earned</Text>
            </View>
          </View>

          {[
            { label: '1 friend joins TruWell AI', reward: '+200 XP + 5 bonus scans', target: 1, current: referralStats.joined },
            { label: '3 friends join TruWell AI', reward: '1 month Pro free for you', target: 3, current: referralStats.joined },
            { label: '10 friends join TruWell AI', reward: 'Lifetime 20% off + Guardian badge', target: 10, current: referralStats.joined },
          ].map((tier) => {
            const unlocked = tier.current >= tier.target;
            return (
              <View key={tier.label} style={[cardStyles.tierRow, { borderBottomColor: theme.border }]}>
                <Text style={{ fontSize: 16 }}>{unlocked ? '🔓' : '🔒'}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[cardStyles.milestoneTitle, { color: theme.text1 }]}>{tier.label}</Text>
                  <Text style={[cardStyles.rowSub, { color: theme.text3 }]}>{tier.reward}</Text>
                  <Text style={[cardStyles.rowSub, { color: theme.teal, marginTop: 2 }]}>
                    {Math.min(tier.current, tier.target)} of {tier.target}
                  </Text>
                </View>
              </View>
            );
          })}

          <Text style={[cardStyles.disclaimer, { color: theme.text3, marginTop: 8 }]}>
            Rewards are applied to your TruWell account within 24 hours of qualifying referral.
            Reward terms subject to TruWell Terms of Service.
          </Text>

          <TouchableOpacity
            style={[cardStyles.shareBtnPrimary, { backgroundColor: theme.teal }]}
            onPress={() => void shareInviteFriend()}
          >
            <Text style={[cardStyles.rowLabel, { color: theme.bg0, fontWeight: '800' }]}>Invite a friend to TruWell AI</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[cardStyles.shareBtnSecondary, { borderColor: theme.border }]}
            onPress={() => void shareJourneyProgress()}
          >
            <Text style={[cardStyles.rowLabel, { color: theme.text2 }]}>Share my wellness journey</Text>
          </TouchableOpacity>
        </View>

        <SectionLabel title="Family plan" theme={theme} />

        {/* ── Family plan (subscription sharing — not referral) ─────────── */}
        {isFamilyOwner ? (
          <>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => {
                hapticLight();
                router.push('/family' as never);
              }}
              style={[familyStyles.hubBanner, { borderColor: theme.teal, backgroundColor: theme.bg1 }]}
            >
              <View style={[familyStyles.hubBannerLeft, { backgroundColor: `${theme.teal}12` }]}>
                <Text style={familyStyles.hubBannerIcon}>👨‍👩‍👧</Text>
              </View>
              <View style={familyStyles.hubBannerText}>
                <Text style={[familyStyles.hubBannerTitle, { color: theme.teal }]}>Family Hub</Text>
                <Text style={[familyStyles.hubBannerSub, { color: theme.text2 }]}>
                  {familyGroupInfo?.memberCount ?? 0} of 5 members added
                </Text>
                <Text style={[familyStyles.hubBannerAction, { color: theme.teal }]}>
                  Manage members · Share invite code →
                </Text>
              </View>
              <View
                style={[
                  familyStyles.memberCountBadge,
                  {
                    backgroundColor:
                      (familyGroupInfo?.memberCount ?? 0) === 0
                        ? `${theme.amber}18`
                        : `${theme.teal}18`,
                    borderColor:
                      (familyGroupInfo?.memberCount ?? 0) === 0
                        ? `${theme.amber}35`
                        : `${theme.teal}35`,
                  },
                ]}
              >
                <Text
                  style={[
                    familyStyles.memberCountNum,
                    {
                      color:
                        (familyGroupInfo?.memberCount ?? 0) === 0 ? theme.amber : theme.teal,
                    },
                  ]}
                >
                  {familyGroupInfo?.memberCount ?? 0}/5
                </Text>
              </View>
            </TouchableOpacity>

            {(familyGroupInfo?.memberCount ?? 0) === 0 ? (
              <View
                style={[
                  familyStyles.nudgeBanner,
                  { backgroundColor: `${theme.amber}0A`, borderColor: `${theme.amber}25` },
                ]}
              >
                <Text style={[familyStyles.nudgeText, { color: theme.amber }]}>
                  You haven&apos;t added any family members yet. Open Family Hub to share your invite
                  code.
                </Text>
              </View>
            ) : null}
          </>
        ) : isFamilyMember ? (
          <View style={[cardStyles.block, { backgroundColor: theme.bg1, borderColor: `${theme.teal}25`, overflow: 'hidden' }]}>
            <View style={[cardStyles.referralHeader, { backgroundColor: `${theme.teal}08` }]}>
              <Text style={[cardStyles.blockTitle, { color: theme.teal }]}>You&apos;re on a Family Plan</Text>
              <Text style={[cardStyles.rowSub, { color: theme.text3, marginTop: 4 }]}>
                Protected by {familyOwnerName}&apos;s family plan
              </Text>
              <Text style={[cardStyles.rowSub, { color: theme.text2, marginTop: 6 }]}>
                You have full Premium access included in their plan
              </Text>
            </View>
          </View>
        ) : (
          !isFamilyOwner && !isFamilyMember && (
            <View style={[cardStyles.block, {
              backgroundColor: theme.bg1,
              borderColor: `${theme.teal}20`,
            }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center',
                justifyContent: 'space-between', marginBottom: 8 }}>
                <Text style={[cardStyles.blockTitle, { color: theme.text1 }]}>
                  Family Plan
                </Text>
                <View style={[subStyles.freeBadge, {
                  backgroundColor: `${theme.teal}12`,
                  borderColor: `${theme.teal}30`,
                }]}>
                  <Text style={[subStyles.freeBadgeText, { color: theme.teal }]}>
                    Up to 5 members
                  </Text>
                </View>
              </View>
              <Text style={[cardStyles.rowSub, { color: theme.text3, marginBottom: 12 }]}>
                {'Have a family invite code? Enter it below to get Premium access on someone else\'s plan.'}
              </Text>
              <TouchableOpacity
                onPress={() => router.push('/settings/subscription' as never)}
                activeOpacity={0.85}
                style={[subStyles.upgradeCta, {
                  backgroundColor: theme.teal,
                  height: 44,
                  borderRadius: 12,
                }]}
              >
                <Text style={[subStyles.upgradeCtaText, { color: '#020A14' }]}>
                  Join or Start a Family Plan
                </Text>
              </TouchableOpacity>
            </View>
          )
        )}

        {/* ── Settings: Personalisation ─────────────────────────────────── */}
        <SettingsGroup title="Personalisation" theme={theme}>
          <SettingsNavRow icon="🎨" label="Appearance" theme={theme} onPress={() => { hapticLight(); router.push('/settings/appearance' as never); }} />
          <SettingsNavRow icon="🌍" label="Language & region" sub={localeLabel} theme={theme} onPress={() => { hapticLight(); router.push('/settings' as never); }} />
          <SettingsNavRow icon="🔔" label="Notifications" theme={theme} onPress={() => { hapticLight(); router.push('/settings/notifications' as never); }} />
          <View style={[cardStyles.settingsRow, { borderBottomColor: theme.border }]}>
            <Text style={cardStyles.rowIcon}>⚡</Text>
            <View style={cardStyles.rowLeft}>
              <Text style={[cardStyles.rowLabel, { color: theme.text1 }]}>Smart Alerts</Text>
              <Text style={[cardStyles.rowSub, { color: theme.text3 }]}>Personalized ingredient warnings</Text>
            </View>
            <Switch
              value={smartAlerts}
              onValueChange={toggleSmartAlerts}
              trackColor={{ false: theme.bg3, true: `${theme.teal}80` }}
              thumbColor={smartAlerts ? theme.teal : theme.text3}
            />
          </View>
          <SettingsNavRow icon="💚" label="Wellness reminders" theme={theme} last onPress={() => { hapticLight(); router.push('/settings/wellness-reminders' as never); }} />
        </SettingsGroup>

        {/* ── Settings: Privacy & data ──────────────────────────────────── */}
        <SettingsGroup title="Privacy & data" theme={theme}>
          <SettingsNavRow icon="🔒" label="Privacy settings" theme={theme} onPress={() => { hapticLight(); router.push('/settings/privacy' as never); }} />
          <SettingsNavRow icon="📦" label="Export my data" theme={theme} onPress={handleExportData} />
          <SettingsNavRow icon="📋" label="Data consent" theme={theme} onPress={() => { hapticLight(); router.push('/settings/policy' as never); }} />
          <SettingsNavRow icon="❤️" label="Health profile" theme={theme} onPress={goHealthProfile} />
          <SettingsNavRow
            icon="💊"
            label="Medications & prescriptions"
            theme={theme}
            last
            onPress={() => { hapticLight(); router.push('/settings/health-profile' as never); }}
          />
        </SettingsGroup>

        {/* ── Settings: Help & support ───────────────────────────────────── */}
        <SettingsGroup title="Help & support" theme={theme}>
          <SettingsNavRow icon="❓" label="Help centre" theme={theme} onPress={() => { hapticLight(); void Linking.openURL('https://truwellai.xyz/help'); }} />
          <SettingsNavRow icon="✉️" label="Contact support" theme={theme} onPress={() => { hapticLight(); void Linking.openURL('https://truwellai.xyz/contact'); }} />
          <SettingsNavRow icon="🐛" label="Report a problem" theme={theme} onPress={() => { hapticLight(); void Linking.openURL('https://truwellai.xyz/contact'); }} />
          <SettingsNavRow icon="💡" label="Suggest a feature" theme={theme} onPress={() => { hapticLight(); void Linking.openURL('https://truwellai.xyz/contact'); }} />
          <SettingsNavRow icon="ℹ️" label="About TruWell AI" sub={`truwellai.xyz · v${appVersion}`} theme={theme} onPress={() => { hapticLight(); void Linking.openURL('https://truwellai.xyz/about'); }} />
          <SettingsNavRow
            icon="↩️"
            label="Restore purchases"
            sub={restoring ? 'Restoring…' : undefined}
            theme={theme}
            last
            onPress={() => void handleRestorePurchases()}
          />
        </SettingsGroup>

        {/* ── Follow us ─────────────────────────────────────────────────── */}
        <View style={[styles.settingsBlock, { backgroundColor: theme.bg1, borderColor: theme.border }]}>
          <Text style={[styles.blockTitle, { color: theme.text1 }]}>Follow TruWell AI</Text>
          <Text style={[styles.followSub, { color: theme.text3 }]}>
            Wellness tips, new features, and health insights.
          </Text>
          <View style={styles.followRow}>
            {SOCIAL_HANDLES.map((s) => (
              <TouchableOpacity
                key={s.name}
                activeOpacity={0.75}
                onPress={() => {
                  hapticLight();
                  void Linking.openURL(s.url);
                }}
                accessibilityLabel={`Follow TruWell AI on ${s.name}`}
                style={[
                  styles.followBtn,
                  { backgroundColor: `${s.brandColor}14`, borderColor: `${s.brandColor}30` },
                ]}
              >
                {s.icon(s.brandColor)}
                <Text style={[styles.followName, { color: s.brandColor }]}>{s.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Manage subscription billing in App Store or Google Play settings */}
        <View style={[styles.cancellationInfo, { backgroundColor: `${theme.teal}08`, borderColor: `${theme.teal}18` }]}>
          <Text style={[styles.cancellationTitle, { color: theme.text1 }]}>Manage Subscription</Text>
          <Text style={[styles.cancellationBody, { color: theme.text3 }]}>
            Cancel, restore or request a refund for your subscription. Manage everything in one place.
          </Text>
          <TouchableOpacity
            onPress={() => {
              hapticLight();
              const url =
                Platform.OS === 'ios'
                  ? 'https://apps.apple.com/account/subscriptions'
                  : 'https://play.google.com/store/account/subscriptions';
              void Linking.openURL(url).catch(() => {
                void Linking.openURL('https://truwell.ai/support');
              });
            }}
            hitSlop={8}
          >
            <Text style={[styles.cancellationLink, { color: theme.teal }]}>Open Subscription Center</Text>
          </TouchableOpacity>
        </View>

        {/* ── Sign out ──────────────────────────────────────────────────── */}
        <TouchableOpacity
          activeOpacity={0.85}
          style={[styles.signOutBtn, { borderColor: `${theme.red}30` }]}
          onPress={signOut}
        >
          <Text style={[styles.signOutText, { color: theme.red }]}>Sign Out</Text>
        </TouchableOpacity>

        {/* ── Danger Zone ────────────────────────────────────────────────── */}
        <View style={[styles.dangerZone, { backgroundColor: `${theme.red}08`, borderColor: `${theme.red}20` }]}>
          <Text style={[styles.dangerZoneTitle, { color: theme.red }]}>Danger Zone</Text>
          <TouchableOpacity
            activeOpacity={0.85}
            style={[styles.deleteAccountBtn, { borderColor: `${theme.red}40` }]}
            onPress={() => userId && void requestAccountDeletion(userId)}
          >
            <Text style={[styles.deleteAccountText, { color: theme.red }]}>Delete Account and All Data</Text>
          </TouchableOpacity>
          <Text style={[styles.deleteAccountNote, { color: theme.text3 }]}>
            This permanently deletes your health data, scan history, and account. Cannot be undone.
          </Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

// ── Social icons & handles ──────────────────────────────────────────────────

function XIcon({ color }: { color: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill={color}>
      <SvgPath d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </Svg>
  );
}

function LinkedInIcon({ color }: { color: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill={color}>
      <SvgPath d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </Svg>
  );
}

function FacebookIcon({ color }: { color: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill={color}>
      <SvgPath d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </Svg>
  );
}

type SocialHandle = {
  name: string;
  label: string;
  url: string;
  icon: (color: string) => React.ReactNode;
  brandColor: string;
};

const SOCIAL_HANDLES: SocialHandle[] = [
  {
    name: 'X',
    label: 'X',
    url: 'https://x.com/Truwellai',
    icon: (c) => <XIcon color={c} />,
    brandColor: '#1D9BF0',
  },
  {
    name: 'LinkedIn',
    label: 'LinkedIn',
    url: 'https://www.linkedin.com/company/truwell-ai',
    icon: (c) => <LinkedInIcon color={c} />,
    brandColor: '#0A66C2',
  },
  {
    name: 'Facebook',
    label: 'Facebook',
    url: 'https://www.facebook.com/profile.php?id=61573169953847',
    icon: (c) => <FacebookIcon color={c} />,
    brandColor: '#1877F2',
  },
];

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { paddingBottom: 48 },

  // Avatar
  avatarSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 10,
  },
  avatarTouchable: {
    position: 'relative',
  },
  avatarUploadOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEditBadge: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    borderRadius: 12,
    padding: 6,
  },
  avatarEditIcon: { fontSize: 12 },
  onboardingInsightRow: {
    marginTop: 10,
    gap: 2,
  },
  onboardingInsightLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  onboardingInsightValue: {
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },
  avatarWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    overflow: 'hidden',
  },
  avatar: { width: 64, height: 64 },
  avatarFallback: {
    width: 64,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: { fontSize: 22, fontWeight: '800' },
  nameBlock: { flex: 1, gap: 6 },
  displayName: { fontSize: 18, fontWeight: '800', letterSpacing: -0.4 },
  memberMeta: { fontSize: 11, fontWeight: '500' },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 2 },
  tierBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
  },
  tierText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.3 },
  streakBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
  },
  streakBadgeText: { fontSize: 10, fontWeight: '800' },
  milestoneCol: { alignItems: 'center', width: 24 },

  // Stats
  statsGrid: {
    marginHorizontal: 16,
    marginTop: 14,
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: 'row',
  },
  statCell: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 12,
    alignItems: 'center',
    gap: 3,
    borderRightWidth: StyleSheet.hairlineWidth,
  },
  statValue: { fontSize: 17, fontWeight: '800', letterSpacing: -0.5 },
  statLabel: { fontSize: 10, fontWeight: '600', letterSpacing: 0.3 },
  statSeg: { marginTop: 6, width: '100%' },

  // AI card
  aiCard: {
    marginHorizontal: 16,
    marginTop: 14,
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  aiTitle: { fontSize: 15, fontWeight: '800', letterSpacing: -0.2, marginBottom: 3 },
  aiSub: { fontSize: 12, fontWeight: '500', lineHeight: 17 },
  aiArrow: { fontSize: 24, fontWeight: '300' },

  rxEmpty: { fontSize: 13, lineHeight: 18, paddingVertical: 8, paddingBottom: 16 },
  rxCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginBottom: 12,
    gap: 6,
  },
  rxCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 10,
  },
  rxMed: { flex: 1, fontSize: 15, fontWeight: '800' },
  rxStatus: { fontSize: 11, fontWeight: '700', textTransform: 'capitalize' },
  rxSub: { fontSize: 12, lineHeight: 17 },
  rxInstr: { fontSize: 12, lineHeight: 17, fontStyle: 'italic' },
  rxAskBtn: {
    marginTop: 6,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  rxAskTxt: { fontSize: 13, fontWeight: '800' },

  // Upgrade card
  upgradeCard: {
    marginHorizontal: 16,
    marginTop: 10,
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  upgradeTitle: { fontSize: 15, fontWeight: '800', letterSpacing: -0.2, marginBottom: 3 },
  upgradeSub: { fontSize: 12, fontWeight: '500', lineHeight: 17 },
  upgradeArrow: { fontSize: 24, fontWeight: '300' },

  // Settings block
  settingsBlock: {
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 4,
  },
  blockTitle: { fontSize: 15, fontWeight: '800', letterSpacing: -0.2, marginBottom: 10 },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 13,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  settingsRowLast: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 13,
    paddingBottom: 10,
  },
  rowLeft: { flex: 1, marginRight: 12 },
  rowLabel: { fontSize: 14, fontWeight: '600' },
  rowSub: { fontSize: 11, fontWeight: '500', marginTop: 2 },
  rowChev: { fontSize: 20, fontWeight: '300' },
  familyBadge: {
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    marginRight: 6,
  },
  familyBadgeText: { fontSize: 12, fontWeight: '700' },

  // Health profile fields
  fieldLabel: { fontSize: 11, fontWeight: '600', letterSpacing: 0.3, marginBottom: 6, marginTop: 10 },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    fontWeight: '500',
    minHeight: 44,
    marginBottom: 4,
    textAlignVertical: 'top',
  },
  saveBtn: {
    marginTop: 12,
    marginBottom: 6,
    paddingVertical: 13,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
  },
  saveBtnText: { fontSize: 14, fontWeight: '800', letterSpacing: -0.1 },

  // Follow us
  followSub: {
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 17,
    marginTop: 4,
    marginBottom: 12,
  },
  followRow: {
    flexDirection: 'row',
    gap: 10,
  },
  followBtn: {
    flex: 1,
    height: 72,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  followName: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  sectionLabel: {
    marginHorizontal: 16,
    marginTop: 18,
    marginBottom: 4,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },

  // Sign out
  signOutBtn: {
    marginHorizontal: 16,
    marginTop: 16,
    paddingVertical: 13,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
  },
  signOutText: { fontSize: 14, fontWeight: '700' },
  cancellationInfo: {
    marginHorizontal: 16,
    marginTop: 20,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    gap: 6,
  },
  cancellationTitle: { fontSize: 13, fontWeight: '700' },
  cancellationBody: { fontSize: 11, lineHeight: 16 },
  cancellationLink: { fontSize: 12, fontWeight: '700', textDecorationLine: 'underline' },
  dangerZone: {
    marginHorizontal: 16,
    marginTop: 16,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  dangerZoneTitle: { fontSize: 13, fontWeight: '800', letterSpacing: 0.5 },
  deleteAccountBtn: {
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
  },
  deleteAccountText: { fontSize: 14, fontWeight: '700' },
  deleteAccountNote: { fontSize: 11, lineHeight: 16 },
});

export default function WrappedProfileScreen() {
  return (
    <RootErrorBoundary>
      <ProfileScreen />
    </RootErrorBoundary>
  );
}
