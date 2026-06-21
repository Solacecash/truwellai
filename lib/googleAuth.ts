import {
  GoogleSignin,
  statusCodes,
} from '@react-native-google-signin/google-signin';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

import { supabase } from '@/lib/supabase';

function googleWebClientIdFromConfig(): string {
  const fromExtra = Constants.expoConfig?.extra?.googleWebClientId as string | undefined;
  const trimmed = typeof fromExtra === 'string' ? fromExtra.trim() : '';
  if (trimmed) return trimmed;
  return process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID?.trim?.() ?? '';
}

function googleIosClientIdFromConfig(): string | undefined {
  const fromExtra = Constants.expoConfig?.extra?.googleIosClientId as string | undefined;
  const trimmed = typeof fromExtra === 'string' ? fromExtra.trim() : '';
  if (trimmed) return trimmed;
  const env = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID?.trim?.();
  return env || undefined;
}

let configureCalled = false;

/**
 * Call once at app startup (see `app/_layout.tsx`).
 * Uses `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` (and optional `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID`)
 * from env, or `extra.googleWebClientId` / `extra.googleIosClientId` from app config.
 */
export function configureGoogleSignIn(): void {
  if (Platform.OS === 'web') return;
  if (configureCalled) return;

  const webClientId = googleWebClientIdFromConfig();
  if (!webClientId) {
    if (__DEV__) {
      console.warn(
        '[googleAuth] Missing web client ID. Set EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID (Web OAuth client from Google Cloud Console).',
      );
    }
    return;
  }

  const iosClientId = googleIosClientIdFromConfig();

  GoogleSignin.configure({
    webClientId,
    offlineAccess: false,
    ...(iosClientId ? { iosClientId } : {}),
  });

  configureCalled = true;
}

export type GoogleSignInResult =
  | { success: true; user: { id: string; email: string | null }; isNew: boolean }
  | { success: false; error: string; cancelled?: boolean };

function developerErrorMessage(): string {
  return (
    'Google Sign-In is misconfigured (DEVELOPER_ERROR). ' +
    'Use the Web OAuth client ID in EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID, register your Android SHA-1/SHA-256 ' +
    'for package com.truwell.ai in Google Cloud Console (or Firebase), then rebuild the native app. ' +
    'Run: npx @react-native-google-signin/config-doctor'
  );
}

export async function signInWithGoogle(): Promise<GoogleSignInResult> {
  if (Platform.OS === 'web') {
    return { success: false, error: 'Google sign-in is not available on web.' };
  }

  const webClientId = googleWebClientIdFromConfig();
  if (!webClientId) {
    return {
      success: false,
      error:
        'Google Sign-In is not configured. Add EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID (Web application OAuth client ID).',
    };
  }

  try {
    configureGoogleSignIn();
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

    const response = await GoogleSignin.signIn();

    if (response.type === 'cancelled') {
      return { success: false, error: 'Cancelled.', cancelled: true };
    }

    const googleUser = response.data;
    let idToken = googleUser.idToken;
    if (!idToken) {
      try {
        const tokens = await GoogleSignin.getTokens();
        idToken = tokens.idToken;
      } catch {
        idToken = null;
      }
    }

    if (!idToken) {
      return {
        success: false,
        error:
          'Google did not return an ID token. Check that EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID is the Web client ID from Google Cloud Console.',
      };
    }

    const {
      data: { user },
      error: supabaseError,
    } = await supabase.auth.signInWithIdToken({
      provider: 'google',
      token: idToken,
    });

    if (supabaseError || !user) {
      return {
        success: false,
        error: supabaseError?.message ?? 'Supabase sign in failed.',
      };
    }

    const createdAt = new Date(user.created_at).getTime();
    const isNew = Date.now() - createdAt < 10_000;

    const profile = googleUser.user;
    if (profile) {
      await supabase.auth.updateUser({
        data: {
          full_name: profile.name ?? '',
          given_name: profile.givenName ?? '',
          family_name: profile.familyName ?? '',
          avatar_url: profile.photo ?? '',
          provider: 'google',
        },
      }).catch(() => {});
    }

    return {
      success: true,
      user: { id: user.id, email: user.email ?? null },
      isNew,
    };
  } catch (err: unknown) {
    const e = err as { code?: string; message?: string };
    if (e.code === statusCodes.SIGN_IN_CANCELLED || e.code === '12501') {
      return { success: false, error: 'Cancelled.', cancelled: true };
    }
    if (e.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
      return {
        success: false,
        error: 'Google Play Services is not available on this device.',
      };
    }
    if (e.code === statusCodes.IN_PROGRESS) {
      return { success: false, error: 'Sign in already in progress.' };
    }
    if (e.code === '10' || String(e.message ?? '').includes('DEVELOPER_ERROR')) {
      return { success: false, error: developerErrorMessage() };
    }

    if (__DEV__) console.error('[googleAuth]', err);
    return {
      success: false,
      error: e.message ?? 'An unexpected error occurred.',
    };
  }
}

export async function signOutGoogle(): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    configureGoogleSignIn();
    await GoogleSignin.signOut();
  } catch (err) {
    if (__DEV__) console.warn('[googleAuth] signOut:', err);
  }
}
