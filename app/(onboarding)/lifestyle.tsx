import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import {
  OnboardingCta,
  OnboardingFooter,
  OnboardingStepShell,
  OnboardingTitle,
  SelectChip,
} from '@/components/onboarding/OnboardingStepShell';
import { LIFESTYLE_OPTIONS, SLEEP_OPTIONS, STRESS_OPTIONS } from '@/lib/onboardingStepData';
import { useOnboardingBack } from '@/lib/useOnboardingNavigation';
import { useOnboardingStore } from '@/stores/onboardingStore';
import { OB_COLORS, OB_FONTS, ONBOARDING_ROUTES } from '@/lib/_obShared';

const PROGRESS = 56;

export default function OnboardingLifestyle() {
  const router = useRouter();
  const lifestyle = useOnboardingStore((s) => s.lifestyle);
  const setLifestyle = useOnboardingStore((s) => s.setLifestyle);
  const assessmentAnswers = useOnboardingStore((s) => s.assessmentAnswers);
  const sleepHours = assessmentAnswers.sleep ?? '';
  const setSleep = (val: string) => {
    useOnboardingStore.getState().setAssessmentAnswer('sleep', val);
  };
  const stressLevel = useOnboardingStore((s) => s.stressLevel);
  const setStressLevel = useOnboardingStore((s) => s.setStressLevel);
  const setConversionFlowStep = useOnboardingStore((s) => s.setConversionFlowStep);
  const setCompletionPercent = useOnboardingStore((s) => s.setCompletionPercent);
  const handleBack = useOnboardingBack(10);

  useEffect(() => {
    setCompletionPercent(PROGRESS);
    setConversionFlowStep(10);
  }, [setCompletionPercent, setConversionFlowStep]);

  const ctaReady = !!lifestyle && !!sleepHours && !!stressLevel;

  const onContinue = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setConversionFlowStep(11);
    router.push(ONBOARDING_ROUTES.familyRole);
  };

  return (
    <OnboardingStepShell
      progress={PROGRESS}
      onBack={handleBack}
      eyebrow="LIFESTYLE SNAPSHOT"
      title={
        <OnboardingTitle>
          {'Paint me your '}
          <Text style={{ color: OB_COLORS.gold, fontStyle: 'italic' }}>
            daily life.
          </Text>
        </OnboardingTitle>
      }
      footer={
        <OnboardingFooter>
          <OnboardingCta
            label={"That's my life \u2192"}
            onPress={onContinue}
            disabled={!ctaReady}
          />
        </OnboardingFooter>
      }
    >
      <Text style={sectionStyles.label}>Activity Level</Text>
      {LIFESTYLE_OPTIONS.map((l) => (
        <SelectChip
          key={l.id}
          label={l.label}
          icon={l.icon}
          selected={lifestyle === l.id}
          onPress={() => setLifestyle(l.id)}
        />
      ))}

      <Text style={[sectionStyles.label, { marginTop: 24 }]}>
        Average Sleep Per Night
      </Text>
      <View style={sectionStyles.grid}>
        {SLEEP_OPTIONS.map((s) => (
          <View key={s} style={sectionStyles.gridItem}>
            <SelectChip
              label={s}
              selected={sleepHours === s}
              onPress={() => setSleep(s)}
            />
          </View>
        ))}
      </View>

      <Text style={[sectionStyles.label, { marginTop: 24 }]}>
        Typical Stress Level
      </Text>
      {STRESS_OPTIONS.map((s) => (
        <SelectChip
          key={s.id}
          label={s.label}
          selected={stressLevel === s.id}
          onPress={() => setStressLevel(s.id)}
        />
      ))}
    </OnboardingStepShell>
  );
}

const sectionStyles = StyleSheet.create({
  label: {
    fontFamily: OB_FONTS.semiBold,
    fontSize: 11,
    color: OB_COLORS.white40,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  gridItem: {
    width: '48%',
  },
});
