import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';

import {
  OnboardingStepShell,
  OnboardingTitle,
  SelectChip,
} from '@/components/onboarding/OnboardingStepShell';
import { GENDER_OPTIONS } from '@/lib/onboardingStepData';
import { useOnboardingBack } from '@/lib/useOnboardingNavigation';
import { useOnboardingStore } from '@/stores/onboardingStore';
import { ONBOARDING_ROUTES } from '@/lib/_obShared';

const PROGRESS = 25;

export default function OnboardingGender() {
  const router = useRouter();
  const gender = useOnboardingStore((s) => s.gender);
  const setGender = useOnboardingStore((s) => s.setGender);
  const setConversionFlowStep = useOnboardingStore((s) => s.setConversionFlowStep);
  const setCompletionPercent = useOnboardingStore((s) => s.setCompletionPercent);
  const handleBack = useOnboardingBack(5);

  useEffect(() => {
    setCompletionPercent(PROGRESS);
    setConversionFlowStep(5);
  }, [setCompletionPercent, setConversionFlowStep]);

  const pick = (id: string) => {
    void Haptics.selectionAsync();
    setGender(id);
    setTimeout(() => {
      setConversionFlowStep(6);
      router.push(ONBOARDING_ROUTES.conditions);
    }, 350);
  };

  return (
    <OnboardingStepShell
      progress={PROGRESS}
      onBack={handleBack}
      eyebrow="ABOUT YOU"
      title={<OnboardingTitle>How do you identify?</OnboardingTitle>}
      subtitle="Optional but helps personalise metabolic and hormonal insights."
    >
      <View style={styles.grid}>
        {GENDER_OPTIONS.map((opt, index) => (
          <View key={opt.id} style={styles.gridItem}>
            <SelectChip
              label={opt.label}
              icon={opt.icon}
              selected={gender === opt.id}
              onPress={() => pick(opt.id)}
              index={index}
              style={styles.gridChip}
            />
          </View>
        ))}
      </View>
    </OnboardingStepShell>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 32,
  },
  gridItem: {
    width: '48%',
  },
  gridChip: {
    width: '100%',
  },
});
