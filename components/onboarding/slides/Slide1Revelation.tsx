import { LinearGradient } from 'expo-linear-gradient';
import React, { memo, useEffect } from 'react';
import { Dimensions, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AnimateUp } from '../AnimateUp';
import { SlideCtaFooter } from '../SlideCtaFooter';
import { OB, OB_FONTS } from '../tokens';
import { TruWellShield } from '../TruWellShield';
import { ActivityTicker } from '../ui/ActivityTicker';
import { CtaButton } from '../ui/CtaButton';
import { FloatingChemTag } from '../ui/FloatingChemTag';
import { PulseRing } from '../ui/PulseRing';
import { SegmentedIndicator } from '../ui/SegmentedIndicator';
import { StatCard } from '../ui/StatCard';
import { LEGAL } from '@/lib/legalContent';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
// Approximate bottom of the visual zone (44 % of mid area, after top-bar ~90px)
const VISUAL_ZONE_BOTTOM = Math.round(SCREEN_H * 0.56);

type Props = {
  active: boolean;
  onNext: () => void;
  onSkip: () => void;
};

/** Slide 1 orbit rings: explicit Reanimated rotation per spec (FIX 6). */
function Slide1OrbitRing({
  size,
  borderColor,
  durationMs,
  clockwise,
  dotColor,
  dotSize = 5,
}: {
  size: number;
  borderColor: string;
  durationMs: number;
  clockwise: boolean;
  dotColor?: string;
  dotSize?: number;
}) {
  const rotation = useSharedValue(0);

  useEffect(() => {
    const toValue = clockwise ? 360 : -360;
    rotation.value = withRepeat(
      withTiming(toValue, {
        duration: durationMs,
        easing: Easing.linear,
      }),
      -1,
      false
    );
  }, [clockwise, durationMs, rotation]);

  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const half = size / 2;
  const dotHalf = dotSize / 2;

  return (
    <View
      style={[
        orbitStyles.wrap,
        {
          width: size,
          height: size,
          marginTop: -half,
          marginLeft: -half,
        },
      ]}
      pointerEvents="none"
    >
      <Animated.View
        style={[
          orbitStyles.ring,
          {
            width: size,
            height: size,
            borderRadius: half,
            borderColor,
          },
          ringStyle,
        ]}
      >
        {dotColor ? (
          <View
            style={[
              orbitStyles.dot,
              {
                width: dotSize,
                height: dotSize,
                borderRadius: dotHalf,
                backgroundColor: dotColor,
                top: -dotHalf,
                marginLeft: -dotHalf,
                shadowColor: dotColor,
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.9,
                shadowRadius: 8,
                elevation: 6,
              },
            ]}
          />
        ) : null}
      </Animated.View>
    </View>
  );
}

const orbitStyles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    position: 'absolute',
    borderWidth: 1,
    borderStyle: 'solid',
  },
  dot: {
    position: 'absolute',
    left: '50%',
  },
});

