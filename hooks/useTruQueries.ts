import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { useUserProfileStore } from '@/stores/userProfileStore';
import { useHydrationStore } from '@/stores/hydrationStore';
import { useRewardStore } from '@/stores/rewardStore';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useEffect } from 'react';

export function useProfileQuery() {
  const session = useAuthStore((s) => s.session);
  const setProfile = useUserProfileStore((s) => s.setProfile);

  const q = useQuery({
    queryKey: ['profile', session?.user.id],
    enabled: !!session?.user.id,
    staleTime: 8 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, display_name, locale, health_profile, reputation_score, user_type, subscription_tier')
        .eq('id', session!.user.id)
        .maybeSingle();
      if (error) throw error;
      if (data) setProfile(data);
      return data;
    },
  });

  useEffect(() => {
    if (q.data) setProfile(q.data);
  }, [q.data, setProfile]);

  return q;
}

export function useRewardsQuery() {
  const session = useAuthStore((s) => s.session);
  const setProgress = useRewardStore((s) => s.setProgress);
  const setBadges = useRewardStore((s) => s.setBadges);
  const setChallenges = useRewardStore((s) => s.setChallenges);
  const setStreak = useRewardStore((s) => s.setStreak);

  const DEFAULT_CHALLENGES = [
    { id: '1', title: 'Scan 2 items', xp: 25, done: false },
    { id: '2', title: 'Drink 2L water', xp: 20, done: false },
    { id: '3', title: 'Complete breathing session', xp: 20, done: false },
  ];

  const q = useQuery({
    queryKey: ['rewards', session?.user.id],
    enabled: !!session?.user.id,
    staleTime: 30 * 1000,
    queryFn: async () => {
      // XP, level and streak all live in user_wellness
      const [wellnessRes, badgesRes] = await Promise.all([
        supabase
          .from('user_wellness')
          .select('xp_total, xp_level, current_streak, last_active_date')
          .eq('user_id', session!.user.id)
          .maybeSingle(),
        supabase
          .from('user_badges')
          .select('badge_id, earned_at, badges(name, icon_emoji)')
          .eq('user_id', session!.user.id),
      ]);
      if (wellnessRes.error) throw wellnessRes.error;
      return {
        xp:            wellnessRes.data?.xp_total        ?? 0,
        level:         wellnessRes.data?.xp_level        ?? 1,
        streak_days:   wellnessRes.data?.current_streak  ?? 0,
        last_streak_at: wellnessRes.data?.last_active_date ?? null,
        badges: (badgesRes.data ?? []) as unknown as {
          badge_id: string;
          earned_at: string;
          badges: { name: string; icon_emoji: string } | null;
        }[],
      };
    },
  });

  useEffect(() => {
    if (!session?.user.id) return;
    if (q.data) {
      setProgress(q.data.xp, q.data.level);
      setBadges(
        q.data.badges
          .filter((b) => b.badges != null)
          .map((b) => ({
            id:          b.badge_id,
            label:       b.badges!.name + (b.badges!.icon_emoji ? ` ${b.badges!.icon_emoji}` : ''),
            unlockedAt:  b.earned_at,
          }))
      );
      setStreak(q.data.streak_days, q.data.last_streak_at);
      setChallenges(DEFAULT_CHALLENGES);
    } else if (q.isSuccess) {
      setProgress(0, 1);
      setBadges([]);
      setStreak(0, null);
      setChallenges(DEFAULT_CHALLENGES);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q.data, q.isSuccess, session?.user.id, setProgress, setBadges, setChallenges, setStreak]);

  return q;
}

export function useAlertsQuery() {
  const session = useAuthStore((s) => s.session);
  return useQuery({
    queryKey: ['alerts'],
    enabled: !!session,
    staleTime: 2 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_alerts')
        .select('id, title, summary')
        .order('created_at', { ascending: false })
        .limit(8);
      if (error) throw error;
      return data ?? [];
    },
  });
}

export type CommunityReviewRow = {
  id: string;
  rating: number | null;
  body: string | null;
  created_at: string;
  user_id: string;
  /** Supabase may return object or single-element array for FK embed */
  barcode_products: { name: string; brand: string | null } | { name: string; brand: string | null }[] | null;
};

