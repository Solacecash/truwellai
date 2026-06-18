import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import React, { memo, useEffect } from 'react';
import { Dimensions, Image, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, {
  Defs,
  Filter,
  FeTurbulence,
  Line,
  Path,
  Polyline,
  Rect,
} from 'react-native-svg';

import { OB_FONTS } from './tokens';

const SHIELD_IMAGE = require('@/assets/images/truwell-shield.png');

const { width: SW, height: SH } = Dimensions.get('window');
const NAVY = '#020A14';
const TEAL = '#00E5C8';
const GOLD = '#C9A84C';
const GOLD_DARK = '#A0832A';

const TOTAL_DURATION = 3600;
const EXIT_DURATION = 700;

type Props = {
  onComplete: () => void;
};

function PulseRing({
  size,
  borderColor,
  delayMs,
}: {
  size: number;
  borderColor: string;
  delayMs: number;
}) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0.4);

  useEffect(() => {
    scale.value = withDelay(
      delayMs,
      withRepeat(
        withSequence(
          withTiming(1.03, { duration: 1750, easing: Easing.inOut(Easing.quad) }),
          withTiming(1, { duration: 1750, easing: Easing.inOut(Easing.quad) })
        ),
        -1,
        false
      )
    );
    opacity.value = withDelay(
      delayMs,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 1750 }),
          withTiming(0.4, { duration: 1750 })
        ),
        -1,
        false
      )
    );
  }, [delayMs, opacity, scale]);

  const s = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
    width: size,
    height: size,
    borderRadius: size / 2,
    borderWidth: 1,
    borderColor,
    position: 'absolute',
  }));

  return <Animated.View style={s} />;
}

