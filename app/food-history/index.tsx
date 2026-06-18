import { BackHeader } from '@/components/ui/BackHeader';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
import {
  deleteFoodScanRecord,
  getDailyCalorieSummary,
  getFoodScanHistory,
  restoreFoodScanRecord,
  wipeScanHistory,
  type DailyCalorieSummary,
  type FoodScanRecord,
} from '@/lib/edge';
import { useAuthStore } from '@/stores/authStore';
import { useTheme } from '@/theme/ThemeContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  SectionList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';

type HistoryTab = 'all' | 'food' | 'products' | 'ingredients';

const TABS: { key: HistoryTab; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'food', label: 'Food' },
  { key: 'products', label: 'Products' },
  { key: 'ingredients', label: 'Ingredients' },
];

const TAB_TYPES: Record<HistoryTab, FoodScanRecord['scan_type'][] | null> = {
  all: null,
  food: ['visual_ai', 'manual'],
  products: ['barcode'],
  ingredients: ['ocr'],
};

const BADGE_META: Record<
  FoodScanRecord['scan_type'],
  { label: string; colorKey: 'teal' | 'gold' | 'purple' | 'text3' }
> = {
  barcode: { label: 'BARCODE', colorKey: 'teal' },
  visual_ai: { label: 'AI SNAP', colorKey: 'gold' },
  ocr: { label: 'OCR', colorKey: 'purple' },
  manual: { label: 'MANUAL', colorKey: 'text3' },
};

function formatDateHeader(iso: string): string {
  const d = new Date(iso + 'T12:00:00');
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yIso = yesterday.toISOString().slice(0, 10);
  if (iso === today) return 'Today';
  if (iso === yIso) return 'Yesterday';
  return d.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

function last7Days(): string[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().slice(0, 10);
  });
}

function ScanTypeBadge({ type }: { type: FoodScanRecord['scan_type'] }) {
  const { theme } = useTheme();
  const meta = BADGE_META[type];
  const color = theme[meta.colorKey] as string;
  return (
    <View style={[styles.badge, { backgroundColor: `${color}18`, borderColor: `${color}44` }]}>
      <Text style={[styles.badgeText, { color }]}>{meta.label}</Text>
    </View>
  );
}

const DELETE_THRESHOLD = -72;

