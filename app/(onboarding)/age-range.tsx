import * as Haptics from 'expo-haptics';

import { useRouter } from 'expo-router';

import React, { useEffect } from 'react';

import { StyleSheet, Text, View } from 'react-native';



import {

  OnboardingStepShell,

  OnboardingTitle,

  SelectChip,

} from '@/components/onboarding/OnboardingStepShell';

import { AGE_RANGES } from '@/lib/onboardingStepData';

import { useOnboardingBack } from '@/lib/useOnboardingNavigation';

import { useOnboardingStore } from '@/stores/onboardingStore';

import { OB_COLORS, ONBOARDING_ROUTES } from '@/lib/_obShared';



const PROGRESS = 18;



export default function OnboardingAgeRange() {

  const router = useRouter();

  const ageRange = useOnboardingStore((s) => s.ageRange);
  const setAgeRange = useOnboardingStore((s) => s.setAgeRange);
  const setConversionFlowStep = useOnboardingStore((s) => s.setConversionFlowStep);

  const setCompletionPercent = useOnboardingStore((s) => s.setCompletionPercent);

  const handleBack = useOnboardingBack(4);



  useEffect(() => {

    setCompletionPercent(PROGRESS);

    setConversionFlowStep(4);

  }, [setCompletionPercent, setConversionFlowStep]);



  const pick = (value: string) => {

    void Haptics.selectionAsync();

    setAgeRange(value);

    setTimeout(() => {

      setConversionFlowStep(5);

      router.push(ONBOARDING_ROUTES.gender);

    }, 350);

  };



  return (

    <OnboardingStepShell

      progress={PROGRESS}

      onBack={handleBack}

      eyebrow="PERSONALISING YOUR INTELLIGENCE"

      title={

        <OnboardingTitle>

          {'Which age range are '}

          <Text style={{ color: OB_COLORS.gold, fontStyle: 'italic' }}>

            you in?

          </Text>

        </OnboardingTitle>

      }

      subtitle="Your age shapes your nutritional needs, hormonal profile, and risk factors. This changes everything I recommend."

    >

      <View style={styles.grid}>

        {AGE_RANGES.map((range, index) => (

          <View key={range} style={styles.gridItem}>

            <SelectChip

              label={range}

              selected={ageRange === range}

              onPress={() => pick(range)}

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


