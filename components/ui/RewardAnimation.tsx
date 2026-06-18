/**
 * RewardAnimation.tsx
 *
 * Exports:
 *  - WaterSplashEffect  — local overlay in WaterCupGrid
 *  - TaskBurstEffect    — local overlay in task rows
 *  - RewardAnimationPortal — global overlay, mounted once in _layout.tsx
 *
 * Global animations are driven by the rewardAnimStore queue.
 */

import React, { useEffect } from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withDecay,
  withSequence,
  withSpring,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import Svg, { Circle, Path } from 'react-native-svg';

import { useTheme } from '@/theme/ThemeContext';
import { useRewardAnimStore } from '@/stores/rewardAnimStore';
import type { GlobalAnimEvent } from '@/stores/rewardAnimStore';

const { width: SW, height: SH } = Dimensions.get('window');

// ─────────────────────────────────────────────────────────────────────────────
// ANIMATION 1  —  Water Splash  (local)
// ─────────────────────────────────────────────────────────────────────────────

// Static config outside component — no hooks in maps
const DROPLET_CONFIGS = Array.from({ length: 10 }, (_, i) => ({
  angle:    (i / 10) * 2 * Math.PI,
  distance: 18 + (i % 3) * 10,   // 18 | 28 | 38 px
  delay:    i * 40,
}));

interface DropletProps {
  angle:    number;
  distance: number;
  delay:    number;
  color:    string;
  onDone?:  () => void;
}

function Droplet({ angle, distance, delay, color, onDone }: DropletProps) {
  const tx      = useSharedValue(0);
  const ty      = useSharedValue(0);
  const scale   = useSharedValue(0.2);
  const opacity = useSharedValue(0);

  useEffect(() => {
    const dx = Math.cos(angle) * distance;
    const dy = Math.sin(angle) * distance;

    opacity.value = withDelay(delay, withTiming(1, { duration: 150 }));
    scale.value   = withDelay(
      delay,
      withSpring(1.0, { damping: 8, stiffness: 200 }, () => {
        opacity.value = withTiming(0, { duration: 300 });
        if (onDone) runOnJS(onDone)();
      })
    );
    tx.value = withDelay(delay, withTiming(dx, { duration: 800, easing: Easing.out(Easing.quad) }));
    ty.value = withDelay(delay, withTiming(dy, { duration: 800, easing: Easing.out(Easing.quad) }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateX: tx.value }, { translateY: ty.value }, { scale: scale.value }],
    opacity:   opacity.value,
  }));

  return (
    <Animated.View style={[splashStyles.droplet, style]}>
      <Svg width={10} height={14} viewBox="0 0 10 14">
        <Path d="M5 0 C5 0 0 7 0 10 A5 4 0 0 0 10 10 C10 7 5 0 5 0 Z" fill={color} />
      </Svg>
    </Animated.View>
  );
}

interface WaterSplashProps {
  active:  boolean;
  onDone:  () => void;
}

export function WaterSplashEffect({ active, onDone }: WaterSplashProps) {
  const { theme } = useTheme();
  if (!active) return null;

  return (
    <View style={splashStyles.root} pointerEvents="none">
      {DROPLET_CONFIGS.map((d, i) => (
        <Droplet
          key={i}
          angle={d.angle}
          distance={d.distance}
          delay={d.delay}
          color={theme.teal}
          onDone={i === 0 ? onDone : undefined}
        />
      ))}
    </View>
  );
}

const splashStyles = StyleSheet.create({
  root: {
    position:       'absolute',
    top:            0,
    left:           0,
    width:          0,
    height:         0,
    alignItems:     'center',
    justifyContent: 'center',
    zIndex:         100,
  },
  droplet: { position: 'absolute' },
});

// ─────────────────────────────────────────────────────────────────────────────
// ANIMATION 4  —  Task Burst  (local)
// ─────────────────────────────────────────────────────────────────────────────

const BURST_CONFIGS = Array.from({ length: 7 }, (_, i) => ({
  angle: (i / 7) * 2 * Math.PI,
}));

function BurstParticle({
  angle,
  color,
  onDone,
}: {
  angle:   number;
  color:   string;
  onDone?: () => void;
}) {
  const tx      = useSharedValue(0);
  const ty      = useSharedValue(0);
  const opacity = useSharedValue(1);

  useEffect(() => {
    const speed = 28 + Math.random() * 28;
    const dx    = Math.cos(angle) * speed;
    const initVY = Math.sin(angle) * speed;

    tx.value      = withTiming(dx, { duration: 500 });
    ty.value      = withDecay({ velocity: initVY + 60, deceleration: 0.995 }, () => {
      if (onDone) runOnJS(onDone)();
    });
    opacity.value = withDelay(200, withTiming(0, { duration: 500 }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateX: tx.value }, { translateY: ty.value }],
    opacity:   opacity.value,
  }));

  return <Animated.View style={[burstStyles.particle, { backgroundColor: color }, style]} />;
}

interface TaskBurstProps {
  active:  boolean;
  onDone:  () => void;
  colors:  string[];
}

export function TaskBurstEffect({ active, onDone, colors }: TaskBurstProps) {
  if (!active) return null;
  return (
    <View style={burstStyles.root} pointerEvents="none">
      {BURST_CONFIGS.map((d, i) => (
        <BurstParticle
          key={i}
          angle={d.angle}
          color={colors[i % colors.length] ?? '#fff'}
          onDone={i === 0 ? onDone : undefined}
        />
      ))}
    </View>
  );
}

