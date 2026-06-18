import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AI_PROCESSING_STEPS } from '@/lib/onboardingStepData';
import { useOnboardingStore } from '@/stores/onboardingStore';
import { OB_COLORS, OB_FONTS, ONBOARDING_ROUTES } from '@/lib/_obShared';

const SHIELD = require('@/assets/images/truwell-shield.png');

const PROGRESS = 75;

type OnboardingStoreFields = {
  conditions: string[];
  allergies: string[];
  guardianGoals: string[];
  assessmentAnswers: Record<string, string>;
  familyRole: string;
};

function deriveScore(store: OnboardingStoreFields): number {
  let base = 65;
  const conds = store.conditions.filter((c) => c !== 'none');
  base -= conds.length * 4;
  const allgs = store.allergies.filter((a) => a !== 'none');
  base -= allgs.length * 1.5;
  base += Math.min(store.guardianGoals.length * 2, 12);
  const sleep = store.assessmentAnswers.sleep ?? '';
  if (sleep === '7-8hrs' || sleep === '8-9hrs' || sleep === '9+hrs') base += 8;
  else if (sleep === 'Less than 5hrs' || sleep === '5-6hrs') base -= 6;
  if (store.familyRole === 'parent') base += 3;
  return Math.max(45, Math.min(92, Math.round(base)));
}

function SpinningRing() {
  const rotation = useSharedValue(0);

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, { duration: 2200, easing: Easing.linear }),
      -1,
      false
    );
  }, [rotation]);

  const style = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return (
    <Animated.View style={[styles.ring, style]}>
      <View style={styles.ringInner}>
        <Image
          source={SHIELD}
          style={styles.ringLogo}
          contentFit="contain"
          accessibilityLabel="TruWell AI"
        />
      </View>
    </Animated.View>
  );
}

export default function AiProcessing() {
  const router = useRouter();
  const store = useOnboardingStore();
  const setHealthScore = useOnboardingStore((s) => s.setHealthScore);
  const setConversionFlowStep = useOnboardingStore((s) => s.setConversionFlowStep);
  const setCompletionPercent = useOnboardingStore((s) => s.setCompletionPercent);
  const [visibleCount, setVisibleCount] = useState(0);

  useEffect(() => {
    setCompletionPercent(PROGRESS);
    setConversionFlowStep(13);
  }, [setCompletionPercent, setConversionFlowStep]);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];

    AI_PROCESSING_STEPS.forEach((_, index) => {
      timers.push(
        setTimeout(() => {
          setVisibleCount(index + 1);
          void Haptics.selectionAsync();
        }, (index + 1) * 380)
      );
    });

    timers.push(
      setTimeout(() => {
        const score = deriveScore({
          conditions: store.conditions,
          allergies: store.allergies,
          guardianGoals: store.guardianGoals,
          assessmentAnswers: store.assessmentAnswers,
          familyRole: store.familyRole,
        });
        setHealthScore(score);
        setConversionFlowStep(14);
        router.replace(ONBOARDING_ROUTES.scoreReveal);
      }, AI_PROCESSING_STEPS.length * 380 + 600)
    );

    return () => timers.forEach(clearTimeout);
  }, [router, setConversionFlowStep, setHealthScore, store]);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.ringWrap}>
        <SpinningRing />
      </View>
      <Text style={styles.headline}>Building your care report</Text>
      <Text style={styles.sub}>Running your answers through TruWell intelligence...</Text>
      <View style={styles.list}>
        {AI_PROCESSING_STEPS.map((step, index) =>
          index < visibleCount ? (
            <Animated.Text
              key={step}
              entering={FadeInDown.springify()}
              style={styles.step}
            >
              ✓ {step}
            </Animated.Text>
          ) : null
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#020A14',
    paddingHorizontal: 24,
    paddingTop: 40,
  },
  ringWrap: {
    alignItems: 'center',
    marginBottom: 28,
    height: 100,
    justifyContent: 'center',
  },
  ring: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 3,
    borderColor: OB_COLORS.gold,
    borderTopColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(201,168,76,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  ringLogo: {
    width: 38,
    height: 38,
  },
  headline: {
    fontFamily: OB_FONTS.bold,
    fontWeight: '700',
    fontSize: 24,
    color: OB_COLORS.white,
    textAlign: 'center',
    marginBottom: 8,
  },
  sub: {
    fontFamily: OB_FONTS.body,
    fontSize: 14,
    color: OB_COLORS.white70,
    textAlign: 'center',
    marginBottom: 28,
  },
  list: { gap: 12 },
  step: {
    fontFamily: OB_FONTS.medium,
    fontSize: 14,
    color: OB_COLORS.white,
  },
});
