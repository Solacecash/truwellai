import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { memo, useCallback, useEffect, useRef, useState } from 'react';
import { Dimensions, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  type SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Path } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useOnboardingStore, type UserType } from '@/stores/onboardingStore';

import { AnimateUp } from '../AnimateUp';
import { SlideCtaFooter } from '../SlideCtaFooter';
import { OB, OB_FONTS } from '../tokens';
import type { BurstEffectRef } from '../ui/BurstEffect';
import { BurstEffect } from '../ui/BurstEffect';
import { CtaButton } from '../ui/CtaButton';
import { PulseRing } from '../ui/PulseRing';
import { SegmentedIndicator } from '../ui/SegmentedIndicator';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

type Props = {
  active: boolean;
  onOpenWizard: () => void;
};

function WhiteCheck() {
  return (
    <Svg width={14} height={11} viewBox="0 0 12 10">
      <Path
        d="M1 5l3 3 7-7"
        stroke="#FFFFFF"
        strokeWidth={2}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function PulsingDot() {
  const p = useSharedValue(1);
  useEffect(() => {
    p.value = withRepeat(
      withSequence(
        withTiming(1.15, { duration: 1100, easing: Easing.inOut(Easing.quad) }),
        withTiming(1, { duration: 1100, easing: Easing.inOut(Easing.quad) })
      ),
      -1,
      false
    );
  }, [p]);
  const st = useAnimatedStyle(() => ({
    transform: [{ scale: p.value }],
  }));
  return <Animated.View style={[styles.fomoDot, st]} />;
}

function Slide5TypeSelectInner({ active, onOpenWizard }: Props) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const selectedType = useOnboardingStore((s) => s.selectedType);
  const setSelectedType = useOnboardingStore((s) => s.setSelectedType);
  const burstRef = useRef<BurstEffectRef>(null);
  const userCardRef = useRef<View>(null);
  const expertCardRef = useRef<View>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [spots, setSpots] = useState(3427);

  const userScale = useSharedValue(1);
  const expertScale = useSharedValue(1);
  const ctaOp = useSharedValue(0.4);

  useEffect(() => {
    if (!active) return;
    intervalRef.current = setInterval(() => {
      setSpots((s) => {
        if (Math.random() > 0.55) return Math.max(3200, s - 1);
        return s;
      });
    }, 6000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [active]);

  useEffect(() => {
    if (selectedType) {
      ctaOp.value = withTiming(1, { duration: 300 });
    } else {
      ctaOp.value = 0.4;
    }
  }, [ctaOp, selectedType]);

  const ctaWrapStyle = useAnimatedStyle(() => ({
    opacity: ctaOp.value,
  }));

  const userCardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: userScale.value }],
  }));
  const expertCardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: expertScale.value }],
  }));

  const select = useCallback(
    (t: UserType, ref: React.RefObject<View | null>, scaleSv: SharedValue<number>) => {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      scaleSv.value = withSequence(
        withSpring(1.02, { damping: 10, stiffness: 200 }),
        withSpring(1, { damping: 10, stiffness: 200 })
      );
      ref.current?.measureInWindow((x, y, w, h) => {
        burstRef.current?.burst(x + w / 2, y + h / 2);
      });
      setSelectedType(t);
    },
    [setSelectedType]
  );

  const ctaLabel = selectedType === 'user' ? 'Create My Free Account' : 'Continue';

  useEffect(() => {
    if (!selectedType) setSelectedType('user');
  }, [selectedType, setSelectedType]);

  const openWizard = useCallback(() => {
    if (!selectedType) return;
    onOpenWizard();
  }, [onOpenWizard, selectedType]);

  return (
    <LinearGradient
      colors={['#0A1824', '#030810']}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
      style={[styles.root, { width: SCREEN_W, height: SCREEN_H }]}
    >
      <BurstEffect ref={burstRef} />
      <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
        <SegmentedIndicator currentStep={4} />
        <View style={styles.topRow}>
          <View style={styles.chapter}>
            <Text style={styles.chapterText}>05 of 05</Text>
          </View>
          <View style={{ width: 60 }} />
        </View>
      </View>

      <View style={styles.mid}>
        <View style={styles.visual}>
          <PulseRing
            size={160}
            color="rgba(255,71,87,0.22)"
            delayMs={0}
            durationMs={2800}
            scaleStart={0.85}
            scaleEnd={1.4}
            opacityStart={0.7}
            opacityEnd={0}
          />
          <PulseRing
            size={120}
            color="rgba(255,71,87,0.2)"
            delayMs={800}
            durationMs={2800}
            scaleStart={0.85}
            scaleEnd={1.4}
            opacityStart={0.7}
            opacityEnd={0}
          />
          <PulseRing
            size={80}
            color="rgba(255,71,87,0.24)"
            delayMs={1600}
            durationMs={2800}
            scaleStart={0.85}
            scaleEnd={1.4}
            opacityStart={0.7}
            opacityEnd={0}
          />
          <View style={styles.counterWrap}>
            <View style={styles.counterBox}>
              <View style={styles.redDot} />
              <Text style={styles.counterText} numberOfLines={1}>
                {spots.toLocaleString()} lifetime spots remaining
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.content}>
          <AnimateUp active={active} delayMs={60}>
            <Text style={styles.eyebrow}>🚀 Begin Now</Text>
          </AnimateUp>
          <AnimateUp active={active} delayMs={130}>
            <Text style={styles.headline}>
              Are you protecting your family, or still hoping nothing is wrong?
            </Text>
          </AnimateUp>

          <AnimateUp active={active} delayMs={200}>
            <View style={styles.cardsCol}>
              <View ref={userCardRef} collapsable={false}>
                <Animated.View style={userCardStyle}>
                  <Pressable
                    onPress={() => select('user', userCardRef, userScale)}
                    style={[
                      styles.typeCard,
                      selectedType === 'user' ? styles.typeCardOnUser : styles.typeCardOff,
                    ]}
                    accessibilityRole="button"
                    accessibilityState={{ selected: selectedType === 'user' }}
                  >
                    <View style={[styles.iconCircle, styles.iconUser]}>
                      <Svg width={24} height={24} viewBox="0 0 24 24">
                        <Circle cx={12} cy={8} r={4} fill="none" stroke={OB.teal} strokeWidth={1.8} />
                        <Path
                          d="M4 20c0-4 3.6-7 8-7s8 3 8 7"
                          fill="none"
                          stroke={OB.teal}
                          strokeWidth={1.8}
                        />
                      </Svg>
                    </View>
                    <View style={styles.typeText}>
                      <Text style={styles.typeTitle}>Family Guardian</Text>
                      <Text style={styles.typeSub}>
                        Protect everyone you love from hidden dangers in everyday products
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.check,
                        selectedType === 'user' ? styles.checkOn : styles.checkOff,
                      ]}
                    >
                      {selectedType === 'user' ? <WhiteCheck /> : null}
                    </View>
                  </Pressable>
                </Animated.View>
              </View>
            </View>
          </AnimateUp>

          <View style={styles.fomo}>
            <PulsingDot />
            <Text style={styles.fomoText}>
              Every hour, 34 families discover TruWell AI. Don&apos;t be last.
            </Text>
          </View>
        </View>
      </View>

      <SlideCtaFooter>
        <Animated.View
          style={[ctaWrapStyle, { width: '100%', alignSelf: 'stretch' }]}
          pointerEvents={selectedType ? 'auto' : 'none'}
        >
          <CtaButton label={ctaLabel} onPress={openWizard} disabled={false} />
        </Animated.View>
        <View style={styles.memberSignInRow}>
          <Text style={styles.memberSignInPrompt}>Already a member? </Text>
          <Pressable
            onPress={() => router.push('/login')}
            hitSlop={8}
            accessibilityRole="link"
            accessibilityLabel="Sign in"
          >
            <Text style={styles.memberSignInLink}>Sign in</Text>
          </Pressable>
        </View>
      </SlideCtaFooter>
    </LinearGradient>
  );
}

