import { LinearGradient } from 'expo-linear-gradient';
import React, { memo, useEffect } from 'react';
import { LayoutChangeEvent, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { OB } from '../tokens';

const SIDE_PAD = 44;

type Props = {
  totalSteps?: number;
  currentStep: number;
  /** Defaults to gold gradient (onboarding wizard). Use psychBrand gradient for psychological flow. */
  gradientColors?: readonly [string, string];
};

type CellProps = {
  index: number;
  currentStep: number;
  gradientColors: readonly [string, string];
};

function SegmentCell({ index, currentStep, gradientColors }: CellProps) {
  const done = index < currentStep;
  const active = index === currentStep;

  const trackW = useSharedValue(0);
  const progress = useSharedValue(0);

  useEffect(() => {
    if (!active) return;
    progress.value = 0;
    progress.value = withTiming(1, {
      duration: 7000,
      easing: Easing.linear,
    });
  }, [active, progress]);

  const onLayout = (e: LayoutChangeEvent) => {
    trackW.value = e.nativeEvent.layout.width;
  };

  const fillStyle = useAnimatedStyle(() => ({
    width: trackW.value * progress.value,
  }));

  return (
    <View style={styles.segment}>
      <View style={styles.track} onLayout={onLayout}>
        {done ? (
          <LinearGradient
            colors={[gradientColors[0], gradientColors[1]]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={StyleSheet.absoluteFillObject}
          />
        ) : null}
        {active ? (
          <Animated.View style={[styles.activeFill, fillStyle]}>
            <LinearGradient
              colors={[gradientColors[0], gradientColors[1]]}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={styles.activeGradient}
            />
          </Animated.View>
        ) : null}
      </View>
    </View>
  );
}

function SegmentedIndicatorInner({
  totalSteps = 5,
  currentStep,
  gradientColors = [OB.goldDark, OB.gold],
}: Props) {
  return (
    <View style={styles.padWrap}>
      <View style={styles.row}>
        {Array.from({ length: totalSteps }, (_, index) => (
          <SegmentCell
            key={index}
            index={index}
            currentStep={currentStep}
            gradientColors={gradientColors}
          />
        ))}
      </View>
    </View>
  );
}

export const SegmentedIndicator = memo(SegmentedIndicatorInner);

const styles = StyleSheet.create({
  padWrap: {
    width: '100%',
    paddingHorizontal: SIDE_PAD,
  },
  row: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: 10,
    width: '100%',
  },
  segment: {
    flex: 1,
  },
  track: {
    height: 3,
    borderRadius: 3,
    overflow: 'hidden',
    backgroundColor: OB.t10,
  },
  trackFuture: {
    backgroundColor: OB.t10,
  },
  activeFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    borderRadius: 3,
    overflow: 'hidden',
  },
  activeGradient: {
    height: '100%',
    minWidth: '100%',
  },
});
