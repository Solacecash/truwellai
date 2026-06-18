import { type PlanId } from '@/lib/subscriptionPlans';
import { useRouter } from 'expo-router';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Path, Svg } from 'react-native-svg';

const GOLD = '#C9A84C';
const BG_DARK = '#020A14';

interface Props {
  featureName: string;
  description: string;
  highlightedPlan?: PlanId;
  onUpgrade?: () => void;
}

function LockIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path
        d="M19 11H5a2 2 0 00-2 2v7a2 2 0 002 2h14a2 2 0 002-2v-7a2 2 0 00-2-2z"
        stroke={GOLD}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M7 11V7a5 5 0 0110 0v4"
        stroke={GOLD}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function UpgradePromptCard({
  featureName,
  description,
  onUpgrade,
}: Props) {
  const router = useRouter();

  const handlePress = () => {
    if (onUpgrade) {
      onUpgrade();
    } else {
      router.push('/settings/subscription');
    }
  };

  return (
    <View style={styles.card}>
      {/* Left accent strip */}
      <View style={styles.accentStrip} />

      {/* Header */}
      <View style={styles.headerRow}>
        <LockIcon />
        <View style={styles.proBadge}>
          <Text style={styles.proBadgeText}>Pro Feature</Text>
        </View>
      </View>

      {/* Title + description */}
      <Text style={styles.title}>{featureName}</Text>
      <Text style={styles.description}>{description}</Text>

      {/* CTA */}
      <TouchableOpacity onPress={handlePress} style={styles.ctaBtn} activeOpacity={0.85}>
        <Text style={styles.ctaBtnText}>Unlock {featureName}</Text>
      </TouchableOpacity>

      <Text style={styles.ctaNote}>From $6.66/month · Cancel anytime</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(201,168,76,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(201,168,76,0.25)',
    borderRadius: 18,
    padding: 14,
    paddingLeft: 18,
    overflow: 'hidden',
    position: 'relative',
  },
  accentStrip: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: GOLD,
    borderTopLeftRadius: 4,
    borderBottomLeftRadius: 4,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  proBadge: {
    backgroundColor: 'rgba(201,168,76,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(201,168,76,0.30)',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  proBadgeText: { fontSize: 9, fontWeight: '800', color: GOLD, letterSpacing: 0.5 },
  title: { fontSize: 14, fontWeight: '700', color: '#F0F4FF', marginBottom: 4 },
  description: { fontSize: 12, color: 'rgba(240,244,255,0.55)', lineHeight: 18, marginBottom: 12 },
  ctaBtn: {
    height: 50,
    borderRadius: 14,
    backgroundColor: GOLD,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaBtnText: { fontSize: 14, fontWeight: '800', color: BG_DARK },
  ctaNote: { fontSize: 10, color: 'rgba(240,244,255,0.30)', textAlign: 'center', marginTop: 5 },
});