export const Slide5TypeSelect = memo(Slide5TypeSelectInner);

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
  mid: {
    flex: 1,
    flexDirection: 'column',
    minHeight: 0,
    overflow: 'hidden',
  },
  visual: {
    flex: 35,
    minHeight: 0,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  counterWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    zIndex: 2,
  },
  counterBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    maxWidth: 260,
    height: 60,
    paddingHorizontal: 16,
    borderRadius: OB.r99,
    backgroundColor: 'rgba(255,71,87,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,71,87,0.2)',
  },
  redDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: OB.red,
  },
  counterText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '700',
    color: OB.red,
  },
  content: {
    flex: 65,
    minHeight: 0,
    paddingHorizontal: 24,
    paddingTop: 4,
    paddingBottom: 80,
    overflow: 'hidden',
  },
  eyebrow: { fontSize: 11, fontWeight: '700', color: OB.teal, marginBottom: 6 },
  headline: { fontSize: 21, fontFamily: OB_FONTS.display, fontWeight: '700', color: OB.t100, lineHeight: 27, marginBottom: 10 },
  cardsCol: { gap: 8 },
  typeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: OB.r16,
    borderWidth: 1,
  },
  typeCardOff: {
    backgroundColor: OB.glass1,
    borderColor: OB.glassBorder,
  },
  typeCardOnUser: {
    backgroundColor: 'rgba(0,229,200,0.08)',
    borderColor: 'rgba(0,229,200,0.35)',
  },
  typeCardOnExpert: {
    backgroundColor: 'rgba(201,168,76,0.08)',
    borderColor: 'rgba(201,168,76,0.35)',
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  iconUser: {
    backgroundColor: 'rgba(0,229,200,0.1)',
    borderColor: 'rgba(0,229,200,0.2)',
  },
  iconExpert: {
    backgroundColor: 'rgba(201,168,76,0.1)',
    borderColor: 'rgba(201,168,76,0.2)',
  },
  typeText: { flex: 1 },
  typeTitle: { fontSize: 14, fontWeight: '700', color: OB.t100 },
  typeSub: { fontSize: 12, color: OB.t70, marginTop: 4, lineHeight: 17 },
  check: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkOff: {
    borderWidth: 1.5,
    borderColor: OB.glassBorder,
    backgroundColor: 'transparent',
  },
  checkOn: { backgroundColor: OB.gold, borderWidth: 1.5, borderColor: OB.gold },
  fomo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: OB.r12,
    backgroundColor: 'rgba(255,71,87,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,71,87,0.15)',
    marginTop: 8,
  },
  fomoDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: OB.red,
  },
  fomoText: {
    flex: 1,
    fontSize: 10,
    fontWeight: '600',
    color: 'rgba(255,107,118,0.9)',
  },
  memberSignInRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    paddingBottom: 2,
  },
  memberSignInPrompt: {
    fontSize: 13,
    color: OB.t45,
  },
  memberSignInLink: {
    fontSize: 13,
    fontWeight: '700',
    color: OB.teal,
  },
});
