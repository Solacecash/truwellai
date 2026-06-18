import * as Haptics from 'expo-haptics';
import React, { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { OB } from '@/components/onboarding/tokens';
import { TRUWELL_COLORS } from '@/theme/truwellBrand';

type Props = {
  icon: string;
  label: string;
  selected: boolean;
  onPress: () => void;
  variant?: 'guardian' | 'professional';
};

function GoalCardInner({ icon, label, selected, onPress, variant = 'guardian' }: Props) {
  const scale = useSharedValue(1);
  const accent = variant === 'professional' ? TRUWELL_COLORS.professional : TRUWELL_COLORS.guardian;

  const anim = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={[styles.wrap, anim]}>
      <Pressable
        onPress={() => {
          void Haptics.selectionAsync();
          scale.value = withSpring(1.04, {}, () => {
            scale.value = withSpring(1);
          });
          onPress();
        }}
        style={[
          styles.card,
          {
            borderColor: selected ? accent : OB.glassBorder,
            backgroundColor: selected ? 'rgba(255,255,255,0.08)' : OB.glass1,
          },
        ]}
      >
        <View style={[styles.iconWrap, { backgroundColor: selected ? `${accent}33` : OB.glass2 }]}>
          <Text style={styles.icon}>{icon}</Text>
        </View>
        <Text style={styles.label}>{label}</Text>
        {selected ? <Text style={[styles.check, { color: TRUWELL_COLORS.gold }]}>✓</Text> : null}
      </Pressable>
    </Animated.View>
  );
}

export const GoalCard = memo(GoalCardInner);

const styles = StyleSheet.create({
  wrap: { width: '48%', marginBottom: 10 },
  card: {
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 14,
    minHeight: 108,
    gap: 8,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: { fontSize: 20 },
  label: { color: OB.t100, fontSize: 13, fontWeight: '700', lineHeight: 18 },
  check: { position: 'absolute', top: 10, right: 10, fontSize: 12, fontWeight: '900' },
});
