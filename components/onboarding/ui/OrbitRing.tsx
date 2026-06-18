import React, { memo, useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

export type OrbitDirection = 'cw' | 'ccw';

type Props = {
  size: number;
  borderColor: string;
  duration: number;
  direction: OrbitDirection;
  dotColor?: string;
  dotSize?: number;
};

function OrbitRingInner({
  size,
  borderColor,
  duration,
  direction,
  dotColor,
  dotSize = 6,
}: Props) {
  const rotation = useSharedValue(0);

  useEffect(() => {
    const toValue = direction === 'cw' ? 360 : -360;
    rotation.value = withRepeat(
      withTiming(toValue, {
        duration: duration * 1000,
        easing: Easing.linear,
      }),
      -1,
      false
    );
  }, [direction, duration, rotation]);

  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const half = size / 2;
  const dotHalf = dotSize / 2;

  return (
    <View
      style={[
        styles.wrap,
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
          styles.ring,
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
              styles.dot,
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

export const OrbitRing = memo(OrbitRingInner);

const styles = StyleSheet.create({
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
