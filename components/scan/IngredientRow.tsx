import React, { useCallback, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useTheme } from '@/theme/ThemeContext';

export type RiskLevel = 'safe' | 'moderate' | 'avoid';

export interface Ingredient {
  id: string;
  name: string;
  safety_rating: RiskLevel;
  risk_category?: string;
  description?: string;
  ewg_score?: number;
  fda_status?: string;
  eu_status?: string;
  is_eu_banned?: boolean;
}

interface Props {
  ingredient: Ingredient;
}

const RISK_COLORS: Record<RiskLevel, string> = {
  safe: '#00C050',
  moderate: '#FF7850',
  avoid: '#FF4C2E',
};

const RISK_LABELS: Record<RiskLevel, string> = {
  safe: 'Safe',
  moderate: 'Moderate',
  avoid: 'Avoid',
};

const EXPANDED_HEIGHT = 120;

export function IngredientRow({ ingredient }: Props) {
  const { theme } = useTheme();
  const [expanded, setExpanded] = useState(false);
  const height = useSharedValue(0);

  const toggle = useCallback(() => {
    const next = !expanded;
    setExpanded(next);
    height.value = withTiming(next ? EXPANDED_HEIGHT : 0, { duration: 220 });
  }, [expanded, height]);

  const expandStyle = useAnimatedStyle(() => ({
    height: height.value,
    overflow: 'hidden',
  }));

  const accentColor = RISK_COLORS[ingredient.safety_rating];

  return (
    <View style={[styles.container, { borderBottomColor: theme.border }]}>
      <TouchableOpacity onPress={toggle} style={styles.row} activeOpacity={0.7}>
        <View style={[styles.accent, { backgroundColor: accentColor }]} />
        <View style={styles.info}>
          <Text style={[styles.name, { color: theme.text1 }]}>{ingredient.name}</Text>
          {ingredient.risk_category ? (
            <Text style={[styles.category, { color: theme.text3 }]}>
              {ingredient.risk_category}
            </Text>
          ) : null}
        </View>
        <View style={[styles.badge, { backgroundColor: `${accentColor}18`, borderColor: `${accentColor}44` }]}>
          <Text style={[styles.badgeText, { color: accentColor }]}>
            {RISK_LABELS[ingredient.safety_rating]}
          </Text>
        </View>
        <Text style={[styles.chevron, { color: theme.text3 }]}>
          {expanded ? '▲' : '▼'}
        </Text>
      </TouchableOpacity>

      <Animated.View style={expandStyle}>
        <View style={styles.detail}>
          <Text style={[styles.description, { color: theme.text2 }]}>
            {ingredient.description
              ? ingredient.description
              : 'No additional safety notes available for this ingredient yet.'}
          </Text>
          <View style={styles.metaRow}>
            {ingredient.ewg_score !== undefined && (
              <Text style={[styles.meta, { color: theme.text3 }]}>
                EWG: {ingredient.ewg_score}
              </Text>
            )}
            {ingredient.fda_status ? (
              <Text style={[styles.meta, { color: theme.text3 }]}>
                FDA: {ingredient.fda_status}
              </Text>
            ) : null}
            {ingredient.is_eu_banned && (
              <Text style={[styles.meta, { color: RISK_COLORS.avoid }]}>EU Banned</Text>
            )}
          </View>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderBottomWidth: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 10,
  },
  accent: {
    width: 3,
    height: 36,
    borderRadius: 2,
  },
  info: {
    flex: 1,
    gap: 2,
  },
  name: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  category: {
    fontSize: 11,
    fontWeight: '500',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  chevron: {
    fontSize: 10,
    width: 14,
    textAlign: 'center',
  },
  detail: {
    paddingHorizontal: 29,
    paddingBottom: 12,
    gap: 6,
  },
  description: {
    fontSize: 13,
    lineHeight: 19,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 12,
  },
  meta: {
    fontSize: 11,
    fontWeight: '600',
  },
});
