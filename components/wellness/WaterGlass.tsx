/**
 * Realistic single-serving water glass with animated water inside.
 *
 * Renders a tapered-glass SVG outline and, when `filled`, animates a teal
 * water mass rising from the bottom with a gentle surface wave, a highlight
 * streak on the side, and a few rising bubbles. When `filled` is toggled off
 * the water drains back down smoothly.
 *
 * Designed to be used inside the `WaterCupGrid` — one per cup. Sizing is
 * controlled with the `width` / `height` props so the grid can flex.
 */

import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedProps,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Svg, {
  Circle,
  ClipPath,
  Defs,
  LinearGradient,
  Path,
  Rect,
  Stop,
} from 'react-native-svg';

const AnimatedRect = Animated.createAnimatedComponent(Rect);
const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface Props {
  filled: boolean;
  width?: number;
  height?: number;
  accentColor?: string;
  glassColor?: string;
  highlight?: string;
}

/**
 * Natural tapered-glass silhouette. Numbers are expressed in a 40x56 viewBox
 * so the caller can scale via width/height without distorting proportions.
 */
const VIEW_W = 40;
const VIEW_H = 56;

// Outer glass path (rim at top, narrow foot at bottom).
const GLASS_OUTLINE = `
  M 6 4
  L 34 4
  L 31 52
  Q 31 53.5 29 53.5
  L 11 53.5
  Q 9 53.5 9 52
  Z
`;

// Inner clip region (a touch inside the outline) — keeps water/highlights
// from bleeding past the glass edge.
const GLASS_INNER = `
  M 7 5.5
  L 33 5.5
  L 30 51.5
  Q 30 52 29 52
  L 11 52
  Q 10 52 10 51.5
  Z
`;

export function WaterGlass({
  filled,
  width = 40,
  height = 56,
  accentColor = '#00E5C8',
  glassColor = 'rgba(255,255,255,0.22)',
  highlight = 'rgba(255,255,255,0.35)',
}: Props) {
  // Level: 0 = empty, 1 = full.
  const level = useSharedValue(filled ? 1 : 0);
  // Surface wobble (subtle horizontal drift of the wave).
  const wave = useSharedValue(0);
  // Bubble animation progress (0..1 repeating).
  const bubble = useSharedValue(0);

  useEffect(() => {
    level.value = withTiming(filled ? 1 : 0, {
      duration: 620,
      easing: Easing.out(Easing.cubic),
    });
  }, [filled, level]);

  useEffect(() => {
    // Gentle ambient wave — always running so cups never look frozen.
    wave.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1800, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 1800, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      false
    );
    bubble.value = withRepeat(
      withSequence(
        withDelay(200, withTiming(1, { duration: 2600, easing: Easing.out(Easing.quad) })),
        withTiming(0, { duration: 0 })
      ),
      -1,
      false
    );
  }, [wave, bubble]);

  // Water body: an animated rect clipped to the glass interior.
  // Top edge sits at (52 - level * usableHeight), where usable is the vertical
  // water column from just under the rim down to just above the foot.
  const USABLE_TOP = 8;      // water surface when full
  const USABLE_BOTTOM = 51.5; // water surface when empty
  const USABLE_HEIGHT = USABLE_BOTTOM - USABLE_TOP;

  const waterRectProps = useAnimatedProps(() => {
    const top = USABLE_BOTTOM - level.value * USABLE_HEIGHT;
    return {
      y: top,
      height: Math.max(0, USABLE_BOTTOM - top),
    };
  });

  // Surface wave: a shallow sinusoidal path sitting on top of the water rect.
  const surfaceProps = useAnimatedProps(() => {
    const top = USABLE_BOTTOM - level.value * USABLE_HEIGHT;
    const amp = 0.9 + level.value * 0.4; // amplitude in viewbox units
    const phase = wave.value * Math.PI * 2;
    // Sample 7 points across the visible width.
    const pts: { x: number; y: number }[] = [];
    for (let i = 0; i <= 6; i += 1) {
      const x = 8 + (i / 6) * 24;
      const y = top + Math.sin(phase + i * 0.9) * amp;
      pts.push({ x, y });
    }
    const d =
      `M ${pts[0].x} ${pts[0].y}` +
      pts.slice(1).map((p) => ` L ${p.x} ${p.y}`).join('') +
      ` L 32 ${USABLE_BOTTOM} L 8 ${USABLE_BOTTOM} Z`;
    return { d, opacity: level.value };
  });

  // Two bubbles rising from near the bottom. Only visible when filled.
  const bubbleAProps = useAnimatedProps(() => {
    const t = bubble.value;
    const cy = USABLE_BOTTOM - t * USABLE_HEIGHT * level.value;
    const opacity = level.value * (1 - Math.abs(t - 0.5) * 1.6);
    return { cy, opacity: Math.max(0, opacity) };
  });
  const bubbleBProps = useAnimatedProps(() => {
    // Offset phase so bubbles don't rise in lockstep.
    const t = (bubble.value + 0.45) % 1;
    const cy = USABLE_BOTTOM - t * USABLE_HEIGHT * level.value;
    const opacity = level.value * (1 - Math.abs(t - 0.5) * 1.6) * 0.9;
    return { cy, opacity: Math.max(0, opacity) };
  });

  return (
    <View style={[styles.wrap, { width, height }]}>
      <Svg width={width} height={height} viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}>
        <Defs>
          <ClipPath id="glassClip">
            <Path d={GLASS_INNER} />
          </ClipPath>
          <LinearGradient id="waterGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={accentColor} stopOpacity={0.95} />
            <Stop offset="1" stopColor={accentColor} stopOpacity={0.6} />
          </LinearGradient>
          <LinearGradient id="glassGrad" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0"   stopColor={glassColor} stopOpacity={0.55} />
            <Stop offset="0.5" stopColor={glassColor} stopOpacity={0.18} />
            <Stop offset="1"   stopColor={glassColor} stopOpacity={0.55} />
          </LinearGradient>
        </Defs>

        {/* Glass body (behind water) */}
        <Path
          d={GLASS_OUTLINE}
          fill="url(#glassGrad)"
          stroke={accentColor}
          strokeOpacity={0.35}
          strokeWidth={1.2}
        />

        {/* Water fill — clipped to the glass interior */}
        <AnimatedRect
          x={5}
          width={30}
          fill="url(#waterGrad)"
          clipPath="url(#glassClip)"
          animatedProps={waterRectProps}
        />

        {/* Wave surface */}
        <AnimatedPath
          fill={accentColor}
          fillOpacity={0.35}
          clipPath="url(#glassClip)"
          animatedProps={surfaceProps}
        />

        {/* Rising bubbles */}
        <AnimatedCircle
          cx={16}
          r={1.3}
          fill="rgba(255,255,255,0.8)"
          clipPath="url(#glassClip)"
          animatedProps={bubbleAProps}
        />
        <AnimatedCircle
          cx={24}
          r={0.9}
          fill="rgba(255,255,255,0.75)"
          clipPath="url(#glassClip)"
          animatedProps={bubbleBProps}
        />

        {/* Side highlight (front of glass) */}
        <Path
          d="M 11 10 L 12.5 10 L 11.5 48 L 10 48 Z"
          fill={highlight}
          opacity={0.9}
        />

        {/* Rim */}
        <Path
          d="M 6 4 Q 20 2.4 34 4 Q 20 6.2 6 4 Z"
          fill={accentColor}
          fillOpacity={filled ? 0.55 : 0.35}
        />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center' },
});
