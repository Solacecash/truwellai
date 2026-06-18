import { type QuotaStatus } from '@/lib/quotaManager';
import { useEffect } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

const TEAL = '#00E5C8';

interface Props {
  quotaStatus: QuotaStatus;
  onUpgrade: () => void;
  type: 'scan' | 'report';
}

function PulsingDot({ color }: { color: string }) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  useEffect(() => {
    scale.value = withRepeat(
      withSequence(withTiming(1.4, { duration: 700 }), withTiming(1.0, { duration: 700 })),
      -1,
      false
    );
    opacity.value = withRepeat(
      withSequence(withTiming(0.4, { duration: 700 }), withTiming(1.0, { duration: 700 })),
      -1,
      false
    );
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[style, { width: 7, height: 7, borderRadius: 3.5, backgroundColor: color }]}
    />
  );
}

export function QuotaWarningBanner({ quotaStatus, onUpgrade, type }: Props) {
  const translateY = useSharedValue(-20);
  const opacity = useSharedValue(0);

  useEffect(() => {
    translateY.value = withSpring(0, { damping: 16, stiffness: 200 });
    opacity.value = withTiming(1, { duration: 350 });
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  const isNear =
    type === 'scan' ? quotaStatus.isNearScanLimit : quotaStatus.isNearReportLimit;
  const isAt =
    type === 'scan' ? quotaStatus.isAtScanLimit : quotaStatus.isAtReportLimit;
  const used = type === 'scan' ? quotaStatus.scansUsed : quotaStatus.reportsUsed;
  const limit =
    type === 'scan'
      ? typeof quotaStatus.scansLimit === 'number' ? quotaStatus.scansLimit : 10
      : typeof quotaStatus.reportsLimit === 'number' ? quotaStatus.reportsLimit : 5;
  const remaining =
    type === 'scan'
      ? typeof quotaStatus.scansRemaining === 'number' ? quotaStatus.scansRemaining : 0
      : typeof quotaStatus.reportsRemaining === 'number' ? quotaStatus.reportsRemaining : 0;
  const noun = type === 'scan' ? 'scan' : 'report';
  const nounPlural = type === 'scan' ? 'scans' : 'reports';

  if (isAt) {
    // STATE 3 — limit reached
    return (
      <Animated.View
        style={[
          animStyle,
          styles.bannerBase,
          {
            backgroundColor: 'rgba(255,71,87,0.12)',
            borderColor: 'rgba(255,71,87,0.40)',
            padding: 14,
          },
        ]}
      >
        <Text style={[styles.limitTitle, { color: '#FF4757' }]}>
          Monthly {noun} limit reached
        </Text>
        <Text style={styles.limitBody}>
          You have used all {limit} {nounPlural} for {quotaStatus.resetDate
            ? `${quotaStatus.resetDate.split(' ')[0]}`
            : 'this month'}
          . Upgrade TruWell AI for unlimited {nounPlural}.
        </Text>
        <TouchableOpacity onPress={onUpgrade} style={styles.unlockBtn} activeOpacity={0.85}>
          <Text style={styles.unlockBtnText}>
            Unlock Unlimited {type === 'scan' ? 'Scans' : 'Reports'}
          </Text>
        </TouchableOpacity>
        <Text style={styles.resetNote}>
          Resets on {quotaStatus.resetDate} if you stay on free
        </Text>
      </Animated.View>
    );
  }

  const isOneLast = type === 'scan' ? used === 9 : used === 4;

  if (isOneLast) {
    // STATE 2 — one remaining
    return (
      <Animated.View
        style={[
          animStyle,
          styles.bannerBase,
          {
            backgroundColor: 'rgba(255,71,87,0.08)',
            borderColor: 'rgba(255,71,87,0.25)',
          },
        ]}
      >
        <View style={styles.bannerRow}>
          <View style={styles.leftRow}>
            <PulsingDot color="#FF4757" />
            <Text style={[styles.bannerText, { color: '#FF4757' }]}>
              Last free {noun} remaining
            </Text>
          </View>
          <TouchableOpacity onPress={onUpgrade} style={styles.upgradePill} activeOpacity={0.85}>
            <Text style={styles.upgradePillText}>Upgrade Now</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    );
  }

  if (isNear) {
    // STATE 1 — approaching limit
    return (
      <Animated.View
        style={[
          animStyle,
          styles.bannerBase,
          {
            backgroundColor: 'rgba(255,165,2,0.08)',
            borderColor: 'rgba(255,165,2,0.20)',
          },
        ]}
      >
        <View style={styles.bannerRow}>
          <View style={styles.leftRow}>
            <PulsingDot color="#FFA502" />
            <Text style={[styles.bannerText, { color: '#FFA502' }]}>
              {remaining} free {remaining === 1 ? noun : nounPlural} remaining this month
            </Text>
          </View>
          <TouchableOpacity onPress={onUpgrade} hitSlop={8}>
            <Text style={[styles.upgradeLink, { color: TEAL }]}>Upgrade</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  bannerBase: {
    borderWidth: 1,
    borderRadius: 12,
    marginHorizontal: 12,
    marginVertical: 6,
  },
  bannerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    paddingHorizontal: 12,
  },
  leftRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  bannerText: { fontSize: 12, fontWeight: '600', flex: 1 },

  // State 3
  limitTitle: { fontSize: 14, fontWeight: '700', marginBottom: 4 },
  limitBody: { fontSize: 12, color: 'rgba(240,244,255,0.65)', lineHeight: 18, marginBottom: 10 },
  unlockBtn: {
    backgroundColor: TEAL,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 8,
  },
  unlockBtnText: { fontSize: 13, fontWeight: '800', color: '#020A14' },
  resetNote: { fontSize: 10, color: 'rgba(240,244,255,0.35)', fontStyle: 'italic', textAlign: 'center' },

  // State 2
  upgradePill: {
    backgroundColor: TEAL,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  upgradePillText: { fontSize: 11, fontWeight: '800', color: '#020A14' },

  // State 1
  upgradeLink: { fontSize: 12, fontWeight: '700' },
});
