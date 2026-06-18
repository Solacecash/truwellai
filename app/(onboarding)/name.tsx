import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated as RNAnimated,
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Animated, {
  Easing,
  FadeInDown,
  FadeOut,
  interpolate,
  makeMutable,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import Svg, { Circle as SvgCircle, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useOnboardingBack } from '@/lib/useOnboardingNavigation';
import { useOnboardingStore } from '@/stores/onboardingStore';

import { OB_COLORS, OB_FONTS, ONBOARDING_ROUTES } from '@/lib/_obShared';

const AnimatedSvgCircle = Animated.createAnimatedComponent(SvgCircle);
const { width: SW } = Dimensions.get('window');

const PROGRESS = 6;

function ProgressBar({ percent }: { percent: number }) {
  const width = useSharedValue(0);

  useEffect(() => {
    width.value = withSpring(percent, { damping: 14, stiffness: 100 });
  }, [percent, width]);

  const fillStyle = useAnimatedStyle(() => ({ width: `${width.value}%` }));

  return (
    <View style={styles.progressTrack}>
      <Animated.View style={[styles.progressFill, fillStyle]} />
    </View>
  );
}

function AmbientGlow({
  style,
  color,
  delayMs,
}: {
  style: object;
  color: string;
  delayMs: number;
}) {
  const opacity = useSharedValue(0.08);

  useEffect(() => {
    const start = setTimeout(() => {
      opacity.value = withRepeat(
        withSequence(
          withTiming(0.18, { duration: 1200, easing: Easing.inOut(Easing.quad) }),
          withTiming(0.08, { duration: 1200, easing: Easing.inOut(Easing.quad) })
        ),
        -1,
        false
      );
    }, delayMs);
    return () => clearTimeout(start);
  }, [delayMs, opacity]);

  const glowStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return <Animated.View style={[style, { backgroundColor: color }, glowStyle]} />;
}

function responseForName(name: string): string {
  const len = name.trim().length;
  if (len <= 3) return 'Short and punchy. Love it \uD83D\uDD25';
  if (len <= 6) return "That's got a great ring to it \u2728";
  if (len <= 9) return "Nice - that's a name that gets things done \uD83D\uDCAA";
  return "Big name energy. We're here for it \uD83D\uDC51";
}

type CelebrationParticleProps = {
  x: number;
  y: SharedValue<number>;
  op: SharedValue<number>;
  size: number;
  color: string;
  opacity?: number;
};

function CelebrationParticle({ x, y, op, size, color }: CelebrationParticleProps) {
  const pStyle = useAnimatedStyle(() => ({
    opacity: op.value,
    transform: [{ translateY: y.value }],
  }));

  return (
    <Animated.View
      style={[
        celStyles.particle,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
          left: x,
        },
        pStyle,
      ]}
    />
  );
}

