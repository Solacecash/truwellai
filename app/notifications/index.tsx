import React, { useCallback, useRef } from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { BackHeader } from '@/components/ui/BackHeader';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
import { markAllRead, markNotificationRead } from '@/lib/notificationCenter';
import { useNotificationStore } from '@/stores/notificationStore';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { useTheme } from '@/theme/ThemeContext';

// ── Types ─────────────────────────────────────────────────────────────────────

type AlertType =
  | 'ingredient_alert'
  | 'streak_warning'
  | 'level_up'
  | 'community_post'
  | 'watchlist_warning'
  | 'review_response'
  | 'system_info';

interface NotifRow {
  id:           string;
  user_id:      string;
  alert_type:   AlertType | string;
  title?:       string | null;
  message:      string;
  dismissed:    boolean;
  created_at:   string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.round(diff / 1000);
  if (s < 60) return 'just now';
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.round(h / 24)}d ago`;
}

const TYPE_META: Record<string, { emoji: string; colorKey: keyof ReturnType<typeof import('@/theme/ThemeContext').useTheme>['theme'] }> = {
  ingredient_alert:  { emoji: '🧪', colorKey: 'red'   },
  streak_warning:    { emoji: '🔥', colorKey: 'amber' },
  level_up:          { emoji: '⭐', colorKey: 'gold'  },
  community_post:    { emoji: '👥', colorKey: 'teal'  },
  watchlist_warning: { emoji: '⚠️', colorKey: 'red'   },
  review_response:   { emoji: '💬', colorKey: 'teal'  },
  system_info:       { emoji: 'ℹ️', colorKey: 'text3' },
};

function derivedTitle(row: NotifRow): string {
  if (row.title) return row.title;
  const map: Record<string, string> = {
    ingredient_alert:  'Ingredient Alert',
    streak_warning:    'Streak Reminder',
    level_up:          'Level Up!',
    community_post:    'Community Alert',
    watchlist_warning: 'Watchlist Warning',
    review_response:   'Review Response',
    system_info:       'Info',
  };
  return map[row.alert_type] ?? 'Notification';
}

// ── Swipeable notification row ────────────────────────────────────────────────

interface NotifItemProps {
  item:     NotifRow;
  onDismiss: (id: string) => void;
}

const DISMISS_THRESHOLD = -80;

function NotifItem({ item, onDismiss }: NotifItemProps) {
  const { theme } = useTheme();
  const meta      = TYPE_META[item.alert_type] ?? TYPE_META.system_info;
  const accentColor = theme[meta.colorKey] as string;
  const translateX  = useSharedValue(0);

  const pan = Gesture.Pan()
    .activeOffsetX([-8, 8])
    .onUpdate((e) => {
      translateX.value = Math.min(0, e.translationX);
    })
    .onEnd((e) => {
      if (e.translationX < DISMISS_THRESHOLD) {
        translateX.value = withTiming(-400, { duration: 250 }, () => {
          runOnJS(onDismiss)(item.id);
        });
      } else {
        translateX.value = withTiming(0, { duration: 200 });
      }
    });

  const rowStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <GestureDetector gesture={pan}>
      <Animated.View
        style={[
          rowStyle,
          styles.notifRow,
          {
            backgroundColor: item.dismissed ? theme.bg1 : theme.bg2,
            borderBottomColor: theme.border,
          },
        ]}
      >
        {/* Type icon */}
        <View style={[styles.iconCircle, { backgroundColor: `${accentColor}18` }]}>
          <Text style={styles.iconEmoji}>{meta.emoji}</Text>
        </View>

        {/* Content */}
        <View style={styles.notifContent}>
          <Text
            style={[
              styles.notifTitle,
              { color: theme.text1, fontWeight: item.dismissed ? '500' : '700' },
            ]}
            numberOfLines={1}
          >
            {derivedTitle(item)}
          </Text>
          <Text style={[styles.notifBody, { color: theme.text3 }]} numberOfLines={2}>
            {item.message}
          </Text>
          <Text style={[styles.notifTime, { color: theme.text4 }]}>
            {timeAgo(item.created_at)}
          </Text>
        </View>
      </Animated.View>
    </GestureDetector>
  );
}

// ── Screen ────────────────────────────────────────────────────────────────────

export default function NotificationsScreen() {
  const { theme }  = useTheme();
  const router     = useRouter();
  const queryClient = useQueryClient();
  const userId      = useAuthStore((s) => s.session?.user.id);
  const setUnread   = useNotificationStore((s) => s.setUnreadCount);

  const { data: notifications, isLoading } = useQuery({
    queryKey: ['notifications', userId],
    enabled:  !!userId,
    queryFn:  async () => {
      const { data } = await supabase
        .from('user_alerts')
        .select('id, user_id, alert_type, title, message, dismissed, created_at')
        .eq('user_id', userId!)
        .order('created_at', { ascending: false })
        .limit(50);
      return (data ?? []) as NotifRow[];
    },
  });

  const handleDismiss = useCallback(async (id: string) => {
    await markNotificationRead(id);
    queryClient.setQueryData<NotifRow[]>(['notifications', userId], (prev) =>
      (prev ?? []).filter((n) => n.id !== id)
    );
    setUnread(
      (notifications ?? []).filter((n) => !n.dismissed && n.id !== id).length
    );
  }, [notifications, userId, queryClient, setUnread]);

  const handleMarkAll = useCallback(async () => {
    if (!userId) return;
    await markAllRead(userId);
    queryClient.setQueryData<NotifRow[]>(['notifications', userId], (prev) =>
      (prev ?? []).map((n) => ({ ...n, dismissed: true }))
    );
    setUnread(0);
  }, [userId, queryClient, setUnread]);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg0 }]} edges={['top']}>
      <BackHeader
        title="Notifications"
        onBack={() => router.back()}
        rightContent={
          <TouchableOpacity onPress={handleMarkAll} hitSlop={8}>
            <Text style={[styles.markAllText, { color: theme.teal }]}>Mark all read</Text>
          </TouchableOpacity>
        }
      />

      {isLoading ? (
        <View style={styles.skeleton}>
          {[0, 1, 2, 3].map((i) => (
            <SkeletonLoader key={i} width="100%" height={72} borderRadius={0} />
          ))}
        </View>
      ) : !notifications?.length ? (
        // Empty state
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>🔔</Text>
          <Text style={[styles.emptyTitle, { color: theme.text1 }]}>You are all caught up</Text>
          <Text style={[styles.emptyBody, { color: theme.text3 }]}>
            Notifications about your scans and streaks will appear here.
          </Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(n) => n.id}
          renderItem={({ item }) => (
            <NotifItem item={item} onDismiss={handleDismiss} />
          )}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.list}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  skeleton: { gap: 1, paddingTop: 1 },
  list: { paddingBottom: 40 },
  markAllText: { fontSize: 13, fontWeight: '700' },

  notifRow: {
    flexDirection:  'row',
    alignItems:     'center',
    gap:            12,
    paddingHorizontal: 16,
    paddingVertical:   14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  iconCircle: {
    width:          40,
    height:         40,
    borderRadius:   20,
    alignItems:     'center',
    justifyContent: 'center',
    flexShrink:     0,
  },
  iconEmoji:    { fontSize: 18 },
  notifContent: { flex: 1 },
  notifTitle:   { fontSize: 13, lineHeight: 18 },
  notifBody:    { fontSize: 12, lineHeight: 17, marginTop: 2 },
  notifTime:    { fontSize: 10, fontWeight: '500', marginTop: 4 },

  // Empty state
  empty: {
    flex:           1,
    alignItems:     'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    gap:            12,
  },
  emptyIcon:  { fontSize: 48, marginBottom: 4 },
  emptyTitle: { fontSize: 18, fontWeight: '800', textAlign: 'center' },
  emptyBody:  { fontSize: 13, textAlign: 'center', lineHeight: 20 },
});
