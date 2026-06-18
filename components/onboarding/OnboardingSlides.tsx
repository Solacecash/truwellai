import * as Haptics from 'expo-haptics';
import React, { memo, useCallback, useEffect, useState } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { useOnboardingStore } from '@/stores/onboardingStore';

import { Slide1Revelation } from './slides/Slide1Revelation';
import { Slide2Proof } from './slides/Slide2Proof';
import { Slide3Personalise } from './slides/Slide3Personalise';
import { Slide4Community } from './slides/Slide4Community';
import { Slide5TypeSelect } from './slides/Slide5TypeSelect';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const TOTAL = 5;

type Props = {
  onOpenWizard: () => void;
};

function OnboardingSlidesInner({ onOpenWizard }: Props) {
  const currentSlide = useOnboardingStore((s) => s.currentSlide);
  const setCurrentSlide = useOnboardingStore((s) => s.setCurrentSlide);

  const translateX = useSharedValue(0);
  const containerOp = useSharedValue(0);
  const idxSV = useSharedValue(0);
  const [activeSlide, setActiveSlide] = useState(0);

  useEffect(() => {
    containerOp.value = withTiming(1, { duration: 600 });
    setActiveSlide(currentSlide);
    idxSV.value = currentSlide;
    translateX.value = withSpring(-currentSlide * SCREEN_W, { damping: 24, stiffness: 200 });
  }, [currentSlide, containerOp, idxSV, translateX]);

  const goToSlide = useCallback(
    (index: number) => {
      const clamped = Math.max(0, Math.min(TOTAL - 1, index));
      idxSV.value = clamped;
      setCurrentSlide(clamped);
      setActiveSlide(clamped);
      translateX.value = withSpring(-clamped * SCREEN_W, { damping: 24, stiffness: 200 });
    },
    [idxSV, setCurrentSlide, translateX]
  );

  const next = useCallback(() => {
    const cs = useOnboardingStore.getState().currentSlide;
    if (cs < TOTAL - 1) {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      goToSlide(cs + 1);
    }
  }, [goToSlide]);

  const skipAll = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    goToSlide(TOTAL - 1);
  }, [goToSlide]);

  const panGesture = Gesture.Pan()
    .activeOffsetX([-12, 12])
    .failOffsetY([-24, 24])
    .onUpdate((e) => {
      const base = -idxSV.value * SCREEN_W;
      const nextX = base + e.translationX;
      const minX = -(TOTAL - 1) * SCREEN_W;
      const maxX = 0;
      if (nextX > maxX) {
        translateX.value = maxX + (nextX - maxX) * 0.2;
      } else if (nextX < minX) {
        translateX.value = minX + (nextX - minX) * 0.2;
      } else {
        translateX.value = nextX;
      }
    })
    .onEnd((e) => {
      const threshold = 55;
      let newIdx = idxSV.value;
      if (e.translationX < -threshold && idxSV.value < TOTAL - 1) {
        newIdx = idxSV.value + 1;
      } else if (e.translationX > threshold && idxSV.value > 0) {
        newIdx = idxSV.value - 1;
      }
      if (newIdx !== idxSV.value) {
        runOnJS(Haptics.selectionAsync)();
      }
      idxSV.value = newIdx;
      translateX.value = withSpring(-newIdx * SCREEN_W, { damping: 22, stiffness: 220 });
      runOnJS(setCurrentSlide)(newIdx);
      runOnJS(setActiveSlide)(newIdx);
    });

  const rowStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const fadeStyle = useAnimatedStyle(() => ({
    opacity: containerOp.value,
  }));

  return (
    <View style={styles.wrapper}>
      <Animated.View
        style={[styles.outer, fadeStyle]}
        pointerEvents="auto"
      >
        <GestureDetector gesture={panGesture}>
          <Animated.View
            style={[styles.track, { width: SCREEN_W * TOTAL, height: SCREEN_H }, rowStyle]}
          >
            <View style={[styles.slot, { width: SCREEN_W, height: SCREEN_H }]}>
              <Slide1Revelation active={activeSlide === 0} onNext={next} onSkip={skipAll} />
            </View>
            <View style={[styles.slot, { width: SCREEN_W, height: SCREEN_H }]}>
              <Slide2Proof active={activeSlide === 1} onNext={next} onSkip={skipAll} />
            </View>
            <View style={[styles.slot, { width: SCREEN_W, height: SCREEN_H }]}>
              <Slide3Personalise active={activeSlide === 2} onNext={next} onSkip={skipAll} />
            </View>
            <View style={[styles.slot, { width: SCREEN_W, height: SCREEN_H }]}>
              <Slide4Community active={activeSlide === 3} onNext={next} onSkip={skipAll} />
            </View>
            <View style={[styles.slot, { width: SCREEN_W, height: SCREEN_H }]}>
              <Slide5TypeSelect active={activeSlide === 4} onOpenWizard={onOpenWizard} />
            </View>
          </Animated.View>
        </GestureDetector>
      </Animated.View>
    </View>
  );
}

export const OnboardingSlides = memo(OnboardingSlidesInner);

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    width: '100%',
    overflow: 'hidden',
  },
  outer: {
    flex: 1,
    width: '100%',
    overflow: 'hidden',
    zIndex: 100,
  },
  track: {
    flexDirection: 'row',
    overflow: 'hidden',
  },
  slot: {
    flex: 1,
    overflow: 'hidden',
  },
});
