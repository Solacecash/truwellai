import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { hapticLight } from '@/lib/haptics';
import { StarRating } from '@/components/ui/StarRating';
import { useTheme } from '@/theme/ThemeContext';

export interface ProductReview {
  id: string;
  user_id: string;
  product_name: string;
  barcode?: string | null;
  rating: number;
  body: string;
  tags?: string[] | null;
  helpful_count: number;
  created_at: string;
}

interface Props {
  review: ProductReview;
  isNew?: boolean;
  onHelpful?: (id: string) => void;
  onWriteReview?: () => void;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export function ReviewCard({ review, isNew = false, onHelpful }: Props) {
  const { theme } = useTheme();
  const [helpfulPressed, setHelpfulPressed] = useState(false);
  const [localCount, setLocalCount] = useState(review.helpful_count);

  const handleHelpful = () => {
    if (helpfulPressed) return;
    hapticLight();
    setHelpfulPressed(true);
    setLocalCount((c) => c + 1);
    onHelpful?.(review.id);
  };

  return (
    <Animated.View
      entering={isNew ? FadeIn.duration(350) : undefined}
      style={[styles.card, { borderBottomColor: theme.border }]}
    >
      <View style={styles.header}>
        <Text style={[styles.productName, { color: theme.text1 }]} numberOfLines={1}>
          {review.product_name}
        </Text>
        <Text style={[styles.time, { color: theme.text3 }]}>{timeAgo(review.created_at)}</Text>
      </View>

      <StarRating value={review.rating} readonly size={13} />

      <Text style={[styles.body, { color: theme.text2 }]} numberOfLines={4}>
        {review.body}
      </Text>

      {review.tags && review.tags.length > 0 && (
        <View style={styles.tags}>
          {review.tags.map((tag) => (
            <View
              key={tag}
              style={[styles.tag, { backgroundColor: `${theme.teal}14`, borderColor: `${theme.teal}30` }]}
            >
              <Text style={[styles.tagText, { color: theme.teal }]}>{tag}</Text>
            </View>
          ))}
        </View>
      )}

      <TouchableOpacity
        onPress={handleHelpful}
        hitSlop={8}
        style={[
          styles.helpfulBtn,
          {
            backgroundColor: helpfulPressed ? `${theme.gold}18` : 'transparent',
            borderColor: helpfulPressed ? `${theme.gold}40` : theme.border,
          },
        ]}
      >
        <Text style={[styles.helpfulText, { color: helpfulPressed ? theme.gold : theme.text3 }]}>
          {helpfulPressed ? 'Helpful' : 'Helpful'} ({localCount})
        </Text>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  productName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: -0.1,
  },
  time: {
    fontSize: 11,
    fontWeight: '500',
    flexShrink: 0,
  },
  body: {
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '400',
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
  },
  tagText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  helpfulBtn: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
  },
  helpfulText: {
    fontSize: 11,
    fontWeight: '600',
  },
});
