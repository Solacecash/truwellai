import { LinearGradient } from 'expo-linear-gradient';
import React, { memo, useEffect } from 'react';
import {
  Dimensions,
  LayoutChangeEvent,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
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
import { CtaButton } from '../ui/CtaButton';
import { OrbitRing } from '../ui/OrbitRing';
import { SegmentedIndicator } from '../ui/SegmentedIndicator';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

const BADGES = ['FDA', 'WHO', 'EWG', 'EU Cosmetics', 'Prop 65', 'PubMed', 'NTP', 'IARC'] as const;

type Props = { active: boolean; onNext: () => void; onSkip: () => void };

function Slide2ProofInner({ active, onNext, onSkip }: Props) {
  const insets = useSafeAreaInsets();
  const vfH = useSharedValue(72);
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withRepeat(
      withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.quad) }),
      -1,
      true
    );
  }, [progress]);

  const onViewfinderLayout = (e: LayoutChangeEvent) => {
    vfH.value = e.nativeEvent.layout.height;
  };

  const beamStyle = useAnimatedStyle(() => {
    const h = vfH.value;
    const p = progress.value;
    const yMin = 6;
    const yMax = Math.max(yMin + 8, h - 6);
    const y = yMin + p * (yMax - yMin);
    let op = 1;
    if (p < 0.06) op = p / 0.06;
    else if (p > 0.94) op = (1 - p) / 0.06;
    return {
      transform: [{ translateY: y }],
      opacity: op,
    };
  });

  return (
    <LinearGradient
      colors={['#091E35', '#040B16']}
      start={{ x: 0.4, y: 0 }}
      end={{ x: 0.5, y: 1 }}
      style={[styles.root, { width: SCREEN_W, height: SCREEN_H }]}
    >
      <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
        <SegmentedIndicator currentStep={1} />
        <View style={styles.topRow}>
          <View style={styles.chapter}>
            <Text style={styles.chapterText}>02 of 05</Text>
          </View>
          <Pressable accessibilityRole="button" onPress={onSkip} style={styles.skipBtn}>
            <Text style={styles.skipText}>Skip</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.mid}>
        <View style={styles.visual}>
          <View style={styles.halo} />
          <OrbitRing
            size={220}
            borderColor="rgba(201,168,76,0.15)"
            duration={18}
            direction="cw"
            dotColor={OB.gold}
            dotSize={4}
          />
          <View style={styles.phone}>
            <View style={styles.notch} />
            <View style={styles.screen}>
              <View style={styles.viewfinder} onLayout={onViewfinderLayout}>
                <View style={[styles.corner, styles.tl]} />
                <View style={[styles.corner, styles.tr]} />
                <View style={[styles.corner, styles.bl]} />
                <View style={[styles.corner, styles.br]} />
                <Animated.View style={[styles.beam, beamStyle]} pointerEvents="none">
                  <LinearGradient
                    colors={['transparent', OB.teal, 'transparent']}
                    start={{ x: 0, y: 0.5 }}
                    end={{ x: 1, y: 0.5 }}
                    style={StyleSheet.absoluteFillObject}
                  />
                </Animated.View>
                <View style={styles.bars}>
                  {Array.from({ length: 14 }).map((_, i) => (
                    <View
                      key={i}
                      style={[
                        styles.bar,
                        { width: i % 3 === 0 ? 3.5 : i % 2 === 0 ? 2 : 1 },
                      ]}
                    />
                  ))}
                </View>
              </View>
              <View style={styles.resultCard}>
                <View style={styles.resultTop}>
                  <Text style={styles.resultLabel}>SAFETY SCORE</Text>
                  <View style={styles.grade}>
                    <Text style={styles.gradeText}>F</Text>
                  </View>
                </View>
                <Text style={styles.resultSub}>3 endocrine disruptors detected</Text>
                <View style={styles.scoreTrack}>
                  <LinearGradient
                    colors={[OB.red, '#FF6B6B']}
                    start={{ x: 0, y: 0.5 }}
                    end={{ x: 1, y: 0.5 }}
                    style={[styles.scoreFill, { width: '18%' }]}
                  />
                </View>
              </View>
              <View style={styles.altPill}>
                <View style={styles.greenDot} />
                <View>
                  <Text style={styles.altTitle}>SAFER CHOICE FOUND</Text>
                  <Text style={styles.altSub}>2 aisles away · same price</Text>
                </View>
              </View>
              <Text style={styles.timeBadge}>RESULT IN 5 SECONDS</Text>
            </View>
          </View>
        </View>

        <View style={styles.content}>
          <AnimateUp active={active} delayMs={60}>
            <Text style={styles.eyebrow}>⚡ Instant Intelligence</Text>
          </AnimateUp>
          <AnimateUp active={active} delayMs={130}>
            <Text style={styles.headline}>
              <Text style={{ color: OB.teal }}>5 seconds </Text>
              from uncertainty to{' '}
              <Text style={{ color: OB.goldLight, fontWeight: '700' }}>total clarity</Text>
            </Text>
          </AnimateUp>
          <AnimateUp active={active} delayMs={200}>
            <Text style={styles.body}>
              Point your camera. Scan the barcode. TruWell AI cross-references 47 scientific databases in milliseconds and delivers your personalised grade.
            </Text>
          </AnimateUp>
          <AnimateUp active={active} delayMs={280}>
            <View style={styles.badgeRow}>
              {BADGES.map((b) => (
                <View key={b} style={styles.dbPill}>
                  <Text style={styles.dbText}>{b}</Text>
                </View>
              ))}
            </View>
          </AnimateUp>
        </View>
      </View>

      <SlideCtaFooter>
        <CtaButton label="See My Personalised Shield" onPress={onNext} />
      </SlideCtaFooter>
    </LinearGradient>
  );
}

