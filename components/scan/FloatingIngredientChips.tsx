import { useTheme } from '@/theme/ThemeContext';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

const SAMPLE_CHIPS = [
  { name: 'Refined sugar', risk: 'high' as const },
  { name: 'Palm oil', risk: 'medium' as const },
  { name: 'Wheat flour', risk: 'low' as const },
  { name: 'Eggs', risk: 'low' as const },
  { name: 'Dairy', risk: 'low' as const },
  { name: 'Salt', risk: 'low' as const },
  { name: 'Seed oils', risk: 'medium' as const },
  { name: 'Preservatives', risk: 'medium' as const },
  { name: 'Butter', risk: 'low' as const },
  { name: 'Artificial colors', risk: 'high' as const },
];

interface Props {
  active: boolean;
  disabled?: boolean;
}

/**
 * Ambient "AI is scanning" chips that float in from random edges, hover for
 * a moment, then fade out. Purely theatrical — they're not an analysis result.
 */
export function FloatingIngredientChips({ active, disabled }: Props) {
  const [visible, setVisible] = useState<Array<{ id: number; name: string; risk: 'low' | 'medium' | 'high'; x: number; y: number }>>([]);

  useEffect(() => {
    if (!active || disabled) {
      setVisible([]);
      return;
    }
    let counter = 0;
    const spawn = () => {
      counter += 1;
      const chip = SAMPLE_CHIPS[Math.floor(Math.random() * SAMPLE_CHIPS.length)];
      const x = 20 + Math.random() * 70;
      const y = 15 + Math.random() * 70;
      setVisible((prev) => [
        ...prev.slice(-3),
        { id: counter, name: chip.name, risk: chip.risk, x, y },
      ]);
    };
    spawn();
    const interval = setInterval(spawn, 1800);
    return () => clearInterval(interval);
  }, [active, disabled]);

  if (!active || disabled) return null;

  return (
    <View style={styles.wrap} pointerEvents="none">
      {visible.map((c) => (
        <FadingChip key={c.id} x={c.x} y={c.y} name={c.name} risk={c.risk} />
      ))}
    </View>
  );
}

function FadingChip({
  x,
  y,
  name,
  risk,
}: {
  x: number;
  y: number;
  name: string;
  risk: 'low' | 'medium' | 'high';
}) {
  const { theme } = useTheme();
  const opacity = useSharedValue(0);
  const translate = useSharedValue(8);

  useEffect(() => {
    opacity.value = withSequence(
      withTiming(1, { duration: 260, easing: Easing.out(Easing.quad) }),
      withDelay(1400, withTiming(0, { duration: 420, easing: Easing.in(Easing.quad) }))
    );
    translate.value = withTiming(0, { duration: 260, easing: Easing.out(Easing.quad) });
  }, [opacity, translate]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translate.value }],
  }));

  const color =
    risk === 'high'
      ? { fg: theme.red, bg: `${theme.red}22`, border: `${theme.red}55` }
      : risk === 'medium'
        ? { fg: theme.amber, bg: `${theme.amber}1F`, border: `${theme.amber}55` }
        : { fg: theme.teal, bg: `${theme.teal}1F`, border: `${theme.teal}50` };

  return (
    <Animated.View
      style={[
        styles.chip,
        animatedStyle,
        {
          left: `${x}%`,
          top: `${y}%`,
          backgroundColor: color.bg,
          borderColor: color.border,
        },
      ]}
    >
      <Text style={[styles.chipTxt, { color: color.fg }]}>{name}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { ...StyleSheet.absoluteFillObject },
  chip: {
    position: 'absolute',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
  },
  chipTxt: { fontSize: 10, fontWeight: '800', letterSpacing: 0.2 },
});
