import { TRUWELL_LOGO } from '@/lib/brandAssets';
import { Image } from 'expo-image';
import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

interface Props {
  size?: number;
}

export default function TruWellShieldAnimated({ size = 90 }: Props) {
  const floatY = useSharedValue(0);
  const ring1Rotate = useSharedValue(0);
  const ring2Rotate = useSharedValue(0);
  const pulseScale = useSharedValue(0.92);
  const pulseOpacity = useSharedValue(1);

  useEffect(() => {
    floatY.value = withRepeat(
      withSequence(
        withTiming(-8, { duration: 2000, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 2000, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      false
    );

    ring1Rotate.value = withRepeat(
      withTiming(360, { duration: 14000, easing: Easing.linear }),
      -1,
      false
    );

    ring2Rotate.value = withRepeat(
      withTiming(-360, { duration: 20000, easing: Easing.linear }),
      -1,
      false
    );

    pulseScale.value = withRepeat(
      withSequence(
        withTiming(1.55, { duration: 2200, easing: Easing.out(Easing.quad) }),
        withTiming(0.92, { duration: 0 })
      ),
      -1,
      false
    );
    pulseOpacity.value = withRepeat(
      withSequence(
        withTiming(0, { duration: 2200, easing: Easing.out(Easing.quad) }),
        withTiming(1, { duration: 0 })
      ),
      -1,
      false
    );
  }, [floatY, pulseOpacity, pulseScale, ring1Rotate, ring2Rotate]);

  const floatStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: floatY.value }],
  }));

  const ring1Style = useAnimatedStyle(() => ({
    transform: [{ rotate: `${ring1Rotate.value}deg` }],
  }));

  const ring2Style = useAnimatedStyle(() => ({
    transform: [{ rotate: `${ring2Rotate.value}deg` }],
  }));

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
    opacity: pulseOpacity.value,
  }));

  const containerSize = size + 48;

  return (
    <View style={{ width: containerSize, height: containerSize, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View style={[StyleSheet.absoluteFill, ring1Style, { alignItems: 'center', justifyContent: 'center' }]}>
        <View
          style={{
            width: size + 30,
            height: size + 30,
            borderRadius: (size + 30) / 2,
            borderWidth: 1,
            borderColor: 'rgba(201,168,76,0.20)',
            borderStyle: 'dashed',
          }}
        />
      </Animated.View>

      <Animated.View style={[StyleSheet.absoluteFill, ring2Style, { alignItems: 'center', justifyContent: 'center' }]}>
        <View
          style={{
            width: size + 46,
            height: size + 46,
            borderRadius: (size + 46) / 2,
            borderWidth: 1,
            borderColor: 'rgba(0,229,200,0.12)',
          }}
        />
      </Animated.View>

      <Animated.View style={[pulseStyle, StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }]}>
        <View
          style={{
            width: size + 8,
            height: size + 8,
            borderRadius: (size + 8) / 2,
            borderWidth: 1.5,
            borderColor: 'rgba(201,168,76,0.38)',
          }}
        />
      </Animated.View>

      <Animated.View style={floatStyle}>
        <Image
          source={TRUWELL_LOGO}
          style={{ width: size, height: size }}
          contentFit="contain"
          accessibilityLabel="TruWell AI"
        />
      </Animated.View>
    </View>
  );
}
