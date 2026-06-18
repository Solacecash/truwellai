import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Line, G, Rect } from 'react-native-svg';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import type { VisualProps } from './types';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

/** Tactical reticle visual. Outer ring rotates during inhale/exhale, locks on hold. */
export function MilitaryVisual({
  phase,
  phaseDurationMs,
  size = 240,
}: VisualProps) {
  const rotation = useSharedValue(0);
  const innerScale = useSharedValue(0.85);
  const centerGlow = useSharedValue(0.4);

  useEffect(() => {
    cancelAnimation(rotation);
    cancelAnimation(innerScale);
    cancelAnimation(centerGlow);

    if (phase === 'inhale') {
      innerScale.value = withTiming(1.05, {
        duration: phaseDurationMs,
        easing: Easing.bezier(0.4, 0, 0.2, 1),
      });
      rotation.value = withRepeat(
        withTiming(360, { duration: 8000, easing: Easing.linear }),
        -1,
        false
      );
      centerGlow.value = withTiming(0.9, { duration: phaseDurationMs });
    } else if (phase === 'hold' || phase === 'hold2') {
      centerGlow.value = withRepeat(
        withTiming(1, { duration: 500, easing: Easing.inOut(Easing.quad) }),
        -1,
        true
      );
    } else if (phase === 'exhale') {
      innerScale.value = withTiming(0.85, {
        duration: phaseDurationMs,
        easing: Easing.bezier(0.4, 0, 0.2, 1),
      });
      rotation.value = withRepeat(
        withTiming(-360, { duration: 8000, easing: Easing.linear }),
        -1,
        false
      );
      centerGlow.value = withTiming(0.5, { duration: phaseDurationMs });
    } else {
      innerScale.value = withTiming(0.85, { duration: 400 });
      centerGlow.value = withTiming(0.4, { duration: 400 });
    }
  }, [phase, phaseDurationMs, rotation, innerScale, centerGlow]);

  const reticleStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }, { scale: innerScale.value }],
  }));

  const centerProps = useAnimatedProps(() => {
    const color =
      phase === 'inhale'
        ? '#2ED573'
        : phase === 'exhale'
        ? '#1E90FF'
        : '#C9A84C';
    return { fill: color, opacity: 0.4 + centerGlow.value * 0.6 };
  });

  return (
    <View style={[styles.root, { width: size, height: size }]}>
      {/* Tactical grid backdrop */}
      <Svg width={size} height={size} viewBox="0 0 240 240" style={StyleSheet.absoluteFill}>
        <G opacity={0.06}>
          {Array.from({ length: 12 }).map((_, i) => (
            <Line
              key={`h${i}`}
              x1={0}
              y1={i * 20}
              x2={240}
              y2={i * 20}
              stroke="#00E5C8"
              strokeWidth={0.5}
            />
          ))}
          {Array.from({ length: 12 }).map((_, i) => (
            <Line
              key={`v${i}`}
              x1={i * 20}
              y1={0}
              x2={i * 20}
              y2={240}
              stroke="#00E5C8"
              strokeWidth={0.5}
            />
          ))}
        </G>
      </Svg>

      <Animated.View style={[StyleSheet.absoluteFill, reticleStyle]}>
        <Svg width={size} height={size} viewBox="0 0 240 240">
          <Circle
            cx="120"
            cy="120"
            r="96"
            stroke="rgba(0,229,200,0.45)"
            strokeWidth={1.5}
            fill="transparent"
          />
          <Circle
            cx="120"
            cy="120"
            r="72"
            stroke="rgba(0,229,200,0.25)"
            strokeWidth={1}
            fill="transparent"
            strokeDasharray="4 4"
          />
          {/* Crosshairs */}
          <Line x1="120" y1="10" x2="120" y2="40" stroke="#00E5C8" strokeWidth={2} />
          <Line x1="120" y1="200" x2="120" y2="230" stroke="#00E5C8" strokeWidth={2} />
          <Line x1="10" y1="120" x2="40" y2="120" stroke="#00E5C8" strokeWidth={2} />
          <Line x1="200" y1="120" x2="230" y2="120" stroke="#00E5C8" strokeWidth={2} />
          {/* Degree ticks */}
          {Array.from({ length: 24 }).map((_, i) => {
            const a = (i / 24) * Math.PI * 2;
            const x1 = 120 + Math.cos(a) * 96;
            const y1 = 120 + Math.sin(a) * 96;
            const x2 = 120 + Math.cos(a) * 102;
            const y2 = 120 + Math.sin(a) * 102;
            return (
              <Line
                key={i}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="rgba(0,229,200,0.55)"
                strokeWidth={1.2}
              />
            );
          })}
          <Rect
            x="116"
            y="116"
            width="8"
            height="8"
            fill="#C9A84C"
            opacity={0.8}
          />
          <AnimatedCircle cx="120" cy="120" r="18" animatedProps={centerProps} />
        </Svg>
      </Animated.View>

      <Text style={styles.protocol}>TACTICAL BREATHING PROTOCOL</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  protocol: {
    position: 'absolute',
    bottom: -8,
    color: '#00E5C8',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 3,
  },
});
