import { ParticleField } from '@/components/breathing/ParticleField';
import { RankBadge } from '@/components/breathing/RankBadge';
import LegalDisclaimer from '@/components/legal/LegalDisclaimer';
import { LEGAL } from '@/lib/legalContent';
import { useTheme } from '@/theme/ThemeContext';
import { useAuthStore } from '@/stores/authStore';
import { useBreathingStore } from '@/stores/breathingStore';
import { loadBreathingProgress } from '@/lib/breathingProgress';
import { Ionicons } from '@expo/vector-icons';
import { triggerXpGained } from '@/stores/rewardAnimStore';
import { useRewardStore } from '@/stores/rewardStore';
import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

const CONFETTI_COUNT = 22;
const CONFETTI_COLORS = ['#00E5C8', '#C9A84C', '#2ED573', '#FFFFFF'];

export default function BreathingRewardScreen() {
  const { theme } = useTheme();
  const userId = useAuthStore((s) => s.session?.user.id);
  const exercise = useBreathingStore((s) => s.currentExercise);
  const reward = useBreathingStore((s) => s.sessionReward);
  const addXp = useRewardStore((s) => s.addXp);

  const [rankPoints, setRankPoints] = useState(0);
  const slideUp = useSharedValue(60);
  const opacity = useSharedValue(0);

  useEffect(() => {
    slideUp.value = withTiming(0, { duration: 600, easing: Easing.out(Easing.cubic) });
    opacity.value = withTiming(1, { duration: 600 });
  }, [slideUp, opacity]);

  // Load latest progress
  useEffect(() => {
    (async () => {
      if (!userId) return;
      const p = await loadBreathingProgress(userId);
      setRankPoints(p.rank_points);
    })();
  }, [userId]);

  // Global XP burst
  useEffect(() => {
    if (reward?.xpEarned) {
      addXp(reward.xpEarned);
      triggerXpGained(reward.xpEarned);
    }
  }, [reward?.xpEarned, addXp]);

  const duration = useMemo(() => {
    if (!exercise) return '0:00';
    const secs = (exercise.inhale + exercise.hold1 + exercise.exhale + exercise.hold2) * exercise.totalCycles;
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }, [exercise]);

  const slideStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: slideUp.value }],
    opacity: opacity.value,
  }));

  const handleDoAnother = () => {
    if (exercise) {
      router.replace('/breathing/session' as never);
    } else {
      router.replace('/breathing' as never);
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `I just completed ${exercise?.name ?? 'a breathing session'} on TruWell AI. Session complete. +${reward?.xpEarned ?? 0} XP earned.`,
      });
    } catch {
      // user cancelled
    }
  };

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: theme.bg0 }]}>
      {/* Green glow backdrop */}
      <View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFill,
          {
            backgroundColor: theme.bg0,
          },
        ]}
      />
      <View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFill,
          { opacity: 0.08, backgroundColor: '#2ED573' },
        ]}
      />
      <ParticleField count={18} />

      {/* Confetti */}
      {Array.from({ length: CONFETTI_COUNT }).map((_, i) => (
        <Confetti key={i} index={i} />
      ))}

      <Animated.View style={[styles.content, slideStyle]}>
        <ScrollView contentContainerStyle={{ paddingHorizontal: 18, paddingBottom: 30 }}>
          {/* Header */}
          <View style={{ alignItems: 'center', marginTop: 24 }}>
            <Ionicons name="sparkles" size={48} color={theme.gold} />
            <Text style={[styles.title, { color: theme.text1 }]}>Session Complete!</Text>
            {exercise && (
              <View style={[styles.exPill, { backgroundColor: `${theme.teal}22`, borderColor: theme.teal }]}>
                <Text style={[styles.exName, { color: theme.teal }]}>{exercise.name}</Text>
              </View>
            )}
          </View>

          {/* Session complete */}
          <View style={[styles.card, { backgroundColor: theme.bg1, borderColor: theme.border, alignItems: 'center' }]}>
            <Text style={[styles.kicker, { color: theme.teal }]}>SESSION COMPLETE</Text>
            <Text style={[styles.bigNumber, { color: '#2ED573' }]}>✓</Text>
            <Text style={[styles.subtext, { color: theme.text3 }]}>You completed your session</Text>
          </View>

          {/* Stats row */}
          <View style={styles.statsRow}>
            <StatCard label="DURATION" value={duration} theme={theme} />
            <StatCard
              label="CYCLES"
              value={`${exercise?.totalCycles ?? 0}`}
              theme={theme}
            />
            <StatCard
              label="CALM XP"
              value={`+${reward?.xpEarned ?? 0}`}
              theme={theme}
              accent={theme.gold}
            />
          </View>

          {/* Rank progress */}
          <View style={[styles.card, { backgroundColor: theme.bg1, borderColor: theme.border }]}>
            <Text style={[styles.cardTitle, { color: theme.text1 }]}>Your Rank</Text>
            <View style={{ height: 8 }} />
            <RankBadge points={rankPoints} size="lg" showProgress />
            {reward?.newRank && (
              <View style={[styles.rankUpBanner, { backgroundColor: `${theme.gold}22`, borderColor: theme.gold }]}>
                <Text style={[styles.rankUpLabel, { color: theme.gold }]}>RANK ACHIEVED</Text>
                <Text style={[styles.rankUpName, { color: theme.gold }]}>{reward.newRank}</Text>
              </View>
            )}
          </View>

          {/* Streak badge */}
          {reward?.streakCount && reward.streakCount > 1 && (
            <View style={[styles.card, styles.streakCard, { backgroundColor: theme.bg1, borderColor: theme.border }]}>
              <Text style={{ fontSize: 28 }}>🔥</Text>
              <View style={{ marginLeft: 14 }}>
                <Text style={[styles.streakNum, { color: theme.gold }]}>{reward.streakCount}</Text>
                <Text style={[styles.subtext, { color: theme.text3 }]}>day streak</Text>
              </View>
              {reward.isNewRecord && (
                <Text style={[styles.recordPill, { color: theme.gold, borderColor: theme.gold }]}>
                  NEW RECORD
                </Text>
              )}
            </View>
          )}

          {/* Coaching reflection */}
          {exercise && (
            <Text style={[styles.reflection, { color: `${theme.text2}CC` }]}>
              “{exercise.coachingCues.complete}”
            </Text>
          )}

          {/* Action buttons */}
          <TouchableOpacity
            onPress={handleDoAnother}
            style={[styles.primaryBtn, { backgroundColor: theme.teal }]}
          >
            <Text style={styles.primaryBtnText}>Do Another Round</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.replace('/breathing' as never)}
            style={[styles.secondaryBtn, { borderColor: theme.border }]}
          >
            <Text style={[styles.secondaryBtnText, { color: theme.text1 }]}>
              Continue to Dashboard
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleShare} style={{ alignSelf: 'center', marginTop: 10 }}>
            <Text style={[styles.linkText, { color: theme.teal }]}>Share Progress</Text>
          </TouchableOpacity>

          <LegalDisclaimer
            text={LEGAL.BREATHING_EXERCISE_DISCLAIMER}
            variant="footer"
          />
        </ScrollView>
      </Animated.View>
    </SafeAreaView>
  );
}

