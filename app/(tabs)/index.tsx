import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  Dimensions,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import Svg, { Path } from 'react-native-svg';

import { TruWellErrorBoundary, RootErrorBoundary } from '@/components/TruWellErrorBoundary';
import { DailyHealthTip } from '@/components/home/DailyHealthTip';
import { AlertBanner } from '@/components/ui/AlertBanner';
import { NotificationBell } from '@/components/ui/NotificationBell';
import { CriticalAlertBanner } from '@/components/safecircle/GlobalWatchlist';
import { HealthScoreCarousel } from '@/components/home/HealthScoreCarousel';
import { EmergencyButton } from '@/components/ui/EmergencyButton';
import { PanicButton } from '@/components/breathing/PanicButton';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
import { GradeCard, Grade } from '@/components/ui/GradeCard';
import { useTheme } from '@/theme/ThemeContext';
import { TRUWELL_LOGO } from '@/lib/brandAssets';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';

export { TruWellErrorBoundary as ErrorBoundary };
import {
  useProfileQuery,
  useRewardsQuery,
  useDashboardPrefetch,
} from '@/hooks/useTruQueries';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getGreeting(): string {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return 'Good morning';
  if (h >= 12 && h < 17) return 'Good afternoon';
  if (h >= 17 && h < 21) return 'Good evening';
  return 'Good night';
}

function toGrade(raw: string | null | undefined): Grade {
  const valid: Grade[] = ['A+', 'A', 'B', 'C', 'D', 'F'];
  const up = (raw ?? '').toUpperCase() as Grade;
  return valid.includes(up) ? up : 'B';
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function QuickActionButton({
  label,
  icon,
  color,
  onPress,
}: {
  label: string;
  icon: React.ReactNode;
  color: string;
  onPress: () => void;
}) {
  const { theme } = useTheme();
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.75}
      style={[qaStyles.btn, { backgroundColor: `${color}14`, borderColor: `${color}30` }]}
    >
      {icon}
      <Text style={[qaStyles.label, { color: theme.text2 }]}>{label}</Text>
    </TouchableOpacity>
  );
}

const QA_MAX = (Dimensions.get('window').width - 40 - 20) / 3;
const qaStyles = StyleSheet.create({
  btn: {
    flex: 1,
    minWidth: '30%',
    maxWidth: QA_MAX,
    aspectRatio: 1,
    borderRadius: 14,
    borderWidth: 1,
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    overflow: 'hidden',
  },
  label: { fontSize: 11, fontWeight: '700', letterSpacing: -0.1, textAlign: 'center' },
});

function FireIcon({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 2C12 2 7 7 7 12a5 5 0 0010 0c0-2-1-4-2-5 0 0 0 3-2 4-1-2-1-5-1-9z"
        fill={color}
        stroke={color}
        strokeWidth={1}
        strokeLinejoin="round"
      />
    </Svg>
  );
}

type ScanRow = {
  id: string;
  grade: string | null;
  score: number | null;
  product_name: string | null;
  created_at: string;
};

function ScanResultRow({
  scan,
  onAskAI,
}: {
  scan: ScanRow;
  onAskAI: () => void;
}) {
  const { theme } = useTheme();
  const grade = toGrade(scan.grade);
  return (
    <View style={[scanStyles.row, { backgroundColor: theme.bg2, borderColor: theme.border }]}>
      <GradeCard grade={grade} size="sm" />
      <View style={scanStyles.info}>
        <Text style={[scanStyles.product, { color: theme.text1 }]} numberOfLines={1}>
          {scan.product_name ?? 'Unknown product'}
        </Text>
        <Text style={[scanStyles.score, { color: theme.text3 }]}>
          Score: {scan.score ?? '--'}
        </Text>
      </View>
      <TouchableOpacity
        onPress={onAskAI}
        activeOpacity={0.8}
        style={[scanStyles.aiBtn, { backgroundColor: `${theme.purple}18`, borderColor: `${theme.purple}40` }]}
      >
        <Text style={[scanStyles.aiBtnText, { color: theme.purple }]}>Ask AI</Text>
      </TouchableOpacity>
    </View>
  );
}

const scanStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 8,
    overflow: 'hidden',
  },
  info: { flex: 1, gap: 2 },
  product: { fontSize: 13, fontWeight: '700', letterSpacing: -0.2 },
  score: { fontSize: 11, fontWeight: '500' },
  aiBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  aiBtnText: { fontSize: 11, fontWeight: '800', letterSpacing: 0.2 },
});

// ---------------------------------------------------------------------------
// Main screen
// ---------------------------------------------------------------------------

function HomeScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const userId = useAuthStore((s) => s.session?.user?.id);
  const queryClient = useQueryClient();

  // Existing working queries
  const profileQ = useProfileQuery();
  const rewardsQ = useRewardsQuery();
  useDashboardPrefetch();

  useFocusEffect(
    useCallback(() => {
      void queryClient.invalidateQueries({ queryKey: ['user-score', userId] });
    }, [queryClient, userId])
  );

  // User score from user_scores table (new spec table)
  const userScoreQ = useQuery({
    queryKey: ['user-score', userId],
    enabled: !!userId,
    staleTime: 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_scores')
        .select('overall_score, overall_grade, skin_safety_pct, ingredient_purity_pct, allergen_risk_pct, score_delta_7d')
        .eq('user_id', userId!)
        .maybeSingle();
      if (error) return null;
      return data;
    },
  });

  // User alert (first undismissed)
  const userAlertQ = useQuery({
    queryKey: ['user-alert', userId],
    enabled: !!userId,
    staleTime: 30 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_alerts')
        .select('id, message, alert_type')
        .eq('user_id', userId!)
        .eq('dismissed', false)
        .limit(1)
        .maybeSingle();
      if (error) return null;
      return data;
    },
  });

  // Recent scans
  const recentScansQ = useQuery({
    queryKey: ['recent-scans', userId],
    enabled: !!userId,
    staleTime: 30 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('scan_history')
        .select('id, grade, score, product_name, created_at')
        .eq('user_id', userId!)
        .order('created_at', { ascending: false })
        .limit(3);
      if (error) return [] as ScanRow[];
      return (data ?? []) as ScanRow[];
    },
  });

  // Supabase Realtime subscriptions.
  // Channel name includes a random suffix so each effect invocation always gets
  // a brand-new channel object. Without this, Supabase returns the same cached
  // channel on re-mount (React Strict Mode runs effects twice in dev), and
  // calling .on('postgres_changes') after .subscribe() throws an error.
  useEffect(() => {
    if (!userId) return;
    const channelId = `home-rt-${userId}-${Math.random().toString(36).slice(2, 8)}`;
    const channel = supabase
      .channel(channelId)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'user_alerts', filter: `user_id=eq.${userId}` },
        () => queryClient.invalidateQueries({ queryKey: ['user-alert', userId] })
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'user_scores', filter: `user_id=eq.${userId}` },
        () => queryClient.invalidateQueries({ queryKey: ['user-score', userId] })
      )
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [userId, queryClient]);

  // Pull-to-refresh
  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['user-score', userId] }),
      queryClient.invalidateQueries({ queryKey: ['user-alert', userId] }),
      queryClient.invalidateQueries({ queryKey: ['recent-scans', userId] }),
      queryClient.invalidateQueries({ queryKey: ['rewards', userId] }),
    ]);
    setRefreshing(false);
  }, [userId, queryClient]);

  // Dismiss alert
  const dismissAlert = useCallback(async () => {
    if (!userAlertQ.data?.id) return;
    await supabase
      .from('user_alerts')
      .update({ dismissed: true })
      .eq('id', userAlertQ.data.id);
    queryClient.invalidateQueries({ queryKey: ['user-alert', userId] });
  }, [userAlertQ.data, userId, queryClient]);

  // Fire rotation animation for streak card
  const fireRotation = useSharedValue(0);
  useEffect(() => {
    fireRotation.value = withRepeat(
      withTiming(10, { duration: 600, easing: Easing.inOut(Easing.sin) }),
      -1,
      true
    );
  }, []);
  const fireStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${fireRotation.value}deg` }],
  }));

  // Safety guard — all hooks above are unconditional; bail before render if no session
  if (!userId) {
    return <View style={{ flex: 1, backgroundColor: '#020A14' }} />;
  }

  // Derived values
  const name = profileQ.data?.display_name ?? 'there';
  const score = userScoreQ.data?.overall_score ?? (profileQ.data?.reputation_score ?? 0);
  const skinPct = userScoreQ.data?.skin_safety_pct ?? 0;
  const purityPct = userScoreQ.data?.ingredient_purity_pct ?? 0;
  const allergenPct = userScoreQ.data?.allergen_risk_pct ?? 0;
  const streak = rewardsQ.data?.streak_days ?? 0;
  const xpLevel = rewardsQ.data?.level ?? 1;
  const scoreLoading = userScoreQ.isLoading || profileQ.isLoading;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg0 }]} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.teal}
            colors={[theme.teal]}
          />
        }
      >
        {/* ── Header ─────────────────────────────────────────── */}
        <View style={styles.headerRow}>
          <Image
            source={TRUWELL_LOGO}
            style={styles.headerLogo}
            resizeMode="contain"
            accessibilityLabel="TruWell AI"
          />
          <View style={{ flex: 1 }}>
            <Text style={[styles.greetingName, { color: theme.text1 }]}>
              {getGreeting()}, {name}
            </Text>
            <Text style={[styles.greetingSub, { color: theme.text3 }]}>
              Your health snapshot
            </Text>
          </View>
          <NotificationBell onPress={() => router.push('/notifications' as never)} />
        </View>

        {/* ── Health score carousel ─────────────────────────── */}
        <HealthScoreCarousel
          scoreLoading={scoreLoading}
          overallScore={score}
          overallGrade={userScoreQ.data?.overall_grade}
          skinPct={skinPct}
          purityPct={purityPct}
          allergenPct={allergenPct}
          scoreDelta7d={userScoreQ.data?.score_delta_7d ?? 0}
          streakDays={streak}
          xpLevel={xpLevel}
        />

        {/* ── Alert Banner ────────────────────────────────────── */}
        {userAlertQ.data && (
          <AlertBanner
            message={userAlertQ.data.message}
            onDismiss={dismissAlert}
            style={styles.alertBanner}
          />
        )}

        <DailyHealthTip />

        {/* ── Quick Actions ────────────────────────────────────── */}
        <View style={styles.qaGrid}>
          <QuickActionButton
            label="Scan Product"
            color={theme.teal}
            onPress={() => router.push('/scan')}
            icon={
              <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
                <Path d="M3 9V6a1 1 0 011-1h3M3 15v3a1 1 0 001 1h3M21 9V6a1 1 0 00-1-1h-3M21 15v3a1 1 0 01-1 1h-3M8 12h8" stroke={theme.teal} strokeWidth={2} strokeLinecap="round" />
              </Svg>
            }
          />
          <QuickActionButton
            label="AI Chat"
            color={theme.purple}
            onPress={() => router.push('/assistant')}
            icon={
              <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
                <Path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" stroke={theme.purple} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
              </Svg>
            }
          />
          <QuickActionButton
            label="Nearby"
            color={theme.green}
            onPress={() => router.push('/nearby' as never)}
            icon={
              <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M3 21V5a2 2 0 012-2h6v4h2V3h6a2 2 0 012 2v16"
                  stroke={theme.green}
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <Path d="M9 10h2v2H9v-2zm4 0h2v2h-2v-2z" fill={theme.green} />
              </Svg>
            }
          />
          <QuickActionButton
            label="SafeCircle"
            color={theme.green}
            onPress={() => router.push('/(tabs)/safecircle')}
            icon={
              <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
                <Path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" stroke={theme.green} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
              </Svg>
            }
          />
          <QuickActionButton
            label="Scan Food"
            color={theme.amber}
            onPress={() => router.push('/snap-food' as never)}
            icon={
              <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M5 4v14M5 7h3M5 10h2M5 13h2.5M14 8h2l1 1h3v7h-8V9h2l1-1z"
                  stroke={theme.amber}
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <Path d="M16 12h.01" stroke={theme.amber} strokeWidth={2} strokeLinecap="round" />
              </Svg>
            }
          />
          <QuickActionButton
            label="Scan History"
            color={theme.gold}
            onPress={() => router.push('/food-history' as never)}
            icon={<Text style={{ fontSize: 22 }}>📋</Text>}
          />
        </View>

        {/* ── Critical Alert Banner ────────────────────────────── */}
        <View style={{ marginTop: 4, overflow: 'hidden' }}>
          <CriticalAlertBanner onPress={() => router.push('/(tabs)/safecircle')} />
        </View>

        {/* ── Streak Card ──────────────────────────────────────── */}
        <View style={[styles.streakCard, { backgroundColor: theme.bg1, borderColor: theme.border }]}>
          <Animated.View style={fireStyle}>
            <FireIcon color={theme.amber} />
          </Animated.View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.streakCount, { color: theme.amber }]}>
              {streak} day streak
            </Text>
            <Text style={[styles.streakSub, { color: theme.text3 }]}>
              Keep scanning daily to maintain your streak
            </Text>
          </View>
        </View>

        {/* ── Recent Scans ─────────────────────────────────────── */}
        {recentScansQ.isLoading ? (
          <View style={styles.section}>
            <SkeletonLoader width="100%" height={60} borderRadius={14} style={styles.scanSkeleton} />
            <SkeletonLoader width="100%" height={60} borderRadius={14} style={styles.scanSkeleton} />
            <SkeletonLoader width="100%" height={60} borderRadius={14} />
          </View>
        ) : (recentScansQ.data ?? []).length > 0 ? (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.text1 }]}>Recent Scans</Text>
            {(recentScansQ.data ?? []).map((scan) => (
              <ScanResultRow
                key={scan.id}
                scan={scan}
                onAskAI={() =>
                  router.push({
                    pathname: '/assistant',
                    params: { productName: scan.product_name ?? '' },
                  } as never)
                }
              />
            ))}
          </View>
        ) : null}
      </ScrollView>
      <EmergencyButton />
      <PanicButton liftAboveEmergency />
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { padding: 16, paddingBottom: 140 },

  // Header
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  headerLogo: { width: 40, height: 40 },
  greetingName: { fontSize: 17, fontWeight: '800', letterSpacing: -0.3 },
  greetingSub: { fontSize: 12, fontWeight: '500', marginTop: 1 },

  // Alert
  alertBanner: { marginBottom: 12 },

  // Quick actions
  qaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
    width: '100%',
    overflow: 'hidden',
  },

  section: { marginBottom: 20, overflow: 'hidden' },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.2,
    marginBottom: 10,
  },

  // Streak
  streakCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginBottom: 20,
    overflow: 'hidden',
  },
  streakCount: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  streakSub: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },

  // Scan rows
  scanSkeleton: { marginBottom: 8 },
});

export default function WrappedHomeScreen() {
  return (
    <RootErrorBoundary>
      <HomeScreen />
    </RootErrorBoundary>
  );
}
