import { BackHeader } from '@/components/ui/BackHeader';
import { ExerciseIcon } from '@/components/breathing/ExerciseIcon';
import { MoodSlider } from '@/components/breathing/MoodSlider';
import { ProFeatures } from '@/components/breathing/ProFeatures';
import { RankBadge } from '@/components/breathing/RankBadge';
import { UpgradeChip } from '@/components/subscription/UpgradeChip';
import LegalDisclaimer from '@/components/legal/LegalDisclaimer';
import { LEGAL } from '@/lib/legalContent';
import { isPro as isPlanPro, type PlanId } from '@/lib/subscriptionPlans';
import { useTheme } from '@/theme/ThemeContext';
import { useAuthStore } from '@/stores/authStore';
import {
  BREATHING_EXERCISES,
  formatDuration,
  getExerciseById,
  getRankForPoints,
} from '@/lib/breathingExercises';
import {
  loadBreathingProgress,
  loadTodayStats,
} from '@/lib/breathingProgress';
import {
  calculateStressScore,
  getStressLevel,
  prescribeExercise,
  prescriptionReason,
  saveStressCheckin,
} from '@/lib/stressEngine';
import { useBreathingStore, type BreathExercise } from '@/stores/breathingStore';
import { hapticLight, hapticSelection } from '@/lib/haptics';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

const MOOD_TAGS = ['Anxious', 'Tired', 'Overwhelmed', 'Focused', 'Calm', 'Energized', 'Sad', 'Alert'];
const SYMPTOM_TAGS = ['Headache', 'Tight chest', 'Fatigue', 'Racing mind', 'Irritable', 'Nauseous'];
const CATEGORIES: Array<{ id: BreathExercise['category']; label: string; color: string; emoji: string }> = [
  { id: 'calm', label: 'Calm & Relax', color: '#2ED573', emoji: '🟢' },
  { id: 'focus', label: 'Focus', color: '#1E90FF', emoji: '🔵' },
  { id: 'energy', label: 'Energy', color: '#FF4757', emoji: '🔴' },
  { id: 'recovery', label: 'Recovery', color: '#9B59B6', emoji: '🟣' },
];

