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

import { PRODUCT_CONCERNS } from '@/lib/onboardingStepData';

import { useOnboardingBack } from '@/lib/useOnboardingNavigation';

import { useOnboardingStore } from '@/stores/onboardingStore';

import { OB_COLORS, OB_FONTS, ONBOARDING_ROUTES } from '@/lib/_obShared';



const PROGRESS = 50;



export default function OnboardingProductConcerns() {

  const router = useRouter();

  const productConcerns = useOnboardingStore((s) => s.productConcerns);

  const setProductConcerns = useOnboardingStore((s) => s.setProductConcerns);

  const setConversionFlowStep = useOnboardingStore((s) => s.setConversionFlowStep);

  const setCompletionPercent = useOnboardingStore((s) => s.setCompletionPercent);

  const handleBack = useOnboardingBack(9);

  const knownIds: string[] = PRODUCT_CONCERNS.map((p) => p.id);

  const [selected, setSelected] = useState<string[]>(productConcerns);

  const [otherSelected, setOtherSelected] = useState(

    productConcerns.some((c) => !knownIds.includes(c))

  );

  const [otherText, setOtherText] = useState(

    productConcerns.find((c) => !knownIds.includes(c)) ?? ''

  );



  useEffect(() => {

    setCompletionPercent(PROGRESS);

    setConversionFlowStep(9);

  }, [setCompletionPercent, setConversionFlowStep]);



  const toggle = (id: string) => {

    void Haptics.selectionAsync();

    setSelected((prev) =>

      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]

    );

  };



  const onContinue = () => {

    const finalConcerns = otherSelected && otherText.trim()

      ? [...selected.filter((c) => knownIds.includes(c)), otherText.trim()]

      : selected;

    setProductConcerns(finalConcerns);

    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    setConversionFlowStep(10);

    router.push(ONBOARDING_ROUTES.sleep);

  };



  return (

    <OnboardingStepShell

      progress={PROGRESS}

      onBack={handleBack}

      eyebrow="PRODUCT INTELLIGENCE"

      title={

        <OnboardingTitle>

          {'What product ingredients '}

          <Text style={{ color: OB_COLORS.gold, fontStyle: 'italic' }}>

            worry you most?

          </Text>

        </OnboardingTitle>

      }

      subtitle="These become permanent red flags in every scan. See them instantly, every time."

      footer={

        <OnboardingFooter>

          <OnboardingCta

            label={`Flag these for me (${selected.length + (otherSelected && otherText.trim() ? 1 : 0)}) \u2192`}

            onPress={onContinue}

          />

        </OnboardingFooter>

      }

    >

      {PRODUCT_CONCERNS.map((item, index) => (

        <SelectChip

          key={item.id}

          label={item.label}

          selected={selected.includes(item.id)}

          onPress={() => toggle(item.id)}

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

        index={PRODUCT_CONCERNS.length}

      />

      {otherSelected ? (

        <TextInput

          value={otherText}

          onChangeText={setOtherText}

          placeholder="Describe the ingredient you want flagged..."

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


