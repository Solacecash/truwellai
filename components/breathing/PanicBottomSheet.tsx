import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Dimensions,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useTheme } from '@/theme/ThemeContext';
import { useAuthStore } from '@/stores/authStore';
import EmergencyNotice from '@/components/legal/EmergencyNotice';
import { OrbVisual } from './visuals/OrbVisual';
import { getExerciseById } from '@/lib/breathingExercises';
import { recordBreathingSession } from '@/lib/breathingProgress';
import { hapticLight, hapticSuccess } from '@/lib/haptics';
import type { BreathPhase } from '@/stores/breathingStore';

const SCREEN_H = Dimensions.get('window').height;
const PANIC_EXERCISE_ID = 'box-breathing';
const PANIC_CYCLES = 3;

type Step = { phase: BreathPhase; duration: number };

function buildSteps(): Step[] {
  const ex = getExerciseById(PANIC_EXERCISE_ID)!;
  const s: Step[] = [];
  if (ex.inhale > 0) s.push({ phase: 'inhale', duration: ex.inhale });
  if (ex.hold1 > 0) s.push({ phase: 'hold', duration: ex.hold1 });
  if (ex.exhale > 0) s.push({ phase: 'exhale', duration: ex.exhale });
  if (ex.hold2 > 0) s.push({ phase: 'hold2', duration: ex.hold2 });
  return s;
}

interface Props {
  visible: boolean;
  onClose: () => void;
}

