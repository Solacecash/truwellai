import * as Haptics from 'expo-haptics';

import { useRouter } from 'expo-router';

import React, { useEffect } from 'react';

import { Text } from 'react-native';



import {

  OnboardingStepShell,

  OnboardingTitle,

  SelectChip,

} from '@/components/onboarding/OnboardingStepShell';

import { DIET_OPTIONS } from '@/lib/onboardingStepData';

import { useOnboardingBack } from '@/lib/useOnboardingNavigation';

import { useOnboardingStore } from '@/stores/onboardingStore';

import { OB_COLORS, ONBOARDING_ROUTES } from '@/lib/_obShared';



const PROGRESS = 43;



export default function OnboardingDietType() {

  const router = useRouter();

  const dietType = useOnboardingStore((s) => s.dietType);
  const setDietType = useOnboardingStore((s) => s.setDietType);
  const setConversionFlowStep = useOnboardingStore((s) => s.setConversionFlowStep);

  const setCompletionPercent = useOnboardingStore((s) => s.setCompletionPercent);

  const handleBack = useOnboardingBack(8);



  useEffect(() => {

    setCompletionPercent(PROGRESS);

    setConversionFlowStep(8);

  }, [setCompletionPercent, setConversionFlowStep]);



  const pick = (id: string) => {

    void Haptics.selectionAsync();

    setDietType(id);

    setTimeout(() => {

      setConversionFlowStep(9);

      router.push(ONBOARDING_ROUTES.productConcerns);

    }, 350);

  };



  return (

    <OnboardingStepShell

      progress={PROGRESS}

      onBack={handleBack}

      eyebrow="FOOD INTELLIGENCE"

      title={

        <OnboardingTitle>

          {'How would you describe '}

          <Text style={{ color: OB_COLORS.gold, fontStyle: 'italic' }}>

            your diet?

          </Text>

        </OnboardingTitle>

      }

      subtitle="This trains your meal analysis engine and personalises every food recommendation to your lifestyle."

    >

      {DIET_OPTIONS.map((opt, index) => (

        <SelectChip

          key={opt.id}

          label={opt.label}

          selected={dietType === opt.id}

          onPress={() => pick(opt.id)}

          index={index}

        />

      ))}

    </OnboardingStepShell>

  );

}


