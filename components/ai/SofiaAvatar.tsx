import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Svg, {
  Circle,
  Defs,
  LinearGradient,
  Path,
  Rect,
  Stop,
} from 'react-native-svg';

const ACircle = Animated.createAnimatedComponent(Circle);

export type SofiaAvatarSize = 'small' | 'large' | 'hero';

const SIZE_MAP: Record<SofiaAvatarSize, number> = {
  small: 44,
  large: 72,
  hero: 96,
};

interface Props {
  size?: SofiaAvatarSize;
  teal?: string;
  gold?: string;
  purple?: string;
  thinking?: boolean;
  speaking?: boolean;
  showStatusDot?: boolean;
}

function AIChipIcon({
  teal,
  gold,
  opacity = 1,
}: {
  teal: string;
  gold: string;
  opacity?: number;
}) {
  return (
    <Svg width={28} height={28} viewBox="0 0 28 28" fill="none" opacity={opacity}>
      <Rect x={8} y={8} width={12} height={12} rx={3} fill={`${teal}22`} stroke={teal} strokeWidth={1.2} />
      <Path
        d="M14 5v3M14 20v3M5 14h3M20 14h3M7.5 7.5l2.1 2.1M18.4 18.4l2.1 2.1M20.5 7.5l-2.1 2.1M9.6 18.4l-2.1 2.1"
        stroke={gold}
        strokeWidth={1.1}
        strokeLinecap="round"
        opacity={0.85}
      />
      <Circle cx={11} cy={12} r={1.1} fill={teal} />
      <Circle cx={17} cy={12} r={1.1} fill={teal} />
      <Circle cx={14} cy={16} r={1.1} fill={gold} />
      <Path
        d="M11 12h3M14 13v3"
        stroke={teal}
        strokeWidth={0.9}
        strokeLinecap="round"
        opacity={0.7}
      />
    </Svg>
  );
}

export function SofiaAvatar({
  size = 'large',
  teal = '#00E5C8',
  gold = '#C9A84C',
  purple = '#8B6FFF',
  thinking = false,
  speaking = false,
  showStatusDot,
}: Props) {
  const px = SIZE_MAP[size];
  const showDot = showStatusDot ?? size === 'small';

  const breath = useSharedValue(1);
  const ringScale = useSharedValue(1);
  const ringOpacity = useSharedValue(0.35);
  const chipGlow = useSharedValue(0.4);
  const statusPulse = useSharedValue(1);

  useEffect(() => {
    breath.value = withRepeat(
      withSequence(
        withTiming(1.03, { duration: 2200, easing: Easing.inOut(Easing.quad) }),
        withTiming(1, { duration: 2200, easing: Easing.inOut(Easing.quad) }),
      ),
      -1,
      false,
    );
  }, [breath]);

  useEffect(() => {
    if (thinking || speaking) {
      ringScale.value = withRepeat(
        withSequence(
          withTiming(1.08, { duration: thinking ? 900 : 650, easing: Easing.inOut(Easing.quad) }),
          withTiming(1, { duration: thinking ? 900 : 650, easing: Easing.inOut(Easing.quad) }),
        ),
        -1,
        false,
      );
      ringOpacity.value = withRepeat(
        withSequence(
          withTiming(thinking ? 0.75 : 0.55, { duration: 700 }),
          withTiming(0.25, { duration: 700 }),
        ),
        -1,
        false,
      );
      chipGlow.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 600 }),
          withTiming(0.45, { duration: 600 }),
        ),
        -1,
        true,
      );
      return;
    }

    ringScale.value = withTiming(1, { duration: 240 });
    ringOpacity.value = withTiming(0.35, { duration: 240 });
    chipGlow.value = withTiming(0.4, { duration: 240 });
  }, [thinking, speaking, ringScale, ringOpacity, chipGlow]);

  useEffect(() => {
    if (!showDot) return;
    statusPulse.value = withRepeat(
      withSequence(
        withTiming(1.25, { duration: 900, easing: Easing.inOut(Easing.quad) }),
        withTiming(1, { duration: 900, easing: Easing.inOut(Easing.quad) }),
      ),
      -1,
      false,
    );
  }, [showDot, statusPulse]);

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: breath.value }],
  }));

  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ scale: ringScale.value }],
    opacity: ringOpacity.value,
  }));

  const chipWrapStyle = useAnimatedStyle(() => ({
    opacity: 0.65 + chipGlow.value * 0.35,
  }));

  const statusStyle = useAnimatedStyle(() => ({
    transform: [{ scale: statusPulse.value }],
  }));

  const ringProps = useAnimatedProps(() => ({
    strokeOpacity: ringOpacity.value,
  }));

  const chipScale = px / 44;

  return (
    <View style={{ width: px, height: px }}>
      <Animated.View style={[{ width: px, height: px, alignItems: 'center', justifyContent: 'center' }, containerStyle]}>
        <Animated.View
          style={[
            StyleSheet.absoluteFillObject,
            { alignItems: 'center', justifyContent: 'center' },
            ringStyle,
          ]}
          pointerEvents="none"
        >
          <Svg width={px} height={px} viewBox="0 0 44 44">
            <ACircle
              cx={22}
              cy={22}
              r={20}
              stroke={thinking ? gold : speaking ? teal : purple}
              strokeWidth={1.5}
              fill="none"
              animatedProps={ringProps}
            />
          </Svg>
        </Animated.View>

        <Svg width={px} height={px} viewBox="0 0 44 44">
          <Defs>
            <LinearGradient id="sofiaBg" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor={`${teal}18`} />
              <Stop offset="0.55" stopColor={`${purple}12`} />
              <Stop offset="1" stopColor={`${gold}10`} />
            </LinearGradient>
            <LinearGradient id="sofiaRing" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor={teal} stopOpacity={0.55} />
              <Stop offset="1" stopColor={purple} stopOpacity={0.35} />
            </LinearGradient>
          </Defs>

          <Circle cx={22} cy={22} r={18.5} fill="url(#sofiaBg)" stroke="url(#sofiaRing)" strokeWidth={1.2} />

          <Circle cx={22} cy={22} r={14.5} fill="none" stroke={`${teal}18`} strokeWidth={0.8} strokeDasharray="2 3" />

          <Path
            d="M14 28 C16 24.5 19.5 22.5 22 22.5 C24.5 22.5 28 24.5 30 28"
            stroke={`${teal}30`}
            strokeWidth={1}
            fill="none"
            strokeLinecap="round"
          />
        </Svg>

        <Animated.View
          style={[
            {
              position: 'absolute',
              transform: [{ scale: chipScale * 0.95 }],
            },
            chipWrapStyle,
          ]}
          pointerEvents="none"
        >
          <AIChipIcon teal={teal} gold={gold} />
        </Animated.View>
      </Animated.View>

      {showDot && (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.statusDot,
            {
              width: size === 'small' ? 9 : 11,
              height: size === 'small' ? 9 : 11,
              borderRadius: size === 'small' ? 4.5 : 5.5,
              backgroundColor: thinking ? gold : speaking ? teal : '#2ECC71',
              borderColor: '#FFFFFF',
              borderWidth: 1.5,
              right: size === 'small' ? -1 : 1,
              bottom: size === 'small' ? -1 : 1,
            },
            statusStyle,
          ]}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  statusDot: {
    position: 'absolute',
  },
});

export default SofiaAvatar;
