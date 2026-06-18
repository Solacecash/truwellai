import React from 'react';
import { Share, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { hapticLight } from '@/lib/haptics';
import { useTheme } from '@/theme/ThemeContext';

export type PostType = 'tip' | 'alert' | 'review' | 'question';

export interface FeedPost {
  id: string;
  user_id: string;
  content: string;
  post_type: PostType;
  created_at: string;
}

interface Props {
  post: FeedPost;
  isNew?: boolean;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

const TYPE_LABELS: Record<PostType, string> = {
  tip: 'Tip',
  alert: 'Alert',
  review: 'Review',
  question: 'Question',
};

export function FeedCard({ post, isNew = false }: Props) {
  const { theme } = useTheme();

  const typeColor: string =
    post.post_type === 'alert'
      ? theme.red
      : post.post_type === 'review'
      ? theme.teal
      : post.post_type === 'question'
      ? theme.purple
      : theme.gold;

  const handleShare = async () => {
    hapticLight();
    try {
      await Share.share({ message: post.content });
    } catch {
      // cancelled
    }
  };

  return (
    <Animated.View
      entering={isNew ? FadeIn.duration(350) : undefined}
      style={[styles.card, { borderBottomColor: theme.border }]}
    >
      <View style={styles.meta}>
        <View style={[styles.typeBadge, { backgroundColor: `${typeColor}18`, borderColor: `${typeColor}40` }]}>
          <Text style={[styles.typeLabel, { color: typeColor }]}>
            {TYPE_LABELS[post.post_type]}
          </Text>
        </View>
        <Text style={[styles.time, { color: theme.text3 }]}>{timeAgo(post.created_at)}</Text>
      </View>
      <Text style={[styles.content, { color: theme.text2 }]}>{post.content}</Text>
      <TouchableOpacity onPress={handleShare} hitSlop={8} style={styles.shareBtn}>
        <Text style={[styles.shareText, { color: theme.text3 }]}>Share</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 8,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  typeBadge: {
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
  },
  typeLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  time: {
    fontSize: 11,
    fontWeight: '500',
  },
  content: {
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '400',
  },
  shareBtn: { alignSelf: 'flex-start' },
  shareText: { fontSize: 11, fontWeight: '600' },
});
