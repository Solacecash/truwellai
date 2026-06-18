import { TRUWELL_LOGO } from '@/lib/brandAssets';
import { Image } from 'expo-image';
import React, { memo, useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { OB } from '@/constants/onboardingTheme';

const AnimatedView = Animated.createAnimatedComponent(View);

type ShieldLogoProps = {
  size?: number;
  animated?: boolean;
};

/**
 * Spec ShieldLogo — animated shield with orbit rings (spec lines 73, 219, 233).
 */
function ShieldLogoInner({ size = 92, animated = true }: ShieldLogoProps) {
  const orbit1 = useSharedValue(0);
  const orbit2 = useSharedValue(0);
  const floatY = useSharedValue(0);

  useEffect(() => {
    if (!animated) return;
    orbit1.value = withRepeat(
      withTiming(360, { duration: 9000, easing: Easing.linear }),
      -1,
      false
    );
    orbit2.value = withRepeat(
      withTiming(-360, { duration: 13000, easing: Easing.linear }),
      -1,
      false
    );
    floatY.value = withRepeat(
      withSequence(
        withTiming(-6, { duration: 1600, easing: Easing.inOut(Easing.quad) }),
        withTiming(0, { duration: 1600, easing: Easing.inOut(Easing.quad) })
      ),
      -1,
      false
    );
  }, [animated, floatY, orbit1, orbit2]);

  const floatStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: floatY.value }],
  }));

  const orbit1Style = useAnimatedStyle(() => ({
    transform: [{ rotate: `${orbit1.value}deg` }],
  }));

  const orbit2Style = useAnimatedStyle(() => ({
    transform: [{ rotate: `${orbit2.value}deg` }],
  }));

  const outer = size * 1.35;
  const inner = size * 1.15;

  const logo = (
    <View style={[styles.center, { width: outer, height: outer }]}>
      {animated ? (
        <>
          <AnimatedView
            style={[
              styles.orbit,
              orbit1Style,
              {
                width: outer,
                height: outer,
                borderRadius: outer / 2,
                borderColor: `${OB.teal}55`,
              },
            ]}
          />
          <AnimatedView
            style={[
              styles.orbit,
              orbit2Style,
              {
                width: inner,
                height: inner,
                borderRadius: inner / 2,
                borderColor: `${OB.cyan}44`,
              },
            ]}
          />
        </>
      ) : null}
      <View style={[styles.shieldWrap, { width: size, height: size }]}>
        <Image
          source={TRUWELL_LOGO}
          style={{ width: size, height: size }}
          contentFit="contain"
          accessibilityLabel="TruWell AI"
        />
      </View>
    </View>
  );

  if (animated) {
    return <AnimatedView style={floatStyle}>{logo}</AnimatedView>;
  }
  return logo;
}

export const ShieldLogo = memo(ShieldLogoInner);

const styles = StyleSheet.create({
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  orbit: {
    position: 'absolute',
    borderWidth: 1.5,
    borderStyle: 'dashed',
  },
  shieldWrap: {
    shadowColor: OB.gold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 16,
    elevation: 10,
  },
});
