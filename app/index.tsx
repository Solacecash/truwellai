import React, { useEffect } from 'react';
import { View } from 'react-native';

import { useRouter } from 'expo-router';

import { supabase } from '@/lib/supabase';

import { resolveUserRole } from '@/lib/roleResolver';

import type { Session } from '@supabase/supabase-js';

import type { ConversionRole } from '@/lib/conversionOnboardingTypes';
import { ONBOARDING_ROUTES } from '@/lib/onboardingRoutePaths';
import { guestConversionResumeHref, routeForOnboardingStep } from '@/lib/onboardingService';

import { useOnboardingStore } from '@/stores/onboardingStore';

export default function Index() {
  const router = useRouter();

  useEffect(() => {
    let mounted = true;

    const routeSession = async (_session: Session) => {
      try {
        if (!mounted) return;
        router.replace('/enter' as never);
      } catch (err) {
        if (__DEV__) console.error('[index] routeSession error:', err);
        if (mounted) router.replace('/enter' as never);
      }
    };

    const run = async () => {
      try {
        await useOnboardingStore.getState().hydratePsychFromStorage();
        await useOnboardingStore.getState().hydrateConversionFromStorage();

        if (!mounted) return;

        const { data: { session } } = await supabase.auth.getSession();

        if (!mounted) return;

        const {
          conversionFlowComplete,
          conversionFlowStep,
          selectedRole,
          guardianGoals,
          conversionBlueprintReady,
          setConversionFlowStep,
        } = useOnboardingStore.getState();

        if (session?.user?.id) {
          if (!conversionFlowComplete && conversionFlowStep >= 2 && conversionFlowStep <= 11) {
            const resumeRole: ConversionRole | '' =
              selectedRole === 'guardian' ? 'guardian' : '';
            router.replace(routeForOnboardingStep(conversionFlowStep, resumeRole) as never);
            return;
          }

          if (__DEV__) console.log('[index] existing session:', session.user.id);
          await routeSession(session);
          return;
        }

        // Only resume guest funnel if they have actual assessment data
        // and have not reached the account/subscription screens yet.
        // Steps 10+ (subscription, account) require signup first —
        // always restart from welcome if they got that far without signing in.
        const hasRealProgress =
          selectedRole &&
          guardianGoals.length > 0 &&
          conversionFlowStep >= 2 &&
          conversionFlowStep <= 15;

        if (hasRealProgress) {
          const guestHref = guestConversionResumeHref({
            conversionFlowComplete,
            conversionFlowStep,
            selectedRole,
            guardianGoals,
            conversionBlueprintReady,
            setConversionFlowStep,
          });
          if (guestHref) {
            router.replace(guestHref as never);
            return;
          }
        }

        // Reset stale funnel state so the next session starts fresh
        if (conversionFlowStep >= 10 && !conversionFlowComplete) {
          useOnboardingStore.getState().setConversionFlowStep(1);
          await useOnboardingStore.getState().persistConversionSnapshot();
        }

        router.replace(ONBOARDING_ROUTES.welcome as never);
      } catch (err) {
        if (__DEV__) console.error('[index] run error:', err);
        if (mounted) router.replace(ONBOARDING_ROUTES.welcome as never);
      }
    };

    void run();
    return () => { mounted = false; };
  }, [router]);

  return <View style={{ flex: 1, backgroundColor: '#020A14' }} />;
}
