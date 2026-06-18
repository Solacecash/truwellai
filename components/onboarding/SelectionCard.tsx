import * as Haptics from 'expo-haptics';
import React, { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { OnboardingPathVariant } from '@/theme/truwellBrand';
import { TRUWELL_COLORS, onboardingScreenColors } from '@/theme/truwellBrand';

export type SelectionCardProps = {
  title: string;
  description?: string;
  icon: string;
  selected: boolean;
  onPress: () => void;
  variant?: OnboardingPathVariant;
  isDark?: boolean;
  layout?: 'row' | 'stack';
  fullWidth?: boolean;
};

function SelectionCardInner({
  title,
  description,
  icon,
  selected,
  onPress,
  variant = 'guardian',
  isDark = true,
  fullWidth = false,
  layout = 'row',
}: SelectionCardProps) {
  const palette = onboardingScreenColors(isDark);
  const activeColor = variant === 'professional' ? TRUWELL_COLORS.professional : TRUWELL_COLORS.guardian;
  const rgb = variant === 'professional' ? '0,123,255' : '0,168,120';

  const cardBg = selected
    ? `rgba(${rgb},${isDark ? 0.18 : 0.1})`
    : palette.cardBg;

  const isStack = layout === 'stack';

  return (
    <Pressable
      onPress={() => {
        void Haptics.selectionAsync();
        onPress();
      }}
      style={[
        styles.card,
        isStack && styles.cardStack,
        fullWidth && styles.fullWidth,
        {
          backgroundColor: cardBg,
          borderColor: selected ? activeColor : palette.cardBorder,
          shadowColor: selected ? activeColor : '#000',
          shadowOpacity: selected ? 0.35 : 0.1,
          shadowRadius: selected ? 14 : 4,
          shadowOffset: { width: 0, height: selected ? 4 : 1 },
          elevation: selected ? 6 : 1,
        },
      ]}
    >
      <View
        style={[
          isStack ? styles.iconWrapStack : styles.iconWrap,
          {
            backgroundColor: selected
              ? `rgba(${rgb},0.25)`
              : isDark
                ? 'rgba(255,255,255,0.08)'
                : 'rgba(0,0,0,0.06)',
          },
        ]}
      >
        <Text style={isStack ? styles.iconStack : styles.icon}>{icon}</Text>
      </View>

      <View style={[styles.copy, isStack && styles.copyStack]}>
        <Text
          style={[
            isStack ? styles.titleStack : styles.title,
            { color: palette.textPrimary },
          ]}
          numberOfLines={isStack ? 3 : undefined}
        >
          {title}
        </Text>
        {description && !isStack ? (
          <Text style={[styles.description, { color: palette.textSecondary }]}>{description}</Text>
        ) : null}
      </View>

      {selected && !isStack ? (
        <View style={[styles.check, { backgroundColor: activeColor }]}>
          <Text style={styles.checkMark}>✓</Text>
        </View>
      ) : null}
      {selected && isStack ? (
        <View style={[styles.stackCheck, { backgroundColor: activeColor }]} />
      ) : null}
    </Pressable>
  );
}

export const SelectionCard = memo(SelectionCardInner);

const styles = StyleSheet.create({
  card: {
    borderWidth: 1.5,
    borderRadius: 18,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 12,
  },
  cardStack: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    padding: 14,
    minHeight: 108,
    gap: 8,
    marginBottom: 0,
  },
  fullWidth: {
    width: '100%',
  },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  iconWrapStack: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 24,
  },
  iconStack: {
    fontSize: 22,
  },
  copy: {
    flex: 1,
  },
  copyStack: {
    width: '100%',
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 3,
  },
  titleStack: {
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
  },
  description: {
    fontSize: 13,
    lineHeight: 18,
  },
  check: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  stackCheck: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  checkMark: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
});
