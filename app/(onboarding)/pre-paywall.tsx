import * as Haptics from 'expo-haptics';

import { useRouter } from 'expo-router';

import React, { useEffect, useMemo } from 'react';

import { StyleSheet, Text, View } from 'react-native';

import Animated, { FadeInDown } from 'react-native-reanimated';



import {

  OnboardingCta,

  OnboardingFooter,

  OnboardingStepShell,

  OnboardingTitle,

} from '@/components/onboarding/OnboardingStepShell';

import { GOAL_LABELS } from '@/lib/onboardingStepData';

import { useOnboardingBack } from '@/lib/useOnboardingNavigation';

import { useOnboardingStore } from '@/stores/onboardingStore';

import { OB_COLORS, OB_FONTS, ONBOARDING_ROUTES } from '@/lib/_obShared';



const PROGRESS = 87;



const FEATURES = [

  'Scan any product for hidden dangers',

  'Snap food for instant calorie intelligence',

  'Sofia AI health assistant',

  'Live NAFDAC / FDA / WHO recall alerts',

  'Daily wellness tracking',

  'Personal TruWell Score over time',

] as const;



const TESTIMONIALS = [
  {
    name: 'Amara O.',
    role: 'TruWell user',
    initials: 'AO',
    quote: 'I scanned a supplement I had been taking for months. Found out it had an ingredient flagged for my condition. Switched products that same day.',
  },
  {
    name: 'David K.',
    role: 'TruWell user',
    initials: 'DK',
    quote: 'Sofia caught an allergen in a snack I almost gave my daughter. That single scan paid for the app a hundred times over.',
  },
  {
    name: 'Wei L.',
    role: 'TruWell user',
    initials: 'WL',
    quote: 'I lost 8kg in three months just by scanning before I ate. Seeing the real calorie count next to the ingredient breakdown changed how I shop completely.',
  },
];



const AVATARS = ['🧑🏽', '👩🏻', '👨🏿', '👩🏾', '🧔🏽'];



export default function OnboardingPrePaywall() {

  const router = useRouter();

  const userName = useOnboardingStore((s) => s.userName);

  const guardianGoals = useOnboardingStore((s) => s.guardianGoals);

  const setConversionFlowStep = useOnboardingStore((s) => s.setConversionFlowStep);

  const setCompletionPercent = useOnboardingStore((s) => s.setCompletionPercent);

  const handleBack = useOnboardingBack(15);



  useEffect(() => {

    setCompletionPercent(PROGRESS);

    setConversionFlowStep(15);

  }, [setCompletionPercent, setConversionFlowStep]);



  const goalsLine = useMemo(() => {

    const top = guardianGoals.slice(0, 3)

      .map((g) => GOAL_LABELS[g])

      .filter(Boolean);

    if (!top.length) return 'protect your health and your family';

    return top.join(', ');

  }, [guardianGoals]);



  const onContinue = () => {

    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    setConversionFlowStep(16);

    router.push(ONBOARDING_ROUTES.account);

  };



  const displayName = userName || '';



  return (

    <OnboardingStepShell

      progress={PROGRESS}

      onBack={handleBack}

      eyebrow="ONE LAST THING."

      title={

        <OnboardingTitle>

          {displayName ? `${displayName}, you came here for a ` : 'You came here for a '}

          <Text style={{ color: OB_COLORS.gold }}>reason</Text>

        </OnboardingTitle>

      }

      subtitle={`You want ${goalsLine}. That's not a small thing. That's your life.`}

      footer={

        <OnboardingFooter>

          <OnboardingCta

            label="I'm ready to protect my health →"

            onPress={onContinue}

          />

          <Text style={styles.trustText}>

            {'7-day free trial \u00B7 Cancel anytime \u00B7 No hidden fees'}

          </Text>

        </OnboardingFooter>

      }

    >

      <Animated.View entering={FadeInDown.delay(140).springify()} style={styles.social}>

        <View style={styles.avatarRow}>

          {AVATARS.map((a) => (

            <Text key={a} style={styles.avatar}>{a}</Text>

          ))}

        </View>

        <Text style={styles.socialText}>Thousands of families trust TruWell for daily health decisions</Text>

      </Animated.View>



      {FEATURES.map((feature, index) => (

        <Animated.View

          key={feature}

          entering={FadeInDown.delay(200 + index * 50).springify()}

          style={styles.bulletRow}

        >

          <Text style={styles.bulletMark}>✓</Text>

          <Text style={styles.bulletText}>{feature}</Text>

        </Animated.View>

      ))}



      <Animated.View entering={FadeInDown.delay(520).springify()} style={styles.quoteCard}>

        <Text style={styles.quoteText}>

          "The cost of one hospital visit exceeds a year of TruWell. Prevention isn't a luxury, it's the smartest investment you'll ever make."

        </Text>

      </Animated.View>



      {TESTIMONIALS.map((t, index) => (

        <Animated.View

          key={t.name}

          entering={FadeInDown.delay(580 + index * 60).springify()}

          style={styles.testimonialCard}

        >

          <View style={styles.testimonialStars}>

            {Array.from({ length: 5 }).map((_, i) => (

              <Text key={i} style={styles.testimonialStar}>★</Text>

            ))}

          </View>

          <Text style={styles.testimonialText}>{t.quote}</Text>

          <View style={styles.testimonialFooter}>

            <View style={styles.testimonialAvatar}>

              <Text style={styles.testimonialAvatarTxt}>{t.initials}</Text>

            </View>

            <View>

              <Text style={styles.testimonialName}>{t.name}</Text>

              <Text style={styles.testimonialRole}>{t.role}</Text>

            </View>

          </View>

        </Animated.View>

      ))}

    </OnboardingStepShell>

  );

}



