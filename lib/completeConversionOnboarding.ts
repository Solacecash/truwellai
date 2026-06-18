import type { Href } from 'expo-router';



import { supabase } from '@/lib/supabase';

import { useOnboardingStore } from '@/stores/onboardingStore';



export async function completeConversionOnboarding(

  routerReplace: (href: Href) => void

): Promise<void> {

  useOnboardingStore.getState().setConversionFlowComplete(true);

  useOnboardingStore.getState().setOnboardingComplete(true);



  if (__DEV__) console.log('[TruWell onboarding] completeConversionOnboarding → /enter');



  routerReplace('/enter' as Href);

}

