import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { trackOnboardingEvent } from '@/lib/onboardingAnalytics';
import { AiConsentModal, hasAiConsent } from '@/components/onboarding/AiConsentModal';
import { useOnboardingStore } from '@/stores/onboardingStore';
import { OB_COLORS, OB_FONTS, ONBOARDING_ROUTES } from '@/lib/_obShared';

const SHIELD = require('@/assets/images/truwell-shield.png');

function ShimmerGlow({ style }: { style: object }) {
  const opacity = useSharedValue(0.10);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.20, { duration: 1200, easing: Easing.inOut(Easing.quad) }),
        withTiming(0.10, { duration: 1200, easing: Easing.inOut(Easing.quad) })
      ),
      -1,
      false
    );
  }, [opacity]);

  const animStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));
  return <Animated.View style={[style, animStyle]} />;
}

function OrbHero() {
  const floatY = useSharedValue(0);
  const rot1 = useSharedValue(0);
  const rot2 = useSharedValue(0);
  const rot3 = useSharedValue(0);
  const glowScale = useSharedValue(1);
  const glowOpacity = useSharedValue(0.5);

  useEffect(() => {
    floatY.value = withRepeat(
      withSequence(
        withTiming(-7, { duration: 2200, easing: Easing.inOut(Easing.quad) }),
        withTiming(0, { duration: 2200, easing: Easing.inOut(Easing.quad) })
      ),
      -1,
      false
    );

    rot1.value = withRepeat(
      withTiming(360, { duration: 8000, easing: Easing.linear }),
      -1,
      false
    );

    rot2.value = withRepeat(
      withTiming(-360, { duration: 5500, easing: Easing.linear }),
      -1,
      false
    );

    rot3.value = withRepeat(
      withTiming(360, { duration: 3500, easing: Easing.linear }),
      -1,
      false
    );

    glowScale.value = withRepeat(
      withSequence(
        withTiming(1.12, { duration: 1400 }),
        withTiming(1, { duration: 1400 })
      ),
      -1,
      false
    );
    glowOpacity.value = withRepeat(
      withSequence(
        withTiming(0.9, { duration: 1400 }),
        withTiming(0.5, { duration: 1400 })
      ),
      -1,
      false
    );
  }, [floatY, rot1, rot2, rot3, glowScale, glowOpacity]);

  const floatStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: floatY.value }],
  }));

  const ring1Style = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rot1.value}deg` }],
  }));

  const ring2Style = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rot2.value}deg` }],
  }));

  const ring3Style = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rot3.value}deg` }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    transform: [{ scale: glowScale.value }],
    opacity: glowOpacity.value,
  }));

  return (
    <Animated.View
      entering={FadeInDown.delay(40).springify()}
      style={orbStyles.container}
    >
      <Animated.View style={[orbStyles.glowBlob, glowStyle]} />

      <Animated.View style={[orbStyles.ring1, ring1Style]} />

      <Animated.View style={[orbStyles.ring2, ring2Style]}>
        {Array.from({ length: 12 }).map((_, i) => (
          <View
            key={i}
            style={[
              orbStyles.dash,
              {
                transform: [
                  { rotate: `${i * 30}deg` },
                  { translateX: 72 },
                ],
              },
            ]}
          />
        ))}
      </Animated.View>

      <Animated.View style={[orbStyles.ring3, ring3Style]}>
        {Array.from({ length: 10 }).map((_, i) => (
          <View
            key={i}
            style={[
              orbStyles.dashInner,
              {
                transform: [
                  { rotate: `${i * 36}deg` },
                  { translateX: 52 },
                ],
              },
            ]}
          />
        ))}
      </Animated.View>

      <Animated.View style={[orbStyles.logoWrap, floatStyle]}>
        <Image
          source={SHIELD}
          style={orbStyles.logo}
          contentFit="contain"
          accessibilityLabel="TruWell AI"
        />
      </Animated.View>
    </Animated.View>
  );
}

const orbStyles = StyleSheet.create({
  container: {
    width: 220,
    height: 220,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    marginTop: 8,
  },
  glowBlob: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(0,229,200,0.12)',
  },
  ring1: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 1.5,
    borderColor: 'transparent',
    borderTopColor: '#00E5C8',
    borderRightColor: 'rgba(0,229,200,0.35)',
    borderBottomColor: 'transparent',
    borderLeftColor: 'rgba(0,229,200,0.15)',
  },
  ring2: {
    position: 'absolute',
    width: 156,
    height: 156,
    borderRadius: 78,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dash: {
    position: 'absolute',
    width: 12,
    height: 2,
    borderRadius: 1,
    backgroundColor: 'rgba(0,229,200,0.65)',
  },
  ring3: {
    position: 'absolute',
    width: 116,
    height: 116,
    borderRadius: 58,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dashInner: {
    position: 'absolute',
    width: 10,
    height: 1.5,
    borderRadius: 1,
    backgroundColor: 'rgba(100,180,255,0.55)',
  },
  logoWrap: {
    width: 80,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  logo: {
    width: 72,
    height: 72,
  },
});

export default function OnboardingWelcome() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const setConversionFlowStep = useOnboardingStore((s) => s.setConversionFlowStep);
  const setCompletionPercent = useOnboardingStore((s) => s.setCompletionPercent);

  useEffect(() => {
    setConversionFlowStep(1);
    setCompletionPercent(0);
    void trackOnboardingEvent('onboarding_started');
  }, [setCompletionPercent, setConversionFlowStep]);

  const [profileCount, setProfileCount] = useState(1240);
  const [showAiConsent, setShowAiConsent] = useState(false);

  useEffect(() => {
    hasAiConsent().then((given) => {
      if (!given) setShowAiConsent(true);
    });
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setProfileCount((prev) => prev + Math.floor(Math.random() * 3) + 1);
    }, 2800);
    return () => clearInterval(interval);
  }, []);

  const onPrimary = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setConversionFlowStep(2);
    router.push(ONBOARDING_ROUTES.name);
  };

  const screenOpacity = useSharedValue(0);
  useEffect(() => {
    screenOpacity.value = withTiming(1, { duration: 400 });
  }, [screenOpacity]);
  const screenStyle = useAnimatedStyle(() => ({
    opacity: screenOpacity.value,
  }));

  return (
    <Animated.View
      style={[
        styles.root,
        { paddingTop: insets.top, paddingBottom: insets.bottom + 16 },
        screenStyle,
      ]}
    >
      <ShimmerGlow style={styles.glowGold} />
      <View style={styles.glowTeal} />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <OrbHero />
        <Animated.View entering={FadeInDown.delay(80).springify()} style={styles.fomoRow}>
          <View style={styles.pulseDot} />
          <Text style={styles.fomoText}>
            {profileCount.toLocaleString()} health profiles analyzed today
          </Text>
        </Animated.View>

        <Animated.Text entering={FadeInDown.delay(160).springify()} style={styles.greeting}>
          Hey, I'm <Text style={styles.gold}>TruWell.</Text>
        </Animated.Text>

        <Animated.Text entering={FadeInDown.delay(220).springify()} style={styles.tagline}>
          Your personal health intelligence guardian
        </Animated.Text>

        <Animated.Text entering={FadeInDown.delay(300).springify()} style={styles.body}>
          I scan what you use daily and instantly uncover hidden risks, harmful ingredients, allergens, recalls, and bans, keeping you and your family safe..
        </Animated.Text>
        <Animated.Text entering={FadeInDown.delay(360).springify()} style={styles.body}>
          Two minutes from now, you will have a personalised care report built from your real health profile.
        </Animated.Text>

        <Animated.Text entering={FadeInDown.delay(420).springify()} style={styles.timeNote}>
          2 minutes · No signup required
        </Animated.Text>

        <Animated.View entering={FadeInDown.delay(480).springify()}>
          <Pressable onPress={onPrimary} accessibilityRole="button">
            <LinearGradient
              colors={[OB_COLORS.gold, OB_COLORS.goldLight]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.cta}
            >
              <Text style={styles.ctaText}>I'm ready — let's go →</Text>
            </LinearGradient>
          </Pressable>
          <Pressable onPress={() => router.replace('/(auth)/sign-in')} style={styles.secondaryBtn}>
            <Text style={styles.secondaryText}>Already a member? Sign in</Text>
          </Pressable>
        </Animated.View>
      </ScrollView>
      <AiConsentModal
        visible={showAiConsent}
        onAgree={() => setShowAiConsent(false)}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#020A14' },
  scroll: { paddingHorizontal: 24, paddingBottom: 24, paddingTop: 8 },
  glowGold: {
    position: 'absolute',
    top: -80,
    left: -60,
    width: 220,
    height: 220,
    borderRadius: 999,
    backgroundColor: 'rgba(201,168,76,0.15)',
  },
  glowTeal: {
    position: 'absolute',
    bottom: 40,
    right: -40,
    width: 180,
    height: 180,
    borderRadius: 999,
    backgroundColor: 'rgba(0,229,200,0.12)',
  },
  fomoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    gap: 8,
    marginBottom: 32,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(201,168,76,0.12)',
  },
  pulseDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: OB_COLORS.green },
  fomoText: { fontFamily: OB_FONTS.medium, fontSize: 12, color: OB_COLORS.goldLight },
  greeting: {
    fontFamily: OB_FONTS.bold,
    fontWeight: '700',
    fontSize: 32,
    lineHeight: 40,
    color: OB_COLORS.white,
    marginBottom: 8,
  },
  gold: { color: OB_COLORS.gold },
  tagline: {
    fontFamily: OB_FONTS.semiBold,
    fontSize: 16,
    color: OB_COLORS.teal,
    marginBottom: 20,
  },
  body: {
    fontFamily: OB_FONTS.body,
    fontSize: 14,
    lineHeight: 22,
    color: OB_COLORS.white70,
    marginBottom: 12,
  },
  timeNote: {
    textAlign: 'center',
    fontFamily: OB_FONTS.body,
    fontSize: 13,
    color: OB_COLORS.white40,
    marginTop: 12,
    marginBottom: 24,
  },
  cta: {
    height: 54,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  ctaText: { fontFamily: OB_FONTS.bold, fontWeight: '700', fontSize: 16, color: OB_COLORS.navy },
  secondaryBtn: { alignItems: 'center', paddingVertical: 12 },
  secondaryText: { fontFamily: OB_FONTS.medium, fontSize: 14, color: OB_COLORS.white70 },
});
