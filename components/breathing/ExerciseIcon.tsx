import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  Easing,
  interpolate,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import Svg, {
  Circle,
  Defs,
  Ellipse,
  Path,
  RadialGradient,
  Rect,
  Stop,
} from 'react-native-svg';
import type { BreathExercise } from '@/stores/breathingStore';

const ACircle = Animated.createAnimatedComponent(Circle);
const AEllipse = Animated.createAnimatedComponent(Ellipse);

interface Props {
  visualType: BreathExercise['visualType'];
  color: string;
  size?: number;
  /** When false the icon freezes in its resting pose. Defaults to true. */
  animated?: boolean;
}

export function ExerciseIcon({ visualType, color, size = 44, animated = true }: Props) {
  switch (visualType) {
    case 'lungs':    return <LungsIcon    color={color} size={size} animated={animated} />;
    case 'orb':      return <OrbIcon      color={color} size={size} animated={animated} />;
    case 'pin':      return <PinIcon      color={color} size={size} animated={animated} />;
    case 'ring':     return <RingIcon     color={color} size={size} animated={animated} />;
    case 'military': return <MilitaryIcon color={color} size={size} animated={animated} />;
    default:         return <OrbIcon      color={color} size={size} animated={animated} />;
  }
}

/* ─── Lungs: two ellipses that expand/contract + trachea ─── */
function LungsIcon({ color, size, animated }: { color: string; size: number; animated: boolean }) {
  const t = useSharedValue(0);
  useEffect(() => {
    if (!animated) return;
    t.value = withRepeat(
      withTiming(1, { duration: 2400, easing: Easing.inOut(Easing.quad) }),
      -1,
      true,
    );
  }, [t, animated]);

  const leftProps = useAnimatedProps(() => ({
    rx: interpolate(t.value, [0, 1], [8.5, 11]),
    ry: interpolate(t.value, [0, 1], [13, 16]),
    opacity: interpolate(t.value, [0, 1], [0.7, 1]),
  }));
  const rightProps = useAnimatedProps(() => ({
    rx: interpolate(t.value, [0, 1], [8.5, 11]),
    ry: interpolate(t.value, [0, 1], [13, 16]),
    opacity: interpolate(t.value, [0, 1], [0.7, 1]),
  }));
  const glowProps = useAnimatedProps(() => ({
    opacity: interpolate(t.value, [0, 1], [0.15, 0.35]),
  }));

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} viewBox="0 0 44 44">
        <Defs>
          <RadialGradient id="lg" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor={color} stopOpacity={0.55} />
            <Stop offset="100%" stopColor={color} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <ACircle cx={22} cy={24} r={20} fill="url(#lg)" animatedProps={glowProps} />
        <Path
          d="M22 8 L22 14 M19 8 L25 8 M22 8 L22 4"
          stroke={color}
          strokeWidth={1.6}
          strokeLinecap="round"
          fill="none"
        />
        <AEllipse cx={15} cy={24} fill={`${color}22`} stroke={color} strokeWidth={1.6} animatedProps={leftProps} />
        <AEllipse cx={29} cy={24} fill={`${color}22`} stroke={color} strokeWidth={1.6} animatedProps={rightProps} />
      </Svg>
    </View>
  );
}

/* ─── Orb: radial glow + pulsing core ─── */
function OrbIcon({ color, size, animated }: { color: string; size: number; animated: boolean }) {
  const t = useSharedValue(0);
  useEffect(() => {
    if (!animated) return;
    t.value = withRepeat(
      withTiming(1, { duration: 2200, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, [t, animated]);

  const outerProps = useAnimatedProps(() => ({
    r: interpolate(t.value, [0, 1], [16, 20]),
    opacity: interpolate(t.value, [0, 1], [0.2, 0.45]),
  }));
  const coreProps = useAnimatedProps(() => ({
    r: interpolate(t.value, [0, 1], [8, 11]),
  }));
  const ringProps = useAnimatedProps(() => ({
    r: interpolate(t.value, [0, 1], [12, 14.5]),
  }));

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} viewBox="0 0 44 44">
        <Defs>
          <RadialGradient id="og" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor={color} stopOpacity={0.75} />
            <Stop offset="60%" stopColor={color} stopOpacity={0.25} />
            <Stop offset="100%" stopColor={color} stopOpacity={0} />
          </RadialGradient>
          <RadialGradient id="oc" cx="40%" cy="35%" r="65%">
            <Stop offset="0%" stopColor="#FFFFFF" stopOpacity={0.45} />
            <Stop offset="100%" stopColor={color} stopOpacity={1} />
          </RadialGradient>
        </Defs>
        <ACircle cx={22} cy={22} fill="url(#og)" animatedProps={outerProps} />
        <ACircle cx={22} cy={22} stroke={color} strokeWidth={1} fill="none" opacity={0.5} animatedProps={ringProps} />
        <ACircle cx={22} cy={22} fill="url(#oc)" animatedProps={coreProps} />
        <Circle cx={18} cy={18} r={2} fill="#FFFFFF" opacity={0.6} />
      </Svg>
    </View>
  );
}

/* ─── Pin: circular track with orbiting dot ─── */
function PinIcon({ color, size, animated }: { color: string; size: number; animated: boolean }) {
  const t = useSharedValue(0);
  useEffect(() => {
    if (!animated) return;
    t.value = withRepeat(
      withTiming(1, { duration: 3000, easing: Easing.linear }),
      -1,
      false,
    );
  }, [t, animated]);

  const rot = useAnimatedStyle(() => ({
    transform: [{ rotate: `${t.value * 360}deg` }],
  }));

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} viewBox="0 0 44 44" style={{ position: 'absolute' }}>
        <Circle cx={22} cy={22} r={16} stroke={`${color}66`} strokeWidth={1.4} fill="none" strokeDasharray="2 3" />
        <Circle cx={22} cy={22} r={16} stroke={`${color}22`} strokeWidth={1} fill="none" />
        <Circle cx={22} cy={22} r={3} fill={color} opacity={0.45} />
      </Svg>
      <Animated.View
        style={[
          { position: 'absolute', width: size, height: size, alignItems: 'center', justifyContent: 'flex-start' },
          rot,
        ]}
      >
        <Svg width={size} height={size} viewBox="0 0 44 44" style={{ position: 'absolute' }}>
          <Circle cx={22} cy={6} r={3.2} fill={color} />
          <Circle cx={22} cy={6} r={5.5} fill={color} opacity={0.25} />
        </Svg>
      </Animated.View>
    </View>
  );
}

