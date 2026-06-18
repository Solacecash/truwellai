import { useState } from 'react';
import { LayoutChangeEvent, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@/theme/ThemeContext';
import { hapticSelection } from '@/lib/haptics';

interface Props {
  value: number; // 1..10
  onChange: (v: number) => void;
}

/**
 * Tap-track slider (custom, no native slider dep). Red → teal gradient
 * implemented with 10 adjacent pill segments that fill up to the value.
 */
export function MoodSlider({ value, onChange }: Props) {
  const { theme } = useTheme();
  const [trackWidth, setTrackWidth] = useState(0);

  const onLayout = (e: LayoutChangeEvent) =>
    setTrackWidth(e.nativeEvent.layout.width);

  const handleTap = (stepIndex: number) => {
    const next = stepIndex + 1; // 1..10
    hapticSelection();
    onChange(next);
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.labels}>
        <Text style={[styles.label, { color: theme.red }]}>😰 Stressed</Text>
        <Text style={[styles.label, { color: theme.teal }]}>😌 Calm</Text>
      </View>

      <View style={styles.trackRow} onLayout={onLayout}>
        {Array.from({ length: 10 }).map((_, i) => {
          const active = i < value;
          const color = interpolate(i / 9, theme.red, theme.teal);
          return (
            <Pressable
              key={i}
              onPress={() => handleTap(i)}
              style={[
                styles.segment,
                {
                  backgroundColor: active ? color : 'rgba(255,255,255,0.08)',
                  borderColor: active ? color : theme.border,
                },
              ]}
            />
          );
        })}
      </View>

      <View style={[styles.thumbRow, { marginTop: 6 }]}>
        <Text style={[styles.thumb, { color: theme.text1, borderColor: theme.gold }]}>
          {value}
        </Text>
        {/* Spacer so the number stays aligned under the correct tick */}
        <View style={{ width: trackWidth * ((value - 1) / 9) }} />
      </View>
    </View>
  );
}

function interpolate(t: number, from: string, to: string): string {
  // Simple hex blend — ignores non-hex inputs gracefully.
  const parse = (c: string) => {
    const h = c.startsWith('#') ? c.slice(1) : c;
    if (h.length === 6) {
      return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
    }
    return [0, 0, 0];
  };
  const [r1, g1, b1] = parse(from);
  const [r2, g2, b2] = parse(to);
  const r = Math.round(r1 + (r2 - r1) * t);
  const g = Math.round(g1 + (g2 - g1) * t);
  const b = Math.round(b1 + (b2 - b1) * t);
  return `rgb(${r},${g},${b})`;
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
  },
  labels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  label: {
    fontSize: 11,
    fontWeight: '800',
  },
  trackRow: {
    flexDirection: 'row',
    gap: 4,
  },
  segment: {
    flex: 1,
    height: 12,
    borderRadius: 6,
    borderWidth: 1,
  },
  thumbRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  thumb: {
    fontSize: 12,
    fontWeight: '900',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 2,
  },
});
