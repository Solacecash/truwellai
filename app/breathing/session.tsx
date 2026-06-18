import { LungsVisual } from '@/components/breathing/visuals/LungsVisual';
import { OrbVisual } from '@/components/breathing/visuals/OrbVisual';
import { PinVisual } from '@/components/breathing/visuals/PinVisual';
import { RingVisual } from '@/components/breathing/visuals/RingVisual';
import { MilitaryVisual } from '@/components/breathing/visuals/MilitaryVisual';
import { PHASE_COLORS } from '@/components/breathing/visuals/types';
import { ParticleField } from '@/components/breathing/ParticleField';
import { useTheme } from '@/theme/ThemeContext';
import { useAuthStore } from '@/stores/authStore';
import {
  useBreathingStore,
  type BreathPhase,
  type BreathExercise,
} from '@/stores/breathingStore';
import { getDurationSeconds } from '@/lib/breathingExercises';
import { recordBreathingSession } from '@/lib/breathingProgress';
import { playBreathingSound } from '@/lib/wellnessSound';
import {
  hapticLight,
  hapticMedium,
  hapticSuccess,
} from '@/lib/haptics';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

type PhaseStep = { phase: BreathPhase; duration: number };

function buildPhaseSequence(ex: BreathExercise): PhaseStep[] {
  const steps: PhaseStep[] = [];
  if (ex.inhale > 0) steps.push({ phase: 'inhale', duration: ex.inhale });
  if (ex.hold1 > 0) steps.push({ phase: 'hold', duration: ex.hold1 });
  if (ex.exhale > 0) steps.push({ phase: 'exhale', duration: ex.exhale });
  if (ex.hold2 > 0) steps.push({ phase: 'hold2', duration: ex.hold2 });
  return steps;
}

function phaseLabel(p: BreathPhase): string {
  if (p === 'inhale') return 'INHALE';
  if (p === 'hold' || p === 'hold2') return 'HOLD';
  if (p === 'exhale') return 'EXHALE';
  return '';
}

