import { LinearGradient } from 'expo-linear-gradient';
import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { type DimensionValue, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Dimensions } from 'react-native';
import {
  OB,
  TICKER_NAMES,
  TICKER_OUTCOMES,
  TICKER_PRODUCTS,
} from '../tokens';

const { width: SCREEN_W } = Dimensions.get('window');

type Pill = { id: string; name: string; product: string; outcome: string };

type Props = {
  /** Override bottom position (px or percentage per RN DimensionValue). */
  bottom?: DimensionValue;
  /** Full style override for the container (replaces bottomStyle when provided). */
  style?: ViewStyle;
};

function initials(name: string): string {
  const parts = name.replace(/\.$/, '').split(' ');
  const a = parts[0]?.[0] ?? '?';
  const b = parts[1]?.[0] ?? '';
  return (a + b).toUpperCase();
}

function randomPill(): Pill {
  const name = TICKER_NAMES[Math.floor(Math.random() * TICKER_NAMES.length)] ?? 'User';
  const product =
    TICKER_PRODUCTS[Math.floor(Math.random() * TICKER_PRODUCTS.length)] ?? 'product';
  const outcome =
    TICKER_OUTCOMES[Math.floor(Math.random() * TICKER_OUTCOMES.length)] ?? 'scanned';
  return {
    id: `${Date.now()}-${Math.random()}`,
    name,
    product,
    outcome,
  };
}

function TickerPill({
  pill,
  onDone,
}: {
  pill: Pill;
  onDone: (id: string) => void;
}) {
  const slideX = useSharedValue(40);
  const scale = useSharedValue(0.96);
  const opacity = useSharedValue(0);

  useEffect(() => {
    slideX.value = withTiming(0, { duration: 500, easing: Easing.out(Easing.cubic) });
    scale.value = withTiming(1, { duration: 500, easing: Easing.out(Easing.cubic) });
    opacity.value = withTiming(1, { duration: 500 });
    const dismiss = setTimeout(() => {
      slideX.value = withTiming(
        -80,
        { duration: 400, easing: Easing.in(Easing.cubic) },
        (finished) => {
          if (finished) runOnJS(onDone)(pill.id);
        }
      );
      opacity.value = withTiming(0, { duration: 400 });
    }, 3500);
    return () => clearTimeout(dismiss);
  }, [onDone, opacity, pill.id, scale, slideX]);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateX: slideX.value }, { scale: scale.value }],
    opacity: opacity.value,
  }));

  const rest = ` ${pill.product} ${pill.outcome}`;

  return (
    <Animated.View style={[styles.pill, style]}>
      <LinearGradient
        colors={[OB.goldLight, OB.gold]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.avatar}
      >
        <Text style={styles.avatarText}>{initials(pill.name)}</Text>
      </LinearGradient>
      <Text style={styles.pillText} numberOfLines={2}>
        <Text style={styles.nameBold}>{pill.name}</Text>
        <Text style={styles.rest}>{rest}</Text>
      </Text>
    </Animated.View>
  );
}

function ActivityTickerInner({ bottom, style }: Props) {
  const insets = useSafeAreaInsets();
  const [pills, setPills] = useState<Pill[]>([]);

  const removePill = useCallback((id: string) => {
    setPills((prev) => prev.filter((p) => p.id !== id));
  }, []);

  useEffect(() => {
    const first = setTimeout(() => {
      setPills((p) => [...p, randomPill()].slice(-2));
    }, 2000);
    const interval = setInterval(() => {
      setPills((p) => [...p, randomPill()].slice(-2));
    }, 5000);
    return () => {
      clearTimeout(first);
      clearInterval(interval);
    };
  }, []);

  const bottomStyle = useMemo(() => {
    if (style) return {};
    if (bottom !== undefined) return { bottom };
    return { bottom: insets.bottom + 110 };
  }, [bottom, insets.bottom, style]);

  return (
    <View style={[styles.container, bottomStyle, style]} pointerEvents="none">
      {pills.map((p) => (
        <TickerPill key={p.id} pill={p} onDone={removePill} />
      ))}
    </View>
  );
}

export const ActivityTicker = memo(ActivityTickerInner);

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    right: 10,
    // Explicit width is required — without it flex:1 on pillText collapses to 0
    width: Math.min(SCREEN_W - 20, 320),
    zIndex: 60,
    alignItems: 'flex-end',
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(8,20,34,0.92)',
    borderWidth: 1,
    borderColor: 'rgba(201,168,76,0.25)',
    borderRadius: OB.r99,
    paddingVertical: 9,
    paddingHorizontal: 12,
    marginBottom: 6,
    // Pill spans container width so text flex:1 has space to fill
    alignSelf: 'stretch',
  },
  avatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 11,
    fontWeight: '800',
    color: OB.ink,
  },
  pillText: {
    flex: 1,
    fontSize: 11,
    fontWeight: '500',
    color: OB.t70,
    lineHeight: 15,
  },
  nameBold: {
    fontWeight: '700',
    color: OB.goldLight,
  },
  rest: {
    color: OB.t70,
    fontWeight: '500',
  },
});
