import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';
import { StyleSheet, Text, View } from 'react-native';

type Props = {
  label: string;
  current: number;
  target: number;
  color: string;
};

export function MacroBar({ label, current, target, color }: Props) {
  const r = target > 0 ? Math.min(1, current / target) : 0;
  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <Text style={[typography.caption, styles.label]}>{label}</Text>
        <Text style={[typography.caption]}>
          {current} / {target} g
        </Text>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${r * 100}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  label: { color: colors.textPrimary },
  track: {
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.dark,
    overflow: 'hidden',
  },
  fill: { height: '100%', borderRadius: 4 },
});
