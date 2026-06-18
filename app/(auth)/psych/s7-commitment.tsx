import Slider from '@react-native-community/slider';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { PsychDynamicCard } from '@/components/onboarding/psych/PsychDynamicCard';
import { PsychGradientButton } from '@/components/onboarding/psych/PsychGradientButton';
import { PsychScreenShell } from '@/components/onboarding/psych/PsychScreenShell';
import { getPsychHrefForStep } from '@/lib/psychFlow';
import { useOnboardingStore } from '@/stores/onboardingStore';
import { psychBrand } from '@/theme/colors';

const MIN_M = 5;
const MAX_M = 60;

export default function PsychS7Commitment() {
  const router = useRouter();
  const goToStep = useOnboardingStore((s) => s.goToStep);
  const setPsychAnswers = useOnboardingStore((s) => s.setPsychAnswers);
  const [minutes, setMinutes] = useState(20);

  const response = useMemo(() => {
    return `Perfect. We will design nudges that fit into about ${minutes} minutes a day without stacking guilt on busy weeks.`;
  }, [minutes]);

  const next = () => {
    setPsychAnswers({ dailyMinutes: Math.round(minutes) });
    goToStep(8);
    router.push(getPsychHrefForStep(8));
  };

  return (
    <PsychScreenShell
      step={7}
      title="Daily commitment window"
      subtitle="Slide to the realistic minute budget you can protect most days."
      trustPill="Honest pacing"
      showBack
      onBack={() => router.back()}
      footer={<PsychGradientButton label="Generate my plan" onPress={next} />}
    >
      <Text style={styles.big}>{Math.round(minutes)} min</Text>
      <Slider
        style={styles.slider}
        minimumValue={MIN_M}
        maximumValue={MAX_M}
        step={1}
        value={minutes}
        onValueChange={setMinutes}
        minimumTrackTintColor={psychBrand.primary}
        maximumTrackTintColor="rgba(255,255,255,0.15)"
        thumbTintColor={psychBrand.secondary}
      />
      <Text style={styles.caption}>Small daily reps outperform perfect weeks that never arrive.</Text>
      <PsychDynamicCard visible text={response} />
    </PsychScreenShell>
  );
}

const styles = StyleSheet.create({
  big: {
    fontSize: 44,
    fontWeight: '900',
    color: '#F4F8FC',
    textAlign: 'center',
    marginVertical: 12,
  },
  slider: { width: '100%', height: 48 },
  caption: {
    fontSize: 13,
    color: 'rgba(240,248,255,0.55)',
    textAlign: 'center',
    lineHeight: 19,
    marginTop: 4,
  },
});
