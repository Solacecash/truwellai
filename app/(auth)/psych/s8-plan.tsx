import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { PsychGradientButton } from '@/components/onboarding/psych/PsychGradientButton';
import { PsychScreenShell } from '@/components/onboarding/psych/PsychScreenShell';
import { buildHealthPlan } from '@/lib/buildHealthPlan';
import { getPsychHrefForStep } from '@/lib/psychFlow';
import { useOnboardingStore } from '@/stores/onboardingStore';
import { psychBrand } from '@/theme/colors';

export default function PsychS8Plan() {
  const router = useRouter();
  const goToStep = useOnboardingStore((s) => s.goToStep);
  const setPsychAnswers = useOnboardingStore((s) => s.setPsychAnswers);
  const snap = useOnboardingStore((s) => ({
    healthGoal: s.healthGoal,
    weightRange: s.weightRange,
    painPoints: s.painPoints,
    activityLevel: s.activityLevel,
    dietStyle: s.dietStyle,
    dailyMinutes: s.dailyMinutes,
  }));

  const [phase, setPhase] = useState<'loading' | 'ready'>('loading');
  const [n1, setN1] = useState(0);
  const [n2, setN2] = useState(0);
  const [n3, setN3] = useState(0);
  const raf = useRef<number | null>(null);

  const planText = useMemo(
    () =>
      buildHealthPlan({
        healthGoal: snap.healthGoal,
        weightRange: snap.weightRange,
        painPoints: snap.painPoints,
        activityLevel: snap.activityLevel,
        dietStyle: snap.dietStyle,
        dailyMinutes: snap.dailyMinutes,
      }),
    [snap]
  );

  useEffect(() => {
    const t = setTimeout(() => {
      setPsychAnswers({ planGenerated: true });
      setPhase('ready');
    }, 1800);
    return () => clearTimeout(t);
  }, [setPsychAnswers]);

  useEffect(() => {
    if (phase !== 'ready') return;
    const start = Date.now();
    const duration = 900;
    const targets = [47, 62, 81];
    const tick = () => {
      const p = Math.min(1, (Date.now() - start) / duration);
      setN1(Math.round(targets[0] * p));
      setN2(Math.round(targets[1] * p));
      setN3(Math.round(targets[2] * p));
      if (p < 1) {
        raf.current = requestAnimationFrame(tick);
      }
    };
    raf.current = requestAnimationFrame(tick);
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, [phase]);

  const next = () => {
    goToStep(9);
    router.push(getPsychHrefForStep(9));
  };

  return (
    <PsychScreenShell
      step={8}
      title={phase === 'loading' ? 'Shaping your Guardian plan' : 'Your plan is ready'}
      subtitle={
        phase === 'loading'
          ? 'We are weaving your answers into concrete guardrails.'
          : 'A living roadmap, not a static PDF.'
      }
      trustPill="Evidence aware"
      showBack
      onBack={() => router.back()}
      footer={
        <PsychGradientButton
          label="Continue to secure account"
          disabled={phase !== 'ready'}
          onPress={next}
        />
      }
    >
      {phase === 'loading' ? (
        <Text style={styles.loading}>Calibrating…</Text>
      ) : (
        <>
          <View style={styles.statsRow}>
            <StatBox label="Clarity score" value={n1} suffix="%" />
            <StatBox label="Habit fit" value={n2} suffix="%" />
            <StatBox label="Safety cover" value={n3} suffix="%" />
          </View>
          <Text style={styles.plan}>{planText}</Text>
        </>
      )}
    </PsychScreenShell>
  );
}

function StatBox({ label, value, suffix }: { label: string; value: number; suffix: string }) {
  return (
    <View style={styles.statBox}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statVal}>
        {value}
        {suffix}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  loading: {
    fontSize: 15,
    fontWeight: '700',
    color: 'rgba(240,248,255,0.7)',
    textAlign: 'center',
    marginVertical: 40,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  statBox: {
    flex: 1,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: psychBrand.tealBorder,
    backgroundColor: 'rgba(0,168,120,0.08)',
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: 'rgba(240,248,255,0.5)',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  statVal: { fontSize: 22, fontWeight: '900', color: '#F4F8FC' },
  plan: {
    fontSize: 13,
    lineHeight: 21,
    fontWeight: '500',
    color: 'rgba(240,248,255,0.85)',
  },
});
