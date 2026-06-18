import * as Haptics from 'expo-haptics';

import { useRouter } from 'expo-router';

import React, { useEffect, useState } from 'react';

import { StyleSheet, Text, TextInput, View } from 'react-native';



import {

  OnboardingCta,

  OnboardingFooter,

  OnboardingStepShell,

  OnboardingTitle,

  SelectChip,

} from '@/components/onboarding/OnboardingStepShell';

import { HEALTH_CONDITIONS } from '@/lib/onboardingStepData';

import { LEGAL } from '@/lib/legalContent';

import { toggleExclusiveMulti } from '@/lib/onboardingMultiSelect';

import { useOnboardingBack } from '@/lib/useOnboardingNavigation';

import { useOnboardingStore } from '@/stores/onboardingStore';

import { OB_COLORS, OB_FONTS, ONBOARDING_ROUTES } from '@/lib/_obShared';

const HEALTH_PROFILE_CONSENT_TEXT = LEGAL.HEALTH_PROFILE_CONSENT_TEXT;



const PROGRESS = 31;

const KNOWN_CONDITION_IDS: string[] = HEALTH_CONDITIONS.map((h) => h.id);



export default function OnboardingConditions() {

  const router = useRouter();

  const conditions = useOnboardingStore((s) => s.conditions);

  const setConditions = useOnboardingStore((s) => s.setConditions);

  const setConversionFlowStep = useOnboardingStore((s) => s.setConversionFlowStep);

  const setCompletionPercent = useOnboardingStore((s) => s.setCompletionPercent);

  const handleBack = useOnboardingBack(6);

  const [otherSelected, setOtherSelected] = useState(

    conditions.some((c) => !KNOWN_CONDITION_IDS.includes(c) && c !== 'none')

  );

  const [otherText, setOtherText] = useState(

    conditions.find((c) => !KNOWN_CONDITION_IDS.includes(c) && c !== 'none') ?? ''

  );



  useEffect(() => {

    setCompletionPercent(PROGRESS);

    setConversionFlowStep(6);

  }, [setCompletionPercent, setConversionFlowStep]);



  const onContinue = () => {

    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const finalConditions = otherSelected && otherText.trim()

      ? [

          ...conditions.filter((c) => KNOWN_CONDITION_IDS.includes(c) || c === 'none'),

          otherText.trim(),

        ]

      : conditions;

    setConditions(finalConditions);

    setConversionFlowStep(7);

    router.push(ONBOARDING_ROUTES.allergies);

  };



  return (

    <OnboardingStepShell

      progress={PROGRESS}

      onBack={handleBack}

      eyebrow="CONDITION PROFILE"

      title={

        <OnboardingTitle>

          {'Do you have any '}

          <Text style={{ color: OB_COLORS.gold, fontStyle: 'italic' }}>

            health conditions

          </Text>

          {' I should know about?'}

        </OnboardingTitle>

      }

      subtitle="Select all that apply. This powers ingredient and food safety alerts."

      footer={

        <OnboardingFooter>

          <OnboardingCta

            label={`Got it (${conditions.length + (otherSelected && otherText.trim() ? 1 : 0)} selected) \u2192`}

            onPress={onContinue}

          />

        </OnboardingFooter>

      }

    >

      <View style={styles.privacy}>

        <Text style={styles.privacyText}>

          {'🔒 Used only to personalise your safety alerts. Securely protected, never sold, and you can delete it anytime. This step is optional.'}

        </Text>

      </View>

      {HEALTH_CONDITIONS.map((item, index) => (

        <SelectChip

          key={item.id}

          label={item.label}

          selected={conditions.includes(item.id)}

          onPress={() => {

            void Haptics.selectionAsync();

            setConditions(toggleExclusiveMulti(conditions, item.id, 'none'));

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

        index={HEALTH_CONDITIONS.length}

      />

      {otherSelected ? (

        <TextInput

          value={otherText}

          onChangeText={setOtherText}

          placeholder="Describe your condition..."

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

  privacy: {

    flexDirection: 'row',

    gap: 10,

    padding: 12,

    borderRadius: 10,

    backgroundColor: 'rgba(0,229,200,0.10)',

    borderWidth: 1,

    borderColor: 'rgba(0,229,200,0.30)',

    marginBottom: 16,

  },

  privacyText: {

    flex: 1,

    fontFamily: OB_FONTS.body,

    fontSize: 12,

    lineHeight: 18,

    color: OB_COLORS.teal,

  },

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


