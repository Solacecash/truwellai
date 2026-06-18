import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  runOnJS,
  useAnimatedProps,
  useAnimatedReaction,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';

import { OB } from '@/components/onboarding/tokens';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

type Props = {
  score: number;
  max?: number;
  size?: number;
  color?: string;
  label?: string;
  onCountComplete?: () => void;
};

export function ScoreRingSimple({
  score,
  max = 100,
  size = 168,
  color = OB.teal,
  label,
  onCountComplete,
}: Props) {
  const stroke = 12;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = useSharedValue(0);
  const [displayScore, setDisplayScore] = useState(0);

  useEffect(() => {
    progress.value = 0;
    setDisplayScore(0);
    progress.value = withTiming(Math.min(1, score / max), { duration: 1200 });
    const t = setTimeout(() => onCountComplete?.(), 1200);
    return () => clearTimeout(t);
  }, [max, onCountComplete, progress, score]);

  useAnimatedReaction(
    () => Math.round(progress.value * score),
    (val, prev) => {
      if (val !== prev) runOnJS(setDisplayScore)(val);
    },
    [score]
  );

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - progress.value),
  }));

  return (
    <View style={styles.wrap}>
      <Svg width={size} height={size}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(255,255,255,0.10)"
          strokeWidth={stroke}
          fill="none"
        />
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${circumference} ${circumference}`}
          animatedProps={animatedProps}
          rotation={-90}
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      <View style={StyleSheet.absoluteFillObject}>
        <View style={styles.center}>
          <Text style={styles.score}>{displayScore}</Text>
          {label ? <Text style={styles.label}>{label}</Text> : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  score: { color: OB.t100, fontSize: 44, fontWeight: '900', fontFamily: OB.fontHead },
  label: { color: OB.t45, fontSize: 12, fontWeight: '700', marginTop: 4, fontFamily: OB.fontBody },
});
