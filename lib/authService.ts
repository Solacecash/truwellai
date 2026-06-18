import { supabase } from './supabase';
import * as LocalAuthentication from 'expo-local-authentication';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import * as Crypto from 'expo-crypto';
import { Platform } from 'react-native';

WebBrowser.maybeCompleteAuthSession();

export type AuthMethod =
  | 'email'
  | 'phone'
  | 'apple'
  | 'google'
  | 'facebook'
  | 'linkedin'
  | 'biometric'
  | 'passkey'
  | 'pin';

export interface AuthResult {
  success: boolean;
  userId?: string;
  error?: string;
  method: AuthMethod;
}

// ── BIOMETRIC ──────────────────────────────────────────────────────────
export async function checkBiometricAvailability(): Promise<{
  available: boolean;
  type: 'faceId' | 'fingerprint' | 'iris' | 'none';
  enrolled: boolean;
}> {
  const compatible = await LocalAuthentication.hasHardwareAsync();
  if (!compatible) return { available: false, type: 'none', enrolled: false };

  const enrolled = await LocalAuthentication.isEnrolledAsync();
  const types = await LocalAuthentication.supportedAuthenticationTypesAsync();

  let type: 'faceId' | 'fingerprint' | 'iris' | 'none' = 'none';
  if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
    type = 'faceId';
  } else if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
    type = 'fingerprint';
  } else if (types.includes(LocalAuthentication.AuthenticationType.IRIS)) {
    type = 'iris';
  }

  return { available: compatible, type, enrolled };
}

export async function authenticateWithBiometric(): Promise<AuthResult> {
  try {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Sign in to TruWell AI',
      fallbackLabel: 'Use PIN instead',
      cancelLabel: 'Cancel',
      disableDeviceFallback: false,
    });

    if (!result.success) {
      return { success: false, error: result.error ?? 'Biometric failed', method: 'biometric' };
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user?.id) {
      return { success: false, error: 'No active session — please sign in with email first', method: 'biometric' };
    }

    return { success: true, userId: session.user.id, method: 'biometric' };
  } catch (err: any) {
    return { success: false, error: err.message ?? 'Biometric error', method: 'biometric' };
  }
}

// ── EMAIL + PASSWORD ────────────────────────────────────────────────────
export async function signInWithEmail(
  email: string,
  password: string
): Promise<AuthResult> {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error) return { success: false, error: error.message, method: 'email' };
    return { success: true, userId: data.session?.user?.id, method: 'email' };
  } catch (err: any) {
    return { success: false, error: err.message, method: 'email' };
  }
}

// ── PHONE OTP ───────────────────────────────────────────────────────────
export async function sendPhoneOtp(phone: string): Promise<AuthResult> {
  try {
    const { error } = await supabase.auth.signInWithOtp({ phone: phone.trim() });
    if (error) return { success: false, error: error.message, method: 'phone' };
    return { success: true, method: 'phone' };
  } catch (err: any) {
    return { success: false, error: err.message, method: 'phone' };
  }
}

export async function verifyPhoneOtp(
  phone: string,
  token: string
): Promise<AuthResult> {
  try {
    const { data, error } = await supabase.auth.verifyOtp({
      phone: phone.trim(),
      token: token.trim(),
      type: 'sms',
    });
    if (error) return { success: false, error: error.message, method: 'phone' };
    return { success: true, userId: data.session?.user?.id, method: 'phone' };
  } catch (err: any) {
    return { success: false, error: err.message, method: 'phone' };
  }
}

// ── APPLE (native Expo: identity token → Supabase, no nonce / OAuth client secret) ─────────────────────────────
async function persistAppleIdentityMetadata(
  credential: AppleAuthentication.AppleAuthenticationCredential,
  extraMetadata?: Record<string, unknown>,
): Promise<void> {
  const meta: Record<string, unknown> = { ...(extraMetadata ?? {}), provider: 'apple' };
  const fn = credential.fullName;
  if (fn) {
    const parts: string[] = [];
    if (fn.givenName) parts.push(fn.givenName);
    if (fn.middleName) parts.push(fn.middleName);
    if (fn.familyName) parts.push(fn.familyName);
    const fullName = parts.filter(Boolean).join(' ');
    if (fullName.trim()) {
      meta.full_name = fullName;
      meta.given_name = fn.givenName ?? '';
      meta.family_name = fn.familyName ?? '';
    }
  }
  const hasExtra = !!(extraMetadata && Object.keys(extraMetadata).length > 0);
  if (!hasExtra && !(meta.full_name || meta.given_name || meta.family_name)) {
    return;
  }

  await supabase.auth.updateUser({
    data: meta,
  });
}

export async function signInWithApple(options?: {
  /** Merged into `user_metadata` after sign-in (e.g. `{ role: 'professional' \| 'user' }` from register). */
  extraUserMetadata?: Record<string, unknown>;
}): Promise<AuthResult & { credential?: AppleAuthentication.AppleAuthenticationCredential }> {
  try {
    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    });

    if (!credential.identityToken) {
      return { success: false, error: 'No identity token from Apple', method: 'apple' };
    }

    const { data, error } = await supabase.auth.signInWithIdToken({
      provider: 'apple',
      token: credential.identityToken,
    });

    if (error) return { success: false, error: error.message, method: 'apple' };

    await persistAppleIdentityMetadata(credential, options?.extraUserMetadata).catch(() => {});

    return { success: true, userId: data.session?.user?.id, method: 'apple', credential };
  } catch (err: any) {
    if (err.code === 'ERR_REQUEST_CANCELED') {
      return { success: false, error: 'cancelled', method: 'apple' };
    }
    return { success: false, error: err.message, method: 'apple' };
  }
}

