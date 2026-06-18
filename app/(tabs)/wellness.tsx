import { TruWellErrorBoundary, RootErrorBoundary } from '@/components/TruWellErrorBoundary';
import { ExerciseIcon } from '@/components/breathing/ExerciseIcon';
import { PanicButton } from '@/components/breathing/PanicButton';
import { BreathingCircle, BreathingPattern } from '@/components/wellness/BreathingCircle';
import { WaterCupGrid } from '@/components/wellness/WaterCupGrid';
import { UpgradePromptCard } from '@/components/subscription/UpgradePromptCard';
import { isPro as isPlanPro, type PlanId } from '@/lib/subscriptionPlans';

export { TruWellErrorBoundary as ErrorBoundary };
import { SegmentedIndicator, SegmentedIndicatorRef } from '@/components/ui/SegmentedIndicator';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
import { TaskBurstEffect } from '@/components/ui/RewardAnimation';
import { recordWellnessActivityDay } from '@/lib/activityStreak';
import { recordBreathingSession } from '@/lib/breathingProgress';
import { exportDietPlanAsPDF } from '@/lib/dietPlanExport';
import { hapticSelection, hapticSuccess } from '@/lib/haptics';
import { supabase } from '@/lib/supabase';
import { loadWellnessPrefs } from '@/lib/wellnessPrefs';
import { playBreathingSound, type BreathingSoundId } from '@/lib/wellnessSound';
import { applyWellnessReminderPrefs } from '@/lib/wellnessReminders';
import { useAuthStore } from '@/stores/authStore';
import { useRewardStore } from '@/stores/rewardStore';
import { useUserProfileStore } from '@/stores/userProfileStore';
import { useDietStore } from '@/stores/dietStore';
import { triggerXpGained } from '@/stores/rewardAnimStore';
import { useRewardsQuery } from '@/hooks/useTruQueries';
import { useTheme } from '@/theme/ThemeContext';
import { useFocusEffect } from '@react-navigation/native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Circle as SvgCircle, Path as SvgPath } from 'react-native-svg';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
  interpolate,
} from 'react-native-reanimated';

function ChatBubbleIcon({ color }: { color: string }) {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <SvgPath
        d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

async function ensureDailyReset(userId: string): Promise<void> {
  const today = todayIso();
  const { data } = await supabase
    .from('user_wellness')
    .select('last_daily_reset')
    .eq('user_id', userId)
    .maybeSingle();

  const lastReset = (data as { last_daily_reset: string | null } | null)
    ?.last_daily_reset ?? null;

  if (lastReset === today) return;

  await supabase
    .from('user_wellness')
    .update({
      daily_water_cups: 0,
      breathing_sessions_today: 0,
      calories_consumed: 0,
      daily_score_contribution: 0,
      last_daily_reset: today,
    })
    .eq('user_id', userId);
}

function dayLabel(iso: string) {
  const d = new Date(iso + 'T12:00:00');
  return d.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric' });
}

function ForkCameraIcon({ color }: { color: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <SvgPath
        d="M3 5c0 2.5 2 4.5 2 7v8M3 8h3M3 12h2.5"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
      />
      <SvgPath
        d="M14 9h2.2l1 1H21v7H13V10h1l1-1z"
        stroke={color}
        strokeWidth={1.6}
        strokeLinejoin="round"
      />
      <SvgCircle cx={17} cy={13} r={2} stroke={color} strokeWidth={1.5} />
    </Svg>
  );
}

const PATTERNS: { key: BreathingPattern; label: string }[] = [
  { key: 'box', label: 'Box 4-4-4-4' },
  { key: '4-7-8', label: '4-7-8' },
  { key: 'wim-hof', label: 'Wim Hof' },
];

// ---------------------------------------------------------------------------
// GoalCard — title + value text + 8-segment SegmentedIndicator
// ---------------------------------------------------------------------------

interface GoalCardProps {
  title: string;
  value: string;
  pct: number;
  color: string;
  segRef: React.RefObject<SegmentedIndicatorRef | null>;
  headerRight?: React.ReactNode;
}

function GoalCard({ title, value, pct, color, segRef, headerRight }: GoalCardProps) {
  const { theme } = useTheme();
  return (
    <View style={[goalStyles.card, { backgroundColor: theme.bg2, borderColor: theme.border }]}>
      <View style={goalStyles.goalHead}>
        <Text style={[goalStyles.title, { color: theme.text3 }]}>{title}</Text>
        {headerRight}
      </View>
      <Text style={[goalStyles.value, { color }]}>{value}</Text>
      <SegmentedIndicator
        ref={segRef}
        value={Math.min(100, pct)}
        count={8}
        color={color}
        height={4}
        gap={2}
        animated
      />
    </View>
  );
}

const scoreStyles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 8, marginHorizontal: 16, marginBottom: 12 },
  pill: { borderRadius: 12, borderWidth: 1, padding: 10, flex: 1 },
  pillLabel: { fontSize: 10, marginBottom: 2 },
  pillValue: { fontSize: 16, fontWeight: '800' },
});

const goalStyles = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    gap: 6,
    minWidth: '45%',
  },
  goalHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  },
  title: { fontSize: 10, fontWeight: '700', letterSpacing: 0.6, textTransform: 'uppercase', flex: 1 },
  camBtn: { padding: 6, borderRadius: 10, borderWidth: 1 },
  value: { fontSize: 17, fontWeight: '900', letterSpacing: -0.4 },
});

// ---------------------------------------------------------------------------
// Main screen
// ---------------------------------------------------------------------------

