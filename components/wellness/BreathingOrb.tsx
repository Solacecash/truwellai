import { useBreathingStore } from '@/stores/breathingStore';
import { colors } from '@/theme/colors';
import { useEffect } from 'react';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

type Props = {
  size?: number;
  active?: boolean;
};

const INHALE_MS = 4000;
const EXHALE_MS = 6000;

/** Phase-driven orb — sky-blue pulse; parent drives `phase` via breathing store. */
export function BreathingOrb({ size = 220, active }: Props) {
  const phase = useBreathingStore((s) => s.phase);
  const scale = useSharedValue(1);
  const glow = useSharedValue(0.65);

  useEffect(() => {
    if (!active) {
      cancelAnimation(scale);
      cancelAnimation(glow);
      scale.value = withRepeat(
        withSequence(
          withTiming(1.06, { duration: 5000, easing: Easing.inOut(Easing.sin) }),
          withTiming(0.94, { duration: 5000, easing: Easing.inOut(Easing.sin) })
        ),
        -1,
        false
      );
      glow.value = withTiming(0.55, { duration: 500 });
      return;
    }

    if (phase === 'inhale' || phase === 'idle') {
      cancelAnimation(glow);
      scale.value = withTiming(1.14, {
        duration: INHALE_MS,
        easing: Easing.inOut(Easing.sin),
      });
      glow.value = withTiming(0.95, { duration: INHALE_MS });
    } else if (phase === 'hold') {
      cancelAnimation(scale);
      glow.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 700, easing: Easing.inOut(Easing.quad) }),
          withTiming(0.72, { duration: 700, easing: Easing.inOut(Easing.quad) })
        ),
        -1,
        true
      );
    } else if (phase === 'exhale') {
      cancelAnimation(glow);
      scale.value = withTiming(0.9, {
        duration: EXHALE_MS,
        easing: Easing.inOut(Easing.sin),
      });
      glow.value = withTiming(0.62, { duration: EXHALE_MS });
    }
  }, [active, phase, scale, glow]);

  const style = useAnimatedStyle(() => ({
    width: size,
    height: size,
    borderRadius: size / 2,
    transform: [{ scale: scale.value }],
    backgroundColor: colors.breathing,
    opacity: 0.72 + glow.value * 0.22,
    shadowColor: colors.breathing,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: Math.min(1, glow.value),
    shadowRadius: active ? 10 + glow.value * 24 : 14,
    elevation: active ? 18 : 10,
  }));

  return <Animated.View style={style} />;
}