function CelebrationOverlay({ name }: { name: string }) {
  const bgOpacity = useSharedValue(0);
  const barWidth = useSharedValue(0);

  // Blob drift animations
  const blob1X = useSharedValue(0);
  const blob1Y = useSharedValue(0);
  const blob2X = useSharedValue(0);
  const blob2Y = useSharedValue(0);
  const blob3X = useSharedValue(0);
  const blob3Y = useSharedValue(0);

  const greetAnim = useRef(new RNAnimated.Value(0)).current;
  const nameAnim  = useRef(new RNAnimated.Value(0)).current;
  const divAnim   = useRef(new RNAnimated.Value(0)).current;
  const sub1Anim  = useRef(new RNAnimated.Value(0)).current;
  const sub2Anim  = useRef(new RNAnimated.Value(0)).current;
  const b1Anim    = useRef(new RNAnimated.Value(0)).current;
  const b2Anim    = useRef(new RNAnimated.Value(0)).current;
  const b3Anim    = useRef(new RNAnimated.Value(0)).current;

  const PARTICLES = useMemo(
    () =>
      Array.from({ length: 28 }, (_, i) => ({
        x: Math.random() * SW,
        y: makeMutable(300 + Math.random() * 400),
        op: makeMutable(0),
        size: 4 + Math.random() * 6,
        isCircle: Math.random() > 0.5,
        speed: 0.6 + Math.random() * 0.8,
        color: [
          '#60A5FA', '#A78BFA', '#F472B6',
          '#34D399', '#FBBF24', '#F87171',
          '#818CF8', OB_COLORS.gold,
        ][i % 8],
        delay: Math.round(i * 140),
      })),
    []
  );

  useEffect(() => {
    bgOpacity.value = withTiming(1, { duration: 350 });

    // Blob drift
    blob1X.value = withRepeat(withSequence(withTiming(20, { duration: 8000, easing: Easing.inOut(Easing.quad) }), withTiming(0, { duration: 8000, easing: Easing.inOut(Easing.quad) })), -1, false);
    blob1Y.value = withRepeat(withSequence(withTiming(30, { duration: 8000, easing: Easing.inOut(Easing.quad) }), withTiming(0, { duration: 8000, easing: Easing.inOut(Easing.quad) })), -1, false);
    blob2X.value = withRepeat(withSequence(withTiming(-15, { duration: 10000, easing: Easing.inOut(Easing.quad) }), withTiming(0, { duration: 10000, easing: Easing.inOut(Easing.quad) })), -1, false);
    blob2Y.value = withRepeat(withSequence(withTiming(-25, { duration: 10000, easing: Easing.inOut(Easing.quad) }), withTiming(0, { duration: 10000, easing: Easing.inOut(Easing.quad) })), -1, false);
    blob3X.value = withRepeat(withSequence(withTiming(12, { duration: 12000, easing: Easing.inOut(Easing.quad) }), withTiming(0, { duration: 12000, easing: Easing.inOut(Easing.quad) })), -1, false);
    blob3Y.value = withRepeat(withSequence(withTiming(-18, { duration: 12000, easing: Easing.inOut(Easing.quad) }), withTiming(0, { duration: 12000, easing: Easing.inOut(Easing.quad) })), -1, false);

    barWidth.value = withDelay(
      1800,
      withTiming(1, { duration: 4200, easing: Easing.bezier(0.4, 0, 0.2, 1) })
    );

    // Confetti particles
    PARTICLES.forEach((p) => {
      const floatDuration = Math.round(3000 + (1 - p.speed) * 5000);
      p.op.value = withDelay(
        p.delay,
        withRepeat(
          withSequence(
            withTiming(0.9, { duration: floatDuration * 0.1, easing: Easing.out(Easing.quad) }),
            withTiming(0.9, { duration: floatDuration * 0.75, easing: Easing.linear }),
            withTiming(0, { duration: floatDuration * 0.15, easing: Easing.in(Easing.quad) })
          ),
          -1, false
        )
      );
      p.y.value = withDelay(
        p.delay,
        withRepeat(
          withSequence(
            withTiming(-80, { duration: floatDuration, easing: Easing.linear }),
            withTiming(700, { duration: 0 })
          ),
          -1, false
        )
      );
    });

    const timers: ReturnType<typeof setTimeout>[] = [];

    timers.push(setTimeout(() => {
      RNAnimated.timing(greetAnim, { toValue: 1, duration: 700, useNativeDriver: true }).start();
    }, 350));

    timers.push(setTimeout(() => {
      RNAnimated.spring(nameAnim, { toValue: 1, friction: 7, tension: 90, useNativeDriver: true }).start();
    }, 700));

    timers.push(setTimeout(() => {
      RNAnimated.timing(divAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
    }, 1100));

    timers.push(setTimeout(() => {
      RNAnimated.timing(sub1Anim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
    }, 1350));

    timers.push(setTimeout(() => {
      RNAnimated.timing(sub2Anim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
    }, 1650));

    timers.push(setTimeout(() => {
      RNAnimated.timing(b1Anim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
    }, 1900));
    timers.push(setTimeout(() => {
      RNAnimated.timing(b2Anim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
    }, 2050));
    timers.push(setTimeout(() => {
      RNAnimated.timing(b3Anim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
    }, 2200));

    return () => timers.forEach(clearTimeout);
  }, [PARTICLES, b1Anim, b2Anim, b3Anim, barWidth, bgOpacity, blob1X, blob1Y, blob2X, blob2Y, blob3X, blob3Y, divAnim, greetAnim, nameAnim, sub1Anim, sub2Anim]);

  const bgStyle = useAnimatedStyle(() => ({ opacity: bgOpacity.value }));

  const blob1Style = useAnimatedStyle(() => ({
    transform: [{ translateX: blob1X.value }, { translateY: blob1Y.value }, { scale: 1 + blob1X.value * 0.001 }],
  }));
  const blob2Style = useAnimatedStyle(() => ({
    transform: [{ translateX: blob2X.value }, { translateY: blob2Y.value }],
  }));
  const blob3Style = useAnimatedStyle(() => ({
    transform: [{ translateX: blob3X.value }, { translateY: blob3Y.value }],
  }));

  const barStyle = useAnimatedStyle(() => ({
    width: `${barWidth.value * 100}%` as `${number}%`,
  }));

  const fadeUp = (anim: RNAnimated.Value) => ({
    opacity: anim,
    transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [18, 0] }) }],
  });

  const scaleFade = (anim: RNAnimated.Value) => ({
    opacity: anim,
    transform: [{ scale: anim.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] }) }],
  });

  return (
    <View style={celStyles.root}>
      {/* Background */}
      <Animated.View style={[StyleSheet.absoluteFillObject, bgStyle]}>
        <LinearGradient
          colors={['#0B1628', '#0a1628', '#081220']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />
        {/* Animated blobs */}
        <Animated.View style={[celStyles.blob1, blob1Style]} />
        <Animated.View style={[celStyles.blob2, blob2Style]} />
        <Animated.View style={[celStyles.blob3, blob3Style]} />

        {/* Orbit rings */}
        <View style={celStyles.orbitRing1} />
        <View style={celStyles.orbitRing2} />
      </Animated.View>

      {/* Confetti particles */}
      {PARTICLES.map((p, i) => (
        <CelebrationParticle
          key={i}
          x={p.x}
          y={p.y}
          op={p.op}
          size={p.size}
          color={p.color}
        />
      ))}

      {/* Main content */}
      <View style={celStyles.content}>

        {/* Greeting */}
        <RNAnimated.Text style={[celStyles.greeting, fadeUp(greetAnim)]}>
          Well, hello there
        </RNAnimated.Text>

        {/* Name + sparkle */}
        <RNAnimated.View style={[celStyles.nameBadge, scaleFade(nameAnim)]}>
          <Text style={celStyles.nameText}>{name}</Text>
          <Text style={celStyles.sparkle}>{'\u2726'}</Text>
        </RNAnimated.View>

        {/* Divider */}
        <RNAnimated.View style={[celStyles.divider, { opacity: divAnim, transform: [{ scaleX: divAnim }] }]} />

        {/* Headline */}
        <RNAnimated.Text style={[celStyles.headline, fadeUp(sub1Anim)]}>
          {'Your health intelligence report\nis about to get '}
          <RNAnimated.Text style={celStyles.headlineAccent}>personal</RNAnimated.Text>
        </RNAnimated.Text>

        {/* Subtext */}
        <RNAnimated.Text style={[celStyles.subtext, fadeUp(sub2Anim)]}>
          {`Let's build something great together, ${name}.\nYour insights are ready to unfold.`}
        </RNAnimated.Text>

        {/* Badges */}
        <View style={celStyles.badgeRow}>
          {[
            { label: 'AI-powered',   anim: b1Anim, color: '#60A5FA', bg: 'rgba(79,142,247,0.15)',   border: 'rgba(79,142,247,0.3)' },
            { label: 'Personalized', anim: b2Anim, color: '#C4B5FD', bg: 'rgba(167,139,250,0.15)',  border: 'rgba(167,139,250,0.3)' },
            { label: 'Secure',       anim: b3Anim, color: '#6EE7B7', bg: 'rgba(52,211,153,0.12)',   border: 'rgba(52,211,153,0.25)' },
          ].map((b) => (
            <RNAnimated.View
              key={b.label}
              style={[
                celStyles.badge,
                { backgroundColor: b.bg, borderColor: b.border },
                { opacity: b.anim, transform: [{ translateY: b.anim.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) }] },
              ]}
            >
              <Text style={[celStyles.badgeText, { color: b.color }]}>{b.label}</Text>
            </RNAnimated.View>
          ))}
        </View>
      </View>

      {/* Progress bar at bottom */}
      <View style={celStyles.barTrack}>
        <Animated.View style={[celStyles.barFill, barStyle]}>
          <LinearGradient
            colors={['rgba(232,196,106,0.6)', OB_COLORS.gold]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFillObject}
          />
        </Animated.View>
      </View>
    </View>
  );
}

