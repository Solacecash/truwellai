import { supabase } from './supabase';

export type NotificationType =
  | 'ingredient_alert'
  | 'streak_warning'
  | 'level_up'
  | 'community_post'
  | 'watchlist_warning'
  | 'review_response'
  | 'system_info';

export async function createInAppNotification(
  userId: string,
  type: NotificationType,
  title: string,
  body: string,
  data?: Record<string, unknown>
): Promise<void> {
  await supabase.from('user_alerts').insert({
    user_id:    userId,
    alert_type: type,
    title,
    message:    body,
    data:       data ?? {},
    dismissed:  false,
  });
}

export async function markNotificationRead(notificationId: string): Promise<void> {
  await supabase
    .from('user_alerts')
    .update({ dismissed: true })
    .eq('id', notificationId);
}

export async function markAllRead(userId: string): Promise<void> {
  await supabase
    .from('user_alerts')
    .update({ dismissed: true })
    .eq('user_id', userId)
    .eq('dismissed', false);
}

export async function getUnreadCount(userId: string): Promise<number> {
  const { count } = await supabase
    .from('user_alerts')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('dismissed', false);
  return count ?? 0;
}