export default function BreathingHubScreen() {
  const { theme } = useTheme();
  const userId = useAuthStore((s) => s.session?.user.id);
  const setCurrentExercise = useBreathingStore((s) => s.setCurrentExercise);
  const setStressCheck = useBreathingStore((s) => s.setStressCheck);

  const [mood, setMood] = useState(5);
  const [moodTags, setMoodTags] = useState<string[]>([]);
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [recommendedId, setRecommendedId] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<BreathExercise['category']>('calm');

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

  const progressQ = useQuery({
    queryKey: ['breathing-progress', userId],
    enabled: !!userId,
    staleTime: 30 * 1000,
    queryFn: () => loadBreathingProgress(userId!),
  });

  const todayQ = useQuery({
    queryKey: ['breathing-today', userId],
    enabled: !!userId,
    staleTime: 30 * 1000,
    queryFn: () => loadTodayStats(userId!),
  });

  const rankPoints = progressQ.data?.rank_points ?? 0;
  const currentRank = getRankForPoints(rankPoints);

  const filteredExercises = useMemo(
    () => BREATHING_EXERCISES.filter(ex => ex.category === activeCategory),
    [activeCategory]
  );

  const recommendedExercise = recommendedId ? getExerciseById(recommendedId) : null;
  const stressScore = useMemo(
    () =>
      calculateStressScore({
        moodRating: mood,
        moodTags: moodTags.map(t => t.toLowerCase()),
        symptoms: symptoms.map(s => s.toLowerCase()),
      }),
    [mood, moodTags, symptoms]
  );
  const stressLevel = getStressLevel(stressScore);

  const toggleFrom = (arr: string[], v: string) =>
    arr.includes(v) ? arr.filter(x => x !== v) : [...arr, v];

  const handleFindMyBreathing = async () => {
    hapticLight();
    const id = prescribeExercise(stressScore, new Date().getHours());
    setRecommendedId(id);
    setStressCheck({
      moodRating: mood,
      moodTags,
      symptoms,
      stressScore,
    });
    if (userId) {
      await saveStressCheckin(
        userId,
        { moodRating: mood, moodTags, symptoms },
        stressScore,
        'manual'
      );
    }
  };

  const handleStart = (ex: BreathExercise) => {
    if (ex.isPro && !isPro) {
      router.push('/settings/subscription' as never);
      return;
    }
    hapticLight();
    setCurrentExercise(ex);
    router.push('/breathing/session' as never);
  };

  const handleStartRecommended = () => {
    if (recommendedExercise) handleStart(recommendedExercise);
  };

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: theme.bg0 }]} edges={['top']}>
      <BackHeader
        title="Breathing"
        onBack={() => router.back()}
        rightContent={
          <TouchableOpacity
            onPress={() => router.push('/breathing/progress' as never)}
            hitSlop={8}
          >
            <Ionicons name="trending-up" size={22} color={theme.teal} />
          </TouchableOpacity>
        }
      />

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        {/* Breathing disclaimer */}
        <LegalDisclaimer
          text={LEGAL.BREATHING_EXERCISE_DISCLAIMER}
          variant="banner"
        />

        {/* Rank card */}
        <View style={[styles.card, { backgroundColor: theme.bg1, borderColor: theme.border }]}>
          <RankBadge points={rankPoints} size="md" showProgress />
          <Text style={[styles.rankDesc, { color: theme.text3 }]}>
            {currentRank.description}
          </Text>
        </View>

        {/* Today's stats */}
        <View style={[styles.statsRow]}>
          <StatCell label="Today" value={`${todayQ.data?.sessions ?? 0} sessions`} color={theme.teal} theme={theme} />
          <StatCell label="Minutes" value={`${todayQ.data?.minutes ?? 0}`} color={theme.gold} theme={theme} />
          <StatCell label="Streak" value={`${progressQ.data?.current_streak ?? 0}d`} color={theme.green} theme={theme} />
        </View>

        {/* Stress check-in */}
        <View style={[styles.card, { backgroundColor: theme.bg1, borderColor: theme.border }]}>
          <Text style={[styles.cardTitle, { color: theme.text1 }]}>How are you feeling?</Text>
          <View style={{ height: 12 }} />
          <MoodSlider value={mood} onChange={setMood} />

          <View style={{ height: 14 }} />
          <Text style={[styles.subLabel, { color: theme.text3 }]}>MOOD</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.pillRow}
          >
            {MOOD_TAGS.map(tag => {
              const active = moodTags.includes(tag);
              return (
                <TouchableOpacity
                  key={tag}
                  onPress={() => {
                    hapticSelection();
                    setMoodTags(prev => toggleFrom(prev, tag));
                  }}
                  style={[
                    styles.pill,
                    {
                      backgroundColor: active ? `${theme.teal}22` : 'transparent',
                      borderColor: active ? theme.teal : theme.border,
                    },
                  ]}
                >
                  <Text style={[styles.pillText, { color: active ? theme.teal : theme.text2 }]}>
                    {tag}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <Text style={[styles.subLabel, { color: theme.text3, marginTop: 10 }]}>SYMPTOMS</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.pillRow}
          >
            {SYMPTOM_TAGS.map(tag => {
              const active = symptoms.includes(tag);
              return (
                <TouchableOpacity
                  key={tag}
                  onPress={() => {
                    hapticSelection();
                    setSymptoms(prev => toggleFrom(prev, tag));
                  }}
                  style={[
                    styles.pill,
                    {
                      backgroundColor: active ? `${theme.amber}22` : 'transparent',
                      borderColor: active ? theme.amber : theme.border,
                    },
                  ]}
                >
                  <Text style={[styles.pillText, { color: active ? theme.amber : theme.text2 }]}>
                    {tag}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <View style={[styles.stressBar, { marginTop: 14 }]}>
            <Text style={[styles.stressLabel, { color: theme.text3 }]}>Session type recommended based on your inputs</Text>
          </View>

          <TouchableOpacity
            onPress={handleFindMyBreathing}
            style={[styles.primaryBtn, { backgroundColor: theme.teal }]}
          >
            <Text style={styles.primaryBtnText}>Find My Breathing</Text>
          </TouchableOpacity>
        </View>

        {/* AI recommendation */}
        {recommendedExercise && (
          <View
            style={[
              styles.card,
              styles.recCard,
              { backgroundColor: theme.bg1, borderLeftColor: theme.teal, borderColor: theme.border },
            ]}
          >
            <View style={styles.recHeader}>
              <Ionicons name="sparkles" size={14} color={theme.teal} />
              <Text style={[styles.recKicker, { color: theme.teal }]}>BASED ON YOUR INPUTS</Text>
            </View>
            <Text style={[styles.recName, { color: theme.text1 }]}>
              {recommendedExercise.name}
            </Text>
            <Text style={[styles.recReason, { color: theme.text2 }]}>
              {prescriptionReason(stressScore, recommendedExercise.name)}
            </Text>
            <TouchableOpacity
              onPress={handleStartRecommended}
              style={[styles.primaryBtn, { backgroundColor: theme.teal, marginTop: 10 }]}
            >
              <Text style={styles.primaryBtnText}>Start Now</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setRecommendedId(null)}
              style={{ alignSelf: 'center', marginTop: 8 }}
            >
              <Text style={{ color: theme.text3, fontSize: 12, fontWeight: '700' }}>
                Show all exercises
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Category tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.catRow}
        >
          {CATEGORIES.map(cat => {
            const active = activeCategory === cat.id;
            return (
              <TouchableOpacity
                key={cat.id}
                onPress={() => {
                  hapticSelection();
                  setActiveCategory(cat.id);
                }}
                style={[
                  styles.catPill,
                  {
                    backgroundColor: active ? cat.color : 'transparent',
                    borderColor: active ? cat.color : theme.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.catPillText,
                    { color: active ? '#FFFFFF' : cat.color },
                  ]}
                >
                  {cat.emoji} {cat.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Grid of exercises */}
        <View style={styles.grid}>
          {filteredExercises.map(ex => (
            <ExerciseCard
              key={ex.id}
              exercise={ex}
              isPro={isPro}
              onStart={() => handleStart(ex)}
              theme={theme}
            />
          ))}
        </View>

        <View style={{ height: 18 }} />
        <Text style={[styles.cardTitle, { color: theme.text1, marginBottom: 8 }]}>
          AI Breath Intelligence
        </Text>
        <ProFeatures isPro={isPro} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────

function StatCell({
  label,
  value,
  color,
  theme,
}: {
  label: string;
  value: string;
  color: string;
  theme: ReturnType<typeof useTheme>['theme'];
}) {
  const glow = useSharedValue(0);
  useEffect(() => {
    glow.value = withRepeat(
      withTiming(1, { duration: 2400, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, [glow]);

  const valueStyle = useAnimatedStyle(() => ({
    opacity: interpolate(glow.value, [0, 1], [0.85, 1]),
    transform: [{ scale: interpolate(glow.value, [0, 1], [1, 1.03]) }],
  }));
  const dotStyle = useAnimatedStyle(() => ({
    opacity: interpolate(glow.value, [0, 1], [0.3, 1]),
    transform: [{ scale: interpolate(glow.value, [0, 1], [0.9, 1.2]) }],
  }));

  return (
    <View
      style={[
        statCellStyles.cell,
        { backgroundColor: theme.bg1, borderColor: theme.border },
      ]}
    >
      <Animated.View
        style={[
          statCellStyles.pulseDot,
          { backgroundColor: color },
          dotStyle,
        ]}
      />
      <Animated.Text style={[statCellStyles.value, { color }, valueStyle]}>
        {value}
      </Animated.Text>
      <Text style={[statCellStyles.label, { color: theme.text3 }]}>{label}</Text>
    </View>
  );
}

function ExerciseCard({
  exercise,
  isPro,
  onStart,
  theme,
}: {
  exercise: BreathExercise;
  isPro: boolean;
  onStart: () => void;
  theme: ReturnType<typeof useTheme>['theme'];
}) {
  const locked = exercise.isPro && !isPro;
  const scale = useSharedValue(1);
  const dot = useSharedValue(0);

  useEffect(() => {
    dot.value = withRepeat(
      withTiming(1, { duration: 1600, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, [dot]);

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  const dotStyle = useAnimatedStyle(() => ({
    opacity: interpolate(dot.value, [0, 1], [0.4, 1]),
    transform: [{ scale: interpolate(dot.value, [0, 1], [0.85, 1.15]) }],
  }));

  return (
    <Animated.View style={[cardStyle, { width: '48.5%' }]}>
      <Pressable
        onPressIn={() => { scale.value = withSpring(0.96, { damping: 18, stiffness: 300 }); }}
        onPressOut={() => { scale.value = withSpring(1, { damping: 14, stiffness: 220 }); }}
        onPress={onStart}
        style={[cardStyles.card, { backgroundColor: theme.bg1, borderColor: theme.border }]}
      >
        {locked && (
          <View style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(2,10,20,0.75)', borderRadius: 16, zIndex: 10, alignItems: 'center', justifyContent: 'center' }}>
            <UpgradeChip />
          </View>
        )}
        <View style={cardStyles.topRow}>
          <Animated.View style={[cardStyles.dot, { backgroundColor: exercise.categoryColor }, dotStyle]} />
          <Text style={[cardStyles.catLabel, { color: exercise.categoryColor }]} numberOfLines={1}>
            {exercise.categoryLabel.toUpperCase()}
          </Text>
          {locked && (
            <Ionicons name="lock-closed" size={12} color={theme.gold} style={{ marginLeft: 'auto' }} />
          )}
        </View>

        <View style={cardStyles.iconWrap}>
          <ExerciseIcon
            visualType={exercise.visualType}
            color={exercise.categoryColor}
            size={52}
          />
        </View>

        <Text style={[cardStyles.name, { color: theme.text1 }]} numberOfLines={2}>
          {exercise.name}
        </Text>
        <View style={cardStyles.durRow}>
          <View style={[cardStyles.durPill, { borderColor: theme.border }]}>
            <Text style={[cardStyles.durTxt, { color: theme.text2 }]}>{formatDuration(exercise)}</Text>
          </View>
        </View>
        <Text style={[cardStyles.benefit, { color: theme.text3 }]} numberOfLines={2}>
          {exercise.benefit}
        </Text>
        <View style={[cardStyles.startPill, { backgroundColor: exercise.categoryColor }]}>
          <Text style={cardStyles.startTxt}>{locked ? 'Unlock' : 'Start'}</Text>
          <Ionicons
            name={locked ? 'lock-closed' : 'arrow-forward'}
            size={11}
            color="#FFFFFF"
            style={{ marginLeft: 4 }}
          />
        </View>
      </Pressable>
    </Animated.View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1 },
  card: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
  },
  cardTitle: { fontSize: 16, fontWeight: '800' },
  rankDesc: { fontSize: 11, marginTop: 8 },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  subLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 1, marginBottom: 6 },
  pillRow: {
    flexDirection: 'row',
    gap: 8,
    paddingRight: 8,
  },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 14,
    borderWidth: 1,
  },
  pillText: { fontSize: 12, fontWeight: '700' },
  stressBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stressLabel: { fontSize: 11, fontWeight: '700' },
  stressValue: { fontSize: 14, fontWeight: '900' },
  primaryBtn: {
    height: 46,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  primaryBtnText: { color: '#020A14', fontSize: 14, fontWeight: '900', letterSpacing: 0.5 },
  recCard: { borderLeftWidth: 3 },
  recHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  recKicker: { fontSize: 9, fontWeight: '900', letterSpacing: 1 },
  recName: { fontSize: 18, fontWeight: '900', marginTop: 4 },
  recReason: { fontSize: 12, marginTop: 6, lineHeight: 18 },
  catRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
    paddingRight: 8,
  },
  catPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
  },
  catPillText: { fontSize: 12, fontWeight: '800' },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
});

const statCellStyles = StyleSheet.create({
  cell: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 12,
    alignItems: 'center',
    overflow: 'hidden',
  },
  pulseDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  value: { fontSize: 16, fontWeight: '900' },
  label: { fontSize: 10, fontWeight: '700', marginTop: 2, letterSpacing: 0.5 },
});

const cardStyles = StyleSheet.create({
  card: {
    width: '100%',
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
    overflow: 'hidden',
  },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  iconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    marginBottom: 4,
    height: 56,
  },
  catLabel: { fontSize: 9, fontWeight: '900', letterSpacing: 1, flexShrink: 1 },
  name: { fontSize: 14, fontWeight: '900', marginTop: 4, minHeight: 36 },
  durRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  durPill: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  durTxt: { fontSize: 10, fontWeight: '800' },
  benefit: { fontSize: 11, marginTop: 8, lineHeight: 15, minHeight: 30 },
  startPill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    marginTop: 10,
  },
  startTxt: { color: '#FFFFFF', fontSize: 11, fontWeight: '900', letterSpacing: 0.5 },
});
