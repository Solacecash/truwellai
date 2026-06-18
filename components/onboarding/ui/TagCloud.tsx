import * as Haptics from 'expo-haptics';
import React, { memo, useCallback } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
} from 'react-native-reanimated';

import { OB } from '../tokens';

type Props = {
  tags: string[];
  selected: string[];
  onToggle: (tag: string) => void;
  sectionLabel?: string;
};

function TagCloudInner({ tags, selected, onToggle, sectionLabel }: Props) {
  return (
    <View>
      {sectionLabel ? <Text style={styles.section}>{sectionLabel}</Text> : null}
      <View style={styles.cloud}>
        {tags.map((tag) => (
          <TagPill
            key={tag}
            tag={tag}
            on={selected.includes(tag)}
            onToggle={onToggle}
          />
        ))}
      </View>
    </View>
  );
}

type PillProps = {
  tag: string;
  on: boolean;
  onToggle: (tag: string) => void;
};

const TagPill = memo(function TagPillInner({ tag, on, onToggle }: PillProps) {
  const scale = useSharedValue(1);

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = useCallback(() => {
    void Haptics.selectionAsync();
    scale.value = withSequence(
      withSpring(1.03, { damping: 8, stiffness: 200 }),
      withSpring(1, { damping: 8, stiffness: 200 })
    );
    onToggle(tag);
  }, [onToggle, scale, tag]);

  return (
    <Animated.View style={style}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={tag}
        accessibilityState={{ selected: on }}
        onPress={handlePress}
        style={[styles.pill, on ? styles.pillOn : styles.pillOff]}
      >
        <Text style={[styles.pillText, on ? styles.pillTextOn : styles.pillTextOff]}>
          {tag}
        </Text>
      </Pressable>
    </Animated.View>
  );
});

export const TagCloud = memo(TagCloudInner);

const styles = StyleSheet.create({
  section: {
    marginTop: 4,
    marginBottom: 10,
    fontSize: 11,
    fontWeight: '700',
    color: OB.t20,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  cloud: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pill: {
    borderRadius: OB.r99,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderWidth: 1,
  },
  pillOff: {
    backgroundColor: OB.glass1,
    borderColor: OB.glassBorder,
  },
  pillOn: {
    backgroundColor: 'rgba(201,168,76,0.15)',
    borderColor: 'rgba(201,168,76,0.4)',
  },
  pillText: {
    fontSize: 11.5,
    fontWeight: '600',
  },
  pillTextOff: {
    color: OB.t45,
  },
  pillTextOn: {
    color: OB.gold,
  },
});