export function useAlertsFeedQuery() {
  const session = useAuthStore((s) => s.session);
  return useQuery({
    queryKey: ['alerts-feed'],
    enabled: !!session,
    staleTime: 20 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_alerts')
        .select('id, title, summary, created_at')
        .order('created_at', { ascending: false })
        .limit(24);
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useCommunityReviewsQuery() {
  const session = useAuthStore((s) => s.session);
  return useQuery({
    queryKey: ['community-reviews'],
    enabled: !!session,
    staleTime: 25 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('product_reviews')
        .select('id, rating, body, created_at, user_id, barcode_products(name, brand)')
        .order('created_at', { ascending: false })
        .limit(24);
      if (error) throw error;
      return (data ?? []) as unknown as CommunityReviewRow[];
    },
  });
}

export function useTrendingProductsQuery() {
  const session = useAuthStore((s) => s.session);
  return useQuery({
    queryKey: ['trending-products'],
    enabled: !!session,
    staleTime: 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('barcode_products')
        .select('id, name, brand, barcode, price_band, image_url')
        .order('created_at', { ascending: false })
        .limit(16);
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useScansCountQuery() {
  const session = useAuthStore((s) => s.session);
  return useQuery({
    queryKey: ['scans-count', session?.user.id],
    enabled: !!session?.user.id,
    staleTime: 30 * 1000,
    queryFn: async () => {
      const { count, error } = await supabase
        .from('scan_history')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', session!.user.id);
      if (error) throw error;
      return count ?? 0;
    },
  });
}

export function useMyReviewCountQuery() {
  const session = useAuthStore((s) => s.session);
  return useQuery({
    queryKey: ['my-review-count', session?.user.id],
    enabled: !!session?.user.id,
    staleTime: 45 * 1000,
    queryFn: async () => {
      const { count, error } = await supabase
        .from('product_reviews')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', session!.user.id);
      if (error) throw error;
      return count ?? 0;
    },
  });
}

export function useBreathSessionsTodayQuery() {
  const session = useAuthStore((s) => s.session);
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  return useQuery({
    queryKey: ['breath-today', session?.user.id, start.toDateString()],
    enabled: !!session?.user.id,
    staleTime: 30 * 1000,
    queryFn: async () => {
      const { count, error } = await supabase
        .from('breathing_sessions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', session!.user.id)
        .gte('created_at', start.toISOString());
      if (error) throw error;
      return count ?? 0;
    },
  });
}

export function useAlertLikesQuery(alertIds: string[]) {
  const session = useAuthStore((s) => s.session);
  const sorted = [...alertIds].sort().join(',');
  return useQuery({
    queryKey: ['alert-likes', sorted, session?.user.id],
    enabled: !!session && alertIds.length > 0,
    staleTime: 15 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('alert_likes')
        .select('alert_id, user_id')
        .in('alert_id', alertIds);
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useAlertCommentsQuery(alertId: string | null) {
  const session = useAuthStore((s) => s.session);
  return useQuery({
    queryKey: ['alert-comments', alertId],
    enabled: !!session && !!alertId,
    staleTime: 15 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('alert_comments')
        .select('id, alert_id, user_id, parent_id, body, created_at')
        .eq('alert_id', alertId!)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useHydrationTodayQuery() {
  const session = useAuthStore((s) => s.session);
  const setTodayTotal = useHydrationStore((s) => s.setTodayTotal);

  const q = useQuery({
    queryKey: ['hydration-today', session?.user.id],
    enabled: !!session?.user.id,
    staleTime: 15 * 1000,
    queryFn: async () => {
      // user_wellness is one row per user — daily_water_cups resets via the cron job
      const { data, error } = await supabase
        .from('user_wellness')
        .select('daily_water_cups')
        .eq('user_id', session!.user.id)
        .maybeSingle();
      if (error) throw error;
      // Convert cups to ml (240 ml per cup) to preserve existing store semantics
      return (data?.daily_water_cups ?? 0) * 240;
    },
  });

  useEffect(() => {
    if (q.data != null) setTodayTotal(q.data);
  }, [q.data, setTodayTotal]);

  return q;
}

export function useDashboardPrefetch() {
  const queryClient = useQueryClient();
  const session = useAuthStore((s) => s.session);
  const uid = session?.user.id;

  useFocusEffect(
    useCallback(() => {
      if (!uid) return;
      void queryClient.prefetchQuery({
        queryKey: ['profile', uid],
        staleTime: 8 * 60 * 1000,
      });
      void queryClient.prefetchQuery({
        queryKey: ['rewards', uid],
        staleTime: 30 * 1000,
      });
      void queryClient.prefetchQuery({ queryKey: ['alerts'], staleTime: 2 * 60 * 1000 });
      void queryClient.prefetchQuery({ queryKey: ['alerts-feed'], staleTime: 20 * 1000 });
      void queryClient.prefetchQuery({ queryKey: ['community-reviews'], staleTime: 25 * 1000 });
      void queryClient.prefetchQuery({ queryKey: ['trending-products'], staleTime: 60 * 1000 });
    }, [queryClient, uid])
  );
}
