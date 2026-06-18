import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { PsychDynamicCard } from '@/components/onboarding/psych/PsychDynamicCard';
import { PsychGradientButton } from '@/components/onboarding/psych/PsychGradientButton';
import { PsychScreenShell } from '@/components/onboarding/psych/PsychScreenShell';
import { getPsychHrefForStep } from '@/lib/psychFlow';
import { useOnboardingStore } from '@/stores/onboardingStore';
import { psychBrand } from '@/theme/colors';

const PAIN = [
  'Cravings',
  'Low sleep',
  'Stress eating',
  'No time to cook',
  'Confusing labels',
  'Motivation swings',
] as const;

export default function PsychS5Pain() {
  const router = useRouter();
  const goToStep = useOnboardingStore((s) => s.goToStep);
  const setPsychAnswers = useOnboardingStore((s) => s.setPsychAnswers);
  const [picked, setPicked] = useState<string[]>([]);

  const toggle = (p: string) => {
    void Haptics.selectionAsync();
    setPicked((prev) => (prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]));
  };

  const response = useMemo(() => {
    if (picked.length === 0) return '';
    return `Noted. We will highlight swaps, rituals, and reminders that speak directly to: ${picked.join(', ')}.`;
  }, [picked]);

  const next = () => {
    setPsychAnswers({ painPoints: picked });
    goToStep(6);
    router.push(getPsychHrefForStep(6));
  };

  return (
    <PsychScreenShell
      step={5}
      title="What drains you most right now?"
      subtitle="Select every answer that feels true. No typing required."
      trustPill="No judgement"
      showBack
      onBack={() => router.back()}
      footer={<PsychGradientButton label="Continue" disabled={picked.length === 0} onPress={next} />}
    >
      <View style={styles.chips}>
        {PAIN.map((p) => {
          const on = picked.includes(p);
          return (
            <Pressable
              key={p}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: on }}
              onPress={() => toggle(p)}
              style={[styles.chip, on && styles.chipOn]}
            >
              <Text style={[styles.chipText, on && styles.chipTextOn]}>{p}</Text>
            </Pressable>
          );
        })}
      </View>
      <PsychDynamicCard visible={picked.length > 0} text={response} />
    </PsychScreenShell>
  );
}

const styles = StyleSheet.create({
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  chipOn: {
    borderColor: psychBrand.primary,
    backgroundColor: 'rgba(0,168,120,0.15)',
  },
  chipText: { fontSize: 13, fontWeight: '700', color: 'rgba(240,248,255,0.8)' },
  chipTextOn: { color: '#F4F8FC' },
});
