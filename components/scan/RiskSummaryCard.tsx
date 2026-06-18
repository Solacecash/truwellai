import { ScanResultPayload } from '@/stores/scanStore';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';
import { StyleSheet, Text, View } from 'react-native';
import { GlowCard } from '../ui/GlowCard';

type Props = { result: ScanResultPayload };

function gradeColor(grade: string) {
  const g = grade.toUpperCase();
  if (g === 'A' || g === 'B') return colors.safe;
  if (g === 'C') return colors.moderate;
  return colors.avoid;
}

export function RiskSummaryCard({ result }: Props) {
  const borderTint = gradeColor(result.grade);

  return (
    <GlowCard style={styles.card}>
      <View style={styles.row}>
        <View style={[styles.gradeBubble, { borderColor: borderTint }]}>
          <Text style={[typography.headline, styles.grade]}>{result.grade}</Text>
        </View>
        <View style={styles.meta}>
          <Text style={[typography.caption]}>Safety score</Text>
          <Text style={[typography.headline, styles.score]}>{result.personalizedScore ?? result.score}</Text>
        </View>
      </View>
      <Text style={[typography.body, styles.summary]}>{result.summary}</Text>
      {result.riskNotes?.length ? (
        <View style={styles.notes}>
          {result.riskNotes.map((n, i) => (
            <Text key={i} style={[typography.caption, styles.riskLine]}>
              • {n}
            </Text>
          ))}
        </View>
      ) : null}
    </GlowCard>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: 16 },
  row: { flexDirection: 'row', alignItems: 'center' },
  gradeBubble: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  grade: { fontSize: 28 },
  meta: { flex: 1 },
  score: { color: colors.tealGlow },
  summary: { marginTop: 14 },
  notes: { marginTop: 12 },
  riskLine: { color: colors.moderate, marginTop: 4 },
});
