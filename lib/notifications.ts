import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';

const DAILY_COUNT_KEY = 'tw_notif_count';
const DAILY_DATE_KEY = 'tw_notif_date';
export const MAX_NOTIFICATIONS_PER_DAY = 4;

export type NotificationPriority = 'streak' | 'goal' | 'reminder' | 'general';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

async function getTodayCount(): Promise<number> {
  const today = new Date().toDateString();
  const storedDate = await AsyncStorage.getItem(DAILY_DATE_KEY);
  if (storedDate !== today) {
    await AsyncStorage.setItem(DAILY_DATE_KEY, today);
    await AsyncStorage.setItem(DAILY_COUNT_KEY, '0');
    return 0;
  }
  const n = await AsyncStorage.getItem(DAILY_COUNT_KEY);
  return parseInt(n ?? '0', 10);
}

async function bumpTodayCount(): Promise<void> {
  const c = await getTodayCount();
  await AsyncStorage.setItem(DAILY_COUNT_KEY, String(c + 1));
}

/** Central orchestrator: caps at MAX_NOTIFICATIONS_PER_DAY; higher priority wins scheduling order */
export async function scheduleIfAllowed(
  title: string,
  body: string,
  priority: NotificationPriority,
  triggerSeconds: number
): Promise<string | null> {
  const count = await getTodayCount();
  if (count >= MAX_NOTIFICATIONS_PER_DAY) return null;

  if (Platform.OS === 'web') return null;

  try {
    const perm = await Notifications.getPermissionsAsync();
    if (!perm.granted) {
      const req = await Notifications.requestPermissionsAsync();
      if (!req.granted) return null;
    }

    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: { priority },
      },
      trigger: {
        seconds: Math.max(1, triggerSeconds),
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      },
    });
    await bumpTodayCount();
    return id;
  } catch {
    return null;
  }
}

export async function cancelAllScheduled(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

export async function registerForPushNotifications(userId: string): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') return;

    // getExpoPushTokenAsync requires google-services.json (Android) or
    // APNs credentials (iOS). Silently skip when those aren't configured yet.
    const token = (await Notifications.getExpoPushTokenAsync()).data;
    await supabase.from('user_devices').upsert(
      { user_id: userId, push_token: token, platform: Platform.OS },
      { onConflict: 'user_id,push_token' }
    );
  } catch {
    // Push notifications unavailable (FCM / APNs not configured). Non-fatal.
  }
}
