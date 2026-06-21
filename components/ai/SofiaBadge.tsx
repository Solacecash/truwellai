import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/theme/ThemeContext';

export const SOFIA_WELLNESS_LABEL = 'Sofia · AI Wellness Intelligence';

type Variant = 'header' | 'compact' | 'pill';

interface Props {
  variant?: Variant;
  /** When true, only renders the subtitle portion (after the middle dot). */
  subtitleOnly?: boolean;
}

export function SofiaBadge({ variant = 'header', subtitleOnly = false }: Props) {
  const { theme } = useTheme();

  if (subtitleOnly) {
    return (
      <Text
        style={[
          styles.subtitleOnly,
          variant === 'compact' ? styles.subtitleCompact : styles.subtitleHeader,
          { color: theme.text3 },
        ]}
        numberOfLines={1}
      >
        AI Wellness Intelligence
      </Text>
    );
  }

  if (variant === 'pill') {
    return (
      <View
        style={[
          styles.pill,
          { backgroundColor: `${theme.teal}12`, borderColor: `${theme.teal}35` },
        ]}
      >
        <View style={[styles.pillDot, { backgroundColor: theme.teal }]} />
        <Text style={[styles.pillText, { color: theme.teal }]} numberOfLines={1}>
          {SOFIA_WELLNESS_LABEL}
        </Text>
      </View>
    );
  }

  return (
    <Text
      style={[variant === 'compact' ? styles.compactLine : styles.headerLine]}
      numberOfLines={variant === 'compact' ? 2 : 1}
      adjustsFontSizeToFit={variant === 'compact'}
      minimumFontScale={0.85}
    >
      <Text style={{ color: theme.text1, fontWeight: '800' }}>Sofia</Text>
      <Text style={{ color: theme.text3, fontWeight: '600' }}> · AI Wellness Intelligence</Text>
    </Text>
  );
}

const styles = StyleSheet.create({
  headerLine: {
    fontSize: 14,
    letterSpacing: -0.2,
    lineHeight: 18,
  },
  compactLine: {
    fontSize: 12,
    letterSpacing: -0.15,
    lineHeight: 16,
  },
  subtitleOnly: {
    fontWeight: '600',
    letterSpacing: 0.1,
  },
  subtitleHeader: {
    fontSize: 11,
  },
  subtitleCompact: {
    fontSize: 10,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 100,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  pillDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  pillText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.15,
  },
});

export default SofiaBadge;