export const Slide2Proof = memo(Slide2ProofInner);

const CORNER = { borderColor: OB.teal, position: 'absolute' as const, width: 16, height: 16 };

const styles = StyleSheet.create({
  root: {
    flex: 1,
    height: '100%',
    width: '100%',
    overflow: 'hidden',
  },
  topBar: { paddingHorizontal: 0 },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
    color: OB.teal,
    textTransform: 'uppercase',
  },
  skipBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: OB.glass1,
    borderRadius: OB.r99,
    borderWidth: 1,
    borderColor: OB.glassBorder,
  },
  skipText: { color: OB.t70, fontWeight: '600' },
  mid: {
    flex: 1,
    flexDirection: 'column',
    minHeight: 0,
    overflow: 'hidden',
  },
  visual: {
    flex: 48,
    minHeight: 0,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  halo: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(201,168,76,0.12)',
    opacity: 0.9,
  },
  phone: {
    width: 130,
    height: 220,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 8,
    paddingTop: 12,
    zIndex: 2,
    backgroundColor: OB.navy2,
  },
  notch: {
    alignSelf: 'center',
    width: 60,
    height: 8,
    borderRadius: 4,
    backgroundColor: OB.ink,
    marginBottom: 6,
  },
  screen: { flex: 1, minHeight: 0 },
  viewfinder: {
    backgroundColor: OB.navy,
    borderRadius: 12,
    padding: 8,
    marginBottom: 6,
    height: 88,
    overflow: 'hidden',
  },
  corner: CORNER,
  tl: { top: 6, left: 6, borderTopWidth: 2, borderLeftWidth: 2 },
  tr: { top: 6, right: 6, borderTopWidth: 2, borderRightWidth: 2 },
  bl: { bottom: 6, left: 6, borderBottomWidth: 2, borderLeftWidth: 2 },
  br: { bottom: 6, right: 6, borderBottomWidth: 2, borderRightWidth: 2 },
  beam: {
    position: 'absolute',
    left: 6,
    right: 6,
    top: 0,
    height: 2,
  },
  bars: {
    flexDirection: 'row',
    gap: 2,
    justifyContent: 'center',
    marginTop: 28,
    alignItems: 'flex-end',
  },
  bar: { height: 28, backgroundColor: 'rgba(255,255,255,0.6)' },
  resultCard: {
    borderRadius: 10,
    backgroundColor: 'rgba(0,229,200,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(0,229,200,0.15)',
    padding: 8,
  },
  resultTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  resultLabel: { fontSize: 11, color: OB.t70 },
  grade: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: OB.red,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gradeText: { color: '#FFFFFF', fontWeight: '800', fontSize: 16 },
  resultSub: { fontSize: 11, color: OB.t70, marginTop: 3 },
  scoreTrack: {
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginTop: 5,
    overflow: 'hidden',
  },
  scoreFill: { height: '100%', borderRadius: 2 },
  altPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(46,213,115,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(46,213,115,0.2)',
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginTop: 6,
  },
  greenDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: OB.green },
  altTitle: { fontSize: 11, fontWeight: '700', color: OB.green },
  altSub: { fontSize: 11, color: 'rgba(255,255,255,0.35)' },
  timeBadge: {
    textAlign: 'center',
    marginTop: 6,
    fontSize: 11,
    color: OB.t70,
    letterSpacing: 1.5,
  },
  content: {
    flex: 52,
    minHeight: 0,
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 80,
    overflow: 'hidden',
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: '700',
    color: OB.teal,
    letterSpacing: 2,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  headline: { fontSize: 26, fontFamily: OB_FONTS.display, fontWeight: '700', color: OB.t100, lineHeight: 32, marginBottom: 10 },
  body: { fontSize: 14, lineHeight: 22, color: OB.t70, marginBottom: 12 },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 },
  dbPill: {
    backgroundColor: OB.glass1,
    borderWidth: 1,
    borderColor: OB.glassBorder,
    borderRadius: OB.r99,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  dbText: { fontSize: 11, fontWeight: '700', color: OB.t70 },
});
