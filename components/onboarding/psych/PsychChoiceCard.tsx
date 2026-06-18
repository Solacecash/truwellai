import * as Haptics from 'expo-haptics';
import React, { memo, useCallback } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

import { psychBrand } from '@/theme/colors';

import { OB } from '../tokens';

type Props = {
  emoji: string;
  title: string;
  subtitle?: string;
  selected: boolean;
  onSelect: () => void;
  groupName: string;
};

function PsychChoiceCardInner({
  emoji,
  title,
  subtitle,
  selected,
  onSelect,
  groupName,
}: Props) {
  const scale = useSharedValue(1);

  const anim = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = useCallback(() => {
    void Haptics.selectionAsync();
    scale.value = withSequence(
      withSpring(1.02, { damping: 10, stiffness: 200 }),
      withSpring(1, { damping: 10, stiffness: 200 })
    );
    onSelect();
  }, [onSelect, scale]);

  return (
    <Animated.View style={anim}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${groupName}: ${title}`}
        accessibilityState={{ selected }}
        onPress={handlePress}
        style={[styles.row, selected ? styles.rowOn : styles.rowOff]}
      >
        <Text style={styles.emoji}>{emoji}</Text>
        <View style={styles.textBlock}>
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
        <View style={[styles.radio, selected ? styles.radioOn : styles.radioOff]}>
          {selected ? (
            <Svg width={14} height={10} viewBox="0 0 10 8">
              <Path
                d="M2 5l2.5 2.5L8 2"
                stroke={OB.ink}
                strokeWidth={2}
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          ) : null}
        </View>
      </Pressable>
    </Animated.View>
  );
}

export const PsychChoiceCard = memo(PsychChoiceCardInner);

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 8,
  },
  rowOff: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderColor: 'rgba(255,255,255,0.12)',
  },
  rowOn: {
    backgroundColor: 'rgba(0,168,120,0.12)',
    borderColor: psychBrand.tealBorder,
  },
  emoji: {
    fontSize: 28,
    marginRight: 4,
  },
  textBlock: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: OB.t100,
  },
  subtitle: {
    marginTop: 2,
    fontSize: 12,
    color: OB.t45,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  radioOff: {
    borderColor: OB.glassBorder,
    backgroundColor: 'transparent',
  },
  radioOn: {
    borderColor: psychBrand.primary,
    backgroundColor: psychBrand.primary,
  },
});
