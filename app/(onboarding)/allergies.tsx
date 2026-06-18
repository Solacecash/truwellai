import * as Haptics from 'expo-haptics';

import { useRouter } from 'expo-router';

import React, { useEffect, useState } from 'react';

import { StyleSheet, Text, TextInput } from 'react-native';



import {

  OnboardingCta,

  OnboardingFooter,

  OnboardingStepShell,

  OnboardingTitle,

  SelectChip,

} from '@/components/onboarding/OnboardingStepShell';

import { ALLERGY_OPTIONS } from '@/lib/onboardingStepData';

import { toggleExclusiveMulti } from '@/lib/onboardingMultiSelect';

import { useOnboardingBack } from '@/lib/useOnboardingNavigation';

import { useOnboardingStore } from '@/stores/onboardingStore';

import { OB_COLORS, OB_FONTS, ONBOARDING_ROUTES } from '@/lib/_obShared';



const PROGRESS = 37;

const KNOWN_ALLERGY_IDS: string[] = ALLERGY_OPTIONS.map((o) => o.id);



export default function OnboardingAllergies() {

  const router = useRouter();

  const allergies = useOnboardingStore((s) => s.allergies);

  const setAllergies = useOnboardingStore((s) => s.setAllergies);

  const setConversionFlowStep = useOnboardingStore((s) => s.setConversionFlowStep);

  const setCompletionPercent = useOnboardingStore((s) => s.setCompletionPercent);

  const handleBack = useOnboardingBack(7);

  const [otherSelected, setOtherSelected] = useState(

    allergies.some((a) => !KNOWN_ALLERGY_IDS.includes(a) && a !== 'none')

  );

  const [otherText, setOtherText] = useState(

    allergies.find((a) => !KNOWN_ALLERGY_IDS.includes(a) && a !== 'none') ?? ''

  );



  useEffect(() => {

    setCompletionPercent(PROGRESS);

    setConversionFlowStep(7);

  }, [setCompletionPercent, setConversionFlowStep]);



  const onContinue = () => {

    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const finalAllergies = otherSelected && otherText.trim()

      ? [

          ...allergies.filter((a) => KNOWN_ALLERGY_IDS.includes(a) || a === 'none'),

          otherText.trim(),

        ]

      : allergies;

    setAllergies(finalAllergies);

    setConversionFlowStep(8);

    router.push(ONBOARDING_ROUTES.dietType);

  };



  return (

    <OnboardingStepShell

      progress={PROGRESS}

      onBack={handleBack}

      eyebrow="ALLERGY PROFILE"

      title={

        <OnboardingTitle>

          {'Any '}

          <Text style={{ color: OB_COLORS.gold, fontStyle: 'italic' }}>

            allergies or sensitivities?

          </Text>

        </OnboardingTitle>

      }

      subtitle="I'll flag these in every single product scan and meal analysis. Every time. Automatically."

      footer={

        <OnboardingFooter>

          <OnboardingCta label={"These are mine \u2192"} onPress={onContinue} />

        </OnboardingFooter>

      }

    >

      {ALLERGY_OPTIONS.map((item, index) => (

        <SelectChip

          key={item.id}

          label={item.label}

          selected={allergies.includes(item.id)}

          onPress={() => {

            void Haptics.selectionAsync();

            setAllergies(toggleExclusiveMulti(allergies, item.id, 'none'));

          }}

          index={index}

        />

      ))}

      <SelectChip

        key="other"

        label="Other — type your own"

        selected={otherSelected}

        onPress={() => {

          void Haptics.selectionAsync();

          setOtherSelected((v) => !v);

          if (otherSelected) setOtherText('');

        }}

        index={ALLERGY_OPTIONS.length}

      />

      {otherSelected ? (

        <TextInput

          value={otherText}

          onChangeText={setOtherText}

          placeholder="Describe your allergy or sensitivity..."

          placeholderTextColor={OB_COLORS.white40}

          autoFocus

          style={styles.otherInput}

          returnKeyType="done"

          maxLength={80}

        />

      ) : null}

    </OnboardingStepShell>

  );

}



const styles = StyleSheet.create({

  otherInput: {

    borderWidth: 1.5,

    borderColor: OB_COLORS.gold,

    borderRadius: 10,

    height: 52,

    paddingHorizontal: 16,

    backgroundColor: 'rgba(201,168,76,0.07)',

    fontFamily: OB_FONTS.body,

    fontSize: 14,

    color: OB_COLORS.white,

    marginTop: 4,

    marginBottom: 8,

  },

});


