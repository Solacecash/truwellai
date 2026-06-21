import {
  DMSans_400Regular,
  DMSans_500Medium,
} from '@expo-google-fonts/dm-sans';
import {
  Montserrat_600SemiBold,
  Montserrat_700Bold,
} from '@expo-google-fonts/montserrat';
import { Stack } from 'expo-router';
import { useFonts } from 'expo-font';
import React, { useEffect } from 'react';
import { setOnboardingFontsReady } from '@/lib/onboardingFonts';
import { useOnboardingStore } from '@/stores/onboardingStore';

/** Spec onboarding stack — `app/(onboarding)/` (lines 35–67). */
export default function SpecOnboardingLayout() {
  const [fontsLoaded, fontError] = useFonts({
    'DM-Sans': DMSans_400Regular,
    'DM-Sans-Medium': DMSans_500Medium,
    Montserrat: Montserrat_700Bold,
    'Montserrat-SemiBold': Montserrat_600SemiBold,
  });

  useEffect(() => {
    void useOnboardingStore.getState().hydrateConversionFromStorage();
  }, []);

  useEffect(() => {
    setOnboardingFontsReady(fontsLoaded && !fontError);
    if (fontError) {
      if (__DEV__) console.warn('[Onboarding] Font load failed — using system fallback.', fontError);
    }
  }, [fontsLoaded, fontError]);

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'fade',
        animationDuration: 300,
        contentStyle: { backgroundColor: '#020A14' },
      }}
    >
      <Stack.Screen name="welcome" options={{ gestureEnabled: false }} />
      <Stack.Screen name="name" />
      <Stack.Screen name="goals" />
      <Stack.Screen name="age-range" />
      <Stack.Screen name="gender" />
      <Stack.Screen name="conditions" />
      <Stack.Screen name="allergies" />
      <Stack.Screen name="diet-type" />
      <Stack.Screen name="product-concerns" />
      <Stack.Screen name="sleep" />
      <Stack.Screen name="lifestyle" />
      <Stack.Screen name="family-role" />
      <Stack.Screen name="feature-preview" />
      <Stack.Screen name="ai-processing" options={{ gestureEnabled: false }} />
      <Stack.Screen name="score-reveal" />
      <Stack.Screen name="pre-paywall" />
      <Stack.Screen
        name="account"
        options={{ gestureEnabled: false, animation: 'fade' }}
      />
      <Stack.Screen name="subscription" options={{ gestureEnabled: false }} />
      <Stack.Screen
        name="success"
        options={{ gestureEnabled: false, animation: 'fade' }}
      />
      {/* Legacy routes — redirect stubs for deep links / resume */}
      <Stack.Screen name="role" />
      <Stack.Screen name="guardian/care-discovery" />
      <Stack.Screen name="guardian/assessment" />
      <Stack.Screen name="future-vision" />
      <Stack.Screen name="ai-demo" />
      <Stack.Screen name="blueprint" />
    </Stack>
  );
}
