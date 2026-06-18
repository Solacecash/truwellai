import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { PsychAmbientBg } from '@/components/onboarding/psych/PsychAmbientBg';
import { PsychGradientButton } from '@/components/onboarding/psych/PsychGradientButton';
import { TRUWELL_LOGO } from '@/lib/brandAssets';
import { getPsychHrefForStep } from '@/lib/psychFlow';
import { useOnboardingStore } from '@/stores/onboardingStore';
import { psychBrand } from '@/theme/colors';

const floatEmojis = ['�-', '💓', '🧠', '🛡️', '🌿'];

export default function PsychS1Intro() {
  const router = useRouter();
  const goToStep = useOnboardingStore((s) => s.goToStep);

  useEffect(() => {
    router.replace('/(onboarding)/welcome' as never);
  }, [router]);

  const logoScale = useSharedValue(1);
  useEffect(() => {
    logoScale.value = withRepeat(
      withSequence(
        withTiming(1.06, { duration: 2200, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 2200, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );
  }, [logoScale]);

  const logoStyle = useAnimatedStyle(() => ({
    transform: [{ scale: logoScale.value }],
  }));

  const onCta = () => {
    goToStep(2);
    router.replace(getPsychHrefForStep(2));
  };

  return (
    <View style={styles.root}>
      <PsychAmbientBg />
      <View style={styles.topPad} />
      <View style={styles.emojiRow}>
        {floatEmojis.map((e) => (
          <Text key={e} style={styles.floatEmoji} accessibilityLabel="">
            {e}
          </Text>
        ))}
      </View>

      <Animated.View style={[styles.logoWrap, logoStyle]}>
        <Image
          source={TRUWELL_LOGO}
          style={styles.logo}
          contentFit="contain"
          accessibilityRole="image"
          accessibilityLabel="TruWell AI"
        />
      </Animated.View>

      <Text style={styles.headline}>TruWell AI</Text>
      <Text style={styles.tag}>Your health. Clarified. Protected.</Text>

      <View style={styles.footer}>
        <PsychGradientButton label="Begin" onPress={onCta} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: psychBrand.background,
    paddingHorizontal: 24,
    justifyContent: 'flex-end',
    paddingBottom: 32,
  },
  topPad: { height: 56 },
  emojiRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 14,
    marginBottom: 28,
  },
  floatEmoji: {
    fontSize: 34,
  },
  logoWrap: {
    alignSelf: 'center',
    marginBottom: 20,
  },
  logo: {
    width: 120,
    height: 120,
  },
  headline: {
    fontSize: 30,
    fontWeight: '900',
    color: '#F4F8FC',
    textAlign: 'center',
    letterSpacing: -0.8,
  },
  tag: {
    marginTop: 10,
    fontSize: 15,
    fontWeight: '600',
    color: 'rgba(240,248,255,0.62)',
    textAlign: 'center',
  },
  footer: { marginTop: 32 },
});
