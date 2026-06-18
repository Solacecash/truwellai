import { LinearGradient } from 'expo-linear-gradient';
import React, { memo, useEffect, useRef, useState } from 'react';
import { Dimensions, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AnimateUp } from '../AnimateUp';
import { SlideCtaFooter } from '../SlideCtaFooter';
import { OB, OB_FONTS } from '../tokens';
import { CtaButton } from '../ui/CtaButton';
import { SegmentedIndicator } from '../ui/SegmentedIndicator';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

type Props = { active: boolean; onNext: () => void; onSkip: () => void };

function Slide4CommunityInner({ active, onNext, onSkip }: Props) {
  const insets = useSafeAreaInsets();
  const s4doneRef = useRef(false);
  const rafRef = useRef<number | null>(null);
  const [c1, setC1] = useState(0);
  const [c2, setC2] = useState(0);
  const [c3, setC3] = useState(0);

  useEffect(() => {
    if (!active || s4doneRef.current) return;
    s4doneRef.current = true;
    const targets = { t1: 1247, t2: 247000, t3: 47 };
    const start = Date.now();
    const duration = 1800;

    const tick = () => {
      const elapsed = Date.now() - start;
      const u = Math.min(1, elapsed / duration);
      const e = 1 - (1 - u) ** 3;
      setC1(Math.round(targets.t1 * e));
      setC2(Math.round(targets.t2 * e));
      setC3(Math.round(targets.t3 * e));
      if (u < 1) {
        rafRef.current = requestAnimationFrame(tick);
      }
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
  }, [active]);

  const fmt = (n: number) => (n >= 1000 ? `${Math.floor(n / 1000)}K` : `${n}`);

  return (
    <LinearGradient
      colors={['#0C1E2E', '#040A14']}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
      style={[styles.root, { width: SCREEN_W, height: SCREEN_H }]}
    >
      <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
        <SegmentedIndicator currentStep={3} />
        <View style={styles.topRow}>
          <View style={styles.chapter}>
            <Text style={styles.chapterText}>04 of 05</Text>
          </View>
          <Pressable accessibilityRole="button" onPress={onSkip} style={styles.skipBtn}>
            <Text style={styles.skipText}>Skip</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.mid}>
        <View style={styles.visual}>
          <View style={[styles.card, styles.card1]}>
            <View style={styles.cardHeader}>
              <LinearGradient
                colors={[OB.goldLight, OB.gold]}
                style={styles.avatar}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Text style={styles.avatarTxt}>SK</Text>
              </LinearGradient>
              <Text style={styles.name}>Sarah K.</Text>
              <Text style={styles.verified}>✓</Text>
            </View>
            <Text style={styles.quote}>
              I threw out half my pantry after TruWell flagged 6 products my doctor never mentioned.
            </Text>
            <Text style={styles.stars}>⭐⭐⭐⭐⭐</Text>
          </View>
          <View style={[styles.card, styles.card2]}>
            <View style={styles.cardHeader}>
              <LinearGradient
                colors={[OB.goldLight, OB.gold]}
                style={styles.avatar}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Text style={styles.avatarTxt}>JM</Text>
              </LinearGradient>
              <Text style={styles.name}>James M.</Text>
              <Text style={styles.verified}>✓</Text>
            </View>
            <Text style={styles.quote}>
              My eczema improved in weeks once I started filtering by my profile. Wish I had this years
              ago.
            </Text>
            <Text style={styles.stars}>⭐⭐⭐⭐⭐</Text>
          </View>
          <View style={styles.countRow}>
            <View style={styles.countItem}>
              <Text style={styles.countNum}>{c1.toLocaleString()}</Text>
              <Text style={styles.countLbl}>Expert Partners</Text>
            </View>
            <View style={styles.countItem}>
              <Text style={styles.countNum}>{fmt(c2)}</Text>
              <Text style={styles.countLbl}>Families Protected</Text>
            </View>
            <View style={styles.countItem}>
              <Text style={styles.countNum}>{c3}</Text>
              <Text style={styles.countLbl}>Databases</Text>
            </View>
          </View>
        </View>

        <View style={styles.content}>
          <AnimateUp active={active} delayMs={60}>
            <Text style={styles.eyebrow}>🏥 Proven Authority</Text>
          </AnimateUp>
          <AnimateUp active={active} delayMs={130}>
            <Text style={styles.headline}>
              Doctors prescribe it.{' '}
              <Text style={{ color: OB.goldLight, fontFamily: OB_FONTS.display }}>247,000 families</Text>{' '}
              depend on it.
            </Text>
          </AnimateUp>
          <AnimateUp active={active} delayMs={200}>
            <Text style={styles.body}>
              This is not a wellness trend. This is{' '}
              <Text style={styles.bodyStrong}>science with a face</Text> — built with input from
              endocrinologists, dermatologists, and toxicologists who could not stay silent.
            </Text>
          </AnimateUp>
        </View>
      </View>

      <SlideCtaFooter>
        <CtaButton label="Join Them — It's Free" onPress={onNext} />
      </SlideCtaFooter>
    </LinearGradient>
  );
}

export const Slide4Community = memo(Slide4CommunityInner);

const styles = StyleSheet.create({
  root: {
    flex: 1,
    height: '100%',
    width: '100%',
    overflow: 'hidden',
  },
  topBar: { paddingHorizontal: 0 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4, paddingHorizontal: 20 },
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
    flex: 46,
    minHeight: 0,
    position: 'relative',
    overflow: 'hidden',
  },
  card: {
    position: 'absolute',
    backgroundColor: OB.glass2,
    borderWidth: 1,
    borderColor: OB.glassBorder,
    borderRadius: OB.r20,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 8,
  },
  card1: {
    top: '4%',
    left: '4%',
    width: '62%',
    transform: [{ rotate: '-2deg' }],
  },
  card2: {
    bottom: '12%',
    right: '4%',
    width: '68%',
    transform: [{ rotate: '1.5deg' }],
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarTxt: { fontSize: 11, fontWeight: '800', color: OB.ink },
  name: { flex: 1, fontSize: 13, fontWeight: '700', color: OB.t100 },
  verified: { fontSize: 12, color: OB.teal },
  quote: { fontSize: 12, color: OB.t70, lineHeight: 19 },
  stars: { marginTop: 6, fontSize: 12 },
  countRow: {
    position: 'absolute',
    bottom: '4%',
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  countItem: { alignItems: 'center' },
  countNum: { fontSize: 24, fontWeight: '900', color: OB.gold },
  countLbl: { fontSize: 11, color: OB.t70, marginTop: 2 },
  content: {
    flex: 54,
    minHeight: 0,
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 80,
    overflow: 'hidden',
  },
  eyebrow: { fontSize: 11, fontWeight: '700', color: OB.teal, marginBottom: 8 },
  headline: { fontSize: 24, fontFamily: OB_FONTS.display, fontWeight: '700', color: OB.t100, lineHeight: 30, marginBottom: 10 },
  body: { fontSize: 14, lineHeight: 22, color: OB.t70, marginBottom: 8 },
  bodyStrong: { fontWeight: '700', color: OB.t100 },
});
