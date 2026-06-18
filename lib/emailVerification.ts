import type { Href } from 'expo-router';

import { completeConversionOnboarding } from '@/lib/completeConversionOnboarding';
import { ONBOARDING_ROUTES } from '@/lib/onboardingRoutePaths';
import { supabase } from '@/lib/supabase';
import { useOnboardingStore } from '@/stores/onboardingStore';

/** Supabase email confirmation redirect. */
export const VERIFICATION_EMAIL_REDIRECT = 'https://truwellai.xyz/login?redirect=/verify';

export function checkEmailHref(email: string): Href {
  return `/(auth)/check-email?email=${encodeURIComponent(email)}` as Href;
}

export async function getVerificationStatus(): Promise<{
  isVerified: boolean;
  status: string | null;
  emailConfirmed: boolean;
}> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return {
        isVerified: false,
        status: null,
        emailConfirmed: false,
      };
    }

    const emailConfirmed = !!user.email_confirmed_at;

    const { data: profile } = await supabase
      .from('profiles')
      .select('verification_status, is_identity_verified')
      .eq('id', user.id)
      .single();

    return {
      isVerified: profile?.is_identity_verified ?? false,
      status: profile?.verification_status ?? null,
      emailConfirmed,
    };
  } catch {
    return {
      isVerified: false,
      status: null,
      emailConfirmed: false,
    };
  }
}

type RouterLike = {
  replace: (href: Href) => void;
  push: (href: Href) => void;
};

/** Routes after email is confirmed (conversion funnel, onboarding, or main app). */
export async function routeAfterEmailVerified(router: RouterLike): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email_confirmed_at) {
    router.push(checkEmailHref(user?.email ?? ''));
    return;
  }

  const onboarding = useOnboardingStore.getState();
  if (onboarding.conversionFlowStep > 0 && !onboarding.conversionFlowComplete) {
    await completeConversionOnboarding((href) => router.replace(href));
    return;
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('onboarding_complete')
    .eq('id', user.id)
    .single();

  if (profile?.onboarding_complete) {
    router.replace('/enter' as Href);
    return;
  }

  router.replace(ONBOARDING_ROUTES.role);
}

export function isOAuthCallbackUrl(url: string): boolean {
  return url.includes('auth/callback') || url.includes('access_token');
}

/** Parse tokens from OAuth or hash/query callback URLs. */
export async function applyOAuthCallbackFromUrl(url: string): Promise<boolean> {
  if (!isOAuthCallbackUrl(url)) return false;

  const fragment = url.split('#')[1];
  const query = url.split('?')[1];
  const paramString = fragment || query || '';
  const params = new URLSearchParams(paramString);
  const accessToken = params.get('access_token');
  const refreshToken = params.get('refresh_token');

  if (!accessToken || !refreshToken) return false;

  const { error } = await supabase.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken,
  });

  return !error;
}
