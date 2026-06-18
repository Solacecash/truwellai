import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

import { PsychGradientButton } from '@/components/onboarding/psych/PsychGradientButton';
import { PsychScreenShell } from '@/components/onboarding/psych/PsychScreenShell';
import { useOnboardingStore } from '@/stores/onboardingStore';

const BURST = ['✨', '🎉', '💚', '🩺', '🌿', '⚡', '🔥', '🛡️', '💫', '🥳', '📈', '🧬'];

export default function PsychS13Celebration() {
  const router = useRouter();
  const completePsychFlow = useOnboardingStore((s) => s.completePsychFlow);

  const floats = useMemo(
    () =>
      BURST.map((e, i) => ({
        e,
        left: `${(i * 7 + 13) % 88}%` as `${number}%`,
        delay: i * 40,
      })),
    []
  );

  const onCta = () => {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    completePsychFlow();
    router.replace('/enter');
  };

  return (
    <PsychScreenShell
      step={13}
      title="You are inside the Guardian arc"
      subtitle="Your plan adapts as you scan, breathe, and check in."
      trustPill="Momentum unlocked"
      showBack={false}
      footer={<PsychGradientButton label="Enter TruWell AI" onPress={onCta} />}
    >
      <View style={styles.burst} accessibilityElementsHidden>
        {floats.map((f) => (
          <Confetti key={f.e + f.left} emoji={f.e} left={f.left} delay={f.delay} />
        ))}
      </View>
      <Text style={styles.copy}>
        You now have a personalised compass, a transparent scan layer, AI translation, and habit nudges, all working together to protect you.
      </Text>
    </PsychScreenShell>
  );
}

function Confetti({ emoji, left, delay }: { emoji: string; left: `${number}%`; delay: number }) {
  const y = useSharedValue(0);
  const o = useSharedValue(0);
  useEffect(() => {
    o.value = withDelay(delay, withTiming(1, { duration: 400, easing: Easing.out(Easing.quad) }));
    y.value = withDelay(
      delay,
      withTiming(-28, { duration: 1600, easing: Easing.out(Easing.cubic) })
    );
  }, [delay, o, y]);

  const style = useAnimatedStyle(() => ({
    opacity: o.value,
    transform: [{ translateY: y.value }],
  }));

  return (
    <Animated.Text style={[styles.emoji, { left }, style]} accessibilityLabel="">
      {emoji}
    </Animated.Text>
  );
}

const styles = StyleSheet.create({
  burst: {
    height: 120,
    marginBottom: 12,
    position: 'relative',
  },
  emoji: {
    position: 'absolute',
    bottom: 0,
    fontSize: 26,
  },
  copy: {
    fontSize: 14,
    lineHeight: 22,
    color: 'rgba(240,248,255,0.75)',
    fontWeight: '500',
  },
});