export default function OnboardingName() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const storeName = useOnboardingStore((s) => s.userName);
  const setUserName = useOnboardingStore((s) => s.setUserName);
  const setRole = useOnboardingStore((s) => s.setRole);
  const setConversionFlowStep = useOnboardingStore((s) => s.setConversionFlowStep);
  const setCompletionPercent = useOnboardingStore((s) => s.setCompletionPercent);
  const handleBack = useOnboardingBack(2);

  const [name, setName] = useState(storeName);
  const [focused, setFocused] = useState(false);
  const [celebrating, setCelebrating] = useState(false);
  const celebrateFiredRef = useRef(false);

  const ctaReady = name.trim().length >= 2;
  const ctaOpacity = useSharedValue(ctaReady ? 1 : 0.35);

  useEffect(() => {
    setCompletionPercent(PROGRESS);
    setConversionFlowStep(2);
  }, [setCompletionPercent, setConversionFlowStep]);

  useEffect(() => {
    ctaOpacity.value = withSpring(ctaReady ? 1 : 0.35);
  }, [ctaReady, ctaOpacity]);

  const ctaAnimStyle = useAnimatedStyle(() => ({ opacity: ctaOpacity.value }));

  const onContinue = () => {
    const trimmed = name.trim();
    if (trimmed.length < 2 || celebrating || celebrateFiredRef.current) return;

    celebrateFiredRef.current = true;
    setCelebrating(true);

    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setTimeout(() => {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }, 300);
    setTimeout(() => {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }, 600);

    setTimeout(() => {
      setUserName(trimmed);
      setRole('guardian');
      setConversionFlowStep(3);
      router.push(ONBOARDING_ROUTES.goals);
    }, 6500);
  };

  const displayName = name.trim();

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <AmbientGlow style={styles.glowGold} color="rgba(201,168,76,0.20)" delayMs={0} />
      <AmbientGlow style={styles.glowTeal} color="rgba(0,229,200,0.18)" delayMs={400} />

      <View style={styles.headerRow}>
        <Pressable
          onPress={handleBack}
          style={styles.backBtn}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          disabled={celebrating}
        >
          <Text style={styles.backIcon}>{'\u2039'}</Text>
        </Pressable>
        <View style={styles.progressWrap}>
          <ProgressBar percent={PROGRESS} />
        </View>
      </View>

      {!celebrating ? (
        <Animated.View exiting={FadeOut.duration(200)} style={styles.formWrap}>
          <ScrollView
            contentContainerStyle={styles.scroll}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <Animated.View entering={FadeInDown.delay(80).springify()}>
              <Text style={styles.headlineSmall}>{"Hey, I'm TruWell AI \uD83D\uDC4B"}</Text>
              <Text style={styles.headlineLarge}>What do I call you?</Text>
            </Animated.View>

            <Animated.Text entering={FadeInDown.delay(140).springify()} style={styles.body}>
              Just your vibe name — no pressure. Mine's TruWell, but my friends call me Truth.
            </Animated.Text>

            <Animated.View entering={FadeInDown.delay(200).springify()}>
              <TextInput
                value={name}
                onChangeText={(value) => {
                  setName(value);
                  setUserName(value.trim());
                }}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                onSubmitEditing={onContinue}
                placeholder="Type your name..."
                placeholderTextColor={OB_COLORS.white40}
                autoFocus
                returnKeyType="done"
                maxLength={30}
                style={[styles.input, (focused || name.length > 0) && styles.inputActive]}
              />
              {name.length > 0 ? <Text style={styles.charCount}>{name.length}/30</Text> : null}
              {displayName.length >= 2 ? (
                <Animated.Text entering={FadeInDown.springify()} style={styles.responseText}>
                  {responseForName(displayName)}
                </Animated.Text>
              ) : null}
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(280).springify()} style={styles.badgeRow}>
              {(['\uD83D\uDD12 Private', '\u2728 Personalised', '\uD83D\uDCAC Remembered'] as const).map((badge) => (
                <View key={badge} style={styles.badge}>
                  <Text style={styles.badgeText}>{badge}</Text>
                </View>
              ))}
            </Animated.View>
          </ScrollView>

          <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
            <Animated.View style={ctaAnimStyle}>
              <Pressable
                onPress={onContinue}
                accessibilityRole="button"
                pointerEvents={ctaReady ? 'auto' : 'none'}
              >
                <LinearGradient
                  colors={[OB_COLORS.gold, OB_COLORS.goldLight]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.cta}
                >
                  <Text style={styles.ctaText}>
                    {displayName.length >= 2
                      ? `Nice to meet you, ${displayName}! Let's go \u2192`
                      : 'Tell me your name first \uD83D\uDC47'}
                  </Text>
                </LinearGradient>
              </Pressable>
            </Animated.View>
          </View>
        </Animated.View>
      ) : null}

      {celebrating ? <CelebrationOverlay name={displayName} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: OB_COLORS.navy },
  glowGold: {
    position: 'absolute',
    top: -60,
    right: -50,
    width: 200,
    height: 200,
    borderRadius: 999,
  },
  glowTeal: {
    position: 'absolute',
    bottom: 80,
    left: -60,
    width: 180,
    height: 180,
    borderRadius: 999,
  },
  headerRow: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  backIcon: { color: OB_COLORS.white70, fontSize: 28, lineHeight: 32 },
  progressWrap: { flex: 1 },
  progressTrack: { height: 3, backgroundColor: OB_COLORS.white12, borderRadius: 100, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 100, backgroundColor: OB_COLORS.teal },
  formWrap: { flex: 1 },
  scroll: { paddingHorizontal: 24, paddingBottom: 120, paddingTop: 8 },
  headlineSmall: {
    fontFamily: OB_FONTS.semiBold,
    fontSize: 14,
    color: OB_COLORS.teal,
    marginBottom: 6,
  },
  headlineLarge: {
    fontFamily: OB_FONTS.bold,
    fontWeight: '700',
    fontSize: 28,
    lineHeight: 36,
    color: OB_COLORS.white,
    marginBottom: 10,
  },
  body: {
    fontFamily: OB_FONTS.body,
    fontSize: 15,
    lineHeight: 22,
    color: OB_COLORS.white70,
    marginBottom: 24,
  },
  input: {
    borderWidth: 1.5,
    borderColor: OB_COLORS.white12,
    borderRadius: 16,
    height: 56,
    paddingHorizontal: 18,
    backgroundColor: OB_COLORS.white07,
    fontFamily: OB_FONTS.medium,
    fontSize: 17,
    color: OB_COLORS.white,
  },
  inputActive: {
    borderColor: OB_COLORS.teal,
    backgroundColor: 'rgba(0,229,200,0.07)',
  },
  charCount: {
    textAlign: 'right',
    fontSize: 11,
    color: OB_COLORS.white40,
    marginTop: 6,
  },
  responseText: {
    color: OB_COLORS.gold,
    fontFamily: OB_FONTS.medium,
    fontSize: 14,
    marginTop: 8,
  },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 24 },
  badge: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: OB_COLORS.white12,
    backgroundColor: OB_COLORS.white07,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  badgeText: { fontSize: 11, color: OB_COLORS.white70, fontFamily: OB_FONTS.body },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 24,
    paddingTop: 12,
    backgroundColor: OB_COLORS.navy,
  },
  cta: { height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  ctaText: { fontFamily: OB_FONTS.bold, fontWeight: '700', fontSize: 16, color: OB_COLORS.navy },
});

