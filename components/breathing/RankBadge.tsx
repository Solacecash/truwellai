import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme/ThemeContext';
import { getRankForPoints, getNextRank, type MilitaryRank } from '@/lib/breathingExercises';

type IoniconName = keyof typeof Ionicons.glyphMap;

const VALID_ICON_FALLBACKS: Record<string, IoniconName> = {
  shield: 'shield',
  star: 'star',
  'star-outline': 'star-outline',
  medal: 'medal',
  ribbon: 'ribbon',
  trophy: 'trophy',
  'medal-outline': 'medal-outline',
  flash: 'flash',
  diamond: 'diamond',
  crown: 'star', // no crown glyph in core Ionicons; use star as fallback
};

function resolveIcon(key: string): IoniconName {
  return VALID_ICON_FALLBACKS[key] ?? 'shield';
}

interface Props {
  points: number;
  size?: 'sm' | 'md' | 'lg';
  showProgress?: boolean;
}

export function RankBadge({ points, size = 'md', showProgress = false }: Props) {
  const { theme } = useTheme();
  const current = getRankForPoints(points);
  const next = getNextRank(points);

  const iconSize = size === 'lg' ? 36 : size === 'md' ? 22 : 16;
  const nameSize = size === 'lg' ? 20 : size === 'md' ? 14 : 11;

  const span = next ? next.minPoints - current.minPoints : 1;
  const earned = points - current.minPoints;
  const pct = Math.min(1, span > 0 ? earned / span : 1);

  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <View style={[styles.iconWrap, { borderColor: theme.gold, backgroundColor: `${theme.gold}22` }]}>
          <Ionicons name={resolveIcon(current.icon)} size={iconSize} color={theme.gold} />
        </View>
        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text style={[styles.name, { color: theme.gold, fontSize: nameSize }]}>{current.rank}</Text>
          {showProgress && (
            <>
              <View style={[styles.barBg, { backgroundColor: theme.border }]}>
                <View
                  style={[
                    styles.barFill,
                    { width: `${pct * 100}%`, backgroundColor: theme.gold },
                  ]}
                />
              </View>
              <Text style={[styles.pts, { color: theme.text3 }]}>
                {next
                  ? `${next.minPoints - points} pts to ${next.rank}`
                  : 'Max rank achieved'}
              </Text>
            </>
          )}
        </View>
      </View>
    </View>
  );
}

/** Inline mini badge for headers. */
export function RankChip({ rank }: { rank: MilitaryRank }) {
  const { theme } = useTheme();
  return (
    <View style={[chipStyles.chip, { borderColor: theme.gold, backgroundColor: `${theme.gold}15` }]}>
      <Ionicons name={resolveIcon(rank.icon)} size={12} color={theme.gold} />
      <Text style={[chipStyles.label, { color: theme.gold }]}>{rank.rank}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: '100%' },
  row: { flexDirection: 'row', alignItems: 'center' },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: { fontWeight: '900' },
  barBg: {
    height: 6,
    borderRadius: 3,
    marginTop: 6,
    overflow: 'hidden',
  },
  barFill: { height: '100%', borderRadius: 3 },
  pts: { fontSize: 10, fontWeight: '700', marginTop: 4 },
});

const chipStyles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderRadius: 10,
  },
  label: { fontSize: 10, fontWeight: '900' },
});