export function PanicBottomSheet({ visible, onClose }: Props) {
  const { theme } = useTheme();
  const userId = useAuthStore((s) => s.session?.user.id);

  const translate = useSharedValue(SCREEN_H);
  const steps = useMemo(buildSteps, []);
  const exercise = useMemo(() => getExerciseById(PANIC_EXERCISE_ID)!, []);

  const [stepIdx, setStepIdx] = useState(0);
  const [cycle, setCycle] = useState(0);
  const [countdown, setCountdown] = useState(0);
  const [done, setDone] = useState(false);
  const stoppedRef = useRef(false);
  const startedAtRef = useRef(Date.now());

  useEffect(() => {
    if (visible) {
      translate.value = withTiming(0, { duration: 320, easing: Easing.out(Easing.cubic) });
      // reset
      setStepIdx(0);
      setCycle(0);
      setDone(false);
      stoppedRef.current = false;
      startedAtRef.current = Date.now();
    } else {
      translate.value = withTiming(SCREEN_H, { duration: 240 });
    }
  }, [visible, translate]);

  const currentStep = steps[stepIdx];

  useEffect(() => {
    if (!visible || done) return;
    if (!currentStep) return;
    setCountdown(currentStep.duration);
    hapticLight();

    const interval = setInterval(() => {
      setCountdown(prev => (prev <= 1 ? 0 : prev - 1));
    }, 1000);

    const timer = setTimeout(() => {
      if (stoppedRef.current) return;
      if (stepIdx < steps.length - 1) {
        setStepIdx(i => i + 1);
      } else {
        // Cycle complete
        const nextCycle = cycle + 1;
        hapticSuccess();
        if (nextCycle >= PANIC_CYCLES) {
          setDone(true);
          void finish();
        } else {
          setCycle(nextCycle);
          setStepIdx(0);
        }
      }
    }, currentStep.duration * 1000);

    return () => {
      clearInterval(interval);
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stepIdx, cycle, visible, done, currentStep]);

  const finish = useCallback(async () => {
    if (!userId) return;
    try {
      await recordBreathingSession(userId, {
        exercise,
        durationSeconds: Math.round((Date.now() - startedAtRef.current) / 1000),
        cyclesCompleted: PANIC_CYCLES,
        stressBefore: 90,
        stressAfter: 55,
      });
    } catch {
      // graceful
    }
  }, [userId, exercise]);

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translate.value }],
  }));

  const keepGoing = () => {
    stoppedRef.current = false;
    setStepIdx(0);
    setCycle(0);
    setDone(false);
    startedAtRef.current = Date.now();
  };

  const phase = currentStep?.phase ?? 'idle';
  const phaseText =
    phase === 'inhale' ? 'Breathe In'
    : phase === 'exhale' ? 'Breathe Out'
    : 'Hold';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={() => {
        stoppedRef.current = true;
        onClose();
      }}
      statusBarTranslucent
    >
      <Pressable
        style={styles.backdrop}
        onPress={() => {
          stoppedRef.current = true;
          onClose();
        }}
      >
        <Pressable onPress={(e) => e.stopPropagation()}>
        <Animated.View
          style={[
            styles.sheet,
            { backgroundColor: theme.bg0, borderColor: theme.border },
            sheetStyle,
          ]}
        >
          <View pointerEvents="none" style={[styles.glow, { backgroundColor: '#FF4757' }]} />

          {/* Always-visible exit so users can leave whenever they want. */}
          <TouchableOpacity
            onPress={() => {
              stoppedRef.current = true;
              onClose();
            }}
            style={[styles.closeBtn, { backgroundColor: `${theme.text1}15`, borderColor: theme.border }]}
            hitSlop={10}
          >
            <Ionicons name="close" size={20} color={theme.text1} />
          </TouchableOpacity>

          {!done ? (
            <>
              <Text style={[styles.title, { color: theme.text1 }]}>Take Back Control</Text>
              <Text style={[styles.sub, { color: theme.teal }]}>60 second reset</Text>

              <View style={{ marginVertical: 18 }}>
                <OrbVisual
                  phase={phase}
                  phaseDurationMs={(currentStep?.duration ?? 1) * 1000}
                  cyclesCompleted={cycle}
                  totalCycles={PANIC_CYCLES}
                  size={200}
                />
              </View>

              <Text style={[styles.phaseText, { color: theme.text1 }]}>{phaseText}</Text>
              <Text style={[styles.countdown, { color: theme.gold }]}>{countdown}</Text>
              <Text style={[styles.guide, { color: theme.text2 }]}>
                Follow the orb. Breathe with it.
              </Text>

              <Text style={[styles.cycleCounter, { color: theme.text3 }]}>
                Cycle {cycle + 1} of {PANIC_CYCLES}
              </Text>
            </>
          ) : (
            <>
              <Text style={[styles.title, { color: theme.teal }]}>You did it.</Text>
              <Text style={[styles.sub, { color: theme.text2 }]}>
                Session complete
              </Text>
              <View style={{ height: 22 }} />
              <EmergencyNotice />
              <TouchableOpacity
                onPress={keepGoing}
                style={[styles.primaryBtn, { backgroundColor: theme.teal }]}
              >
                <Text style={styles.primaryBtnText}>Keep Going</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={onClose}
                style={[styles.secondaryBtn, { borderColor: theme.border }]}
              >
                <Text style={[styles.secondaryBtnText, { color: theme.text1 }]}>I'm Better</Text>
              </TouchableOpacity>
            </>
          )}
        </Animated.View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'flex-end',
  },
  sheet: {
    height: SCREEN_H * 0.78,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    alignItems: 'center',
    padding: 24,
    overflow: 'hidden',
  },
  glow: {
    position: 'absolute',
    top: -60,
    left: -40,
    right: -40,
    height: 160,
    opacity: 0.08,
    borderRadius: 200,
  },
  closeBtn: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    zIndex: 2,
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    marginTop: 14,
  },
  sub: {
    fontSize: 12,
    fontWeight: '800',
    marginTop: 4,
  },
  phaseText: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 2,
  },
  countdown: {
    fontSize: 56,
    fontWeight: '900',
    marginTop: 4,
  },
  guide: {
    fontSize: 13,
    marginTop: 10,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  cycleCounter: {
    marginTop: 16,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  primaryBtn: {
    width: '100%',
    height: 52,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: { color: '#020A14', fontSize: 15, fontWeight: '900' },
  secondaryBtn: {
    width: '100%',
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  secondaryBtnText: { fontSize: 14, fontWeight: '800' },
});
