import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';
import { StyleSheet, Text, View } from 'react-native';
import { GlowCard } from '../ui/GlowCard';

export type CommunityAlert = { id: string; title: string; summary: string };

type Props = { alerts: CommunityAlert[] };

export function CommunityAlerts({ alerts }: Props) {
  if (!alerts.length) return null;
  return (
    <GlowCard style={styles.wrap}>
      <Text style={[typography.headlineSm, styles.h]}>Community alerts</Text>
      {alerts.map((a) => (
        <View key={a.id} style={styles.item}>
          <Text style={[typography.bodyStrong, styles.t]}>{a.title}</Text>
          <Text style={[typography.caption]}>{a.summary}</Text>
        </View>
      ))}
    </GlowCard>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: 16 },
  h: { marginBottom: 8 },
  item: { paddingVertical: 10, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.cardBorder },
  t: { fontSize: 15, marginBottom: 4 },
});
