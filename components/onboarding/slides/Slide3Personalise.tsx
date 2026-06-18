import { LinearGradient } from 'expo-linear-gradient';
import React, { memo } from 'react';
import { Dimensions, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AnimateUp } from '../AnimateUp';
import { SlideCtaFooter } from '../SlideCtaFooter';
import { OB, OB_FONTS } from '../tokens';
import { CtaButton } from '../ui/CtaButton';
import { FloatingChemTag } from '../ui/FloatingChemTag';
import { SegmentedIndicator } from '../ui/SegmentedIndicator';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

const FEATURES = ['Eczema Safe', 'Hormone Aware', 'Pregnancy Mode', 'Child Safe'] as const;

type Props = { active: boolean; onNext: () => void; onSkip: () => void };

function PersonArt() {
  return (
    <Svg width={70} height={88} viewBox="0 0 70 88">
      <Circle cx={35} cy={22} r={18} fill="rgba(0,229,200,0.1)" stroke="rgba(0,229,200,0.35)" strokeWidth={1.5} />
      <Circle cx={35} cy={22} r={14} stroke="rgba(0,229,200,0.2)" strokeWidth={1.5} fill="none" />
      <Circle cx={35} cy={22} r={9} fill="rgba(0,229,200,0.55)" />
      <Path
        d="M8 86 C8 66 62 66 62 86"
        fill="rgba(0,229,200,0.1)"
        stroke="rgba(0,229,200,0.35)"
        strokeWidth={1.5}
      />
    </Svg>
  );
}

function Slide3PersonaliseInner({ active, onNext, onSkip }: Props) {
  const insets = useSafeAreaInsets();
  return (
    <LinearGradient
      colors={['#0A1A28', '#040C18']}
      start={{ x: 0.6, y: 0 }}
      end={{ x: 0.5, y: 1 }}
      style={[styles.root, { width: SCREEN_W, height: SCREEN_H }]}
    >
      <LinearGradient
        colors={['rgba(30,144,255,0.07)', 'transparent']}
        style={styles.mesh}
        start={{ x: 0.35, y: 0 }}
        end={{ x: 0.5, y: 0.6 }}
      />
      <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
        <SegmentedIndicator currentStep={2} />
        <View style={styles.topRow}>
          <View style={styles.chapter}>
            <Text style={styles.chapterText}>03 of 05</Text>
          </View>
          <Pressable accessibilityRole="button" onPress={onSkip} style={styles.skipBtn}>
            <Text style={styles.skipText}>Skip</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.mid}>
        <View style={styles.visual}>
          <View style={styles.aura} />
          <View style={styles.personWrap}>
            <PersonArt />
          </View>
          <FloatingChemTag label="Eczema" top="18%" left="8%" rotation={-3} animationDelayMs={0} />
          <FloatingChemTag label="Gluten-Free" top="22%" right="6%" rotation={2} animationDelayMs={100} />
          <FloatingChemTag label="PCOS" bottom="20%" left="12%" rotation={1} animationDelayMs={200} />
          <FloatingChemTag label="Thyroid" bottom="16%" right="10%" rotation={-2} animationDelayMs={300} />
        </View>

        <View style={styles.content}>
          <AnimateUp active={active} delayMs={60}>
            <Text style={styles.eyebrow}>🧬 Your Biology. Your Rules.</Text>
          </AnimateUp>
          <AnimateUp active={active} delayMs={130}>
            <Text style={styles.headline}>
              Same product. Two people. Two{' '}
              <Text style={{ color: OB.red, fontFamily: OB_FONTS.display }}>completely different</Text>{' '}
              dangers.
            </Text>
          </AnimateUp>
          <AnimateUp active={active} delayMs={200}>
            <Text style={styles.body}>
              Generic safety ratings are lying to you. TruWell maps every ingredient to your exact biology,{' '}
              <Text style={styles.bodyStrong}>conditions, and medications</Text>. Because your
              neighbour&apos;s &lsquo;safe&rsquo; could be your slow poison.
            </Text>
          </AnimateUp>
          <AnimateUp active={active} delayMs={260}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>Set up once. Protected on every scan, forever.</Text>
            </View>
          </AnimateUp>
          <AnimateUp active={active} delayMs={310}>
            <View style={styles.pillRow}>
              {FEATURES.map((f) => (
                <View key={f} style={styles.featurePill}>
                  <Text style={styles.featureText}>{f}</Text>
                </View>
              ))}
            </View>
          </AnimateUp>
        </View>
      </View>

      <SlideCtaFooter>
        <CtaButton label="See Who Trusts TruWell AI" onPress={onNext} />
      </SlideCtaFooter>
    </LinearGradient>
  );
}

export const Slide3Personalise = memo(Slide3PersonaliseInner);

const styles = StyleSheet.create({
  root: {
    flex: 1,
    height: '100%',
    width: '100%',
    overflow: 'hidden',
  },
  mesh: { ...StyleSheet.absoluteFillObject },
  topBar: { paddingHorizontal: 0, zIndex: 2 },
  topRow: {
    flexDirection: 'row',
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
    flex: 42,
    minHeight: 0,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  aura: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(30,144,255,0.12)',
  },
  personWrap: { zIndex: 1 },
  content: {
    flex: 58,
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
  },
  headline: { fontSize: 26, fontFamily: OB_FONTS.display, fontWeight: '700', color: OB.t100, lineHeight: 32, marginBottom: 10 },
  body: { fontSize: 14, lineHeight: 22, color: OB.t70, marginBottom: 10 },
  bodyStrong: { fontWeight: '700', color: OB.t100 },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(0,229,200,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(0,229,200,0.22)',
    borderRadius: OB.r99,
    paddingVertical: 6,
    paddingHorizontal: 14,
    marginBottom: 10,
  },
  badgeText: { fontSize: 11, fontWeight: '700', color: OB.teal },
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  featurePill: {
    backgroundColor: 'rgba(0,229,200,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(0,229,200,0.18)',
    borderRadius: OB.r99,
    paddingVertical: 7,
    paddingHorizontal: 13,
  },
  featureText: { fontSize: 11, fontWeight: '700', color: OB.teal },
});
