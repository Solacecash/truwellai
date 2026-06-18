import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { PsychChoiceCard } from '@/components/onboarding/psych/PsychChoiceCard';
import { PsychDynamicCard } from '@/components/onboarding/psych/PsychDynamicCard';
import { PsychGradientButton } from '@/components/onboarding/psych/PsychGradientButton';
import { PsychScreenShell } from '@/components/onboarding/psych/PsychScreenShell';
import { getPsychHrefForStep } from '@/lib/psychFlow';
import { useOnboardingStore } from '@/stores/onboardingStore';

const ACTIVITY = [
  { emoji: '🪑', title: 'Mostly seated', subtitle: 'Desk days' },
  { emoji: '🚶', title: 'Light movement', subtitle: 'Walks a few times a week' },
  { emoji: '🏃', title: 'Active most days', subtitle: 'Training or busy on your feet' },
  { emoji: '🔥', title: 'High output', subtitle: 'Athlete or heavy labour' },
] as const;

const DIETS = [
  { emoji: '🍽️', title: 'Balanced omnivore', subtitle: 'Everything in moderation' },
  { emoji: '�-', title: 'Plant-forward', subtitle: 'More plants, flexible protein' },
  { emoji: '🥩', title: 'Protein aware', subtitle: 'Strength or metabolic focus' },
  { emoji: '🩺', title: 'Clinician guided', subtitle: 'Doctor or dietitian led' },
] as const;

export default function PsychS6Lifestyle() {
  const router = useRouter();
  const goToStep = useOnboardingStore((s) => s.goToStep);
  const setPsychAnswers = useOnboardingStore((s) => s.setPsychAnswers);
  const [act, setAct] = useState<string | null>(null);
  const [diet, setDiet] = useState<string | null>(null);

  const response = useMemo(() => {
    if (!act || !diet) return '';
    return `Understood. Meal templates, scan emphasis, and movement prompts will mirror ${act.toLowerCase()} days and ${diet.toLowerCase()} eating.`;
  }, [act, diet]);

  const canNext = !!act && !!diet;

  const next = () => {
    if (act && diet) setPsychAnswers({ activityLevel: act, dietStyle: diet });
    goToStep(7);
    router.push(getPsychHrefForStep(7));
  };

  return (
    <PsychScreenShell
      step={6}
      title="Your lifestyle baseline"
      subtitle="Two quick picks. No typing."
      trustPill="Context aware"
      showBack
      onBack={() => router.back()}
      footer={<PsychGradientButton label="Continue" disabled={!canNext} onPress={next} />}
    >
      <Text style={styles.sectionLabel}>Movement</Text>
      {ACTIVITY.map((g) => (
        <PsychChoiceCard
          key={g.title}
          emoji={g.emoji}
          title={g.title}
          subtitle={g.subtitle}
          selected={act === g.title}
          onSelect={() => setAct(g.title)}
          groupName="Activity"
        />
      ))}
      <Text style={[styles.sectionLabel, { marginTop: 8 }]}>Nutrition stance</Text>
      {DIETS.map((g) => (
        <PsychChoiceCard
          key={g.title}
          emoji={g.emoji}
          title={g.title}
          subtitle={g.subtitle}
          selected={diet === g.title}
          onSelect={() => setDiet(g.title)}
          groupName="Diet"
        />
      ))}
      <PsychDynamicCard visible={canNext} text={response} />
    </PsychScreenShell>
  );
}

const styles = StyleSheet.create({
  sectionLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: 'rgba(240,248,255,0.45)',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
});
