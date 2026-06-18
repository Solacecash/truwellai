import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { PsychChoiceCard } from '@/components/onboarding/psych/PsychChoiceCard';
import { PsychDynamicCard } from '@/components/onboarding/psych/PsychDynamicCard';
import { PsychGradientButton } from '@/components/onboarding/psych/PsychGradientButton';
import { PsychScreenShell } from '@/components/onboarding/psych/PsychScreenShell';
import { getPsychHrefForStep } from '@/lib/psychFlow';
import { useOnboardingStore } from '@/stores/onboardingStore';

const GOALS = [
  { emoji: '⚡', title: 'More daily energy', subtitle: 'Fewer crashes, steadier focus' },
  { emoji: '⚖️', title: 'Weight that feels right', subtitle: 'Sustainable rhythm without obsession' },
  { emoji: '🫀', title: 'Heart and metabolic calm', subtitle: 'Support for lifelong markers' },
  { emoji: '🧬', title: 'Longevity confidence', subtitle: 'Decisions that compound over years' },
] as const;

export default function PsychS3Goal() {
  const router = useRouter();
  const goToStep = useOnboardingStore((s) => s.goToStep);
  const setPsychAnswers = useOnboardingStore((s) => s.setPsychAnswers);
  const [sel, setSel] = useState<string | null>(null);

  const response = useMemo(() => {
    const g = GOALS.find((x) => x.title === sel);
    if (!g) return '';
    return `We will shape your nudges around ${g.title.toLowerCase()}, so every scan feels relevant instead of generic.`;
  }, [sel]);

  const next = () => {
    if (sel) setPsychAnswers({ healthGoal: sel });
    goToStep(4);
    router.push(getPsychHrefForStep(4));
  };

  return (
    <PsychScreenShell
      step={3}
      title="What is the win you want to feel first?"
      subtitle="Pick the outcome that would change your week the fastest."
      trustPill="Personalised guardrails"
      showBack
      onBack={() => router.back()}
      footer={<PsychGradientButton label="Continue" disabled={!sel} onPress={next} />}
    >
      <View>
        {GOALS.map((g) => (
          <PsychChoiceCard
            key={g.title}
            emoji={g.emoji}
            title={g.title}
            subtitle={g.subtitle}
            selected={sel === g.title}
            onSelect={() => setSel(g.title)}
            groupName="Health goal"
          />
        ))}
      </View>
      <PsychDynamicCard visible={!!sel} text={response} />
    </PsychScreenShell>
  );
}

const styles = StyleSheet.create({});