const celStyles = StyleSheet.create({
  root: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    zIndex: 99,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  blob1: {
    position: 'absolute',
    width: 280, height: 280,
    borderRadius: 140,
    backgroundColor: 'rgba(79,142,247,0.18)',
    top: -80, left: -80,
    // blur approximated via opacity — React Native doesn't support CSS filter
  },
  blob2: {
    position: 'absolute',
    width: 220, height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(167,139,250,0.18)',
    bottom: -60, right: -60,
  },
  blob3: {
    position: 'absolute',
    width: 160, height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(52,211,153,0.15)',
    top: '40%', right: -40,
  },
  orbitRing1: {
    position: 'absolute',
    width: 300, height: 300,
    borderRadius: 150,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.07)',
    borderStyle: 'dashed',
    top: '50%', left: '50%',
    marginTop: -150, marginLeft: -150,
  },
  orbitRing2: {
    position: 'absolute',
    width: 420, height: 420,
    borderRadius: 210,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.04)',
    borderStyle: 'dashed',
    top: '50%', left: '50%',
    marginTop: -210, marginLeft: -210,
  },
  particle: {
    position: 'absolute',
  },
  content: {
    position: 'relative',
    zIndex: 10,
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  greeting: {
    fontSize: 13,
    fontWeight: '400',
    color: 'rgba(255,255,255,0.5)',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 10,
    textAlign: 'center',
  },
  nameBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  nameText: {
    fontSize: 48,
    fontWeight: '700',
    letterSpacing: -1,
    color: OB_COLORS.gold,
    textShadowColor: 'rgba(232,196,106,0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  sparkle: {
    fontSize: 30,
    color: OB_COLORS.goldLight,
  },
  divider: {
    width: 48,
    height: 2,
    borderRadius: 2,
    backgroundColor: OB_COLORS.gold,
    marginBottom: 18,
    shadowColor: OB_COLORS.gold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
  },
  headline: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
    lineHeight: 30,
    textAlign: 'center',
    maxWidth: 280,
    marginBottom: 14,
  },
  headlineAccent: {
    color: OB_COLORS.teal,
  },
  subtext: {
    fontSize: 13,
    fontWeight: '400',
    color: 'rgba(255,255,255,0.42)',
    lineHeight: 20,
    textAlign: 'center',
    maxWidth: 240,
    marginBottom: 24,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  badge: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: 0.3,
  },
  barTrack: {
    position: 'absolute',
    bottom: 28,
    left: '50%',
    marginLeft: -60,
    width: 120,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 2,
  },
});