const styles = StyleSheet.create({

  social: {

    alignItems: 'center',

    marginBottom: 20,

    gap: 8,

  },

  avatarRow: { flexDirection: 'row', gap: 4 },

  avatar: { fontSize: 22 },

  socialText: {

    fontFamily: OB_FONTS.body,

    fontSize: 12,

    color: OB_COLORS.white70,

    textAlign: 'center',

  },

  bulletRow: {

    flexDirection: 'row',

    gap: 10,

    marginBottom: 10,

    alignItems: 'flex-start',

  },

  bulletMark: { color: OB_COLORS.gold, fontSize: 14, fontWeight: '900', marginTop: 1 },

  bulletText: {

    flex: 1,

    fontFamily: OB_FONTS.body,

    fontSize: 14,

    lineHeight: 20,

    color: OB_COLORS.white,

  },

  quoteCard: {

    marginTop: 16,

    padding: 14,

    borderRadius: 12,

    borderWidth: 1,

    borderColor: 'rgba(201,168,76,0.30)',

    backgroundColor: 'rgba(201,168,76,0.08)',

  },

  quoteText: {

    fontFamily: OB_FONTS.body,

    fontSize: 13,

    lineHeight: 20,

    color: OB_COLORS.goldLight,

    fontStyle: 'italic',

  },

  testimonialCard: {
    marginTop: 12,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(201,168,76,0.20)',
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  testimonialStars: {
    flexDirection: 'row',
    gap: 2,
    marginBottom: 8,
  },
  testimonialStar: {
    color: OB_COLORS.gold,
    fontSize: 12,
  },
  testimonialText: {
    fontFamily: OB_FONTS.body,
    fontSize: 13,
    lineHeight: 19,
    color: OB_COLORS.white70,
    marginBottom: 12,
  },
  testimonialFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  testimonialAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(201,168,76,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(201,168,76,0.30)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  testimonialAvatarTxt: {
    fontFamily: OB_FONTS.body,
    fontSize: 12,
    fontWeight: '700',
    color: OB_COLORS.gold,
  },
  testimonialName: {
    fontFamily: OB_FONTS.body,
    fontSize: 13,
    fontWeight: '600',
    color: OB_COLORS.white,
  },
  testimonialRole: {
    fontFamily: OB_FONTS.body,
    fontSize: 11,
    color: OB_COLORS.white70,
  },

  trustText: {

    textAlign: 'center',

    fontFamily: OB_FONTS.body,

    fontSize: 11,

    color: OB_COLORS.white40,

    marginTop: 10,

  },

});


