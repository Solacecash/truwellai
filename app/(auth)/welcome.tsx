import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';

import { AhaScreen } from '@/components/onboarding/AhaScreen';
import { OnboardingSlides } from '@/components/onboarding/OnboardingSlides';
import { RegistrationWizard } from '@/components/onboarding/wizard/RegistrationWizard';
import { guestConversionResumeHref } from '@/lib/onboardingService';
import { resolveUserRole } from '@/lib/roleResolver';
import { supabase } from '@/lib/supabase';
import { useOnboardingStore } from '@/stores/onboardingStore';
import type { User } from '@supabase/supabase-js';

const STORAGE_KEY = 'truwell_onboarding_complete';

// Read role from auth metadata (set at signUp, instantly available, no DB call).
// Returns null when metadata is absent so callers can fall back to DB.
function roleFromUser(_user: User): 'user' | null {
  return 'user';
}

export default function WelcomeScreen() {
  const router = useRouter();
  const setWizardOpen = useOnboardingStore((s) => s.setWizardOpen);
  const onboardingComplete = useOnboardingStore((s) => s.onboardingComplete);
  const setOnboardingComplete = useOnboardingStore((s) => s.setOnboardingComplete);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await useOnboardingStore.getState().hydrateConversionFromStorage();
        const v = await AsyncStorage.getItem(STORAGE_KEY);
        const { data } = await supabase.auth.getSession();
        if (cancelled) return;
        const st = useOnboardingStore.getState();
        const guestHref =
          !data.session?.user &&
          guestConversionResumeHref({
            conversionFlowComplete: st.conversionFlowComplete,
            conversionFlowStep: st.conversionFlowStep,
            selectedRole: st.selectedRole,
            guardianGoals: st.guardianGoals,
            conversionBlueprintReady: st.conversionBlueprintReady,
            setConversionFlowStep: st.setConversionFlowStep,
          });
        if (guestHref) {
          router.replace(guestHref as never);
          return;
        }
        if (v === 'true' && data.session?.user) {
          // Onboarding already done AND user is logged in — send to their dashboard.
          // Do NOT redirect to /login when there is no session: a logged-out user
          // arriving here (e.g. via "Create account" on the login screen) should see
          // the onboarding slides so they can register a new account.
          if (!cancelled) router.replace('/enter' as never);
          return;
        }
        // No active session (e.g. user just logged out) — ensure the AHA overlay
        // is hidden so it cannot block the onboarding slides / login button.
        if (!cancelled) setOnboardingComplete(false);
      } catch {
        /* stay on welcome */
        if (!cancelled) setOnboardingComplete(false);
      } finally {
        if (!cancelled) setHydrated(true);
      }
    })();
    return () => { cancelled = true; };
  }, [router, setOnboardingComplete]);

  const openWizard = useCallback(() => {
    useOnboardingStore.getState().setWizardStep(1);
    setWizardOpen(true);
  }, [setWizardOpen]);

  const onRegistrationSuccess = useCallback(() => {
    setOnboardingComplete(true);
  }, [setOnboardingComplete]);

  if (!hydrated) {
    return <View style={{ flex: 1, backgroundColor: '#020A14' }} />;
  }

  return (
    <SafeAreaView style={styles.fill} edges={[]}>
      <View style={styles.fill}>
        <OnboardingSlides onOpenWizard={openWizard} />
        <RegistrationWizard onRegistrationSuccess={onRegistrationSuccess} />
        {onboardingComplete && <AhaScreen visible />}
        {/*
          NO global login button here.
          The "Already a member? Sign in" link lives only in Slide5TypeSelect,
          which is the only slide where it belongs per spec.
        */}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: '#03080F' },
});