type SupabaseMeal = {
  id: string;
  name: string;
  category: string;
  calories: number;
};

type SupabasePlan = {
  id: string;
  logged_meals: string[];
  breakfast: SupabaseMeal | null;
  lunch: SupabaseMeal | null;
  dinner: SupabaseMeal | null;
};

function WellnessScreen() {
  const router       = useRouter();
  const { theme }    = useTheme();
  const queryClient  = useQueryClient();
  const userId       = useAuthStore((s) => s.session?.user.id);
  const userProfile  = useUserProfileStore((s) => s.profile);

  // ── Existing reward data ─────────────────────────────────────────────────
  useRewardsQuery();
  const addXp = useRewardStore((s) => s.addXp);
  const xp = useRewardStore((s) => s.xp);
  const level = useRewardStore((s) => s.level);
  const challenges = useRewardStore((s) => s.challenges);
  const scanCount = useRewardStore((s) => s.scanCountLifetime);
  const nextLevelXp = 100 + (level - 1) * 50;

  // ── user_wellness query ──────────────────────────────────────────────────
  const wellnessQ = useQuery({
    queryKey: ['user-wellness', userId],
    enabled: !!userId,
    staleTime: 20 * 1000,
    queryFn: async () => {
      const today = new Date().toISOString().slice(0, 10);
      let { data, error } = await supabase
        .from('user_wellness')
        .select(
          'id, daily_water_cups, water_goal, breathing_sessions_today, breathing_goal, calories_consumed, calorie_target, daily_score_contribution, cumulative_health_score, last_daily_reset'
        )
        .eq('user_id', userId!)
        .maybeSingle();

      // If no row exists, create one with defaults
      if (!error && !data) {
        const { data: inserted } = await supabase
          .from('user_wellness')
          .upsert({
            user_id: userId!,
            daily_water_cups: 0,
            water_goal: 8,
            breathing_sessions_today: 0,
            breathing_goal: 3,
            calories_consumed: 0,
            calorie_target: 2200,
            daily_score_contribution: 0,
            cumulative_health_score: 0,
            last_daily_reset: today,
          }, { onConflict: 'user_id' })
          .select(
            'id, daily_water_cups, water_goal, breathing_sessions_today, breathing_goal, calories_consumed, calorie_target, daily_score_contribution, cumulative_health_score, last_daily_reset'
          )
          .maybeSingle();
        data = inserted;
      }

      if (error) return null;
      return data;
    },
  });

  const wellness = wellnessQ.data;
  const dailyScoreContribution = (wellness as { daily_score_contribution?: number } | null | undefined)?.daily_score_contribution ?? 0;
  const wellnessCumulativeScore = (wellness as {
    cumulative_health_score?: number
  } | null | undefined)?.cumulative_health_score ?? 0;

  // Also check profiles table where onboarding saves health_score
  const profileScoreQuery = useQuery({
    queryKey: ['profile-health-score', userId],
    enabled: !!userId && wellnessCumulativeScore === 0,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data } = await supabase
        .from('profiles')
        .select('health_score')
        .eq('id', userId!)
        .maybeSingle();
      return (data as { health_score?: number } | null)
        ?.health_score ?? 0;
    },
  });

  const cumulativeScore = wellnessCumulativeScore ||
    profileScoreQuery.data || 0;
  const waterGoal = wellness?.water_goal ?? 8;
  const breathDone = wellness?.breathing_sessions_today ?? 0;
  const breathGoal = wellness?.breathing_goal ?? 3;

  // Live water-cup count so the header ("X of 8 cups today") reacts
  // instantly when the user taps a cup — the DB write + React Query
  // invalidation fire in the background.
  const [waterCupsLive, setWaterCupsLive] = useState<number | null>(null);
  const waterCups = waterCupsLive ?? wellness?.daily_water_cups ?? 0;
  useEffect(() => {
    // When the underlying DB value changes (e.g. from another device), drop
    // the local override so we show the truth.
    setWaterCupsLive(null);
  }, [wellness?.daily_water_cups]);

  // Cache the user's breathing-reward sound so we can play it locally when
  // they finish a session without an extra DB hit.
  const breathingSoundRef = useRef<BreathingSoundId>('chime');
  useEffect(() => {
    if (!userId) return;
    void (async () => {
      try {
        const prefs = await loadWellnessPrefs(userId);
        breathingSoundRef.current = prefs.breathing_reminder_sound;
        // Opportunistically re-apply the reminder schedule on wellness screen
        // mount so the OS scheduler stays in sync even if the user never opens
        // the dedicated settings screen.
        void applyWellnessReminderPrefs(prefs);
      } catch { /* non-fatal */ }
    })();
  }, [userId]);
  const caloriesDone = wellness?.calories_consumed ?? 0;
  const calorieTarget = wellness?.calorie_target ?? 2200;

  // ── Today's meal plan from Supabase ─────────────────────────────────────
  const today = todayIso();
  const [selectedDate, setSelectedDate] = useState(today);
  const tierQ = useQuery({
    queryKey: ['subscription-tier', userId],
    enabled: !!userId,
    staleTime: 10 * 60 * 1000,
    queryFn: async () => {
      const { data } = await supabase
        .from('profiles')
        .select('subscription_plan')
        .eq('id', userId!)
        .maybeSingle();
      return ((data as { subscription_plan: string } | null)?.subscription_plan ?? 'free') as PlanId;
    },
  });
  const tier = tierQ.data ?? 'free';
  const isPro = isPlanPro(tier);

  const mealPlanQ = useQuery({
    queryKey: ['meal-plan', userId, selectedDate],
    enabled: !!userId,
    staleTime: 30 * 1000,
    queryFn: async (): Promise<SupabasePlan | null> => {
      const { data, error } = await supabase
        .from('meal_plans')
        .select(
          `id, logged_meals,
           breakfast:breakfast_meal_id(id, name, category, calories),
           lunch:lunch_meal_id(id, name, category, calories),
           dinner:dinner_meal_id(id, name, category, calories)`
        )
        .eq('user_id', userId!)
        .eq('plan_date', selectedDate)
        .maybeSingle();
      if (error || !data) return null;
      return {
        id: (data as Record<string, unknown>).id as string,
        logged_meals: ((data as Record<string, unknown>).logged_meals as string[]) ?? [],
        breakfast: (data as Record<string, unknown>).breakfast as SupabaseMeal | null,
        lunch: (data as Record<string, unknown>).lunch as SupabaseMeal | null,
        dinner: (data as Record<string, unknown>).dinner as SupabaseMeal | null,
      };
    },
  });

  // ── Local diet store fallback (week picker) ──────────────────────────────
  const weekPlans = useDietStore((s) => s.weekPlans);

  // weekPlans is kept only for the day-selector chip UI;
  // actual meal content now comes from mealPlanQ (real
  // Supabase data) per selected day, not from the static
  // demo template.

  // ── Log meal (Supabase plan) ─────────────────────────────────────────────
  const [localLogged, setLocalLogged] = useState<Set<string>>(new Set());

  const logMeal = useMutation({
    mutationFn: async ({ mealId, calories }: { mealId: string; calories: number }) => {
      if (!mealPlanQ.data?.id) return;
      const updated = [...(mealPlanQ.data.logged_meals ?? []), mealId];
      await supabase
        .from('meal_plans')
        .update({ logged_meals: updated })
        .eq('id', mealPlanQ.data.id);
      if (userId) {
        await supabase
          .from('user_wellness')
          .update({ calories_consumed: (wellness?.calories_consumed ?? 0) + calories })
          .eq('user_id', userId);
        await supabase.rpc('calculate_daily_score_contribution', {
          p_user_id: userId,
        });
      }
    },
    onMutate: ({ mealId }) => setLocalLogged((s) => new Set(s).add(mealId)),
    onSuccess: () => {
      addXp(15);
      void queryClient.invalidateQueries({ queryKey: ['user-wellness', userId] });
      void queryClient.invalidateQueries({ queryKey: ['meal-plan', userId, selectedDate] });
      void queryClient.invalidateQueries({ queryKey: ['rewards', userId] });
    },
    onError: (_, { mealId }) =>
      setLocalLogged((s) => { const n = new Set(s); n.delete(mealId); return n; }),
  });

  // ── Supabase Realtime for user_wellness ──────────────────────────────────
  useEffect(() => {
    if (!userId) return;
    const ch = supabase
      .channel(`wellness-rt-${userId}-${Math.random().toString(36).slice(2, 8)}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'user_wellness', filter: `user_id=eq.${userId}` },
        () => {
          void queryClient.invalidateQueries({ queryKey: ['user-wellness', userId] });
          // re-animate on update (handled in the focus effect below as well)
          segRefs.current.forEach((r) => r?.triggerAnimation());
        }
      )
      .subscribe();
    return () => { void supabase.removeChannel(ch); };
  }, [userId, queryClient]);

  // ── SegmentedIndicator refs ──────────────────────────────────────────────
  const xpSegRef = useRef<SegmentedIndicatorRef>(null);
  const waterSegRef = useRef<SegmentedIndicatorRef>(null);
  const breathSegRef = useRef<SegmentedIndicatorRef>(null);
  const calSegRef = useRef<SegmentedIndicatorRef>(null);
  const scanSegRef = useRef<SegmentedIndicatorRef>(null);
  const segRefs = useRef([xpSegRef.current, waterSegRef.current, breathSegRef.current, calSegRef.current, scanSegRef.current]);

  useFocusEffect(
    useCallback(() => {
      [xpSegRef, waterSegRef, breathSegRef, calSegRef, scanSegRef].forEach(
        (r) => r.current?.triggerAnimation()
      );
      if (userId) {
        void ensureDailyReset(userId).then(() => {
          void queryClient.invalidateQueries({ queryKey: ['wellness', userId] });
          void queryClient.invalidateQueries({ queryKey: ['hydration-today', userId] });
          void queryClient.invalidateQueries({ queryKey: ['user-wellness', userId] });
        });
      }
    }, [userId, queryClient])
  );

  // ── Task burst ────────────────────────────────────────────────────────────
  const [burstChallengeId, setBurstChallengeId] = useState<string | null>(null);
  const setChallenges = useRewardStore((s) => s.setChallenges);

  const handleMarkChallengeDone = useCallback((id: string) => {
    const challenge = challenges.find((c) => c.id === id);
    if (!challenge || challenge.done) return;
    hapticSelection();
    setChallenges(challenges.map((c) => c.id === id ? { ...c, done: true } : c));
    addXp(challenge.xp);
    triggerXpGained(challenge.xp);
    setBurstChallengeId(id);
  }, [challenges, setChallenges, addXp]);

  // ── Collapsible tasks ────────────────────────────────────────────────────
  const TASKS_KEY = 'truwell_tasks_expanded';
  const [tasksExpanded, setTasksExpanded] = useState(true);
  const taskHeightSV  = useSharedValue(1);   // 1 = open, 0 = closed
  const chevronSV     = useSharedValue(1);

  // Load persisted state once on mount
  useEffect(() => {
    void AsyncStorage.getItem(TASKS_KEY).then((val) => {
      if (val === 'false') {
        setTasksExpanded(false);
        taskHeightSV.value  = 0;
        chevronSV.value     = 0;
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleTasks = useCallback(() => {
    hapticSelection();
    setTasksExpanded((prev) => {
      const next = !prev;
      taskHeightSV.value = withTiming(next ? 1 : 0, { duration: 300 });
      chevronSV.value    = withTiming(next ? 1 : 0, { duration: 300 });
      void AsyncStorage.setItem(TASKS_KEY, String(next));
      return next;
    });
  }, [taskHeightSV, chevronSV]);

  const [taskContentHeight, setTaskContentHeight] = useState(0);

  const tasksAnimStyle = useAnimatedStyle(() => ({
    height:   taskHeightSV.value * taskContentHeight,
    opacity:  taskHeightSV.value,
    overflow: 'hidden',
  }));

  const chevronAnimStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${interpolate(chevronSV.value, [0, 1], [0, 180])}deg` }],
  }));

  const doneTasks   = challenges.filter((c) => c.done).length;
  const totalTasks  = challenges.length;

  // ── Diet plan download ───────────────────────────────────────────────────
  const [downloading, setDownloading] = useState<'weekly' | 'monthly' | null>(null);

  const handleDownloadPlan = async (period: 'weekly' | 'monthly') => {
    if (!userId) return;
    setDownloading(period);
    try {
      const days     = period === 'weekly' ? 7 : 30;
      const dates: string[] = Array.from({ length: days }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() + i);
        return d.toISOString().slice(0, 10);
      });

      const { data: planRows } = await supabase
        .from('meal_plans')
        .select(`
          plan_date,
          breakfast:breakfast_meal_id(name, calories),
          lunch:lunch_meal_id(name, calories),
          dinner:dinner_meal_id(name, calories)
        `)
        .eq('user_id', userId)
        .in('plan_date', dates)
        .order('plan_date');

      const DAYS = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
      const plans = dates.map((date) => {
        const row = (planRows ?? []).find((r: Record<string,unknown>) => r.plan_date === date) as Record<string,unknown> | undefined;
        const bf  = (row?.breakfast as { name:string; calories:number } | null) ?? { name: 'Rest day', calories: 0 };
        const lu  = (row?.lunch    as { name:string; calories:number } | null) ?? { name: 'Rest day', calories: 0 };
        const di  = (row?.dinner   as { name:string; calories:number } | null) ?? { name: 'Rest day', calories: 0 };
        return {
          date,
          dayName: DAYS[new Date(date + 'T12:00:00').getDay()],
          breakfast: bf,
          lunch:     lu,
          dinner:    di,
        };
      });

      const healthProfile = (userProfile?.health_profile as { dietary_restrictions?: string[] } | null);
      await exportDietPlanAsPDF({
        userProfile: {
          name:                 (userProfile as { display_name?: string } | null)?.display_name ?? 'TruWell User',
          dietaryRestrictions:  healthProfile?.dietary_restrictions ?? [],
        },
        plans,
        period,
      });
      hapticSuccess();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Export failed';
      Alert.alert('Export failed', msg);
    } finally {
      setDownloading(null);
    }
  };

  // ── Breathing session ────────────────────────────────────────────────────
  const [breathingActive, setBreathingActive] = useState(false);
  const [breathingPattern, setBreathingPattern] = useState<BreathingPattern>('box');
  const breathStartRef = useRef<number | null>(null);

  const startBreathing = useCallback(() => {
    breathStartRef.current = Date.now();
    setBreathingActive(true);
  }, []);

  const flash = useSharedValue(0);
  const flashStyle = useAnimatedStyle(() => ({ opacity: flash.value }));

  const handleBreathingComplete = useCallback(async () => {
    setBreathingActive(false);
    addXp(10);
    hapticSuccess();
    // Play the user's chosen breathing reward sound (no-op if 'none' or the
    // asset is missing). Fire-and-forget.
    void playBreathingSound(breathingSoundRef.current);
    flash.value = withSequence(
      withTiming(1, { duration: 180 }),
      withTiming(0, { duration: 320 })
    );

    if (userId) {
      const durationSeconds = breathStartRef.current
        ? Math.round((Date.now() - breathStartRef.current) / 1000)
        : 0;
      breathStartRef.current = null;

      // Single source of truth for breathing data: writes a fully
      // populated row to breathing_sessions AND upserts the
      // breathing_progress row (streak, rank, total sessions) that
      // the Breathing Hub and My Breathing Journey screens read from.
      await recordBreathingSession(userId, {
        exercise: {
          id: breathingPattern,
          name: breathingPattern,
          category: 'general',
          visualType: 'standard',
        } as never,
        durationSeconds,
        cyclesCompleted: 0,
        stressBefore: null,
        stressAfter: null,
      });

      // Increment today's counter in user_wellness, used by the
      // wellness card's own daily progress ring.
      await supabase
        .from('user_wellness')
        .update({ breathing_sessions_today: (breathDone ?? 0) + 1 })
        .eq('user_id', userId);
      await supabase.rpc('calculate_daily_score_contribution', {
        p_user_id: userId,
      });
    }

    await recordWellnessActivityDay();
    void queryClient.invalidateQueries({ queryKey: ['user-wellness', userId] });
    void queryClient.invalidateQueries({ queryKey: ['rewards', userId] });
    void queryClient.invalidateQueries({ queryKey: ['breathing-progress', userId] });
    void queryClient.invalidateQueries({ queryKey: ['breathing-today', userId] });
    void queryClient.invalidateQueries({ queryKey: ['breathing-history', userId] });
  }, [addXp, breathDone, breathingPattern, flash, queryClient, userId]);

  // ── Derived values ───────────────────────────────────────────────────────
  const xpPct = nextLevelXp > 0 ? (xp / nextLevelXp) * 100 : 0;
  const waterPct = waterGoal > 0 ? (waterCups / waterGoal) * 100 : 0;
  const breathPct = breathGoal > 0 ? (breathDone / breathGoal) * 100 : 0;
  const calPct = calorieTarget > 0 ? (caloriesDone / calorieTarget) * 100 : 0;
  const scanPct = Math.min(100, (scanCount / 10) * 100);

  const supabaseMeals: ({ meal: SupabaseMeal; logged: boolean } | null)[] = mealPlanQ.data
    ? [
        mealPlanQ.data.breakfast
          ? { meal: mealPlanQ.data.breakfast, logged: localLogged.has(mealPlanQ.data.breakfast.id) || mealPlanQ.data.logged_meals.includes(mealPlanQ.data.breakfast.id) }
          : null,
        mealPlanQ.data.lunch
          ? { meal: mealPlanQ.data.lunch, logged: localLogged.has(mealPlanQ.data.lunch.id) || mealPlanQ.data.logged_meals.includes(mealPlanQ.data.lunch.id) }
          : null,
        mealPlanQ.data.dinner
          ? { meal: mealPlanQ.data.dinner, logged: localLogged.has(mealPlanQ.data.dinner.id) || mealPlanQ.data.logged_meals.includes(mealPlanQ.data.dinner.id) }
          : null,
      ].filter(Boolean)
    : [];

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg0 }]} edges={['top']}>
      <Animated.View style={[styles.flashOverlay, { backgroundColor: theme.gold }, flashStyle]} pointerEvents="none" />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <Text style={[styles.screenTitle, { color: theme.text1 }]}>Wellness</Text>
        <Text style={[styles.screenSub, { color: theme.text3 }]}>Your daily health habits</Text>

        <View style={scoreStyles.row}>
          <View style={[scoreStyles.pill, { backgroundColor: theme.bg1, borderColor: theme.border }]}>
            <Text style={[scoreStyles.pillLabel, { color: theme.text3 }]}>Today's contribution</Text>
            <Text style={[scoreStyles.pillValue, { color: theme.teal }]}>{dailyScoreContribution}/70 pts</Text>
          </View>
          <View style={[scoreStyles.pill, { backgroundColor: theme.bg1, borderColor: theme.gold + '44' }]}>
            <Text style={[scoreStyles.pillLabel, { color: theme.text3 }]}>Health score</Text>
            <Text style={[scoreStyles.pillValue, { color: theme.gold }]}>
              {cumulativeScore}/100
            </Text>
          </View>
        </View>

        {/* ── XP Level card ───────────────────────────────────────────────── */}
        <View style={[styles.card, { backgroundColor: theme.bg1, borderColor: theme.border }]}>
          <View style={styles.xpHeader}>
            <View style={[styles.levelBadge, { backgroundColor: `${theme.gold}18`, borderColor: `${theme.gold}55` }]}>
              <Text style={[styles.levelLbl, { color: theme.text3 }]}>LVL</Text>
              <Text style={[styles.levelNum, { color: theme.gold }]}>{level}</Text>
            </View>
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={[styles.xpTitle, { color: theme.text1 }]}>Guardian Level {level}</Text>
              <Text style={[styles.xpSub, { color: theme.text3 }]}>{xp} / {nextLevelXp} XP to next level</Text>
              <SegmentedIndicator
                ref={xpSegRef}
                value={xpPct}
                count={15}
                color={theme.gold}
                height={5}
                gap={2}
                animated
              />
            </View>
          </View>
          {/* Collapsible task header */}
          <Pressable
            onPress={toggleTasks}
            style={[styles.taskHeader, { borderTopColor: theme.border }]}
          >
            <Text style={[styles.taskHeaderTitle, { color: theme.text2 }]}>Daily Tasks</Text>
            <View style={styles.taskHeaderRight}>
              <View style={[styles.taskBadge, { backgroundColor: `${theme.gold}18`, borderColor: `${theme.gold}40` }]}>
                <Text style={[styles.taskBadgeText, { color: theme.gold }]}>
                  {doneTasks} of {totalTasks}
                </Text>
              </View>
              <Animated.Text style={[styles.taskChevron, { color: theme.text3 }, chevronAnimStyle]}>
                ˄
              </Animated.Text>
            </View>
          </Pressable>

          {/* Animated task list */}
          <Animated.View style={tasksAnimStyle}>
            <View
              onLayout={(e) => setTaskContentHeight(e.nativeEvent.layout.height)}
              style={styles.taskListInner}
            >
              {challenges.slice(0, 3).map((c) => (
                <Pressable
                  key={c.id}
                  onPress={() => handleMarkChallengeDone(c.id)}
                  style={[styles.challengeRow, { borderTopColor: theme.border }]}
                >
                  {/* Task burst origin */}
                  <View style={styles.burstOrigin}>
                    <TaskBurstEffect
                      active={burstChallengeId === c.id}
                      onDone={() => setBurstChallengeId(null)}
                      colors={[theme.teal, theme.gold, theme.green]}
                    />
                  </View>
                  <Text style={[styles.challengeTitle, { color: c.done ? theme.text4 : theme.text2 }]}>
                    {c.done ? '✓ ' : ''}{c.title}
                  </Text>
                  <Text style={[styles.challengeXp, { color: theme.gold }]}>+{c.xp} XP</Text>
                </Pressable>
              ))}
            </View>
          </Animated.View>
        </View>

        {/* ── Goals grid ──────────────────────────────────────────────────── */}
        {wellnessQ.isLoading ? (
          <View style={styles.goalsGrid}>
            {[0, 1, 2, 3].map((i) => (
              <SkeletonLoader key={i} width="47%" height={80} borderRadius={14} />
            ))}
          </View>
        ) : (
          <View style={styles.goalsGrid}>
            <GoalCard
              title="Water"
              value={`${waterCups} / ${waterGoal} cups`}
              pct={waterPct}
              color={theme.teal}
              segRef={waterSegRef}
            />
            <GoalCard
              title="Breathing"
              value={`${breathDone} / ${breathGoal} sessions`}
              pct={breathPct}
              color={theme.purple}
              segRef={breathSegRef}
            />
            <GoalCard
              title="Calories"
              value={`${caloriesDone} / ${calorieTarget}`}
              pct={calPct}
              color={theme.amber}
              segRef={calSegRef}
              headerRight={
                <TouchableOpacity
                  onPress={() => router.push('/snap-food' as never)}
                  hitSlop={10}
                  style={[goalStyles.camBtn, { borderColor: `${theme.amber}50`, backgroundColor: `${theme.amber}14` }]}
                  accessibilityLabel="Snap food"
                >
                  <ForkCameraIcon color={theme.amber} />
                </TouchableOpacity>
              }
            />
            <GoalCard
              title="Scans"
              value={`${scanCount} lifetime`}
              pct={scanPct}
              color={theme.green}
              segRef={scanSegRef}
            />
          </View>
        )}

        {/* ── Water section ───────────────────────────────────────────────── */}
        <View style={[styles.card, { backgroundColor: theme.bg1, borderColor: theme.border }]}>
          <Text style={[styles.cardTitle, { color: theme.teal }]}>Water Intake</Text>
          <Text style={[styles.cardSub, { color: theme.text3 }]}>
            {waterCups} of {waterGoal} cups today
          </Text>
          <WaterCupGrid
            key={today}
            initialCups={waterCups}
            goalCups={waterGoal}
            onChange={(cups) => {
              setWaterCupsLive(cups);
              // Invalidate in the background so the query store catches up too.
              void queryClient.invalidateQueries({ queryKey: ['user-wellness', userId] });
              if (userId) {
                void (async () => {
                  await supabase
                    .from('user_wellness')
                    .update({ daily_water_cups: cups })
                    .eq('user_id', userId);
                  await supabase.rpc('calculate_daily_score_contribution', {
                    p_user_id: userId,
                  });
                  void queryClient.invalidateQueries({ queryKey: ['wellness', userId] });
                  void queryClient.invalidateQueries({ queryKey: ['user-wellness', userId] });
                })();
              }
            }}
          />
        </View>

        {/* ── Breathing section (legacy inline) ────────────────────────────── */}
        <View style={[styles.card, { backgroundColor: theme.bg1, borderColor: theme.border }]}>
          <Text style={[styles.cardTitle, { color: theme.purple }]}>Quick Session</Text>
          {!breathingActive && (
            <>
              <View style={styles.patternRow}>
                {PATTERNS.map((p) => (
                  <Pressable
                    key={p.key}
                    onPress={() => { hapticSelection(); setBreathingPattern(p.key); }}
                    style={[
                      styles.patternChip,
                      {
                        backgroundColor: breathingPattern === p.key ? `${theme.purple}18` : theme.bg2,
                        borderColor: breathingPattern === p.key ? theme.purple : theme.border,
                      },
                    ]}
                  >
                    <Text style={[styles.patternLabel, { color: breathingPattern === p.key ? theme.purple : theme.text3 }]}>
                      {p.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
              <TouchableOpacity
                onPress={startBreathing}
                activeOpacity={0.85}
                style={[styles.startBtn, { backgroundColor: `${theme.purple}18`, borderColor: `${theme.purple}40` }]}
              >
                <Text style={[styles.startBtnText, { color: theme.purple }]}>Start Session</Text>
              </TouchableOpacity>
            </>
          )}

          {breathingActive && (
            <>
              <BreathingCircle
                pattern={breathingPattern}
                onComplete={handleBreathingComplete}
              />
              <TouchableOpacity
                onPress={() => setBreathingActive(false)}
                activeOpacity={0.85}
                style={[styles.stopBtn, { borderColor: theme.border }]}
              >
                <Text style={[styles.stopBtnText, { color: theme.text3 }]}>Stop</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* ── Breathing Training hub entry (Phase 13) ─────────────────────── */}
        <View style={[styles.card, { backgroundColor: theme.bg1, borderColor: theme.border }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
            <Text style={[styles.cardTitle, { color: theme.text1, flex: 1 }]}>Breathing Training</Text>
            <TouchableOpacity onPress={() => router.push('/breathing/progress' as never)} hitSlop={6}>
              <Text style={{ color: theme.teal, fontSize: 11, fontWeight: '800' }}>View Progress</Text>
            </TouchableOpacity>
          </View>
          <Text style={{ color: theme.text3, fontSize: 12, marginBottom: 12 }}>
            12 guided exercises across 4 categories — calm, focus, energy, recovery.
          </Text>

          {/* Animated preview icons — tapping any routes to the hub */}
          <View style={styles.breathPreviewRow}>
            {([
              { v: 'lungs' as const,   c: '#2ED573', label: 'Calm' },
              { v: 'ring' as const,    c: '#1E90FF', label: 'Focus' },
              { v: 'orb' as const,     c: '#FF4757', label: 'Energy' },
              { v: 'military' as const, c: '#9B59B6', label: 'Recover' },
            ]).map(({ v, c, label }) => (
              <TouchableOpacity
                key={v}
                onPress={() => { hapticSelection(); router.push('/breathing' as never); }}
                activeOpacity={0.8}
                style={[styles.breathPreviewTile, { borderColor: theme.border, backgroundColor: theme.bg2 }]}
              >
                <ExerciseIcon visualType={v} color={c} size={38} />
                <Text style={[styles.breathPreviewLabel, { color: theme.text2 }]}>{label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            onPress={() => router.push('/breathing' as never)}
            activeOpacity={0.85}
            style={{
              backgroundColor: theme.teal,
              height: 56,
              borderRadius: 14,
              alignItems: 'center',
              justifyContent: 'center',
              marginTop: 10,
            }}
          >
            <Text style={{ color: '#020A14', fontSize: 15, fontWeight: '900' }}>
              Open Breathing Hub
            </Text>
            <Text style={{ color: '#020A14', fontSize: 10, fontWeight: '700', opacity: 0.8, marginTop: 2 }}>
              Stress check-in · ranks · AI coaching
            </Text>
          </TouchableOpacity>
        </View>

        {/* ── Meal plan section ───────────────────────────────────────────── */}
        <View style={[styles.card, { backgroundColor: theme.bg1, borderColor: theme.border }]}>
          <Text style={[styles.cardTitle, { color: theme.gold }]}>Meal Plan</Text>

          {/* Day picker */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.daysRow}
          >
            {weekPlans.map((d) => {
              const sel = d.date === selectedDate;
              return (
                <Pressable
                  key={d.date}
                  onPress={() => { hapticSelection(); setSelectedDate(d.date); }}
                  style={[
                    styles.dayChip,
                    {
                      backgroundColor: sel ? `${theme.teal}18` : theme.bg2,
                      borderColor: sel ? theme.teal : theme.border,
                    },
                  ]}
                >
                  <Text style={[styles.dayChipText, { color: sel ? theme.teal : theme.text3 }]}>
                    {dayLabel(d.date)}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {mealPlanQ.isLoading ? (
            <SkeletonLoader width="100%" height={90} borderRadius={16} />
          ) : !mealPlanQ.data ? (
            <View style={[styles.card, { backgroundColor: theme.bg1, borderColor: theme.border, padding: 20, alignItems: 'center' }]}>
              <Text style={{ color: theme.text2, fontSize: 14, fontWeight: '600', textAlign: 'center', marginBottom: 8 }}>
                No meal plan for this day yet
              </Text>
              <Text style={{ color: theme.text3, fontSize: 12, textAlign: 'center' }}>
                Generate a personalised AI meal plan to see your meals here.
              </Text>
            </View>
          ) : (
            <View style={styles.mealsBlock}>
              {supabaseMeals.map((item) => {
                if (!item) return null;
                const { meal, logged } = item;
                return (
                  <View key={meal.id} style={styles.mealWrap}>
                    <View style={[styles.supabaseMealRow, { borderBottomColor: theme.border }]}>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.mealCategory, { color: theme.text3 }]}>
                          {meal.category.charAt(0).toUpperCase() + meal.category.slice(1)}
                        </Text>
                        <Text style={[styles.mealName, { color: theme.text1 }]}>{meal.name}</Text>
                        <Text style={[styles.mealCal, { color: theme.amber }]}>{meal.calories} kcal</Text>
                      </View>
                      <TouchableOpacity
                        onPress={() => {
                          if (!logged) logMeal.mutate({ mealId: meal.id, calories: meal.calories });
                        }}
                        activeOpacity={0.8}
                        style={[
                          styles.checkBtn,
                          {
                            backgroundColor: logged ? `${theme.green}20` : `${theme.teal}14`,
                            borderColor: logged ? theme.green : theme.border,
                          },
                        ]}
                      >
                        <Text style={[styles.checkBtnText, { color: logged ? theme.green : theme.text3 }]}>
                          {logged ? 'Done' : 'Log'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                    <TouchableOpacity
                      onPress={() =>
                        router.push({
                          pathname: '/assistant',
                          params: { dietMealName: meal.name },
                        } as never)
                      }
                      activeOpacity={0.8}
                      style={styles.askAiBtn}
                    >
                      <ChatBubbleIcon color={theme.teal} />
                      <Text style={[styles.askAiText, { color: theme.teal }]}>Ask AI about this diet</Text>
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>
          )}

          {isPro ? (
            <View
              style={[
                styles.premiumCard,
                {
                  borderColor: `${theme.gold}55`,
                  backgroundColor: `${theme.gold}10`,
                },
              ]}
            >
              <Text style={styles.sparkle}>✨</Text>
              <Text style={[styles.premiumTitle, { color: theme.gold }]}>Get your perfect diet plan</Text>
              <Text style={[styles.premiumBody, { color: theme.text3 }]}>
                A plan built around your goals, conditions, and food preferences with grocery list included
              </Text>
              <TouchableOpacity
                onPress={() => router.push('/diet-plan/personalise' as never)}
                activeOpacity={0.85}
                style={[styles.premiumCta, { backgroundColor: theme.teal }]}
              >
                <Text style={[styles.premiumCtaText, { color: theme.bg0 }]}>Personalise Now</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <UpgradePromptCard
              featureName="Personalised Meal Plans"
              description="Your meal plan, built around YOUR body. Upgrade to unlock plans that respect your conditions, allergies, and diet — never a meal that isn't right for you."
              onUpgrade={() => router.push('/settings/subscription')}
            />
          )}
        </View>

        {/* ── Download buttons ─────────────────────────────────────────────── */}
        <View style={styles.downloadRow}>
          {(['weekly', 'monthly'] as const).map((period) => (
            <TouchableOpacity
              key={period}
              activeOpacity={0.8}
              disabled={downloading !== null}
              onPress={() =>
                isPro
                  ? void handleDownloadPlan(period)
                  : router.push('/settings/subscription')
              }
              style={[
                styles.downloadBtn,
                {
                  borderColor: theme.teal,
                  opacity: downloading !== null && downloading !== period ? 0.45 : 1,
                },
              ]}
            >
              {downloading === period ? (
                <ActivityIndicator size="small" color={theme.teal} />
              ) : (
                <Text style={[styles.downloadBtnText, { color: theme.teal }]}>
                  {'\uD83D\uDCC5'} {period === 'weekly' ? 'Weekly' : 'Monthly'} Plan
                  {!isPro ? ' 🔒' : ''}
                </Text>
              )}
            </TouchableOpacity>
          ))}
        </View>

      </ScrollView>

      {/* Floating panic-breathing button above tab bar */}
      <PanicButton liftAboveEmergency={false} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { padding: 16, paddingBottom: 40 },

  flashOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 99,
    pointerEvents: 'none',
  },

  screenTitle: { fontSize: 26, fontWeight: '900', letterSpacing: -0.7, marginBottom: 2 },
  screenSub: { fontSize: 13, fontWeight: '500', marginBottom: 16 },

  card: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    marginBottom: 14,
    gap: 12,
  },
  cardTitle: { fontSize: 15, fontWeight: '800', letterSpacing: -0.2 },
  cardSub: { fontSize: 12, fontWeight: '500', marginTop: -6 },

  // XP card
  xpHeader: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  levelBadge: {
    width: 56,
    height: 56,
    borderRadius: 16,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  levelLbl: { fontSize: 9, fontWeight: '700', letterSpacing: 0.8 },
  levelNum: { fontSize: 22, fontWeight: '900', letterSpacing: -0.5 },
  xpTitle: { fontSize: 15, fontWeight: '800', letterSpacing: -0.3 },
  xpSub: { fontSize: 11, fontWeight: '500' },
  challengeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
  },
  challengeTitle: { fontSize: 13, fontWeight: '600' },
  challengeXp:    { fontSize: 12, fontWeight: '700' },

  // Task burst origin
  burstOrigin: {
    position: 'absolute',
    top:      '50%',
    left:     '50%',
    zIndex:   50,
  },

  // Collapsible tasks
  taskHeader: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
    paddingTop:     10,
    borderTopWidth: 1,
  },
  taskHeaderTitle: { fontSize: 12, fontWeight: '700', letterSpacing: 0.3 },
  taskHeaderRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  taskBadge: {
    paddingHorizontal: 8,
    paddingVertical:   3,
    borderRadius:      10,
    borderWidth:       1,
  },
  taskBadgeText:  { fontSize: 10, fontWeight: '700' },
  taskChevron:    { fontSize: 14, fontWeight: '700', lineHeight: 18 },
  taskListInner:  { position: 'absolute', width: '100%' },

  // Goals grid
  goalsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 14,
  },

  // Breathing
  breathPreviewRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 2,
  },
  breathPreviewTile: {
    flex: 1,
    height: 78,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
  },
  breathPreviewLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  patternRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  patternChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  patternLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 0.2 },
  startBtn: {
    paddingVertical: 13,
    borderRadius: 50,
    borderWidth: 1,
    alignItems: 'center',
  },
  startBtnText: { fontSize: 14, fontWeight: '800', letterSpacing: -0.1 },
  stopBtn: {
    paddingVertical: 10,
    borderRadius: 50,
    borderWidth: 1,
    alignItems: 'center',
    marginTop: 4,
  },
  stopBtnText: { fontSize: 13, fontWeight: '700' },

  // Meal plan
  daysRow: { gap: 8, paddingBottom: 4 },
  dayChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    borderWidth: 1,
  },
  dayChipText: { fontSize: 11, fontWeight: '700' },
  mealsBlock: { gap: 0 },
  mealWrap: { marginBottom: 4 },
  supabaseMealRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 10,
  },
  mealCategory: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase' },
  mealName: { fontSize: 14, fontWeight: '700', letterSpacing: -0.2, marginTop: 2 },
  mealCal: { fontSize: 11, fontWeight: '600', marginTop: 1 },
  askAiBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 2,
  },
  askAiText: { fontSize: 12, fontWeight: '700' },
  premiumCard: {
    marginTop: 16,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 8,
  },
  sparkle: { fontSize: 20 },
  premiumTitle: { fontSize: 14, fontWeight: '800', letterSpacing: -0.2 },
  premiumBody: { fontSize: 12, fontWeight: '500', lineHeight: 18 },
  premiumCta: {
    marginTop: 8,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  premiumCtaText: { fontSize: 14, fontWeight: '800' },
  checkBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
  },
  checkBtnText: { fontSize: 11, fontWeight: '800' },

  // Download buttons
  downloadRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 24,
  },
  downloadBtn: {
    flex: 1,
    borderWidth: 1.5,
    borderRadius: 12,
    paddingVertical: 11,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 40,
  },
  downloadBtnText: { fontSize: 12, fontWeight: '700' },
});

export default function WrappedWellnessScreen() {
  return (
    <RootErrorBoundary>
      <WellnessScreen />
    </RootErrorBoundary>
  );
}
