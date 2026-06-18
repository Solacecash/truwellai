import React, { useEffect } from 'react';
import { View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useTheme } from '@/theme/ThemeContext';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface Props {
  value: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  backgroundStrokeColor?: string;
  children?: React.ReactNode;
  /** When this value changes, the ring animation restarts (e.g. carousel slide focused). */
  animationKey?: number | string;
}

export function RingChart({
  value,
  size = 100,
  strokeWidth = 10,
  color,
  backgroundStrokeColor,
  children,
  animationKey,
}: Props) {
  const { theme } = useTheme();
  const resolvedColor = color ?? theme.teal;
  const resolvedBg = backgroundStrokeColor ?? theme.bg3;

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const targetOffset = circumference - (value / 100) * circumference;

  const dashOffset = useSharedValue(circumference);

  useEffect(() => {
    dashOffset.value = circumference;
    dashOffset.value = withTiming(targetOffset, {
      duration: 2000,
      easing: Easing.bezier(0.4, 0, 0.2, 1),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- dashOffset is a stable Reanimated shared value
  }, [targetOffset, animationKey, circumference]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: dashOffset.value,
  }));

  const center = size / 2;

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        {/* Background circle */}
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={resolvedBg}
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Progress circle */}
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        <AnimatedCircle
          {...({
            cx: center,
            cy: center,
            r: radius,
            stroke: resolvedColor,
            strokeWidth,
            fill: 'none',
            strokeLinecap: 'round',
            strokeDasharray: circumference,
            transform: `rotate(-90, ${center}, ${center})`,
          } as any)}
          animatedProps={animatedProps}
        />
      </Svg>
      {children && (
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: size,
            height: size,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {children}
        </View>
      )}
    </View>
  );
}
