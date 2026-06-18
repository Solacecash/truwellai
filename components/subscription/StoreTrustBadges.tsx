import { StyleSheet, Text, View } from 'react-native';

type Props = {
  labelColor?: string;
  titleColor?: string;
  subColor?: string;
};

export function StoreTrustBadges({
  labelColor = '#00E5C8',
  titleColor = 'rgba(240,244,255,0.70)',
  subColor = 'rgba(240,244,255,0.40)',
}: Props) {
  return (
    <View style={styles.wrap}>
      <Text style={[styles.label, { color: labelColor }]}>WHY THOUSANDS TRUST US</Text>
      <View style={styles.grid}>
        <View style={styles.card}>
          <Text style={styles.lock}>🔒</Text>
          <Text style={[styles.title, { color: titleColor }]}>Store secured</Text>
          <View style={styles.badgeRow}>
            <View style={styles.storeBadge}>
              <Text style={styles.storeBadgeText}>App Store</Text>
            </View>
            <View style={[styles.storeBadge, styles.storeBadgeGoogle]}>
              <Text style={styles.storeBadgeText}>Google Play</Text>
            </View>
          </View>
        </View>
        <View style={styles.card}>
          <Text style={styles.lock}>✓</Text>
          <Text style={[styles.title, { color: titleColor }]}>Cancel anytime</Text>
          <Text style={[styles.sub, { color: subColor }]}>No questions asked</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.lock}>⚡</Text>
          <Text style={[styles.title, { color: titleColor }]}>Instant access</Text>
          <Text style={[styles.sub, { color: subColor }]}>Activated now</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.lock}>★</Text>
          <Text style={[styles.title, { color: titleColor }]}>7-day refund</Text>
          <Text style={[styles.sub, { color: subColor }]}>If not satisfied</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingVertical: 12 },
  label: {
    fontSize: 9,
    letterSpacing: 3,
    textAlign: 'center',
    marginBottom: 10,
    fontWeight: '600',
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  card: {
    width: '47.5%',
    backgroundColor: 'rgba(255,255,255,0.025)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    borderRadius: 12,
    padding: 10,
    alignItems: 'center',
  },
  lock: { fontSize: 16, marginBottom: 4 },
  title: { fontSize: 11, fontWeight: '600', marginBottom: 4, textAlign: 'center' },
  sub: { fontSize: 9, textAlign: 'center' },
  badgeRow: { flexDirection: 'row', gap: 6, marginTop: 4 },
  storeBadge: {
    backgroundColor: 'rgba(0,0,0,0.35)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  storeBadgeGoogle: {
    borderColor: 'rgba(66,133,244,0.5)',
    backgroundColor: 'rgba(66,133,244,0.12)',
  },
  storeBadgeText: {
    fontSize: 8,
    fontWeight: '700',
    color: '#F0F4FF',
    letterSpacing: 0.3,
  },
});
