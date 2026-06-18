import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useTheme } from '@/theme/ThemeContext';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { triggerBreathingComplete, triggerXpGained } from '@/stores/rewardAnimStore';

export type BreathingPattern = 'box' | '4-7-8' | 'wim-hof';
type Phase = 'idle' | 'inhale' | 'hold' | 'exhale' | 'hold2';

interface PatternConfig {
  inhale: number;
  hold: number;
  exhale: number;
  hold2: number;
  cycles: number;
}

const PATTERNS: Record<BreathingPattern, PatternConfig> = {
  box: { inhale: 4000, hold: 4000, exhale: 4000, hold2: 4000, cycles: 4 },
  '4-7-8': { inhale: 4000, hold: 7000, exhale: 8000, hold2: 0, cycles: 4 },
  'wim-hof': { inhale: 1500, hold: 0, exhale: 1500, hold2: 0, cycles: 30 },
};

const PHASE_LABELS: Record<Phase, string> = {
  idle: 'Ready',
  inhale: 'Inhale',
  hold: 'Hold',
  exhale: 'Exhale',
  hold2: 'Hold',
};

interface Props {
  pattern: BreathingPattern;
  onComplete: () => void;
}

export function BreathingCircle({ pattern, onComplete }: Props) {
  const { theme } = useTheme();
  const userId = useAuthStore((s) => s.session?.user.id);
  const scale = useSharedValue(1.0);
  const [phase, setPhase] = useState<Phase>('idle');
  const [countdown, setCountdown] = useState(0);
  const [cycle, setCycle] = useState(0);
  const config = PATTERNS[pattern];
  const countdownTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const phaseTimeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const activeRef = useRef(true);
  const cycleCountRef = useRef(0);

  const bgColor = `rgba(139, 111, 255, 0.10)`;
  const borderColor = `rgba(139, 111, 255, 0.28)`;

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  useEffect(() => {
    activeRef.current = true;
    cycleCountRef.current = 0;
    phaseTimeoutsRef.current = [];

    // Schedule a callback after `delay` ms, only if still active.
    // State setters called here run on the JS thread — safe for Reanimated.
    const after = (fn: () => void, delay: number) => {
      const t = setTimeout(() => {
        if (!activeRef.current) return;
        fn();
      }, delay);
      phaseTimeoutsRef.current.push(t);
    };

    const handleComplete = async () => {
      if (userId) {
        await supabase.from('breathing_sessions').insert({
          user_id: userId,
          pattern,
          duration_seconds: Math.round(
            (config.inhale + config.hold + config.exhale + config.hold2) *
              config.cycles /
              1000
          ),
        });
      }
      triggerBreathingComplete();
      triggerXpGained(10);
      onComplete();
    };

    // Schedules all phase transitions for one full cycle starting at `startDelay`.
    // withTiming is used ONLY for the visual scale — no callbacks, no state inside.
    const scheduleCycle = (startDelay: number) => {
      let t = startDelay;

      after(() => {
        setPhase('inhale');
        setCountdown(Math.round(config.inhale / 1000));
        scale.value = withTiming(1.28, { duration: config.inhale });
      }, t);
      t += config.inhale;

      if (config.hold > 0) {
        after(() => {
          setPhase('hold');
          setCountdown(Math.round(config.hold / 1000));
          scale.value = withTiming(1.28, { duration: config.hold });
        }, t);
        t += config.hold;
      }

      after(() => {
        setPhase('exhale');
        setCountdown(Math.round(config.exhale / 1000));
        scale.value = withTiming(1.0, { duration: config.exhale });
      }, t);
      t += config.exhale;

      if (config.hold2 > 0) {
        after(() => {
          setPhase('hold2');
          setCountdown(Math.round(config.hold2 / 1000));
          scale.value = withTiming(1.0, { duration: config.hold2 });
        }, t);
        t += config.hold2;
      }

      after(() => {
        cycleCountRef.current += 1;
        setCycle(cycleCountRef.current);
        if (cycleCountRef.current >= config.cycles) {
          setPhase('idle');
          void handleComplete();
        } else {
          scheduleCycle(0);
        }
      }, t);
    };

    scheduleCycle(0);

    return () => {
      activeRef.current = false;
      cancelAnimation(scale);
      phaseTimeoutsRef.current.forEach(clearTimeout);
      phaseTimeoutsRef.current = [];
    };
  }, [pattern]);

  // Countdown ticker — decrements every second while a phase is active.
  useEffect(() => {
    if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    if (phase === 'idle' || countdown <= 0) return;

    let remaining = countdown;
    countdownTimerRef.current = setInterval(() => {
      remaining -= 1;
      if (remaining <= 0) {
        clearInterval(countdownTimerRef.current!);
      } else {
        setCountdown(remaining);
      }
    }, 1000);

    return () => {
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    };
  }, [phase]);

  return (
    <View style={styles.wrapper}>
      <Animated.View
        style={[
          styles.circle,
          { backgroundColor: bgColor, borderColor },
          animStyle,
        ]}
      >
        <Text style={styles.emoji}>🫁</Text>
      </Animated.View>
      <Text style={[styles.phaseLabel, { color: theme.text2 }]}>
        {PHASE_LABELS[phase]}
      </Text>
      {countdown > 0 && (
        <Text style={[styles.countdown, { color: theme.text3 }]}>
          {countdown}s
        </Text>
      )}
      <Text style={[styles.cycleCount, { color: theme.text3 }]}>
        {cycle} / {config.cycles}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    gap: 12,
  },
  circle: {
    width: 74,
    height: 74,
    borderRadius: 37,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    fontSize: 26,
  },
  phaseLabel: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  countdown: {
    fontSize: 13,
    fontWeight: '600',
  },
  cycleCount: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
});