function SpinRing({
  size,
  reverse,
  duration,
  topColor,
  rightColor,
}: {
  size: number;
  reverse?: boolean;
  duration: number;
  topColor: string;
  rightColor: string;
}) {
  const rot = useSharedValue(0);
  useEffect(() => {
    rot.value = withRepeat(
      withTiming(reverse ? -360 : 360, {
        duration,
        easing: Easing.linear,
      }),
      -1,
      false
    );
  }, [duration, reverse, rot]);

  const s = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rot.value}deg` }],
  }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: 1.5,
          borderColor: 'transparent',
          borderTopColor: topColor,
          borderRightColor: rightColor,
        },
        s,
      ]}
    />
  );
}

function ShieldGlow() {
  const sc = useSharedValue(1);
  const op = useSharedValue(0.6);

  useEffect(() => {
    sc.value = withRepeat(
      withSequence(
        withTiming(1.08, { duration: 1250 }),
        withTiming(1, { duration: 1250 })
      ),
      -1,
      false
    );
    op.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1250 }),
        withTiming(0.6, { duration: 1250 })
      ),
      -1,
      false
    );
  }, [op, sc]);

  const s = useAnimatedStyle(() => ({
    transform: [{ scale: sc.value }],
    opacity: op.value,
  }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          width: 146,
          height: 146,
          borderRadius: 73,
          backgroundColor: `${TEAL}26`,
        },
        s,
      ]}
    />
  );
}

function ShieldSVG() {
  return (
    <Image
      source={SHIELD_IMAGE}
      style={{ width: 100, height: 100 }}
      resizeMode="contain"
      accessibilityLabel="TruWell AI Shield"
    />
  );
}

function FloatingShield() {
  const floatY = useSharedValue(0);

  useEffect(() => {
    floatY.value = withRepeat(
      withSequence(
        withTiming(-6, { duration: 2000, easing: Easing.inOut(Easing.quad) }),
        withTiming(0, { duration: 2000, easing: Easing.inOut(Easing.quad) })
      ),
      -1,
      false
    );
  }, [floatY]);

  const s = useAnimatedStyle(() => ({
    transform: [{ translateY: floatY.value }],
  }));

  return (
    <Animated.View style={[styles.shieldWrap, s]}>
      <ShieldGlow />
      <SpinRing size={138} duration={3000} topColor={`${TEAL}CC`} rightColor={`${TEAL}66`} />
      <SpinRing
        size={154}
        duration={5000}
        reverse
        topColor={`${GOLD}80`}
        rightColor={`${GOLD}33`}
      />
      <ShieldSVG />
    </Animated.View>
  );
}

function Particle({
  left,
  bottom,
  size,
  duration,
  delay,
  initOpacity,
}: {
  left: number;
  bottom: number;
  size: number;
  duration: number;
  delay: number;
  initOpacity: number;
}) {
  const y = useSharedValue(0);
  const op = useSharedValue(0);

  useEffect(() => {
    y.value = withDelay(
      delay,
      withRepeat(withTiming(-180, { duration, easing: Easing.linear }), -1, false)
    );
    op.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(0, { duration: 0 }),
          withTiming(initOpacity, { duration: duration * 0.2 }),
          withTiming(initOpacity * 0.5, { duration: duration * 0.6 }),
          withTiming(0, { duration: duration * 0.2 })
        ),
        -1,
        false
      )
    );
  }, [delay, duration, initOpacity, op, y]);

  const s = useAnimatedStyle(() => ({
    transform: [{ translateY: y.value }],
    opacity: op.value,
  }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          left: `${left}%`,
          bottom: `${bottom}%`,
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: 'rgba(100,180,255,0.7)',
        },
        s,
      ]}
    />
  );
}

const PARTICLES = [
  { left: 8, bottom: 12, size: 1.5, duration: 5000, delay: 0, initOpacity: 0.6 },
  { left: 16, bottom: 20, size: 2, duration: 4000, delay: 800, initOpacity: 0.4 },
  { left: 25, bottom: 15, size: 1, duration: 6000, delay: 1600, initOpacity: 0.7 },
  { left: 33, bottom: 28, size: 2.5, duration: 3500, delay: 400, initOpacity: 0.5 },
  { left: 42, bottom: 18, size: 1.5, duration: 4500, delay: 1200, initOpacity: 0.6 },
  { left: 51, bottom: 32, size: 2, duration: 5500, delay: 2000, initOpacity: 0.3 },
  { left: 60, bottom: 10, size: 1, duration: 4000, delay: 600, initOpacity: 0.5 },
  { left: 68, bottom: 22, size: 2.5, duration: 6000, delay: 1400, initOpacity: 0.7 },
  { left: 76, bottom: 36, size: 1.5, duration: 3000, delay: 200, initOpacity: 0.4 },
  { left: 84, bottom: 14, size: 2, duration: 5000, delay: 1800, initOpacity: 0.6 },
  { left: 90, bottom: 25, size: 1, duration: 4500, delay: 1000, initOpacity: 0.5 },
  { left: 20, bottom: 40, size: 2, duration: 3500, delay: 2200, initOpacity: 0.3 },
  { left: 55, bottom: 8, size: 1.5, duration: 6000, delay: 300, initOpacity: 0.7 },
  { left: 72, bottom: 42, size: 1, duration: 4000, delay: 1100, initOpacity: 0.4 },
  { left: 38, bottom: 35, size: 2, duration: 5000, delay: 700, initOpacity: 0.5 },
  { left: 12, bottom: 30, size: 1.5, duration: 4500, delay: 1500, initOpacity: 0.6 },
  { left: 63, bottom: 18, size: 2.5, duration: 3500, delay: 900, initOpacity: 0.4 },
  { left: 47, bottom: 45, size: 1, duration: 5500, delay: 1700, initOpacity: 0.3 },
] as const;

function StatusDot() {
  const sc = useSharedValue(1);
  const op = useSharedValue(1);

  useEffect(() => {
    sc.value = withRepeat(
      withSequence(
        withTiming(0.8, { duration: 1000 }),
        withTiming(1, { duration: 1000 })
      ),
      -1,
      false
    );
    op.value = withRepeat(
      withSequence(
        withTiming(0.6, { duration: 1000 }),
        withTiming(1, { duration: 1000 })
      ),
      -1,
      false
    );
  }, [op, sc]);

  const s = useAnimatedStyle(() => ({
    transform: [{ scale: sc.value }],
    opacity: op.value,
  }));

  return <Animated.View style={[styles.statusDot, s]} />;
}

function LoadingBar() {
  const w = useSharedValue(0);

  useEffect(() => {
    w.value = withDelay(
      500,
      withTiming(1, {
        duration: 2800,
        easing: Easing.bezier(0.4, 0, 0.2, 1),
      })
    );
  }, [w]);

  const s = useAnimatedStyle(() => ({
    width: `${w.value * 100}%`,
  }));

  return (
    <View style={styles.loadingTrack}>
      <Animated.View style={[styles.loadingFillWrap, s]}>
        <LinearGradient
          colors={['#185FA5', TEAL, GOLD]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFillObject}
        />
      </Animated.View>
    </View>
  );
}

function BlinkingText({ text }: { text: string }) {
  const op = useSharedValue(0.5);

  useEffect(() => {
    op.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 900 }),
        withTiming(0.5, { duration: 900 })
      ),
      -1,
      false
    );
  }, [op]);

  const s = useAnimatedStyle(() => ({ opacity: op.value }));
  return <Animated.Text style={[styles.loadingText, s]}>{text}</Animated.Text>;
}

function SplashScreenInner({ onComplete }: Props) {
  const insets = useSafeAreaInsets();

  const exitOpacity = useSharedValue(1);
  const exitScale = useSharedValue(1);

  const wordmarkY = useSharedValue(26);
  const wordmarkOpacity = useSharedValue(0);
  const metricsY = useSharedValue(12);
  const metricsOpacity = useSharedValue(0);
  const bottomY = useSharedValue(12);
  const bottomOpacity = useSharedValue(0);

  useEffect(() => {
    wordmarkY.value = withDelay(
      800,
      withTiming(0, { duration: 700, easing: Easing.bezier(0.4, 0, 0.2, 1) })
    );
    wordmarkOpacity.value = withDelay(
      800,
      withTiming(1, { duration: 700, easing: Easing.bezier(0.4, 0, 0.2, 1) })
    );

    metricsY.value = withDelay(
      1100,
      withTiming(0, { duration: 600, easing: Easing.out(Easing.quad) })
    );
    metricsOpacity.value = withDelay(
      1100,
      withTiming(1, { duration: 600, easing: Easing.out(Easing.quad) })
    );

    bottomY.value = withDelay(
      1300,
      withTiming(0, { duration: 500, easing: Easing.out(Easing.quad) })
    );
    bottomOpacity.value = withDelay(
      1300,
      withTiming(1, { duration: 500, easing: Easing.out(Easing.quad) })
    );

    const exitTimer = setTimeout(() => {
      exitOpacity.value = withTiming(0, {
        duration: EXIT_DURATION,
        easing: Easing.bezier(0.4, 0, 0.2, 1),
      });
      exitScale.value = withTiming(1.06, {
        duration: EXIT_DURATION,
        easing: Easing.bezier(0.4, 0, 0.2, 1),
      });
    }, TOTAL_DURATION);

    const completeTimer = setTimeout(() => {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onComplete();
    }, TOTAL_DURATION + EXIT_DURATION);

    return () => {
      clearTimeout(exitTimer);
      clearTimeout(completeTimer);
    };
  }, [
    onComplete,
    exitOpacity,
    exitScale,
    wordmarkY,
    wordmarkOpacity,
    metricsY,
    metricsOpacity,
    bottomY,
    bottomOpacity,
  ]);

  const rootStyle = useAnimatedStyle(() => ({
    opacity: exitOpacity.value,
    transform: [{ scale: exitScale.value }],
  }));

  const wordmarkStyle = useAnimatedStyle(() => ({
    opacity: wordmarkOpacity.value,
    transform: [{ translateY: wordmarkY.value }],
  }));

  const metricsStyle = useAnimatedStyle(() => ({
    opacity: metricsOpacity.value,
    transform: [{ translateY: metricsY.value }],
  }));

  const bottomStyle = useAnimatedStyle(() => ({
    opacity: bottomOpacity.value,
    transform: [{ translateY: bottomY.value }],
  }));

  return (
    <Animated.View style={[styles.root, rootStyle]} pointerEvents="none">
      <LinearGradient
        colors={['#0a1640', NAVY, NAVY]}
        locations={[0, 0.5, 1]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />

      <Svg
        style={[StyleSheet.absoluteFillObject, { zIndex: 999 }]}
        pointerEvents="none"
        opacity={0.028}
      >
        <Defs>
          <Filter id="grain">
            <FeTurbulence
              type="fractalNoise"
              baseFrequency={0.9}
              numOctaves={4}
              stitchTiles="stitch"
            />
          </Filter>
        </Defs>
        <Rect width="100%" height="100%" filter="url(#grain)" />
      </Svg>

      <View style={styles.orbCenter} pointerEvents="none">
        <PulseRing size={SW * 1.3} borderColor="rgba(0,229,200,0.08)" delayMs={0} />
        <PulseRing size={SW * 1.06} borderColor="rgba(0,229,200,0.14)" delayMs={600} />
        <PulseRing size={SW * 0.81} borderColor="rgba(0,229,200,0.22)" delayMs={1200} />
      </View>

      <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
        {PARTICLES.map((p, i) => (
          <Particle key={i} {...p} />
        ))}
      </View>

      <View style={styles.dnaWrap} pointerEvents="none">
        <Svg width={60} height={220} viewBox="0 0 60 220">
          <Path
            d="M10 0 Q50 20 10 40 Q-30 60 10 80 Q50 100 10 120 Q-30 140 10 160 Q50 180 10 200 Q-30 220 10 240"
            stroke={`${TEAL}40`}
            strokeWidth={1.5}
            fill="none"
          />
          <Path
            d="M50 0 Q10 20 50 40 Q90 60 50 80 Q10 100 50 120 Q90 140 50 160 Q10 180 50 200 Q90 220 50 240"
            stroke={`${TEAL}40`}
            strokeWidth={1.5}
            fill="none"
          />
          {[20, 40, 60, 80, 100, 120, 140, 160, 180, 200].map((y) => (
            <Line
              key={y}
              x1={10}
              y1={y}
              x2={50}
              y2={y}
              stroke={`${TEAL}22`}
              strokeWidth={1}
            />
          ))}
        </Svg>
      </View>

      <View style={styles.heartbeatWrap} pointerEvents="none">
        <Svg width={SW} height={32} viewBox={`0 0 ${SW} 32`}>
          <Polyline
            points={`0,16 ${SW * 0.19},16 ${SW * 0.225},4 ${SW * 0.25},28 ${SW * 0.288},4 ${SW * 0.325},16 ${SW * 0.563},16 ${SW * 0.6},4 ${SW * 0.625},28 ${SW * 0.663},4 ${SW * 0.7},16 ${SW},16`}
            fill="none"
            stroke={`${TEAL}33`}
            strokeWidth={1.2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      </View>

      <LinearGradient
        colors={[`${NAVY}E6`, 'transparent']}
        style={styles.topOverlay}
        pointerEvents="none"
      />
      <LinearGradient
        colors={['transparent', `${NAVY}F2`]}
        style={styles.bottomOverlay}
        pointerEvents="none"
      />

      <StatusDot />

      <View style={styles.centerGroup}>
        <FloatingShield />

        <Animated.View style={[styles.wordmarkWrap, wordmarkStyle]}>
          <View style={styles.brandRow}>
            <Text style={styles.brandWhite}>TRUWELL </Text>
            <Text style={styles.brandTeal}>AI</Text>
          </View>

          <Text style={styles.tagline1}>Longevity Intelligence</Text>

          <View style={styles.divider} />

          <Text style={styles.taglineMain}>
            {'AI-powered health intelligence\nfor you and everyone you love'}
          </Text>
        </Animated.View>
      </View>

      <Animated.View style={[styles.metricsStrip, metricsStyle]}>
        {[
          { value: 'AI', label: 'Powered', color: TEAL },
          { value: '47+', label: 'Databases', color: GOLD },
          { value: '100%', label: 'Private', color: TEAL },
        ].map((m) => (
          <View key={m.label} style={styles.metricCard}>
            <Text style={[styles.metricVal, { color: m.color }]}>{m.value}</Text>
            <Text style={styles.metricLbl}>{m.label}</Text>
          </View>
        ))}
      </Animated.View>

      <Animated.View
        style={[styles.bottomSection, { paddingBottom: insets.bottom + 8 }, bottomStyle]}
      >
        <LoadingBar />
        <BlinkingText text="Initializing your intelligence" />
        <View style={styles.homeBar} />
      </Animated.View>
    </Animated.View>
  );
}

export const SplashScreen = memo(SplashScreenInner);

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 500,
    backgroundColor: NAVY,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orbCenter: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dnaWrap: {
    position: 'absolute',
    right: -10,
    top: 60,
    opacity: 0.7,
    zIndex: 3,
  },
  heartbeatWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 165,
    opacity: 0.8,
    zIndex: 5,
  },
  topOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 80,
    zIndex: 8,
  },
  bottomOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 120,
    zIndex: 8,
  },
  statusDot: {
    position: 'absolute',
    top: 52,
    right: 24,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#5DCAA5',
    zIndex: 20,
  },
  centerGroup: {
    alignItems: 'center',
    zIndex: 10,
  },
  shieldWrap: {
    width: 110,
    height: 110,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  wordmarkWrap: {
    alignItems: 'center',
    marginTop: 4,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 6,
  },
  brandWhite: {
    fontSize: 30,
    fontFamily: OB_FONTS.display,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 3,
    textShadowColor: `${TEAL}66`,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  brandTeal: {
    fontSize: 30,
    fontFamily: OB_FONTS.display,
    fontWeight: '700',
    color: TEAL,
    letterSpacing: 3,
    textShadowColor: `${TEAL}88`,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 16,
  },
  tagline1: {
    fontSize: 11,
    fontWeight: '400',
    color: 'rgba(180,210,255,0.8)',
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 0,
  },
  divider: {
    width: 48,
    height: 1,
    backgroundColor: `${TEAL}CC`,
    marginVertical: 10,
    opacity: 0.7,
  },
  taglineMain: {
    fontSize: 13,
    fontWeight: '300',
    color: 'rgba(200,225,255,0.7)',
    letterSpacing: 0.5,
    textAlign: 'center',
    lineHeight: 21,
    paddingHorizontal: 28,
  },
  metricsStrip: {
    position: 'absolute',
    bottom: 105,
    left: 20,
    right: 20,
    flexDirection: 'row',
    gap: 8,
    zIndex: 10,
  },
  metricCard: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: `${TEAL}33`,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  metricVal: {
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 18,
    marginBottom: 4,
  },
  metricLbl: {
    fontSize: 8,
    fontWeight: '400',
    color: 'rgba(160,200,255,0.6)',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  bottomSection: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    alignItems: 'center',
    paddingTop: 8,
  },
  loadingTrack: {
    width: 120,
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 10,
  },
  loadingFillWrap: {
    height: '100%',
    borderRadius: 2,
    overflow: 'hidden',
  },
  loadingText: {
    fontSize: 10,
    fontWeight: '400',
    color: `${TEAL}8C`,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 16,
  },
  homeBar: {
    width: 96,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.20)',
    borderRadius: 4,
  },
});