function StatCard({
  label,
  value,
  theme,
  accent,
}: {
  label: string;
  value: string;
  theme: ReturnType<typeof useTheme>['theme'];
  accent?: string;
}) {
  return (
    <View
      style={[
        statStyles.card,
        { backgroundColor: theme.bg1, borderColor: theme.border },
      ]}
    >
      <Text style={[statStyles.label, { color: theme.text3 }]}>{label}</Text>
      <Text style={[statStyles.value, { color: accent ?? theme.text1 }]}>{value}</Text>
    </View>
  );
}

function Confetti({ index }: { index: number }) {
  const ty = useSharedValue(-40);
  const rot = useSharedValue(0);
  const startX = useMemo(() => Math.random() * 100, []);
  const size = useMemo(() => 4 + Math.random() * 6, []);
  const color = CONFETTI_COLORS[index % CONFETTI_COLORS.length];
  const duration = useMemo(() => 6000 + Math.random() * 4000, []);
  const delay = useMemo(() => Math.random() * 2000, []);

  useEffect(() => {
    ty.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(900, { duration, easing: Easing.inOut(Easing.quad) }),
          withTiming(-40, { duration: 0 })
        ),
        -1,
        false
      )
    );
    rot.value = withRepeat(
      withTiming(360, { duration: 2000, easing: Easing.linear }),
      -1,
      false
    );
  }, [ty, rot, delay, duration]);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: ty.value }, { rotate: `${rot.value}deg` }],
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        {
          position: 'absolute',
          left: `${startX}%`,
          top: 0,
          width: size,
          height: size * 0.6,
          backgroundColor: color,
          opacity: 0.7,
          borderRadius: 2,
        },
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { flex: 1 },
  title: {
    fontSize: 24,
    fontWeight: '900',
    marginTop: 8,
  },
  exPill: {
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 14,
    borderWidth: 1,
  },
  exName: { fontSize: 12, fontWeight: '800' },
  card: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    marginTop: 14,
  },
  cardTitle: { fontSize: 14, fontWeight: '900' },
  kicker: { fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  bigNumber: { fontSize: 48, fontWeight: '900', marginTop: 4 },
  subtext: { fontSize: 11, fontWeight: '700', marginTop: 2 },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  rankUpBanner: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  rankUpLabel: { fontSize: 9, fontWeight: '900', letterSpacing: 2 },
  rankUpName: { fontSize: 18, fontWeight: '900', marginTop: 4 },
  streakCard: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  streakNum: { fontSize: 22, fontWeight: '900' },
  recordPill: {
    marginLeft: 'auto',
    fontSize: 9,
    fontWeight: '900',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    letterSpacing: 1,
  },
  reflection: {
    fontSize: 13,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 18,
    marginBottom: 10,
    lineHeight: 18,
  },
  primaryBtn: {
    height: 52,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  primaryBtnText: { color: '#020A14', fontSize: 15, fontWeight: '900' },
  secondaryBtn: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  secondaryBtnText: { fontSize: 14, fontWeight: '800' },
  linkText: { fontSize: 12, fontWeight: '800' },
});

const statStyles = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  label: { fontSize: 9, fontWeight: '900', letterSpacing: 1 },
  value: { fontSize: 16, fontWeight: '900', marginTop: 4 },
});
