import React, { memo, useMemo } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import Svg, { Circle, Line, Path } from 'react-native-svg';

/** Spec: circuit texture SVG at 7% opacity on all onboarding screens (line 565). */
const TEXTURE_OPACITY = 0.07;
const STROKE = 'rgba(240,244,255,0.55)';

function CircuitTextureInner() {
  const { width, height } = useWindowDimensions();

  const nodes = useMemo(
    () => [
      { cx: width * 0.12, cy: height * 0.18, r: 2.5 },
      { cx: width * 0.38, cy: height * 0.12, r: 2 },
      { cx: width * 0.72, cy: height * 0.22, r: 2.5 },
      { cx: width * 0.88, cy: height * 0.42, r: 2 },
      { cx: width * 0.08, cy: height * 0.52, r: 2 },
      { cx: width * 0.28, cy: height * 0.64, r: 2.5 },
      { cx: width * 0.55, cy: height * 0.58, r: 2 },
      { cx: width * 0.78, cy: height * 0.72, r: 2.5 },
      { cx: width * 0.42, cy: height * 0.86, r: 2 },
      { cx: width * 0.92, cy: height * 0.88, r: 2 },
    ],
    [width, height]
  );

  const traces = useMemo(
    () => [
      `M ${width * 0.12} ${height * 0.18} H ${width * 0.38} V ${height * 0.12} H ${width * 0.72}`,
      `M ${width * 0.72} ${height * 0.22} V ${height * 0.42} H ${width * 0.88}`,
      `M ${width * 0.08} ${height * 0.52} H ${width * 0.28} V ${height * 0.64}`,
      `M ${width * 0.28} ${height * 0.64} H ${width * 0.55} V ${height * 0.58} H ${width * 0.78}`,
      `M ${width * 0.78} ${height * 0.72} V ${height * 0.88} H ${width * 0.42}`,
      `M ${width * 0.55} ${height * 0.58} V ${height * 0.86}`,
    ],
    [width, height]
  );

  return (
    <View pointerEvents="none" style={styles.layer} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Svg width={width} height={height} style={styles.svg}>
        {traces.map((d, i) => (
          <Path key={`trace-${i}`} d={d} stroke={STROKE} strokeWidth={1} fill="none" />
        ))}
        <Line x1={0} y1={height * 0.35} x2={width * 0.22} y2={height * 0.35} stroke={STROKE} strokeWidth={1} />
        <Line x1={width * 0.65} y1={height * 0.48} x2={width} y2={height * 0.48} stroke={STROKE} strokeWidth={1} />
        <Line x1={width * 0.18} y1={height * 0.78} x2={width * 0.5} y2={height * 0.78} stroke={STROKE} strokeWidth={1} />
        {nodes.map((n, i) => (
          <Circle key={`node-${i}`} cx={n.cx} cy={n.cy} r={n.r} fill={STROKE} />
        ))}
      </Svg>
    </View>
  );
}

export const CircuitTexture = memo(CircuitTextureInner);

const styles = StyleSheet.create({
  layer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
  },
  svg: {
    opacity: TEXTURE_OPACITY,
  },
});
