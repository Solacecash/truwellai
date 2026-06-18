import { hapticLight, hapticSuccess } from '@/lib/haptics';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';
import { useCallback } from 'react';
import { Pressable, Share, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withSpring } from 'react-native-reanimated';

type Props = {
  alertId: string;
  title: string;
  summary?: string | null;
  likeCount: number;
  liked: boolean;
  onToggleLike: () => void;
  onComment: () => void;
  headerBadge?: string;
};

export function FeedPostCard({
  title,
  summary,
  likeCount,
  liked,
  onToggleLike,
  onComment,
  headerBadge,
}: Props) {
  const heart = useSharedValue(1);

  const heartStyle = useAnimatedStyle(() => ({
    transform: [{ scale: heart.value }],
  }));

  const pulseLike = useCallback(() => {
    heart.value = withSequence(withSpring(1.35, { damping: 8 }), withSpring(1, { damping: 10 }));
  }, [heart]);

  const onLike = () => {
    hapticLight();
    if (!liked) {
      hapticSuccess();
      pulseLike();
    }
    onToggleLike();
  };

  const onShare = async () => {
    hapticLight();
    try {
      await Share.share({ message: `${title}${summary ? `\n\n${summary}` : ''}` });
    } catch {
      /* cancelled */
    }
  };

  return (
    <View style={styles.card}>
      {headerBadge ? (
        <View style={styles.badgeRow}>
          <Text style={[typography.caption, styles.badge]}>{headerBadge}</Text>
        </View>
      ) : null}
      <Text style={[typography.bodyStrong]}>{title}</Text>
      {summary ? <Text style={[typography.caption, styles.sum]}>{summary}</Text> : null}
      <View style={styles.actions}>
        <Pressable onPress={onLike} style={styles.actBtn} hitSlop={8}>
          <Animated.Text style={[styles.actIcon, heartStyle, liked && styles.actIconOn]}>
            {liked ? '♥' : '♡'}
          </Animated.Text>
          <Text style={[typography.caption, styles.actLbl]}>{likeCount}</Text>
        </Pressable>
        <Pressable onPress={() => { hapticLight(); onComment(); }} style={styles.actBtn} hitSlop={8}>
          <Text style={[typography.caption, styles.actLbl]}>Comment</Text>
        </Pressable>
        <Pressable onPress={onShare} style={styles.actBtn} hitSlop={8}>
          <Text style={[typography.caption, styles.actLbl]}>Share</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    paddingVertical: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.cardBorder,
  },
  badgeRow: { marginBottom: 8 },
  badge: {
    alignSelf: 'flex-start',
    color: colors.accentGold,
    backgroundColor: 'rgba(201, 168, 76, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    overflow: 'hidden',
  },
  sum: { marginTop: 6, opacity: 0.88 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 20, marginTop: 12 },
  actBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  actIcon: { fontSize: 20, color: colors.tealGlow },
  actIconOn: { color: colors.accentGold },
  actLbl: { color: colors.tealGlow },
});
