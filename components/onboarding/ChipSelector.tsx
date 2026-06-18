import * as Haptics from 'expo-haptics';
import React, { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { OB } from '@/components/onboarding/tokens';
import { TRUWELL_COLORS } from '@/theme/truwellBrand';

type Props = {
  label: string;
  selected: boolean;
  onPress: () => void;
  mode?: 'single' | 'multi';
  variant?: 'guardian' | 'professional';
  fullWidth?: boolean;
};

function ChipSelectorInner({
  label,
  selected,
  onPress,
  variant = 'guardian',
  fullWidth,
}: Props) {
  const accent = variant === 'professional' ? TRUWELL_COLORS.professional : TRUWELL_COLORS.guardian;

  return (
    <Pressable
      onPress={() => {
        void Haptics.selectionAsync();
        onPress();
      }}
      style={[
        styles.chip,
        fullWidth && styles.full,
        {
          borderColor: selected ? accent : OB.glassBorder,
          backgroundColor: selected ? `${accent}22` : OB.glass1,
        },
      ]}
    >
      <Text style={[styles.text, { color: selected ? OB.t100 : OB.t70 }]}>{label}</Text>
    </Pressable>
  );
}

export const ChipSelector = memo(ChipSelectorInner);

const styles = StyleSheet.create({
  chip: {
    borderRadius: 100,
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginRight: 8,
    marginBottom: 8,
  },
  full: { width: '100%', marginRight: 0, borderRadius: 14 },
  text: { fontSize: 13, fontWeight: '600', lineHeight: 18 },
});