const burstStyles = StyleSheet.create({
  root: {
    position:       'absolute',
    top:            0,
    left:           0,
    width:          0,
    height:         0,
    alignItems:     'center',
    justifyContent: 'center',
    zIndex:         100,
  },
  particle: { position: 'absolute', width: 6, height: 6, borderRadius: 3 },
});

// ─────────────────────────────────────────────────────────────────────────────
// ANIMATION 2  —  Breathing Complete  (global, full-screen)
// ─────────────────────────────────────────────────────────────────────────────

const RING_DIAMETER = Math.round(Math.sqrt(SW * SW + SH * SH) * 2.1);

function BreathingRing({
  idx,
  diameter,
  color,
}: {
  idx:      number;
  diameter: number;
  color:    string;
}) {
  const scale   = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    const delay = idx * 150;
    opacity.value = withDelay(delay, withTiming(0.08, { duration: 300 }));
    scale.value   = withDelay(delay, withTiming(1, { duration: 1100, easing: Easing.out(Easing.quad) }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity:   opacity.value,
  }));

  return (
    <Animated.View
      style={[
        breathStyles.ring,
        { width: diameter, height: diameter, borderRadius: diameter / 2, backgroundColor: color },
        style,
      ]}
    />
  );
}

function BreathingCompleteAnim({
  event,
  onDone,
}: {
  event:  GlobalAnimEvent;
  onDone: () => void;
}) {
  const { theme }       = useTheme();
  const checkScale      = useSharedValue(0);
  const xpY             = useSharedValue(0);
  const xpOpacity       = useSharedValue(0);
  const overlayOpacity  = useSharedValue(1);

  useEffect(() => {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    checkScale.value = withDelay(200, withSpring(1, { damping: 10, stiffness: 140 }));
    xpY.value        = withDelay(400, withTiming(-60, { duration: 1200 }));
    xpOpacity.value  = withDelay(400, withSequence(
      withTiming(1, { duration: 150 }),
      withDelay(600, withTiming(0, { duration: 400 }))
    ));
    overlayOpacity.value = withDelay(1700, withTiming(0, { duration: 300 }, () => {
      runOnJS(onDone)();
    }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkStyle   = useAnimatedStyle(() => ({ transform: [{ scale: checkScale.value }] }));
  const xpStyle      = useAnimatedStyle(() => ({
    transform: [{ translateY: xpY.value }],
    opacity:   xpOpacity.value,
  }));
  const overlayStyle = useAnimatedStyle(() => ({ opacity: overlayOpacity.value }));

  return (
    <Animated.View style={[breathStyles.overlay, overlayStyle]} pointerEvents="none">
      {[0, 1, 2, 3, 4].map((i) => (
        <BreathingRing key={i} idx={i} diameter={RING_DIAMETER} color={theme.purple} />
      ))}

      <Animated.View style={checkStyle}>
        <Svg width={64} height={64} viewBox="0 0 64 64">
          <Circle cx={32} cy={32} r={32} fill={`${theme.purple}28`} />
          <Path
            d="M18 32 L27 41 L46 22"
            stroke={theme.purple}
            strokeWidth={3.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </Svg>
      </Animated.View>

      <Animated.Text style={[breathStyles.xpLabel, { color: theme.gold }, xpStyle]}>
        +10 XP
      </Animated.Text>
    </Animated.View>
  );
}

const breathStyles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems:     'center',
    justifyContent: 'center',
    zIndex:         999,
  },
  ring: { position: 'absolute' },
  xpLabel: {
    fontSize:    22,
    fontWeight:  '900',
    marginTop:   12,
    zIndex:      2,
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// ANIMATION 3  —  XP Float  (global)
// ─────────────────────────────────────────────────────────────────────────────

function XpFloatAnim({
  event,
  onDone,
}: {
  event:  GlobalAnimEvent;
  onDone: () => void;
}) {
  const { theme } = useTheme();
  const y         = useSharedValue(0);
  const opacity   = useSharedValue(0);

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 100 });
    y.value       = withTiming(-60, { duration: 1200 });
    opacity.value = withSequence(
      withTiming(1,  { duration: 100 }),
      withDelay(700, withTiming(0, { duration: 400 }, () => runOnJS(onDone)()))
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: y.value }],
    opacity:   opacity.value,
  }));

  return (
    <Animated.Text style={[xpStyles.text, { color: theme.gold }, style]} pointerEvents="none">
      +{event.xp ?? 0} XP
    </Animated.Text>
  );
}

const xpStyles = StyleSheet.create({
  text: {
    position:   'absolute',
    top:        SH * 0.44,
    left:       0,
    right:      0,
    textAlign:  'center',
    fontSize:   18,
    fontWeight: '900',
    zIndex:     998,
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// Portal — mount once in _layout.tsx
// ─────────────────────────────────────────────────────────────────────────────

export function RewardAnimationPortal() {
  const queue  = useRewardAnimStore((s) => s.queue);
  const remove = useRewardAnimStore((s) => s.remove);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {queue.map((event) => {
        const done = () => remove(event.id);
        if (event.type === 'breathing_complete') {
          return <BreathingCompleteAnim key={event.id} event={event} onDone={done} />;
        }
        if (event.type === 'xp_gained') {
          return <XpFloatAnim key={event.id} event={event} onDone={done} />;
        }
        return null;
      })}
    </View>
  );
}