export default function BreathingSessionScreen() {
  const { theme } = useTheme();
  const userId = useAuthStore((s) => s.session?.user.id);
  const currentExercise = useBreathingStore((s) => s.currentExercise);
  const stressCheck = useBreathingStore((s) => s.stressCheck);
  const setCurrentPhase = useBreathingStore((s) => s.setCurrentPhase);
  const setSessionReward = useBreathingStore((s) => s.setSessionReward);
  const setCyclesCompletedStore = useBreathingStore((s) => s.setCyclesCompleted);

  const [phaseIdx, setPhaseIdx] = useState(0);
  const [cycle, setCycle] = useState(0);
  const [countdown, setCountdown] = useState(0);
  const [showCue, setShowCue] = useState(true);
  const [completing, setCompleting] = useState(false);

  const startedAtRef = useRef<number>(Date.now());
  const stoppedRef = useRef(false);

  const completeScale = useSharedValue(1);
  const completeOpacity = useSharedValue(1);
  const completeGlow = useSharedValue(0);

  const sequence = useMemo(
    () => (currentExercise ? buildPhaseSequence(currentExercise) : []),
    [currentExercise]
  );

  const totalCycles = currentExercise?.totalCycles ?? 0;

  // Redirect if no exercise selected.
  useEffect(() => {
    if (!currentExercise) {
      router.replace('/breathing' as never);
    }
  }, [currentExercise]);

  // Start session clock.
  useEffect(() => {
    if (!currentExercise) return;
    startedAtRef.current = Date.now();
    stoppedRef.current = false;
    setPhaseIdx(0);
    setCycle(0);
  }, [currentExercise]);

  const currentPhaseStep = sequence[phaseIdx];

  // Drive phase changes + countdown.
  useEffect(() => {
    if (!currentPhaseStep) return;
    setCountdown(currentPhaseStep.duration);
    setCurrentPhase(currentPhaseStep.phase);
    setShowCue(true);

    if (currentPhaseStep.phase === 'inhale') hapticLight();
    else if (currentPhaseStep.phase === 'exhale') hapticLight();
    else hapticMedium();

    const cueTimer = setTimeout(() => setShowCue(false), 3000);

    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    const phaseTimer = setTimeout(() => {
      advancePhase();
    }, currentPhaseStep.duration * 1000);

    return () => {
      clearInterval(interval);
      clearTimeout(phaseTimer);
      clearTimeout(cueTimer);
    };
    // advancePhase is defined below but stable in closure.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phaseIdx, cycle, currentPhaseStep]);

  const advancePhase = useCallback(() => {
    if (stoppedRef.current) return;
    if (phaseIdx < sequence.length - 1) {
      setPhaseIdx(i => i + 1);
      return;
    }
    // Cycle complete.
    hapticSuccess();
    const nextCycle = cycle + 1;
    setCyclesCompletedStore(nextCycle);
    if (nextCycle >= totalCycles) {
      void finishSession(nextCycle);
      return;
    }
    setCycle(nextCycle);
    setPhaseIdx(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phaseIdx, sequence.length, cycle, totalCycles, setCyclesCompletedStore]);

  const finishSession = useCallback(
    async (completedCycles: number) => {
      if (!currentExercise) return;
      stoppedRef.current = true;
      setCompleting(true);

      completeScale.value = withTiming(2.0, { duration: 800 });
      completeOpacity.value = withTiming(0, { duration: 800 });
      completeGlow.value = withSequence(
        withTiming(1, { duration: 300 }),
        withTiming(0, { duration: 900 })
      );

      const durationSeconds = Math.round((Date.now() - startedAtRef.current) / 1000);
      hapticSuccess();

      // Fire-and-forget reward sound (no-op if asset missing).
      void playBreathingSound('chime');

      const stressBefore = stressCheck?.stressScore ?? null;
      const stressAfter =
        stressBefore != null ? Math.max(0, Math.round(stressBefore * 0.72)) : null;

      let reward = {
        xpEarned: 25,
        newRank: null as string | null,
        streakCount: 1,
        isNewRecord: false,
        rankPoints: 0,
        stressReductionPercent: 0,
      };
      if (userId) {
        try {
          reward = await recordBreathingSession(userId, {
            exercise: currentExercise,
            durationSeconds,
            cyclesCompleted: completedCycles,
            stressBefore,
            stressAfter,
          });
        } catch {
          // graceful fallback
        }
      }

      setSessionReward({
        xpEarned: reward.xpEarned,
        stressReduction: reward.stressReductionPercent,
        newRank: reward.newRank ?? undefined,
        badgeUnlocked: undefined,
        streakCount: reward.streakCount,
        isNewRecord: reward.isNewRecord,
      });

      setTimeout(() => {
        router.replace('/breathing/reward' as never);
      }, 1500);
    },
    [currentExercise, stressCheck, userId, setSessionReward, completeScale, completeOpacity, completeGlow]
  );

  const handleStop = () => {
    Alert.alert(
      'End session?',
      'Your progress in this cycle will not be saved.',
      [
        { text: 'Keep going', style: 'cancel' },
        {
          text: 'End',
          style: 'destructive',
          onPress: () => {
            stoppedRef.current = true;
            router.back();
          },
        },
      ]
    );
  };

  // Ignore back gesture is enforced via _layout `gestureEnabled: false`.
  useFocusEffect(
    useCallback(() => {
      return () => {
        stoppedRef.current = true;
      };
    }, [])
  );

  const completeStyle = useAnimatedStyle(() => ({
    transform: [{ scale: completeScale.value }],
    opacity: completeOpacity.value,
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: completeGlow.value,
    backgroundColor: '#2ED573',
  }));

  if (!currentExercise) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg0 }}>
        <Text style={{ color: theme.text1, textAlign: 'center', marginTop: 40 }}>
          No exercise selected
        </Text>
      </SafeAreaView>
    );
  }

  const phase = currentPhaseStep?.phase ?? 'idle';
  const phaseColor = PHASE_COLORS[phase];
  const cue =
    phase === 'inhale'
      ? currentExercise.coachingCues.inhale
      : phase === 'hold' || phase === 'hold2'
      ? currentExercise.coachingCues.hold
      : phase === 'exhale'
      ? currentExercise.coachingCues.exhale
      : '';

  const visualProps = {
    phase,
    phaseDurationMs: (currentPhaseStep?.duration ?? 1) * 1000,
    cyclesCompleted: cycle,
    totalCycles,
    size: 260,
  };

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: theme.bg0 }]}>
      {/* Ambient particles */}
      <ParticleField count={20} />

      {/* Top bar */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={handleStop} hitSlop={12}>
          <Ionicons name="close" size={22} color={theme.text2} />
        </TouchableOpacity>
        <Text style={[styles.exName, { color: theme.text3 }]}>
          {currentExercise.name.toUpperCase()}
        </Text>
        <Text style={[styles.cycleCount, { color: theme.text3 }]}>
          {Math.min(cycle + 1, totalCycles)} / {totalCycles} cycles
        </Text>
      </View>

      {/* Central visual */}
      <Animated.View style={[styles.visualWrap, completeStyle]}>
        {currentExercise.visualType === 'lungs' && <LungsVisual {...visualProps} />}
        {currentExercise.visualType === 'orb' && <OrbVisual {...visualProps} />}
        {currentExercise.visualType === 'pin' && <PinVisual {...visualProps} />}
        {currentExercise.visualType === 'ring' && <RingVisual {...visualProps} />}
        {currentExercise.visualType === 'military' && <MilitaryVisual {...visualProps} />}
      </Animated.View>

      {/* Phase label */}
      <View style={styles.infoStack}>
        <Text style={[styles.phaseLabel, { color: phaseColor }]}>
          {phaseLabel(phase)}
        </Text>
        <Text style={[styles.countdown, { color: phaseColor }]}>
          {countdown}
        </Text>
        {showCue && cue ? (
          <Text style={[styles.cue, { color: `${theme.text2}CC` }]}>
            {cue}
          </Text>
        ) : (
          <View style={{ height: 18 }} />
        )}
      </View>

      {/* Cycle progress dots */}
      <View style={styles.dotsRow}>
        {Array.from({ length: totalCycles }).map((_, i) => {
          const done = i < cycle;
          const current = i === cycle;
          return (
            <View
              key={i}
              style={[
                styles.dot,
                {
                  backgroundColor: done ? theme.teal : 'transparent',
                  borderColor: current ? theme.teal : theme.border,
                  opacity: current ? 1 : done ? 1 : 0.6,
                },
              ]}
            />
          );
        })}
      </View>

      {/* Green success flash on complete */}
      {completing && (
        <Animated.View
          pointerEvents="none"
          style={[StyleSheet.absoluteFill, glowStyle]}
        />
      )}
      {completing && (
        <View style={styles.completeOverlay} pointerEvents="none">
          <Text style={styles.completeText}>Session Complete</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, padding: 16 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  exName: { fontSize: 11, fontWeight: '800', letterSpacing: 2 },
  cycleCount: { fontSize: 11, fontWeight: '800' },
  visualWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 280,
  },
  infoStack: {
    alignItems: 'center',
    marginTop: 4,
  },
  phaseLabel: {
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: 6,
  },
  countdown: {
    fontSize: 64,
    fontWeight: '900',
    marginTop: 2,
  },
  cue: {
    fontSize: 13,
    fontStyle: 'italic',
    textAlign: 'center',
    maxWidth: 280,
    marginTop: 6,
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginTop: 16,
    marginBottom: 10,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1,
  },
  completeOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  completeText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: 2,
  },
});