// ── GOOGLE (native Google Sign-In → Supabase `signInWithIdToken`; see `@/lib/googleAuth`) ──
export async function signInWithGoogle(): Promise<AuthResult> {
  try {
    const { signInWithGoogle: googleNative } = await import('./googleAuth');
    const result = await googleNative();
    if (result.success) {
      return { success: true, userId: result.user.id, method: 'google' };
    }
    if (result.cancelled) {
      return { success: false, error: 'cancelled', method: 'google' };
    }
    return { success: false, error: result.error, method: 'google' };
  } catch (err: unknown) {
    const e = err as { message?: string };
    return { success: false, error: e.message ?? 'Google sign in failed', method: 'google' };
  }
}

// ── FACEBOOK ────────────────────────────────────────────────────────────
export async function signInWithFacebook(): Promise<AuthResult> {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'facebook',
      options: {
        redirectTo: AuthSession.makeRedirectUri({ scheme: 'truwell', path: 'auth/callback' }),
        skipBrowserRedirect: true,
      },
    });

    if (error || !data.url) {
      return { success: false, error: error?.message ?? 'Facebook OAuth failed', method: 'facebook' };
    }

    const result = await WebBrowser.openAuthSessionAsync(data.url,
      AuthSession.makeRedirectUri({ scheme: 'truwell', path: 'auth/callback' })
    );

    if (result.type !== 'success') {
      return { success: false, error: 'cancelled', method: 'facebook' };
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return { success: false, error: 'Session not established', method: 'facebook' };
    return { success: true, userId: session.user.id, method: 'facebook' };
  } catch (err: any) {
    return { success: false, error: err.message, method: 'facebook' };
  }
}

// ── LINKEDIN ────────────────────────────────────────────────────────────
export async function signInWithLinkedIn(): Promise<AuthResult> {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'linkedin_oidc',
      options: {
        redirectTo: AuthSession.makeRedirectUri({ scheme: 'truwell', path: 'auth/callback' }),
        skipBrowserRedirect: true,
      },
    });

    if (error || !data.url) {
      return { success: false, error: error?.message ?? 'LinkedIn OAuth failed', method: 'linkedin' };
    }

    const result = await WebBrowser.openAuthSessionAsync(data.url,
      AuthSession.makeRedirectUri({ scheme: 'truwell', path: 'auth/callback' })
    );

    if (result.type !== 'success') {
      return { success: false, error: 'cancelled', method: 'linkedin' };
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return { success: false, error: 'Session not established', method: 'linkedin' };
    return { success: true, userId: session.user.id, method: 'linkedin' };
  } catch (err: any) {
    return { success: false, error: err.message, method: 'linkedin' };
  }
}

// ── PASSKEY ─────────────────────────────────────────────────────────────
export async function signInWithPasskey(): Promise<AuthResult> {
  try {
    const Passkey = (() => {
      try { return require('react-native-passkey').Passkey; } catch { return null; }
    })();

    if (!Passkey) {
      return { success: false, error: 'Passkeys not available on this device', method: 'passkey' };
    }

    const isSupported = await Passkey.isSupported();
    if (!isSupported) {
      return { success: false, error: 'Passkeys not supported on this device', method: 'passkey' };
    }

    const { data: challengeData, error: challengeError } = await supabase.functions.invoke(
      'passkey-challenge', { body: { action: 'authenticate' } }
    );

    if (challengeError || !challengeData?.challenge) {
      if (__DEV__) console.warn('[authService] Passkey server not configured, falling back to biometric');
      return authenticateWithBiometric();
    }

    const credential = await Passkey.authenticate(challengeData);

    const { data, error } = await supabase.functions.invoke('passkey-verify', {
      body: { credential, action: 'authenticate' }
    });

    if (error) return { success: false, error: error.message, method: 'passkey' };
    return { success: true, userId: data?.userId, method: 'passkey' };
  } catch (err: any) {
    if (err.message?.includes('cancelled') || err.message?.includes('user cancelled')) {
      return { success: false, error: 'cancelled', method: 'passkey' };
    }
    return authenticateWithBiometric();
  }
}

// ── PIN VALIDATION ───────────────────────────────────────────────────────
export async function verifyPin(pin: string): Promise<AuthResult> {
  try {
    const SecureStore = (() => {
      try { return require('expo-secure-store'); } catch { return null; }
    })();

    if (!SecureStore) {
      return { success: false, error: 'SecureStore not available', method: 'pin' };
    }

    const storedHash = await SecureStore.getItemAsync('truwell_pin_hash');
    if (!storedHash) {
      return { success: false, error: 'No PIN set — please sign in with email first', method: 'pin' };
    }

    const enteredHash = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      pin
    );

    if (enteredHash !== storedHash) {
      return { success: false, error: 'Incorrect PIN', method: 'pin' };
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return { success: false, error: 'Session expired — please sign in again', method: 'pin' };
    }

    return { success: true, userId: session.user.id, method: 'pin' };
  } catch (err: any) {
    return { success: false, error: err.message, method: 'pin' };
  }
}

export async function savePin(pin: string): Promise<void> {
  const SecureStore = (() => {
    try { return require('expo-secure-store'); } catch { return null; }
  })();
  if (!SecureStore) return;

  const hash = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    pin
  );
  await SecureStore.setItemAsync('truwell_pin_hash', hash);
}

export async function hasPin(): Promise<boolean> {
  const SecureStore = (() => {
    try { return require('expo-secure-store'); } catch { return null; }
  })();
  if (!SecureStore) return false;
  const stored = await SecureStore.getItemAsync('truwell_pin_hash');
  return stored !== null;
}

// Unused import suppressor — Platform is referenced indirectly by callers
void Platform.OS;