function Slide1RevelationInner({ active, onNext, onSkip }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <LinearGradient
      colors={['#0D1F35', '#03080F']}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
      style={[styles.root, { width: SCREEN_W, height: SCREEN_H }]}
    >
      <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
        <SegmentedIndicator currentStep={0} />
        <View style={styles.topRow}>
          <View style={styles.chapter}>
            <Text style={styles.chapterText}>01 of 05</Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Skip onboarding"
            onPress={onSkip}
            style={styles.skipBtn}
          >
            <Text style={styles.skipText}>Skip</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.mid}>
        <View style={styles.visual}>
          <LinearGradient
            colors={['rgba(201,168,76,0.07)', 'transparent']}
            style={styles.mesh}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
          />
          <Slide1OrbitRing
            size={270}
            borderColor="rgba(201,168,76,0.15)"
            durationMs={28000}
            clockwise
            dotColor={OB.gold}
            dotSize={5}
          />
          <Slide1OrbitRing
            size={200}
            borderColor="rgba(0,229,200,0.18)"
            durationMs={20000}
            clockwise={false}
            dotColor={OB.teal}
            dotSize={4}
          />
          <PulseRing
            size={100}
            color="rgba(201,168,76,0.4)"
            delayMs={0}
            durationMs={2800}
            scaleEnd={1.4}
            opacityStart={0.7}
          />
          <PulseRing
            size={100}
            color="rgba(201,168,76,0.4)"
            delayMs={800}
            durationMs={2800}
            scaleEnd={1.4}
            opacityStart={0.7}
          />
          <PulseRing
            size={100}
            color="rgba(201,168,76,0.4)"
            delayMs={1600}
            durationMs={2800}
            scaleEnd={1.4}
            opacityStart={0.7}
          />
          <View style={styles.shieldWrap}>
            <TruWellShield size={88} animated={false} />
          </View>
          <FloatingChemTag
            label="Parabens"
            top="12%"
            left="4%"
            rotation={-2}
            variant="red"
            animationDelayMs={0}
          />
          <FloatingChemTag
            label="Phthalates"
            top="21%"
            right="3%"
            rotation={3}
            variant="red"
            delay={0}
            animationDelayMs={120}
          />
          <FloatingChemTag
            label="BPA"
            top="65%"
            left="3%"
            rotation={-1}
            animationDelayMs={240}
          />
          <FloatingChemTag
            label="Nano TiO₂"
            top="71%"
            right="4%"
            rotation={2}
            animationDelayMs={360}
          />
          <FloatingChemTag
            label="Methylisothiazolinone"
            top="7%"
            left="34%"
            rotation={0}
            animationDelayMs={480}
          />
          <FloatingChemTag
            label="Sulfates"
            bottom="12%"
            left="22%"
            rotation={-2}
            animationDelayMs={600}
          />
          <FloatingChemTag
            label="Retinoids"
            bottom="8%"
            right="18%"
            rotation={1}
            animationDelayMs={720}
          />
          <LinearGradient
            colors={['transparent', '#0D1F35']}
            style={[styles.fadeBottom, { height: 60 }]}
          />
        </View>

        <View style={styles.content}>
          <AnimateUp active={active} delayMs={60}>
            <Text style={styles.eyebrow}>⚠ The Truth</Text>
          </AnimateUp>
          <AnimateUp active={active} delayMs={130}>
            <View style={styles.headlineRow}>
              <Text style={styles.headline}>You absorb </Text>
              <Text style={styles.headlineGold}>dozens of harmful chemicals</Text>
              <Text style={styles.headline}> daily without knowing it.</Text>
            </View>
          </AnimateUp>
          <AnimateUp active={active} delayMs={200}>
            <Text style={styles.body}>
              The FDA hasn&apos;t banned a single cosmetic ingredient since 1989. The EU has banned over{' '}
              <Text style={styles.bodyStrong}>1,300</Text>. The shampoo you used this morning is illegal in
              France.
            </Text>
          </AnimateUp>
          <AnimateUp active={active} delayMs={280}>
            <View style={styles.stats}>
              <StatCard value="1,300+" label="EU Banned Substances" valueColor={OB.gold} />
              <StatCard value="11" label="Banned in USA" valueColor={OB.teal} />
              <StatCard value="0" label="FDA bans since 1989" valueColor={OB.red} />
            </View>
          </AnimateUp>
          <AnimateUp active={active} delayMs={340}>
            <View style={styles.trustPill}>
              <View style={styles.trustLock}>
                <Svg width={12} height={12} viewBox="0 0 24 24">
                  <Path
                    d="M12 1C9.24 1 7 3.24 7 6v2H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V10a2 2 0 00-2-2h-2V6c0-2.76-2.24-5-5-5z"
                    fill={OB.teal}
                  />
                </Svg>
              </View>
              <Text style={styles.trustText}>
                End-to-end encrypted. Your data personalises your results only.
              </Text>
            </View>
          </AnimateUp>
        </View>
      </View>

      {/* ActivityTicker at root level — outside overflow:hidden parents so
          pills render unclipped and the flex:1 text has space to fill. */}
      <ActivityTicker style={styles.ticker} />

      <SlideCtaFooter>
        <Text style={styles.nonMedicalNote}>{LEGAL.APP_NOT_MEDICAL_DEVICE}</Text>
        <CtaButton label={"Uncover What's Hidden"} onPress={onNext} />
      </SlideCtaFooter>
    </LinearGradient>
  );
}

export const Slide1Revelation = memo(Slide1RevelationInner);

const styles = StyleSheet.create({
  root: {
    flex: 1,
    height: '100%',
    width: '100%',
    overflow: 'hidden',
  },
  topBar: {
    paddingHorizontal: 0,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
    paddingHorizontal: 20,
  },
  chapter: {
    backgroundColor: 'rgba(0,229,200,0.12)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: OB.r99,
  },
  chapterText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 3,
    textTransform: 'uppercase',
    color: OB.teal,
  },
  skipBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: OB.glass1,
    borderRadius: OB.r99,
    borderWidth: 1,
    borderColor: OB.glassBorder,
  },
  skipText: { fontSize: 13, fontWeight: '600', color: OB.t70 },
  mid: {
    flex: 1,
    flexDirection: 'column',
    minHeight: 0,
    overflow: 'hidden',
  },
  visual: {
    flex: 44,
    minHeight: 0,
    position: 'relative',
    overflow: 'hidden',
  },
  mesh: {
    ...StyleSheet.absoluteFillObject,
  },
  shieldWrap: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fadeBottom: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
  content: {
    flex: 56,
    minHeight: 0,
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 80,
    overflow: 'hidden',
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 3.5,
    textTransform: 'uppercase',
    color: OB.teal,
    marginBottom: 8,
  },
  headlineRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'baseline',
    marginBottom: 12,
  },
  headline: {
    fontSize: 28,
    fontFamily: OB_FONTS.display,
    fontWeight: '700',
    lineHeight: 34,
    color: OB.t100,
    letterSpacing: -0.5,
  },
  headlineGold: {
    fontSize: 28,
    fontFamily: OB_FONTS.display,
    fontWeight: '700',
    lineHeight: 34,
    color: OB.gold,
    letterSpacing: -0.5,
  },
  body: {
    fontSize: 14,
    lineHeight: 24,
    color: OB.t70,
    marginBottom: 14,
  },
  bodyStrong: { fontWeight: '600', color: OB.t70 },
  stats: {
    flexDirection: 'row',
    gap: 7,
    marginBottom: 8,
  },
  trustPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    gap: 6,
    maxWidth: '100%',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: OB.r99,
    backgroundColor: 'rgba(0,229,200,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(0,229,200,0.12)',
  },
  trustLock: { flexShrink: 0 },
  trustText: {
    flexShrink: 1,
    fontSize: 9.5,
    fontStyle: 'italic',
    color: OB.t45,
    lineHeight: 13,
  },
  ticker: {
    // Positioned in the lower quarter of the visual zone
    bottom: VISUAL_ZONE_BOTTOM,
  },
  nonMedicalNote: {
    fontSize: 9,
    fontWeight: '400',
    color: OB.t45,
    textAlign: 'center',
    lineHeight: 13,
    marginBottom: 8,
    paddingHorizontal: 20,
  },
});
