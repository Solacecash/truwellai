import * as Haptics from 'expo-haptics';

import { useRouter } from 'expo-router';

import React, { useEffect } from 'react';

import { Text } from 'react-native';



import {

  OnboardingStepShell,

  OnboardingTitle,

  SelectChip,

} from '@/components/onboarding/OnboardingStepShell';

import { FAMILY_ROLE_OPTIONS } from '@/lib/onboardingStepData';

import { useOnboardingBack } from '@/lib/useOnboardingNavigation';

import { useOnboardingStore } from '@/stores/onboardingStore';

import { OB_COLORS, ONBOARDING_ROUTES } from '@/lib/_obShared';



const PROGRESS = 62;



export default function OnboardingFamilyRole() {

  const router = useRouter();

  const familyRole = useOnboardingStore((s) => s.familyRole);
  const setFamilyRole = useOnboardingStore((s) => s.setFamilyRole);
  const setConversionFlowStep = useOnboardingStore((s) => s.setConversionFlowStep);

  const setCompletionPercent = useOnboardingStore((s) => s.setCompletionPercent);

  const handleBack = useOnboardingBack(11);



  useEffect(() => {

    setCompletionPercent(PROGRESS);

    setConversionFlowStep(11);

  }, [setCompletionPercent, setConversionFlowStep]);



  const pick = (id: string) => {

    void Haptics.selectionAsync();

    setFamilyRole(id);

    setTimeout(() => {

      setConversionFlowStep(12);

      router.push(ONBOARDING_ROUTES.featurePreview);

    }, 350);

  };



  return (

    <OnboardingStepShell

      progress={PROGRESS}

      onBack={handleBack}

      eyebrow="YOUR WORLD"

      title={

        <OnboardingTitle>

          {'Which best describes '}

          <Text style={{ color: OB_COLORS.gold, fontStyle: 'italic' }}>

            your life right now?

          </Text>

        </OnboardingTitle>

      }

      subtitle="This helps me protect not just you, but everyone in your world."

    >

      {FAMILY_ROLE_OPTIONS.map((opt, index) => (

        <SelectChip

          key={opt.id}

          label={opt.label}

          selected={familyRole === opt.id}

          onPress={() => pick(opt.id)}

          index={index}

        />

      ))}

    </OnboardingStepShell>

  );

}


