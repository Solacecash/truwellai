import * as Haptics from 'expo-haptics';

import { useRouter } from 'expo-router';

import React, { useEffect, useState } from 'react';

import { StyleSheet, Text, View } from 'react-native';



import { DopamineInterlude } from '@/components/onboarding/DopamineInterlude';

import {

  OnboardingCta,

  OnboardingFooter,

  OnboardingStepShell,

  OnboardingTitle,

  SelectChip,

} from '@/components/onboarding/OnboardingStepShell';

import { ONBOARDING_GOALS } from '@/lib/onboardingStepData';

import { useOnboardingBack } from '@/lib/useOnboardingNavigation';

import { useOnboardingStore } from '@/stores/onboardingStore';

import { OB_COLORS, OB_FONTS, ONBOARDING_ROUTES } from '@/lib/_obShared';



const PROGRESS = 12;



export default function OnboardingGoals() {

  const router = useRouter();

  const userName = useOnboardingStore((s) => s.userName);

  const guardianGoals = useOnboardingStore((s) => s.guardianGoals);

  const toggleGoal = useOnboardingStore((s) => s.toggleGoal);

  const setConversionFlowStep = useOnboardingStore((s) => s.setConversionFlowStep);

  const setCompletionPercent = useOnboardingStore((s) => s.setCompletionPercent);

  const handleBack = useOnboardingBack(3);

  const [interlude, setInterlude] = useState(false);

  const [chipFlash, setChipFlash] = useState(false);



  useEffect(() => {

    setCompletionPercent(PROGRESS);

    setConversionFlowStep(3);

  }, [setCompletionPercent, setConversionFlowStep]);



  const ctaReady = guardianGoals.length >= 1;



  const onContinue = () => {

    if (!ctaReady) return;

    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    setChipFlash(true);

    setTimeout(() => {

      setChipFlash(false);

      setInterlude(true);

    }, 400);

  };



  return (

    <View style={styles.root}>

      <OnboardingStepShell

        progress={PROGRESS}

        onBack={handleBack}

        eyebrow="YOUR PRIORITIES"

        title={

          <OnboardingTitle>

            {userName ? `${userName}, what matters` : 'What matters'}{' '}

            <Text style={{ color: OB_COLORS.gold, fontStyle: 'italic' }}>

              most to you right now?

            </Text>

          </OnboardingTitle>

        }

        subtitle="Your TruWell care report is built around your priorities. Pick everything that speaks to where you are today."

        footer={

          <OnboardingFooter>

            <OnboardingCta

              label={`These are my goals (${guardianGoals.length}) \u2192`}

              onPress={onContinue}

              disabled={!ctaReady}

            />

          </OnboardingFooter>

        }

      >

        {ONBOARDING_GOALS.map((goal, index) => {

          const isSelected = guardianGoals.includes(goal.id);

          return (

            <View

              key={goal.id}

              style={chipFlash && isSelected ? styles.chipFlash : undefined}

            >

              <SelectChip

                icon={goal.icon}

                label={goal.label}

                selected={isSelected}

                onPress={() => toggleGoal(goal.id)}

                index={index}

              />

            </View>

          );

        })}

        {guardianGoals.length > 0 ? (

          <Text style={styles.confirm}>

            ✓ {guardianGoals.length} priorities selected

          </Text>

        ) : null}

      </OnboardingStepShell>



      {interlude ? (

        <DopamineInterlude

          name={userName}

          emoji="🎯"

          message={`Powerful choices. ${guardianGoals.length} priorities locked in for your report.`}

          onDone={() => {

            setConversionFlowStep(4);

            router.push(ONBOARDING_ROUTES.ageRange);

          }}

        />

      ) : null}

    </View>

  );

}



const styles = StyleSheet.create({

  root: { flex: 1, backgroundColor: '#020A14' },

  confirm: {

    color: OB_COLORS.teal,

    fontFamily: OB_FONTS.medium,

    fontSize: 12,

    marginTop: 8,

  },

  chipFlash: {

    borderRadius: 12,

    borderWidth: 2,

    borderColor: OB_COLORS.gold,

    backgroundColor: 'rgba(201,168,76,0.15)',

  },

});