/* ─── Ring: progress arc ─── */
function RingIcon({ color, size, animated }: { color: string; size: number; animated: boolean }) {
  const t = useSharedValue(0);
  const C = 2 * Math.PI * 16;
  useEffect(() => {
    if (!animated) return;
    t.value = withRepeat(
      withTiming(1, { duration: 2600, easing: Easing.inOut(Easing.cubic) }),
      -1,
      true,
    );
  }, [t, animated]);

  const arcProps = useAnimatedProps(() => ({
    strokeDashoffset: interpolate(t.value, [0, 1], [C, 0]),
  }));
  const coreProps = useAnimatedProps(() => ({
    r: interpolate(t.value, [0, 1], [3.5, 5.5]),
    opacity: interpolate(t.value, [0, 1], [0.55, 1]),
  }));

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} viewBox="0 0 44 44">
        <Circle cx={22} cy={22} r={16} stroke={`${color}33`} strokeWidth={2} fill="none" />
        <ACircle
          cx={22}
          cy={22}
          r={16}
          stroke={color}
          strokeWidth={2.4}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={`${C} ${C}`}
          rotation={-90}
          originX={22}
          originY={22}
          animatedProps={arcProps}
        />
        <ACircle cx={22} cy={22} fill={color} animatedProps={coreProps} />
      </Svg>
    </View>
  );
}

/* ─── Military: rotating reticle ─── */
function MilitaryIcon({ color, size, animated }: { color: string; size: number; animated: boolean }) {
  const t = useSharedValue(0);
  const pulse = useSharedValue(0);
  useEffect(() => {
    if (!animated) return;
    t.value = withRepeat(
      withTiming(1, { duration: 6000, easing: Easing.linear }),
      -1,
      false,
    );
    pulse.value = withRepeat(
      withTiming(1, { duration: 1600, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, [t, pulse, animated]);

  const rotStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${t.value * 360}deg` }],
  }));
  const centerProps = useAnimatedProps(() => ({
    r: interpolate(pulse.value, [0, 1], [2.5, 4]),
    opacity: interpolate(pulse.value, [0, 1], [0.6, 1]),
  }));

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      {/* Static background */}
      <Svg width={size} height={size} viewBox="0 0 44 44" style={{ position: 'absolute' }}>
        <Rect x={3} y={3} width={38} height={38} rx={8} fill={`${color}0F`} />
      </Svg>

      {/* Rotating reticle — rotated via RN View transform (array-safe on Android) */}
      <Animated.View
        style={[
          { position: 'absolute', width: size, height: size },
          rotStyle,
        ]}
      >
        <Svg width={size} height={size} viewBox="0 0 44 44">
          <Circle cx={22} cy={22} r={16} stroke={color} strokeWidth={1.2} fill="none" />
          <Path
            d="M22 6 L22 10 M22 34 L22 38 M6 22 L10 22 M34 22 L38 22"
            stroke={color}
            strokeWidth={1.5}
            strokeLinecap="round"
          />
          <Path
            d="M12 12 L15 15 M29 15 L32 12 M12 32 L15 29 M29 29 L32 32"
            stroke={color}
            strokeWidth={1}
            opacity={0.5}
          />
        </Svg>
      </Animated.View>

      {/* Static crosshair + pulsing center on top */}
      <Svg width={size} height={size} viewBox="0 0 44 44" style={{ position: 'absolute' }}>
        <Circle cx={22} cy={22} r={8} stroke={color} strokeWidth={1} fill="none" opacity={0.5} />
        <Path d="M22 18 L22 26 M18 22 L26 22" stroke={color} strokeWidth={1.2} opacity={0.75} />
        <ACircle cx={22} cy={22} fill={color} animatedProps={centerProps} />
      </Svg>
    </View>
  );
}
