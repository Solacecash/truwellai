import { useCallback, useEffect, useState } from 'react';

import { supabase } from '@/lib/supabase';

export function useUnreadNotifications(userId: string | undefined) {
  const [count, setCount] = useState(0);

  const load = useCallback(async () => {
    if (!userId) {
      setCount(0);
      return;
    }
    const { count: unread, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (!error) setCount(unread ?? 0);
  }, [userId]);

  useEffect(() => {
    void load();
    if (!userId) return;

    const channel = supabase
      .channel(`notifs-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          void load();
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [userId, load]);

  return count;
}
