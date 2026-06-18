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
import Svg, { Circle, Path } from 'react-native-svg';

import { OB } from './tokens';

const AnimatedView = Animated.createAnimatedComponent(View);

type Props = {
  size?: number;
  animated?: boolean;
  showCheckmark?: boolean;
  /** Delay in ms before float loop starts (e.g. after splash entry). */
  floatDelayMs?: number;
};

function TruWellShieldInner({
  size = 120,
  animated = false,
  showCheckmark = false,
  floatDelayMs = 0,
}: Props) {
  const floatY = useSharedValue(0);

  useEffect(() => {
    if (!animated) return;
    const t = setTimeout(() => {
      floatY.value = withRepeat(
        withSequence(
          withTiming(-9, { duration: 1750, easing: Easing.inOut(Easing.quad) }),
          withTiming(0, { duration: 1750, easing: Easing.inOut(Easing.quad) })
        ),
        -1,
        false
      );
    }, floatDelayMs);
    return () => clearTimeout(t);
  }, [animated, floatDelayMs, floatY]);

  const wrapStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: floatY.value }],
  }));

  const logo = (
    <View
      style={[
        styles.shadow,
        {
          width: size,
          height: size,
        },
      ]}
    >
      <Image
        source={TRUWELL_LOGO}
        style={{ width: size, height: size }}
        contentFit="contain"
        accessibilityLabel="TruWell AI"
      />
      {showCheckmark ? (
        <View style={[styles.checkBadge, { width: size * 0.28, height: size * 0.28, borderRadius: size * 0.14 }]}>
          <Svg width={size * 0.16} height={size * 0.16} viewBox="0 0 24 24">
            <Circle cx={12} cy={12} r={11} fill={OB.teal} />
            <Path
              d="M7 12l3 3 7-7"
              stroke="#FFFFFF"
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          </Svg>
        </View>
      ) : null}
    </View>
  );

  if (animated) {
    return <AnimatedView style={wrapStyle}>{logo}</AnimatedView>;
  }
  return logo;
}

export const TruWellShield = memo(TruWellShieldInner);

const styles = StyleSheet.create({
  shadow: {
    shadowColor: OB.gold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 16,
    elevation: 10,
  },
  checkBadge: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    backgroundColor: '#020A14',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: OB.teal,
  },
});
