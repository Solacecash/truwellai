import { BackHeader } from '@/components/ui/BackHeader';
import { RankBadge } from '@/components/breathing/RankBadge';
import { useTheme } from '@/theme/ThemeContext';
import { useAuthStore } from '@/stores/authStore';
import { MILITARY_RANKS, getRankForPoints } from '@/lib/breathingExercises';
import {
  loadBreathingProgress,
  loadSessionHistory,
  loadTodayStats,
} from '@/lib/breathingProgress';
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

function friendlyDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  const y = new Date(now);
  y.setDate(now.getDate() - 1);
  const yesterday = d.toDateString() === y.toDateString();
  const time = d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  if (sameDay) return `Today ${time}`;
  if (yesterday) return `Yesterday ${time}`;
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ` ${time}`;
}

export default function BreathingProgressScreen() {
  const { theme } = useTheme();
  const userId = useAuthStore((s) => s.session?.user.id);

  const progQ = useQuery({
    queryKey: ['breathing-progress', userId],
    enabled: !!userId,
    queryFn: () => loadBreathingProgress(userId!),
  });
  const todayQ = useQuery({
    queryKey: ['breathing-today', userId],
    enabled: !!userId,
    queryFn: () => loadTodayStats(userId!),
  });
  const histQ = useQuery({
    queryKey: ['breathing-history', userId],
    enabled: !!userId,
    queryFn: () => loadSessionHistory(userId!, 30),
  });

  const progress = progQ.data;
  const points = progress?.rank_points ?? 0;
  const currentRank = getRankForPoints(points);

  // Build last-14-day dot calendar
  const last14 = (() => {
    const days: Array<{ date: string; active: boolean; isToday: boolean }> = [];
    const now = new Date();
    const dates = new Set(
      (histQ.data ?? [])
        .map(h => new Date(h.created_at).toISOString().slice(0, 10))
    );
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const iso = d.toISOString().slice(0, 10);
      days.push({
        date: iso,
        active: dates.has(iso),
        isToday: i === 0,
      });
    }
    return days;
  })();

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: theme.bg0 }]} edges={['top']}>
      <BackHeader title="My Breathing Journey" onBack={() => router.back()} />

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        {/* Rank card */}
        <View style={[styles.card, { backgroundColor: theme.bg1, borderColor: theme.gold }]}>
          <RankBadge points={points} size="lg" showProgress />
          <Text style={[styles.rankDesc, { color: theme.text3 }]}>
            {currentRank.description}
          </Text>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 10, paddingTop: 14, paddingBottom: 4 }}
          >
            {MILITARY_RANKS.map(r => {
              const achieved = points >= r.minPoints;
              const current = currentRank.rank === r.rank;
              return (
                <View
                  key={r.rank}
                  style={[
                    styles.rankPill,
                    {
                      borderColor: current ? theme.gold : achieved ? theme.teal : theme.border,
                      backgroundColor: current ? `${theme.gold}22` : 'transparent',
                      opacity: achieved ? 1 : 0.45,
                    },
                  ]}
                >
                  <Ionicons
                    name="star"
                    size={12}
                    color={current ? theme.gold : achieved ? theme.teal : theme.text3}
                  />
                  <Text
                    style={[
                      styles.rankPillText,
                      { color: current ? theme.gold : achieved ? theme.teal : theme.text3 },
                    ]}
                  >
                    {r.rank}
                  </Text>
                </View>
              );
            })}
          </ScrollView>
        </View>

        {/* Streak */}
        <View style={[styles.card, { backgroundColor: theme.bg1, borderColor: theme.border, alignItems: 'center' }]}>
          <Text style={{ fontSize: 44 }}>🔥</Text>
          <Text style={[styles.streakNum, { color: theme.gold }]}>
            {progress?.current_streak ?? 0}
          </Text>
          <Text style={[styles.subtext, { color: theme.text3 }]}>day streak</Text>

          <View style={styles.calendarRow}>
            {last14.map(d => (
              <View
                key={d.date}
                style={[
                  styles.calDot,
                  {
                    backgroundColor: d.active ? theme.teal : 'transparent',
                    borderColor: d.isToday ? theme.teal : theme.border,
                    borderWidth: d.isToday ? 2 : 1,
                  },
                ]}
              />
            ))}
          </View>
          <Text style={[styles.subtext, { color: theme.text3, marginTop: 6 }]}>
            Longest streak: {progress?.longest_streak ?? 0} days
          </Text>
        </View>

        {/* Today stats */}
        <View style={styles.statsGrid}>
          <StatGridCell label="Sessions" value={`${todayQ.data?.sessions ?? 0}`} theme={theme} />
          <StatGridCell label="Minutes" value={`${todayQ.data?.minutes ?? 0}`} theme={theme} />
          <StatGridCell label="XP Today" value={`${todayQ.data?.xp ?? 0}`} theme={theme} />
          <StatGridCell
            label="Best Streak"
            value={`${progress?.longest_streak ?? 0}`}
            theme={theme}
          />
        </View>

        {/* Lifetime grid */}
        <View style={styles.statsGrid}>
          <StatGridCell
            label="Total Sessions"
            value={`${progress?.total_sessions ?? 0}`}
            theme={theme}
            accent={theme.teal}
          />
          <StatGridCell
            label="Total Minutes"
            value={`${progress?.total_minutes ?? 0}`}
            theme={theme}
            accent={theme.teal}
          />
          <StatGridCell
            label="Total XP"
            value={`${points}`}
            theme={theme}
            accent={theme.gold}
          />
          <StatGridCell
            label="Rank"
            value={currentRank.rank}
            theme={theme}
            accent={theme.gold}
          />
        </View>

        {/* History */}
        <Text style={[styles.sectionTitle, { color: theme.text1 }]}>
          Recent Sessions
        </Text>
        {(histQ.data ?? []).length === 0 ? (
          <Text style={{ color: theme.text3, fontSize: 12, textAlign: 'center', marginTop: 12 }}>
            No sessions yet. Start your first one from the hub.
          </Text>
        ) : (
          <FlatList
            data={histQ.data ?? []}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            ItemSeparatorComponent={() => <View style={{ height: 6 }} />}
            renderItem={({ item }) => {
              const dur = item.duration_seconds ?? 0;
              const mm = Math.floor(dur / 60);
              const ss = dur % 60;
              const stressDelta =
                item.stress_score_before != null && item.stress_score_after != null
                  ? Math.max(0, item.stress_score_before - item.stress_score_after)
                  : null;
              const color = item.category === 'calm'
                ? '#2ED573'
                : item.category === 'focus'
                ? '#1E90FF'
                : item.category === 'energy'
                ? '#FF4757'
                : item.category === 'recovery'
                ? '#9B59B6'
                : theme.teal;
              return (
                <View style={[styles.histRow, { backgroundColor: theme.bg1, borderColor: theme.border }]}>
                  <View style={[styles.histDot, { backgroundColor: color }]} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.histName, { color: theme.text1 }]}>
                      {item.exercise_name ?? item.pattern ?? 'Session'}
                    </Text>
                    <Text style={[styles.histMeta, { color: theme.text3 }]}>
                      {friendlyDate(item.created_at)} · {mm}:{ss.toString().padStart(2, '0')} · {item.cycles_completed ?? 0} cycles
                    </Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    {stressDelta != null && stressDelta > 0 && (
                      <Text style={[styles.stressDelta, { color: theme.green }]}>
                        -{stressDelta}
                      </Text>
                    )}
                    <Text style={[styles.xpBadge, { color: theme.gold }]}>
                      +{item.xp_earned ?? 0} pts
                    </Text>
                  </View>
                </View>
              );
            }}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function StatGridCell({
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
        gridStyles.cell,
        { backgroundColor: theme.bg1, borderColor: theme.border },
      ]}
    >
      <Text style={[gridStyles.value, { color: accent ?? theme.text1 }]}>{value}</Text>
      <Text style={[gridStyles.label, { color: theme.text3 }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  card: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
  },
  rankDesc: { fontSize: 12, marginTop: 8 },
  rankPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderRadius: 12,
  },
  rankPillText: { fontSize: 10, fontWeight: '900' },
  streakNum: { fontSize: 44, fontWeight: '900', marginTop: 4 },
  subtext: { fontSize: 12, fontWeight: '700' },
  calendarRow: {
    flexDirection: 'row',
    gap: 4,
    marginTop: 14,
  },
  calDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '900',
    marginTop: 10,
    marginBottom: 8,
  },
  histRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    gap: 10,
  },
  histDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  histName: { fontSize: 13, fontWeight: '800' },
  histMeta: { fontSize: 10, fontWeight: '700', marginTop: 2 },
  stressDelta: { fontSize: 11, fontWeight: '900' },
  xpBadge: { fontSize: 10, fontWeight: '900', marginTop: 2 },
});

const gridStyles = StyleSheet.create({
  cell: {
    flexBasis: '48%',
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    alignItems: 'center',
  },
  value: { fontSize: 18, fontWeight: '900' },
  label: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5, marginTop: 4 },
});