function HistoryRow({
  item,
  onDelete,
}: {
  item: FoodScanRecord;
  onDelete: (record: FoodScanRecord) => void;
}) {
  const { theme } = useTheme();
  const translateX = useSharedValue(0);
  const isAfrican = (item.cuisine_region ?? '').includes('african');

  const pan = Gesture.Pan()
    .activeOffsetX([-8, 8])
    .onUpdate((e) => {
      translateX.value = Math.min(0, e.translationX);
    })
    .onEnd((e) => {
      if (e.translationX < DELETE_THRESHOLD) {
        translateX.value = withTiming(-400, { duration: 220 }, () => {
          runOnJS(onDelete)(item);
        });
      } else {
        translateX.value = withTiming(0, { duration: 180 });
      }
    });

  const rowStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <View style={styles.rowWrap}>
      <View style={[styles.deleteBehind, { backgroundColor: theme.red }]}>
        <Text style={[styles.deleteBehindText, { color: theme.bg0 }]}>Delete</Text>
      </View>
      <GestureDetector gesture={pan}>
        <Animated.View
          style={[
            rowStyle,
            styles.row,
            { backgroundColor: theme.bg1, borderColor: theme.border },
          ]}
        >
          <View style={styles.rowMain}>
            <Text style={[styles.foodName, { color: theme.text1 }]} numberOfLines={1}>
              {isAfrican ? '🌍 ' : ''}
              {item.food_name ?? item.brand_name ?? 'Unknown item'}
            </Text>
            <View style={styles.rowMeta}>
              <Text style={[styles.calText, { color: theme.gold }]}>
                {item.calories_kcal != null ? `${Math.round(item.calories_kcal)} kcal` : '-- kcal'}
              </Text>
              <ScanTypeBadge type={item.scan_type} />
              <Text style={[styles.timeText, { color: theme.text3 }]}>{formatTime(item.scanned_at)}</Text>
            </View>
          </View>
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

function WeeklyChart({ summary }: { summary: DailyCalorieSummary[] }) {
  const { theme } = useTheme();
  const days = last7Days();
  const byDate = useMemo(() => {
    const m = new Map<string, number>();
    summary.forEach((s) => m.set(s.log_date, Number(s.total_calories)));
    return m;
  }, [summary]);
  const values = days.map((d) => byDate.get(d) ?? 0);
  const max = Math.max(...values, 1);

  return (
    <View style={[styles.chartCard, { backgroundColor: theme.bg1, borderColor: theme.border }]}>
      <Text style={[styles.chartTitle, { color: theme.text1 }]}>Weekly calories</Text>
      <View style={styles.chartRow}>
        {days.map((d, i) => {
          const h = Math.max(4, (values[i] / max) * 72);
          const label = new Date(d + 'T12:00:00').toLocaleDateString(undefined, { weekday: 'narrow' });
          return (
            <View key={d} style={styles.barCol}>
              <View style={[styles.barTrack, { backgroundColor: theme.bg2 }]}>
                <View
                  style={[
                    styles.barFill,
                    { height: h, backgroundColor: theme.gold },
                  ]}
                />
              </View>
              <Text style={[styles.barLabel, { color: theme.text3 }]}>{label}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

export default function ScanHistoryScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const queryClient = useQueryClient();
  const userId = useAuthStore((s) => s.session?.user?.id);
  const [tab, setTab] = useState<HistoryTab>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [undo, setUndo] = useState<{ id: string; label: string } | null>(null);
  const undoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const historyQ = useQuery({
    queryKey: ['food-scan-history', userId, tab],
    enabled: !!userId,
    queryFn: async () => {
      const rows = await getFoodScanHistory(userId!, 100, 0);
      const allowed = TAB_TYPES[tab];
      if (!allowed) return rows;
      return rows.filter((r) => allowed.includes(r.scan_type));
    },
  });

  const summaryQ = useQuery({
    queryKey: ['daily-calorie-summary', userId],
    enabled: !!userId,
    queryFn: () => getDailyCalorieSummary(userId!, 7),
  });

  const sections = useMemo(() => {
    const rows = historyQ.data ?? [];
    const groups = new Map<string, FoodScanRecord[]>();
    rows.forEach((r) => {
      const day = r.scanned_at.slice(0, 10);
      const list = groups.get(day) ?? [];
      list.push(r);
      groups.set(day, list);
    });
    return Array.from(groups.entries())
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([date, data]) => ({
        title: date,
        data,
        totalCal: data.reduce((s, r) => s + (Number(r.calories_kcal) || 0), 0),
      }));
  }, [historyQ.data]);

  const clearUndoTimer = useCallback(() => {
    if (undoTimer.current) {
      clearTimeout(undoTimer.current);
      undoTimer.current = null;
    }
  }, []);

  const handleDelete = useCallback(
    async (record: FoodScanRecord) => {
      if (!userId) return;
      clearUndoTimer();
      await deleteFoodScanRecord(userId, record.id);
      queryClient.setQueryData<FoodScanRecord[]>(
        ['food-scan-history', userId, tab],
        (prev) => (prev ?? []).filter((r) => r.id !== record.id)
      );
      void queryClient.invalidateQueries({ queryKey: ['daily-calorie-summary', userId] });
      setUndo({
        id: record.id,
        label: record.food_name ?? record.brand_name ?? 'Item',
      });
      undoTimer.current = setTimeout(() => setUndo(null), 5000);
    },
    [userId, tab, queryClient, clearUndoTimer]
  );

  const handleUndo = useCallback(async () => {
    if (!userId || !undo) return;
    clearUndoTimer();
    await restoreFoodScanRecord(userId, undo.id);
    setUndo(null);
    void queryClient.invalidateQueries({ queryKey: ['food-scan-history', userId] });
    void queryClient.invalidateQueries({ queryKey: ['daily-calorie-summary', userId] });
  }, [userId, undo, queryClient, clearUndoTimer]);

  useEffect(() => () => clearUndoTimer(), [clearUndoTimer]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['food-scan-history', userId] }),
      queryClient.invalidateQueries({ queryKey: ['daily-calorie-summary', userId] }),
    ]);
    setRefreshing(false);
  }, [queryClient, userId]);

  const handleWipeAll = useCallback(() => {
    if (!userId) return;
    Alert.alert(
      'Wipe all history',
      'This cannot be undone. Delete everything?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete all',
          style: 'destructive',
          onPress: () => {
            void (async () => {
              await wipeScanHistory(userId);
              setUndo(null);
              clearUndoTimer();
              void queryClient.invalidateQueries({ queryKey: ['food-scan-history', userId] });
              void queryClient.invalidateQueries({ queryKey: ['daily-calorie-summary', userId] });
            })();
          },
        },
      ]
    );
  }, [userId, queryClient, clearUndoTimer]);

  const handleBack = useCallback(() => {
    if (router.canGoBack()) router.back();
    else router.replace('/(tabs)/index' as never);
  }, [router]);

  if (!userId) {
    return <View style={{ flex: 1, backgroundColor: theme.bg0 }} />;
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg0 }]} edges={['top']}>
      <BackHeader
        title="Scan History"
        onBack={handleBack}
        rightContent={
          <TouchableOpacity onPress={handleWipeAll} hitSlop={10}>
            <Text style={{ fontSize: 18 }}>🗑</Text>
          </TouchableOpacity>
        }
      />

      <View style={[styles.tabRow, { borderBottomColor: theme.border }]}>
        {TABS.map((t) => (
          <Pressable
            key={t.key}
            onPress={() => setTab(t.key)}
            style={[
              styles.tab,
              tab === t.key && { borderBottomColor: theme.gold, borderBottomWidth: 2 },
            ]}
          >
            <Text
              style={[
                styles.tabText,
                { color: tab === t.key ? theme.gold : theme.text3 },
              ]}
            >
              {t.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {historyQ.isLoading ? (
        <ScrollView contentContainerStyle={styles.skeletonBox}>
          {[0, 1, 2, 3, 4].map((i) => (
            <SkeletonLoader key={i} width="100%" height={64} borderRadius={12} style={{ marginBottom: 8 }} />
          ))}
        </ScrollView>
      ) : sections.length === 0 ? (
        <ScrollView
          contentContainerStyle={styles.emptyBox}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.teal} />
          }
        >
          <Text style={[styles.emptyText, { color: theme.text3 }]}>
            No scan history yet. Start by scanning a food.
          </Text>
          <WeeklyChart summary={summaryQ.data ?? []} />
        </ScrollView>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          stickySectionHeadersEnabled={false}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.teal} />
          }
          renderSectionHeader={({ section }) => (
            <View style={[styles.sectionHead, { backgroundColor: theme.bg0 }]}>
              <Text style={[styles.sectionTitle, { color: theme.text1 }]}>
                {formatDateHeader(section.title)}
              </Text>
              <Text style={[styles.sectionCal, { color: theme.gold }]}>
                {Math.round(section.totalCal)} kcal
              </Text>
            </View>
          )}
          renderItem={({ item }) => <HistoryRow item={item} onDelete={handleDelete} />}
          ListFooterComponent={<WeeklyChart summary={summaryQ.data ?? []} />}
        />
      )}

      {undo && (
        <View style={[styles.undoBar, { backgroundColor: theme.bg2, borderColor: theme.border }]}>
          <Text style={[styles.undoText, { color: theme.text2 }]} numberOfLines={1}>
            Deleted {undo.label}
          </Text>
          <TouchableOpacity onPress={() => void handleUndo()}>
            <Text style={[styles.undoBtn, { color: theme.teal }]}>Undo</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  tabRow: {
    flexDirection: 'row',
    paddingHorizontal: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  tabText: { fontSize: 12, fontWeight: '800', letterSpacing: 0.2 },
  skeletonBox: { padding: 16, gap: 8 },
  emptyBox: { flexGrow: 1, padding: 24, justifyContent: 'center', gap: 24 },
  emptyText: { textAlign: 'center', fontSize: 14, lineHeight: 20, fontWeight: '600' },
  listContent: { paddingHorizontal: 16, paddingBottom: 32 },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 16,
    paddingBottom: 8,
  },
  sectionTitle: { fontSize: 14, fontWeight: '800' },
  sectionCal: { fontSize: 12, fontWeight: '800' },
  rowWrap: { marginBottom: 8, position: 'relative', overflow: 'hidden', borderRadius: 12 },
  deleteBehind: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingRight: 20,
    borderRadius: 12,
  },
  deleteBehindText: { fontSize: 13, fontWeight: '800' },
  row: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
  },
  rowMain: { gap: 6 },
  foodName: { fontSize: 15, fontWeight: '800', letterSpacing: -0.2 },
  rowMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  calText: { fontSize: 12, fontWeight: '800' },
  timeText: { fontSize: 11, fontWeight: '600', marginLeft: 'auto' },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
  },
  badgeText: { fontSize: 9, fontWeight: '900', letterSpacing: 0.4 },
  chartCard: {
    marginTop: 20,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 12,
  },
  chartTitle: { fontSize: 13, fontWeight: '800' },
  chartRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 6,
    minHeight: 96,
  },
  barCol: { flex: 1, alignItems: 'center', gap: 6 },
  barTrack: {
    width: '100%',
    height: 72,
    borderRadius: 6,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barFill: { width: '100%', borderRadius: 6 },
  barLabel: { fontSize: 10, fontWeight: '700' },
  undoBar: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  undoText: { flex: 1, fontSize: 13, fontWeight: '600', marginRight: 12 },
  undoBtn: { fontSize: 14, fontWeight: '900' },
});
