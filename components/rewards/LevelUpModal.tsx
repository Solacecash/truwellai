import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { useRewardStore } from '@/stores/rewardStore';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';
import { useEffect, useRef, useState } from 'react';
import { Modal, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

export function LevelUpModal() {
  const level = useRewardStore((s) => s.level);
  const prev = useRef<number | null>(null);
  const boot = useRef(true);
  const [open, setOpen] = useState(false);
  const [shownLevel, setShownLevel] = useState(level);
  const glow = useSharedValue(0);

  useEffect(() => {
    const t = setTimeout(() => {
      boot.current = false;
    }, 2200);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (prev.current === null) {
      prev.current = level;
      return;
    }
    if (boot.current) {
      prev.current = level;
      return;
    }
    if (level > prev.current) {
      setShownLevel(level);
      setOpen(true);
      glow.value = withSequence(
        withTiming(1, { duration: 280, easing: Easing.out(Easing.quad) }),
        withTiming(0.35, { duration: 600 })
      );
    }
    prev.current = level;
  }, [level, glow]);

  const burst = useAnimatedStyle(() => ({
    opacity: glow.value,
    transform: [{ scale: 0.92 + glow.value * 0.12 }],
  }));

  return (
    <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
      <View style={styles.back}>
        <Animated.View style={[styles.card, burst]}>
          <Text style={[typography.caption, styles.lbl]}>Level up</Text>
          <Text style={[typography.headline, styles.lvl]}>{shownLevel}</Text>
          <Text style={[typography.body, styles.msg]}>Keep building trusted habits.</Text>
          <PrimaryButton label="Continue" variant="gold" onPress={() => setOpen(false)} />
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  back: {
    flex: 1,
    backgroundColor: 'rgba(10, 22, 40, 0.88)',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    borderRadius: 24,
    padding: 28,
    backgroundColor: colors.dark,
    borderWidth: 2,
    borderColor: colors.accentGold,
    shadowColor: colors.accentGold,
    shadowOpacity: 0.55,
    shadowRadius: 24,
  },
  lbl: { color: colors.tealGlow, textAlign: 'center' },
  lvl: {
    fontSize: 56,
    textAlign: 'center',
    color: colors.accentGold,
    marginVertical: 8,
  },
  msg: { textAlign: 'center', marginBottom: 20, opacity: 0.9 },
});
