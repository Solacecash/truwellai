import { OrbitLoader } from '@/components/ui/OrbitLoader';
import { colors } from '@/theme/colors';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { useEffect } from 'react';

function ShimmerBar({ style: dim }: { style: { width: number | `${number}%`; height: number } }) {
  const o = useSharedValue(0.35);
  useEffect(() => {
    o.value = withRepeat(withTiming(0.85, { duration: 900, easing: Easing.inOut(Easing.quad) }), -1, true);
  }, [o]);
  const anim = useAnimatedStyle(() => ({ opacity: o.value }));
  return (
    <Animated.View style={[styles.bar, dim, anim]} />
  );
}

export function DashboardSkeleton() {
  return (
    <View style={styles.cols}>
      <View style={styles.orbitRow}>
        <OrbitLoader size={36} />
      </View>
      <ShimmerBar style={{ width: '100%', height: 88 }} />
      <View style={styles.row}>
        <ShimmerBar style={{ width: '48%', height: 120 }} />
        <ShimmerBar style={{ width: '48%', height: 120 }} />
      </View>
      <ShimmerBar style={{ width: '100%', height: 56 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  cols: { gap: 16, width: '100%' },
  orbitRow: { alignItems: 'center', paddingVertical: 8 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  bar: {
    borderRadius: 14,
    backgroundColor: colors.cardBg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
});
