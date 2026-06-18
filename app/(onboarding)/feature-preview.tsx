import * as Haptics from 'expo-haptics';

import { useRouter } from 'expo-router';

import React, { useEffect, useMemo, useState } from 'react';

import { StyleSheet, Text, View } from 'react-native';

import Animated, { FadeInDown } from 'react-native-reanimated';



import { DopamineInterlude } from '@/components/onboarding/DopamineInterlude';

import {

  OnboardingCta,

  OnboardingFooter,

  OnboardingStepShell,

  OnboardingTitle,

} from '@/components/onboarding/OnboardingStepShell';

import { DIET_OPTIONS } from '@/lib/onboardingStepData';

import { useOnboardingBack } from '@/lib/useOnboardingNavigation';

import { useOnboardingStore } from '@/stores/onboardingStore';

import { OB_COLORS, OB_FONTS, ONBOARDING_ROUTES } from '@/lib/_obShared';



const PROGRESS = 68;



function InsightCard({

  emoji,

  title,

  body,

  index,

}: {

  emoji: string;

  title: string;

  body: string;

  index: number;

}) {

  return (

    <Animated.View

      entering={FadeInDown.delay(120 + index * 80).springify()}

      style={styles.card}

    >

      <Text style={styles.cardEmoji}>{emoji}</Text>

      <View style={styles.cardCopy}>

        <Text style={styles.cardTitle}>{title}</Text>

        <Text style={styles.cardBody}>{body}</Text>

      </View>

    </Animated.View>

  );

}



export default function OnboardingFeaturePreview() {

  const router = useRouter();

  const userName = useOnboardingStore((s) => s.userName);

  const conditions = useOnboardingStore((s) => s.conditions);

  const dietType = useOnboardingStore((s) => s.dietType);

  const setConversionFlowStep = useOnboardingStore((s) => s.setConversionFlowStep);

  const setCompletionPercent = useOnboardingStore((s) => s.setCompletionPercent);

  const setConversionBlueprintReady = useOnboardingStore((s) => s.setConversionBlueprintReady);

  const handleBack = useOnboardingBack(12);

  const [interlude, setInterlude] = useState(false);



  useEffect(() => {

    setCompletionPercent(PROGRESS);

    setConversionFlowStep(12);

    setConversionBlueprintReady(true);

  }, [setCompletionPercent, setConversionBlueprintReady, setConversionFlowStep]);



  const highlights = useMemo(() => {

    const activeConds = conditions.filter((c) => c !== 'none');

    const condLabel = activeConds.length > 0

      ? activeConds.slice(0, 2).join(', ').toLowerCase()

      : 'health profile';



    const dietLabelRaw = DIET_OPTIONS.find((d) => d.id === dietType)?.label ?? null;
    const dietLabel = dietLabelRaw
      ? dietLabelRaw.charAt(0).toUpperCase() + dietLabelRaw.slice(1)
      : 'Whatever you eat';



    return [

      {

        emoji: '\uD83D\uDCF7',

        title: 'Know before you eat it',

        body: `Two seconds. That's all it takes for me to tell you if something conflicts with your ${condLabel}, before it's too late to put it back.`,

      },

      {

        emoji: '\uD83D\uDCF8',

        title: 'Snap your food',

        body: `${dietLabel}. I see exactly what's on your plate and tell you what it means for your goal, in real numbers, not guesses.`,

      },

      {

        emoji: '\uD83E\uDD16',

        title: 'Chat with Sofia',

        body: userName
          ? `${userName}, I remember everything. Every scan, every meal, every conversation. You're never starting over with me.`
          : `I remember everything. Every scan, every meal, every conversation. You're never starting over with me.`,

      },

      {

        emoji: '\uD83D\uDEA8',

        title: 'Live recall alerts',

        body: 'The products already in your home, watched around the clock. If a global safety authority flags one tomorrow, you will know before you reach for it again.',

      },

    ];

  }, [conditions, dietType, userName]);



  const onContinue = () => {

    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    setInterlude(true);

  };



  return (

    <View style={styles.root}>

      <OnboardingStepShell

        progress={PROGRESS}

        onBack={handleBack}

        eyebrow="HERE'S WHAT I CAN DO"

        title={

          <OnboardingTitle>

            {userName ? `${userName}, let me show you ` : 'Let me show you '}

            <Text style={{ color: OB_COLORS.gold, fontStyle: 'italic' }}>

              what just got activated.

            </Text>

          </OnboardingTitle>

        }

        subtitle="You told me what matters to you. Here is what I am already doing with it:"

        footer={

          <OnboardingFooter>

            <OnboardingCta

              label="Build my personal health report →"

              onPress={onContinue}

            />

          </OnboardingFooter>

        }

      >

        {highlights.map((item, index) => (

          <InsightCard key={item.title} {...item} index={index} />

        ))}

      </OnboardingStepShell>



      {interlude ? (

        <DopamineInterlude

          name={userName}

          emoji="✨"

          message="Almost there. Your personalised care report is one step away."

          onDone={() => {

            setConversionFlowStep(13);

            router.push(ONBOARDING_ROUTES.aiProcessing);

          }}

        />

      ) : null}

    </View>

  );

}



const styles = StyleSheet.create({

  root: { flex: 1, backgroundColor: '#020A14' },

  card: {

    flexDirection: 'row',

    gap: 12,

    padding: 14,

    borderRadius: 12,

    borderWidth: 1,

    borderColor: OB_COLORS.white12,

    backgroundColor: OB_COLORS.white07,

    marginBottom: 10,

  },

  cardEmoji: { fontSize: 22, marginTop: 2 },

  cardCopy: { flex: 1, gap: 4 },

  cardTitle: {

    fontFamily: OB_FONTS.semiBold,

    fontSize: 14,

    color: OB_COLORS.white,

  },

  cardBody: {

    fontFamily: OB_FONTS.body,

    fontSize: 13,

    lineHeight: 18,

    color: OB_COLORS.white70,

  },

});


