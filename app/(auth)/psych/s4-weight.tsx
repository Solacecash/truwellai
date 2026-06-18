import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { PsychChoiceCard } from '@/components/onboarding/psych/PsychChoiceCard';
import { PsychDynamicCard } from '@/components/onboarding/psych/PsychDynamicCard';
import { PsychGradientButton } from '@/components/onboarding/psych/PsychGradientButton';
import { PsychScreenShell } from '@/components/onboarding/psych/PsychScreenShell';
import { getPsychHrefForStep } from '@/lib/psychFlow';
import { useOnboardingStore } from '@/stores/onboardingStore';

const RANGES = [
  { emoji: '⬇️', title: 'Under 70 kg', subtitle: 'Lighter baseline' },
  { emoji: '⚖️', title: '70 to 90 kg', subtitle: 'Mid range' },
  { emoji: '⬆️', title: '90 to 115 kg', subtitle: 'Higher baseline' },
  { emoji: '📊', title: 'Prefer not to say', subtitle: 'We will still personalise' },
] as const;

export default function PsychS4Weight() {
  const router = useRouter();
  const goToStep = useOnboardingStore((s) => s.goToStep);
  const setPsychAnswers = useOnboardingStore((s) => s.setPsychAnswers);
  const [sel, setSel] = useState<string | null>(null);

  const response = useMemo(() => {
    if (!sel) return '';
    return `Great. We will calibrate portion prompts and movement nudges using ${sel.toLowerCase()} without judging the number itself.`;
  }, [sel]);

  const next = () => {
    if (sel) setPsychAnswers({ weightRange: sel });
    goToStep(5);
    router.push(getPsychHrefForStep(5));
  };

  return (
    <PsychScreenShell
      step={4}
      title="Where is your weight range today?"
      subtitle="This helps TruWell tune energy, portions, and safety cues."
      trustPill="Private to you"
      showBack
      onBack={() => router.back()}
      footer={<PsychGradientButton label="Continue" disabled={!sel} onPress={next} />}
    >
      <View>
        {RANGES.map((g) => (
          <PsychChoiceCard
            key={g.title}
            emoji={g.emoji}
            title={g.title}
            subtitle={g.subtitle}
            selected={sel === g.title}
            onSelect={() => setSel(g.title)}
            groupName="Weight range"
          />
        ))}
      </View>
      <PsychDynamicCard visible={!!sel} text={response} />
    </PsychScreenShell>
  );
}

const styles = StyleSheet.create({});
