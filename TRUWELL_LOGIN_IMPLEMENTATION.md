# TRUWELL AI — LOGIN / SIGN-IN SCREEN COMPLETE REDESIGN
# Implementation Prompt for Claude Code in Cursor
# Based on approved design: truwell_signin_redesign.html
# Version: 1.0

READ THIS ENTIRE PROMPT BEFORE TOUCHING ANY FILE.
Execute each phase in strict order. Do not skip. Do not combine phases.
After every phase: npx tsc --noEmit — fix all errors before proceeding.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PHASE 1 — AUDIT EXISTING LOGIN FILES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Step 1.1 — Locate every login-related file

Run these commands and show full output:

find app -name "login*" -o -name "sign*" -o -name "signin*" -o -name "auth*" 2>/dev/null
grep -r "signIn\|signInWithPassword\|Sign In\|login\|Login\|GoogleSignIn\|AppleAuthentication" \
  app/ components/ lib/ --include="*.tsx" --include="*.ts" -l

Step 1.2 — Read and document each file found

Show the COMPLETE content of:
- app/(auth)/login.tsx (or wherever the login screen lives)
- Any auth helper in lib/ that handles signIn
- Any existing social auth component
- app/(auth)/_layout.tsx — show Stack.Screen list
- Any existing OTP or verification screen

Step 1.3 — Answer these questions before touching anything:

1. What is the exact file path of the current login screen?
2. Does a ForgotPassword or OTP screen already exist?
3. What packages are already installed?
   Run: cat package.json | grep -E "expo-local-authentication|expo-apple|google|facebook|linkedin|passkey|reanimated|haptics"
4. Does lib/supabase.ts have signInWithOAuth configured?
5. What does the post-login navigation look like — where does it go after success?
6. Is there a useAuthStore or similar that holds session state?

Step 1.4 — Delete or empty ONLY the login screen component

After documenting everything:
- EMPTY app/(auth)/login.tsx completely (do not delete the file — keep the route)
- Do NOT touch _layout.tsx, welcome.tsx, roleResolver.ts, or any other auth file
- Do NOT touch any existing OAuth configuration in lib/supabase.ts
- Report: "Login screen emptied. All other auth files untouched."

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PHASE 2 — INSTALL REQUIRED PACKAGES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Step 2.1 — Check what is already installed

Run: cat package.json | grep -E "expo-local-auth|expo-apple|@invertase|react-native-fbsdk|expo-auth|passkey|reanimated|haptics|linear-gradient"

Step 2.2 — Install missing packages

Install only what is NOT already in package.json:

npx expo install expo-local-authentication
npx expo install expo-apple-authentication
npx expo install expo-haptics
npx expo install react-native-reanimated
npx expo install expo-linear-gradient

For Facebook login (install expo-auth-session which handles OAuth including Facebook):
npx expo install expo-auth-session expo-crypto expo-web-browser

For LinkedIn OAuth (also uses expo-auth-session):
Already covered by expo-auth-session above.

For Passkeys (WebAuthn on native):
npm install react-native-passkey --save
Run: npx expo prebuild --clean (only if using bare workflow)
If managed workflow: note that passkeys require a custom dev client build.

Step 2.3 — Verify Reanimated plugin

Open babel.config.js. Confirm this plugin exists:
'react-native-reanimated/plugin'

If missing add it as the LAST item in the plugins array:
module.exports = {
  presets: ['babel-preset-expo'],
  plugins: [
    'react-native-reanimated/plugin',
  ],
};

Step 2.4 — Add app.config.ts permissions and schemes

In app.config.ts (or app.json) under ios.infoPlist add:
NSFaceIDUsageDescription: "TruWell AI uses Face ID to sign you in instantly"

Under android.permissions add if not present:
"USE_BIOMETRIC"
"USE_FINGERPRINT"

Under scheme: confirm a URL scheme is set (needed for OAuth callbacks):
scheme: "truwell"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PHASE 3 — AUTH SERVICE LAYER
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Step 3.1 — Create lib/authService.ts

This file centralises ALL authentication methods.
Do NOT put auth logic inside the screen component.

---
import { supabase } from './supabase';
import * as LocalAuthentication from 'expo-local-authentication';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import * as Crypto from 'expo-crypto';
import { Alert, Platform } from 'react-native';

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

// ── APPLE ───────────────────────────────────────────────────────────────
export async function signInWithApple(): Promise<AuthResult> {
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
    return { success: true, userId: data.session?.user?.id, method: 'apple' };
  } catch (err: any) {
    if (err.code === 'ERR_REQUEST_CANCELED') {
      return { success: false, error: 'cancelled', method: 'apple' };
    }
    return { success: false, error: err.message, method: 'apple' };
  }
}

// ── GOOGLE ──────────────────────────────────────────────────────────────
export async function signInWithGoogle(): Promise<AuthResult> {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: AuthSession.makeRedirectUri({ scheme: 'truwell', path: 'auth/callback' }),
        skipBrowserRedirect: true,
      },
    });

    if (error || !data.url) {
      return { success: false, error: error?.message ?? 'Google OAuth failed', method: 'google' };
    }

    const result = await WebBrowser.openAuthSessionAsync(data.url,
      AuthSession.makeRedirectUri({ scheme: 'truwell', path: 'auth/callback' })
    );

    if (result.type !== 'success') {
      return { success: false, error: 'cancelled', method: 'google' };
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return { success: false, error: 'Session not established', method: 'google' };
    return { success: true, userId: session.user.id, method: 'google' };
  } catch (err: any) {
    return { success: false, error: err.message, method: 'google' };
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
// Passkeys use WebAuthn / FIDO2 via Supabase's experimental support.
// The flow: create a challenge server-side → native authenticator signs it
// → verify on server. Currently requires Supabase passkeys (beta).
// Implementation below attempts native passkey; falls back gracefully.

export async function signInWithPasskey(): Promise<AuthResult> {
  try {
    // Check if react-native-passkey is available
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

    // Get challenge from Supabase (requires Supabase passkey feature enabled in dashboard)
    const { data: challengeData, error: challengeError } = await supabase.functions.invoke(
      'passkey-challenge', { body: { action: 'authenticate' } }
    );

    if (challengeError || !challengeData?.challenge) {
      // Graceful fallback to biometric if passkeys not configured on server
      console.warn('[authService] Passkey server not configured, falling back to biometric');
      return authenticateWithBiometric();
    }

    const credential = await Passkey.authenticate(challengeData);

    const { data, error } = await supabase.functions.invoke('passkey-verify', {
      body: { credential, action: 'authenticate' }
    });

    if (error) return { success: false, error: error.message, method: 'passkey' };
    return { success: true, userId: data?.userId, method: 'passkey' };
  } catch (err: any) {
    // Passkey cancelled or not enrolled — fall through to biometric
    if (err.message?.includes('cancelled') || err.message?.includes('user cancelled')) {
      return { success: false, error: 'cancelled', method: 'passkey' };
    }
    // For now fall back to biometric as passkey equivalent
    return authenticateWithBiometric();
  }
}

// ── PIN VALIDATION ───────────────────────────────────────────────────────
// PIN is a local device verification that re-authenticates to an existing session
// It does NOT create a new Supabase session — it unlocks an existing one
// Store PIN hash in SecureStore, verify locally, then resume Supabase session

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
---

Step 3.2 — Install expo-secure-store if not present

Run: cat package.json | grep secure-store
If missing: npx expo install expo-secure-store

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PHASE 4 — ANIMATION COMPONENTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Step 4.1 — Create components/auth/TruWellShieldAnimated.tsx

This is the animated logo used on the login screen.
Faithfully recreates the approved design: gold shield, circuit board pattern,
human figure silhouette, amber core orb, blue electric orbit ring.

---
import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withSpring,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import Svg, {
  Defs, LinearGradient, RadialGradient, Stop, Filter, FeGaussianBlur,
  Path, Ellipse, Circle, Line, ClipPath, Rect, G, Text as SvgText,
} from 'react-native-svg';

interface Props {
  size?: number;
}

export default function TruWellShieldAnimated({ size = 90 }: Props) {
  const floatY = useSharedValue(0);
  const ring1Rotate = useSharedValue(0);
  const ring2Rotate = useSharedValue(0);
  const pulseScale = useSharedValue(0.92);
  const pulseOpacity = useSharedValue(1);
  const orbGlow = useSharedValue(1);

  useEffect(() => {
    // Float animation
    floatY.value = withRepeat(
      withSequence(
        withTiming(-8, { duration: 2000, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 2000, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      false
    );

    // Ring 1: clockwise
    ring1Rotate.value = withRepeat(
      withTiming(360, { duration: 14000, easing: Easing.linear }),
      -1,
      false
    );

    // Ring 2: counter-clockwise
    ring2Rotate.value = withRepeat(
      withTiming(-360, { duration: 20000, easing: Easing.linear }),
      -1,
      false
    );

    // Pulse ring
    pulseScale.value = withRepeat(
      withSequence(
        withTiming(1.55, { duration: 2200, easing: Easing.out(Easing.quad) }),
        withTiming(0.92, { duration: 0 })
      ),
      -1,
      false
    );
    pulseOpacity.value = withRepeat(
      withSequence(
        withTiming(0, { duration: 2200, easing: Easing.out(Easing.quad) }),
        withTiming(1, { duration: 0 })
      ),
      -1,
      false
    );

    // Orb inner glow pulse
    orbGlow.value = withRepeat(
      withSequence(
        withTiming(1.3, { duration: 1800, easing: Easing.inOut(Easing.sin) }),
        withTiming(0.8, { duration: 1800, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      false
    );
  }, []);

  const floatStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: floatY.value }],
  }));

  const ring1Style = useAnimatedStyle(() => ({
    transform: [{ rotate: `${ring1Rotate.value}deg` }],
  }));

  const ring2Style = useAnimatedStyle(() => ({
    transform: [{ rotate: `${ring2Rotate.value}deg` }],
  }));

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
    opacity: pulseOpacity.value,
  }));

  const containerSize = size + 48;

  return (
    <View style={{ width: containerSize, height: containerSize, alignItems: 'center', justifyContent: 'center' }}>

      {/* Orbit ring 1 */}
      <Animated.View style={[StyleSheet.absoluteFill, ring1Style, { alignItems: 'center', justifyContent: 'center' }]}>
        <View style={{
          width: size + 30,
          height: size + 30,
          borderRadius: (size + 30) / 2,
          borderWidth: 1,
          borderColor: 'rgba(201,168,76,0.20)',
          borderStyle: 'dashed',
        }}/>
      </Animated.View>

      {/* Orbit ring 2 */}
      <Animated.View style={[StyleSheet.absoluteFill, ring2Style, { alignItems: 'center', justifyContent: 'center' }]}>
        <View style={{
          width: size + 46,
          height: size + 46,
          borderRadius: (size + 46) / 2,
          borderWidth: 1,
          borderColor: 'rgba(0,229,200,0.12)',
        }}/>
      </Animated.View>

      {/* Pulse ring */}
      <Animated.View style={[pulseStyle, StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }]}>
        <View style={{
          width: size + 8,
          height: size + 8,
          borderRadius: (size + 8) / 2,
          borderWidth: 1.5,
          borderColor: 'rgba(201,168,76,0.38)',
        }}/>
      </Animated.View>

      {/* Floating shield body */}
      <Animated.View style={floatStyle}>
        <Svg width={size} height={size} viewBox="0 0 200 200" fill="none">
          <Defs>
            <LinearGradient id="lgGold" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor="#F0D060"/>
              <Stop offset="50%" stopColor="#C9A84C"/>
              <Stop offset="100%" stopColor="#8A6020"/>
            </LinearGradient>
            <LinearGradient id="lgBlue" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0%" stopColor="#0A2A6A"/>
              <Stop offset="100%" stopColor="#0A1A4A"/>
            </LinearGradient>
            <RadialGradient id="rgOrb" cx="50%" cy="50%" r="50%">
              <Stop offset="0%" stopColor="#FFB030"/>
              <Stop offset="50%" stopColor="#E06010"/>
              <Stop offset="100%" stopColor="#802000" stopOpacity="0"/>
            </RadialGradient>
          </Defs>

          {/* Outer shield — gold */}
          <Path
            d="M100 8L168 34V90C168 130 138 162 100 174C62 162 32 130 32 90V34Z"
            fill="url(#lgGold)"
          />
          {/* Inner shield — dark navy */}
          <Path
            d="M100 16L160 40V90C160 126 133 155 100 166C67 155 40 126 40 90V40Z"
            fill="url(#lgBlue)"
          />

          {/* Circuit board traces — gold */}
          <Line x1="100" y1="42" x2="100" y2="68" stroke="#C9A84C" strokeWidth="1.2" opacity="0.7"/>
          <Line x1="80" y1="52" x2="60" y2="62" stroke="#C9A84C" strokeWidth="1" opacity="0.5"/>
          <Line x1="120" y1="52" x2="140" y2="62" stroke="#C9A84C" strokeWidth="1" opacity="0.5"/>
          <Circle cx="100" cy="42" r="4" fill="none" stroke="#C9A84C" strokeWidth="1.2" opacity="0.7"/>
          <Circle cx="80" cy="52" r="3" fill="none" stroke="#C9A84C" strokeWidth="1" opacity="0.6"/>
          <Circle cx="120" cy="52" r="3" fill="none" stroke="#C9A84C" strokeWidth="1" opacity="0.6"/>
          <Line x1="68" y1="70" x2="56" y2="78" stroke="#C9A84C" strokeWidth="0.9" opacity="0.45"/>
          <Line x1="132" y1="70" x2="144" y2="78" stroke="#C9A84C" strokeWidth="0.9" opacity="0.45"/>
          <Line x1="60" y1="100" x2="56" y2="78" stroke="#C9A84C" strokeWidth="0.9" opacity="0.4"/>
          <Line x1="140" y1="100" x2="144" y2="78" stroke="#C9A84C" strokeWidth="0.9" opacity="0.4"/>
          <Line x1="60" y1="120" x2="60" y2="100" stroke="#C9A84C" strokeWidth="0.9" opacity="0.35"/>
          <Line x1="140" y1="120" x2="140" y2="100" stroke="#C9A84C" strokeWidth="0.9" opacity="0.35"/>
          <Line x1="78" y1="140" x2="60" y2="120" stroke="#C9A84C" strokeWidth="0.9" opacity="0.3"/>
          <Line x1="122" y1="140" x2="140" y2="120" stroke="#C9A84C" strokeWidth="0.9" opacity="0.3"/>
          <Line x1="100" y1="148" x2="78" y2="140" stroke="#C9A84C" strokeWidth="0.9" opacity="0.3"/>
          <Line x1="100" y1="148" x2="122" y2="140" stroke="#C9A84C" strokeWidth="0.9" opacity="0.3"/>

          {/* Circuit nodes */}
          <Ellipse cx="82" cy="76" rx="5" ry="5" fill="#C9A84C" opacity="0.2"/>
          <Ellipse cx="118" cy="76" rx="5" ry="5" fill="#C9A84C" opacity="0.2"/>
          <Circle cx="60" cy="100" r="3" fill="#C9A84C" opacity="0.25"/>
          <Circle cx="140" cy="100" r="3" fill="#C9A84C" opacity="0.25"/>

          {/* Human figure silhouette — dark */}
          <Path
            d="M100 60C91 60 84 66 84 73C84 79 91 85 100 87C109 85 116 79 116 73C116 66 109 60 100 60Z"
            fill="#1A1A2E"
            opacity="0.95"
          />
          <Path
            d="M72 96C72 84 83 79 100 79C117 79 128 84 128 96L122 112L100 120L78 112Z"
            fill="#1A1A2E"
            opacity="0.9"
          />
          {/* Arms */}
          <Path d="M84 82L70 97" stroke="#1A1A2E" strokeWidth="14" strokeLinecap="round"/>
          <Path d="M116 82L130 97" stroke="#1A1A2E" strokeWidth="14" strokeLinecap="round"/>

          {/* Amber orb — core */}
          <Ellipse cx="100" cy="90" rx="9" ry="9" fill="url(#rgOrb)" opacity="0.9"/>
          <Ellipse cx="100" cy="90" rx="4.5" ry="4.5" fill="#FFB030"/>
          <Ellipse cx="97.5" cy="87.5" rx="2" ry="2" fill="rgba(255,240,180,0.75)"/>

          {/* Blue orbit ring around shield */}
          <Path
            d="M36 114 A70 28 0 0 1 100 88"
            stroke="#00CCFF"
            strokeWidth="3.5"
            strokeLinecap="round"
            opacity="0.85"
            fill="none"
          />
          <Path
            d="M100 88 A70 28 0 0 1 164 114"
            stroke="#00CCFF"
            strokeWidth="3.5"
            strokeLinecap="round"
            opacity="0.85"
            fill="none"
          />
          <Path
            d="M38 118C25 118 26 118 38 105"
            stroke="#00AAFF"
            strokeWidth="2.5"
            strokeLinecap="round"
            opacity="0.6"
            fill="none"
          />
          <Path
            d="M162 118C175 118 174 118 162 105"
            stroke="#00AAFF"
            strokeWidth="2.5"
            strokeLinecap="round"
            opacity="0.6"
            fill="none"
          />
          <Circle cx="36" cy="114" r="4.5" fill="#00CCFF" opacity="0.75"/>
          <Circle cx="164" cy="114" r="4.5" fill="#00CCFF" opacity="0.75"/>
          <Circle cx="100" cy="88" r="3.5" fill="#60E0FF" opacity="0.95"/>

          {/* Crown star */}
          <Circle cx="100" cy="30" r="5.5" fill="#C9A84C" opacity="0.9"/>
          <Circle cx="100" cy="30" r="2.5" fill="#F0D060"/>
        </Svg>
      </Animated.View>
    </View>
  );
}
---

Step 4.2 — Create components/auth/FloatingParticles.tsx

Ambient floating particles for the login background.

---
import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

interface Particle {
  id: number;
  x: number;
  y: Animated.Value;
  opacity: Animated.Value;
  size: number;
  duration: number;
}

export default function FloatingParticles() {
  const particles = useRef<Particle[]>([]);
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const count = 12;
    particles.current = Array.from({ length: count }, (_, i) => ({
      id: i,
      x: Math.random() * width,
      y: new Animated.Value(height + 10),
      opacity: new Animated.Value(0),
      size: 1.5 + Math.random() * 2.5,
      duration: 8000 + Math.random() * 10000,
    }));

    particles.current.forEach((p, idx) => {
      const animate = () => {
        p.y.setValue(height + 10);
        p.opacity.setValue(0);
        Animated.parallel([
          Animated.timing(p.y, {
            toValue: -20,
            duration: p.duration,
            useNativeDriver: true,
          }),
          Animated.sequence([
            Animated.timing(p.opacity, {
              toValue: 0.7,
              duration: p.duration * 0.1,
              useNativeDriver: true,
            }),
            Animated.timing(p.opacity, {
              toValue: 0.5,
              duration: p.duration * 0.8,
              useNativeDriver: true,
            }),
            Animated.timing(p.opacity, {
              toValue: 0,
              duration: p.duration * 0.1,
              useNativeDriver: true,
            }),
          ]),
        ]).start(() => animate());
      };

      setTimeout(animate, idx * 1200);
    });
  }, []);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {particles.current.map(p => (
        <Animated.View
          key={p.id}
          style={{
            position: 'absolute',
            left: p.x,
            width: p.size,
            height: p.size,
            borderRadius: p.size / 2,
            backgroundColor: '#00E5C8',
            opacity: p.opacity,
            transform: [{ translateY: p.y }],
          }}
        />
      ))}
    </View>
  );
}
---

Step 4.3 — Create components/auth/GoldShimmerButton.tsx

Reusable gold CTA button with shimmer sweep animation.

---
import React, { useEffect } from 'react';
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';

interface Props {
  label: string;
  onPress: () => void;
  loading?: boolean;
  color?: 'gold' | 'teal';
  disabled?: boolean;
  icon?: React.ReactNode;
}

export default function GoldShimmerButton({
  label, onPress, loading = false, color = 'gold', disabled = false, icon
}: Props) {
  const shimmerX = useSharedValue(-1);

  useEffect(() => {
    shimmerX.value = withRepeat(
      withTiming(2, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
      -1,
      false
    );
  }, []);

  const shimmerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shimmerX.value * 200 }, { skewX: '-20deg' }],
  }));

  const bg = color === 'gold' ? '#C9A84C' : '#00E5C8';
  const textColor = '#020A14';

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.92}
      style={{
        width: '100%',
        height: 56,
        borderRadius: 16,
        backgroundColor: disabled ? 'rgba(201,168,76,0.4)' : bg,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        flexDirection: 'row',
        gap: 8,
      }}
    >
      <Animated.View
        style={[shimmerStyle, {
          position: 'absolute',
          top: 0, bottom: 0,
          width: '50%',
          backgroundColor: 'rgba(255,255,255,0.22)',
        }]}
      />
      {loading ? (
        <ActivityIndicator color={textColor} size="small"/>
      ) : (
        <>
          {icon}
          <Text style={{ fontSize: 16, fontWeight: '800', color: textColor, letterSpacing: 0.1 }}>
            {label}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
}
---

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PHASE 5 — MAIN LOGIN SCREEN
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Step 5.1 — Replace app/(auth)/login.tsx completely

Write the full new login screen. Structure the file in this exact order:
imports → types → constants → sub-screens → main component.

SCREEN FLOW (three views rendered conditionally, not navigated):
VIEW A — Main sign-in (default)
VIEW B — OTP verification (phone flow OR forgot password)
VIEW C — Success / guardian activated

The entire login experience happens within one screen file.
Never navigate away mid-auth flow — keep user on this screen until complete.

─── VIEW A: MAIN SIGN-IN ───

BACKGROUND LAYERS (position: absolute, full screen, pointer-events none):
1. Void Black base: backgroundColor '#020A14'
2. Ambient orb 1: 350x350 circle, teal radial gradient
   position: top -120, left -80
   Animated: drifts using React Native Animated (not Reanimated — simpler for background)
   translateX: 0→15→-8→0, translateY: 0→-10→10→0, scale: 1→1.05→0.97→1
   Duration: 9000ms, loop infinite, ease-in-out
3. Ambient orb 2: 300x300 circle, gold radial gradient
   position: bottom -80, right -70
   Same animation opposite phase, 12000ms
4. Subtle grid: StyleSheet with a grid pattern using borderWidth trickery
   OR skip and just use two orbs (simpler, same effect)
5. FloatingParticles component (renders on top of orbs, below content)

SCROLLVIEW CONTENT:

─── HERO SECTION ───
paddingTop: safeAreaTop + 28, paddingBottom: 0, alignItems: center

TruWellShieldAnimated size={88}
(The animated shield with float, orbit rings, pulse, orb glow)

"TRUWELL AI" wordmark below shield:
  "TRUL" + "W" (gold) + "ELL AI"
  fontSize 22, fontWeight 900, letterSpacing 1.5, color #EEF2FF
  Use a Text with nested Text for the gold "W":
  <Text style={styles.wordmark}>
    TRUL<Text style={styles.wordmarkGold}>W</Text>ELL AI
  </Text>

Tagline: "Scan. Understand. Choose Better."
  fontSize 11, color rgba(238,242,255,0.42), fontStyle italic
  marginBottom 10

Greeting: "Welcome back, Guardian"
  fontSize 16, fontWeight 700, color #EEF2FF, marginBottom 3

Sub-greeting: "Your health intelligence is waiting"
  fontSize 11, color rgba(238,242,255,0.42), marginBottom 20

─── INSTANT ACCESS SECTION ───
Section label: "INSTANT ACCESS" uppercase, 9px, letterSpacing 2.5, teal color
Flanked by 1px horizontal lines on both sides (flex row pattern)

4-column grid of quick-auth tiles:
Each tile: flex 1, height 70px, borderRadius 16
background rgba(255,255,255,0.04), border rgba(255,255,255,0.09)
gap: 8px between tiles

TILE 1 — Face ID / Biometric (highlighted):
  background rgba(0,229,200,0.08), border 1.5px rgba(0,229,200,0.28)
  Pulse ring around entire tile (position absolute, inset -1, borderRadius 16, pulsing border)
  Icon: face scan SVG 22px, teal
  Label: "Face ID" 10px, 700, #00E5C8
  onPress: handleBiometric()

  Show this tile only if biometric is available (checkBiometricAvailability on mount)
  If face: label "Face ID", icon: face scan SVG
  If fingerprint: label "Touch ID", icon: fingerprint SVG
  If neither: show "Passkey" tile in its place

TILE 2 — Passkey:
  Standard glass tile
  Icon: key SVG 22px, rgba(238,242,255,0.5)
  Label: "Passkey" 10px, 600, rgba(238,242,255,0.55)
  onPress: handlePasskey()

TILE 3 — PIN:
  Standard glass tile
  Icon: 7-dot numpad SVG (3 rows: 3,3,1) 22px
  Label: "PIN" 10px, 600, rgba(238,242,255,0.55)
  onPress: setView('pin')

TILE 4 — OTP:
  Standard glass tile
  Icon: phone with message indicator 22px
  Label: "OTP" 10px, 600, rgba(238,242,255,0.55)
  onPress: setActiveTab('phone') and scroll/show phone section

─── SOCIAL SIGN-IN SECTION ───
Section label: "SOCIAL SIGN-IN" (same section label style)

2x2 grid, gap 8px:

Cell 1 — Apple:
  background rgba(240,242,255,0.92), borderRadius 14, height 50
  Apple logo SVG (16px, color #020A14)
  Label "Apple" fontSize 13, fontWeight 700, color #020A14
  onPress: handleAppleSignIn()
  Show only if Platform.OS === 'ios' AND AppleAuthentication.isAvailableAsync()

Cell 2 — Google:
  background rgba(255,255,255,0.04), border rgba(234,67,53,0.22)
  Google G logo (15px, multicolor SVG)
  Label "Google" fontSize 13, fontWeight 700, color #EEF2FF
  onPress: handleGoogleSignIn()

Cell 3 — Facebook:
  background rgba(24,119,242,0.07), border rgba(24,119,242,0.22)
  Facebook logo (15px, #1877F2)
  Label "Facebook" fontSize 13, fontWeight 700, color #EEF2FF
  onPress: handleFacebookSignIn()

Cell 4 — LinkedIn:
  background rgba(10,102,194,0.07), border rgba(10,102,194,0.22)
  LinkedIn logo (15px, #0A66C2)
  Label "LinkedIn" fontSize 13, fontWeight 700, color #EEF2FF
  onPress: handleLinkedInSignIn()

All social cells: height 50px, borderRadius 14
flexDirection row, alignItems center, justifyContent center, gap 8
Press feedback: Reanimated scale 1.0→0.96 on pressIn, 0.96→1.0 on pressOut
Ripple effect: absolute circle View that scales 0→4 and fades on press

─── DIVIDER ───
Row: 1px line + "OR SIGN IN WITH" + 1px line
Text: 9px, rgba(238,242,255,0.32), fontWeight 600, letterSpacing 1.5

─── AUTH METHOD TABS ───
Pill toggle: two buttons "Email" and "Phone"
Pill container: background rgba(255,255,255,0.04), border rgba(255,255,255,0.08)
borderRadius 999, padding 3, flexDirection row

Active tab: background rgba(201,168,76,0.15), border rgba(201,168,76,0.30)
  Text color: #C9A84C, fontWeight 700
Inactive tab: transparent background
  Text color: rgba(238,242,255,0.40)

Both tabs: fontSize 12, fontWeight 700, paddingVertical 7, flex 1, textAlign center
Animated: active tab background slides — use Reanimated layout animation

─── EMAIL FORM (shown when activeTab === 'email') ───

Field 1 — Email:
  Label: "EMAIL ADDRESS" 10px, fontWeight 700, letterSpacing 1, rgba(238,242,255,0.48)
  Input: height 50, borderRadius 14, background rgba(255,255,255,0.055)
    border rgba(255,255,255,0.10), focused border rgba(201,168,76,0.45)
    focused background rgba(201,168,76,0.04)
    paddingLeft 14, paddingRight 44
    fontSize 14, fontWeight 500, color #EEF2FF
    placeholder "guardian@email.com", placeholderTextColor rgba(238,242,255,0.22)
    keyboardType "email-address", autoCapitalize "none", autoCorrect false
    Right icon: envelope SVG 14px, rgba(238,242,255,0.38)

Field 2 — Password:
  Label: "PASSWORD"
  Input: same style as email
    secureTextEntry (toggle with eye icon on right)
    placeholder "Your password"
    Right icon: eye SVG that toggles between visible/hidden on tap
    textContentType "password" for iOS autofill

"Forgot password?" link — right aligned, 11px, #00E5C8, fontWeight 700
  onPress: setView('verify') after collecting email

─── PHONE FORM (shown when activeTab === 'phone') ───

Country code + phone row:
  Left: country code picker input (70px wide)
    Default: "+234" (Nigerian default — Nigeria is primary market)
    height 50, same input styling
  Right: phone number input (flex 1)
    keyboardType "phone-pad"
    placeholder "080 0000 0000"

Delivery method chips:
  Two small pills below phone input: "SMS" and "WhatsApp"
  SMS: default selected, background rgba(0,229,200,0.08), border rgba(0,229,200,0.2), color #00E5C8
  WhatsApp: background rgba(37,211,102,0.08), border rgba(37,211,102,0.2), color #25D366
  Tapping switches selected state (only one at a time)
  Store in: const [otpChannel, setOtpChannel] = useState<'sms' | 'whatsapp'>('sms')
  Note: WhatsApp OTP via Supabase requires Vonage/Twilio WhatsApp config in Supabase dashboard

Subtext: "We'll send a 6-digit code via [SMS/WhatsApp]"
  fontSize 10, color rgba(238,242,255,0.30), marginTop 4

─── PRIMARY CTA BUTTON ───
GoldShimmerButton component:
  Email tab: label "Sign In Securely"
  Phone tab: label "Send Verification Code"
  loading: isLoading state
  Left icon: lock/arrow SVG

─── SIGNUP ROW ───
"New to TruWell AI? " + "Create account" (teal, bold)
fontSize 12, color rgba(238,242,255,0.38)
onPress: router.push('/(auth)/welcome') or appropriate onboarding route

─── TRUST STRIP ───
Row of 3 items, centered, gap 16:
  "256-bit TLS" with lock icon
  "GDPR safe" with shield icon
  "No data sold" with checkmark icon
All: fontSize 9, color rgba(238,242,255,0.25), fontWeight 600

─── VIEW B: OTP VERIFICATION ───

This view appears when:
a) User taps "Send Verification Code" on phone tab
b) User taps "Forgot password?" on email tab

Header:
  Back arrow button (top left, routes back to VIEW A)
  animated fade-in on mount

Content (centered, paddingHorizontal 22):
  Context icon:
    Phone flow: phone+envelope SVG in teal circle
    Password flow: envelope SVG in teal circle
  Title: "Check your inbox" (phone) OR "Verify your identity" (password)
    fontSize 17, fontWeight 800, color #EEF2FF
  Subtitle: "We sent a 6-digit code to"
    fontSize 11, color rgba(238,242,255,0.42)
  Destination display: "[phone or email]"
    fontSize 14, fontWeight 700, color #00E5C8
  (Phone flow only) Delivery toggle chips: SMS | WhatsApp

6-digit OTP input row:
  6 individual TextInput boxes (not one combined input)
  Each box: width 40px, height 52px, borderRadius 13
    background rgba(255,255,255,0.055), border 1.5px rgba(255,255,255,0.10)
    textAlign center, fontSize 22, fontWeight 800, color #EEF2FF
    focus state: border rgba(0,229,200,0.50), background rgba(0,229,200,0.04)
    filled state: border rgba(201,168,76,0.50), background rgba(201,168,76,0.06), color #C9A84C
  Auto-advance: on entering a digit, focus moves to next box
  Auto-backspace: on deleting, focus returns to previous box
  When all 6 filled: auto-trigger verification after 250ms delay
  Paste support: if user pastes "123456", distribute across all 6 boxes
  refs: useRef array of 6 TextInput refs

"Verify Code" primary button (GoldShimmerButton, teal color)

Resend row: "Didn't receive it? " + "Resend in 0:28"
  Countdown from 28 seconds
  After countdown: "Resend" becomes tappable, resends OTP
  fontSize 11, color rgba(238,242,255,0.35)

─── VIEW C: SUCCESS / GUARDIAN ACTIVATED ───

Full screen, dark background
Position absolute inset 0 on top of everything else
Entry: fadeIn + translateY(20→0), 500ms ease

Confetti burst on mount:
  30-36 rectangle particles (not circles — more confetti-like)
  Colors: #C9A84C, #E8C96B, #00E5C8, #2ED573, #FF4757, #EEF2FF, #1E90FF, #FF6B9D
  Each: random size 3-11px, random x position 5-95%, random rotation
  Animation: translateY from -20px to +500px, rotate 0→720deg
  Duration: 1.4-3.2s per particle, random delay 0-0.7s

Center content (animated spring entrance, delay 100ms):
  Checkmark shield SVG (76x76px)
    Gold shield outline, dark interior, teal circle with white checkmark
    Spring scale animation: 0.3→1.0, cubic-bezier(0.34,1.56,0.64,1)
  
  Title: "Guardian activated" fontSize 20, fontWeight 800, letterSpacing -0.4
  
  Subtitle: contextual based on auth method used:
    email: "Signed in securely. Your health intelligence is watching."
    google/apple/facebook/linkedin: "Welcome via [Provider]. TruWell AI is ready."
    biometric: "Biometric verified. Instant access granted."
    phone: "Phone verified. Your guardian is active."
    pin: "PIN confirmed. Welcome back, Guardian."
  
  Guardian stats card:
    background rgba(0,229,200,0.06), border rgba(0,229,200,0.16), borderRadius 14
    3-column layout:
    "47" — gold — "databases"
    "10" — green — "free scans"
    "L1" — white — "level"
    Each column: number 18px 800, label 8px rgba(238,242,255,0.38)
    borderRight 1px rgba(0,229,200,0.10) between columns
  
  Plan status chip:
    background rgba(201,168,76,0.07), border rgba(201,168,76,0.18), borderRadius 12, padding 10 12
    Row: person icon (22px, gold) + text column
    Text top: "Guardian Profile" 10px, 700, #C9A84C
    Text bottom: "Free plan · Upgrade for unlimited scans" 9px, rgba(238,242,255,0.38)
  
  "Enter Dashboard" button (GoldShimmerButton)
    onPress: navigate to correct dashboard based on role
    After 300ms delay: call roleResolver and navigate

─── VIEW D: PIN ENTRY (shown via setView state) ───

paddingTop 32, alignItems center, textAlign center

Numpad icon in gold circle
Title: "Enter your PIN" fontSize 16, fontWeight 800
Subtitle: "Your 6-digit security PIN"
Small note: "You set this PIN when you first signed in"

6-digit PIN input (same structure as OTP boxes but type="password" on each)
  Each box shows • when filled
  Gold ring around container

Below inputs row: 
  "Use biometrics instead?" text + "Use Face ID" teal link
  onPress teal link: handleBiometric()

"Confirm PIN" primary button

"Back" link: returns to main view

Step 5.2 — State management for the login screen

Use these state values at the top of the component:

type ViewState = 'main' | 'verify' | 'success' | 'pin';
type TabState = 'email' | 'phone';

const [view, setView] = useState<ViewState>('main');
const [activeTab, setActiveTab] = useState<TabState>('email');
const [email, setEmail] = useState('');
const [password, setPassword] = useState('');
const [showPassword, setShowPassword] = useState(false);
const [countryCode, setCountryCode] = useState('+234');
const [phone, setPhone] = useState('');
const [otpChannel, setOtpChannel] = useState<'sms' | 'whatsapp'>('sms');
const [otp, setOtp] = useState(['', '', '', '', '', '']);
const [pin, setPin] = useState(['', '', '', '', '', '']);
const [isLoading, setIsLoading] = useState(false);
const [error, setError] = useState<string | null>(null);
const [biometricInfo, setBiometricInfo] = useState<{ available: boolean; type: string; enrolled: boolean }>({ available: false, type: 'none', enrolled: false });
const [authMethod, setAuthMethod] = useState<AuthMethod>('email');
const [resendCountdown, setResendCountdown] = useState(28);

const otpRefs = useRef<Array<TextInput | null>>(Array(6).fill(null));
const pinRefs = useRef<Array<TextInput | null>>(Array(6).fill(null));

Step 5.3 — Handler functions

Each handler calls authService and then post-auth navigates:

const handlePostAuthSuccess = async (userId: string, method: AuthMethod) => {
  setAuthMethod(method);
  setView('success');
  // After success animation plays (2 seconds), resolve role and navigate
  setTimeout(async () => {
    const role = await resolveUserRole(userId);
    router.replace(role === 'expert' ? '/(expert)' : '/(tabs)');
  }, 2500);
};

const handleEmailSignIn = async () => {
  if (!email.trim() || !password.trim()) {
    setError('Please enter your email and password');
    return;
  }
  setIsLoading(true);
  setError(null);
  const result = await signInWithEmail(email, password);
  setIsLoading(false);
  if (!result.success) {
    setError(result.error ?? 'Sign in failed');
    // Shake the form: Reanimated sequence translateX 0→-8→8→-4→0 150ms
    return;
  }
  await handlePostAuthSuccess(result.userId!, 'email');
};

const handleSendOtp = async () => {
  const fullPhone = `${countryCode}${phone.replace(/\s/g, '')}`;
  setIsLoading(true);
  setError(null);
  const result = await sendPhoneOtp(fullPhone);
  setIsLoading(false);
  if (!result.success) {
    setError(result.error ?? 'Failed to send code');
    return;
  }
  setView('verify');
  startResendCountdown();
};

const handleVerifyOtp = async () => {
  const token = otp.join('');
  if (token.length < 6) return;
  const fullPhone = `${countryCode}${phone.replace(/\s/g, '')}`;
  setIsLoading(true);
  const result = await verifyPhoneOtp(fullPhone, token);
  setIsLoading(false);
  if (!result.success) {
    setError(result.error ?? 'Invalid code');
    // Shake otp boxes
    return;
  }
  await handlePostAuthSuccess(result.userId!, 'phone');
};

const handleBiometric = async () => {
  const result = await authenticateWithBiometric();
  if (result.success) {
    const { data: { session } } = await supabase.auth.getSession();
    await handlePostAuthSuccess(session!.user.id, 'biometric');
  } else if (result.error !== 'cancelled') {
    setError(result.error ?? 'Biometric failed');
  }
};

const handleAppleSignIn = async () => {
  const result = await signInWithApple();
  if (result.success) await handlePostAuthSuccess(result.userId!, 'apple');
  else if (result.error !== 'cancelled') setError(result.error ?? 'Apple sign in failed');
};

const handleGoogleSignIn = async () => {
  const result = await signInWithGoogle();
  if (result.success) await handlePostAuthSuccess(result.userId!, 'google');
  else if (result.error !== 'cancelled') setError(result.error ?? 'Google sign in failed');
};

const handleFacebookSignIn = async () => {
  const result = await signInWithFacebook();
  if (result.success) await handlePostAuthSuccess(result.userId!, 'facebook');
  else if (result.error !== 'cancelled') setError(result.error ?? 'Facebook sign in failed');
};

const handleLinkedInSignIn = async () => {
  const result = await signInWithLinkedIn();
  if (result.success) await handlePostAuthSuccess(result.userId!, 'linkedin');
  else if (result.error !== 'cancelled') setError(result.error ?? 'LinkedIn sign in failed');
};

const handlePasskey = async () => {
  const result = await signInWithPasskey();
  if (result.success && result.userId) await handlePostAuthSuccess(result.userId, 'passkey');
  else if (result.error !== 'cancelled') setError(result.error ?? 'Passkey authentication failed');
};

Error display:
Show error in an animated banner that slides down from top of form area:
  background rgba(255,71,87,0.10), border rgba(255,71,87,0.30), borderRadius 12, padding 10
  Text: fontSize 12, color #FF4757, textAlign center
  Auto-dismiss after 4 seconds
  Tap to dismiss early

Step 5.4 — Mount effects

useEffect on mount:
1. Check biometric availability → setBiometricInfo
2. Check if user has PIN set → show PIN tile differently

useEffect for resend countdown:
  Start from 28, decrement every second, stop at 0
  setInterval cleanup in return

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PHASE 6 — SUPABASE OAUTH CONFIGURATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Step 6.1 — Supabase dashboard configuration required

In the Supabase dashboard (app.supabase.io → Authentication → Providers):

GOOGLE:
  Enable Google provider
  Set Client ID and Client Secret from Google Cloud Console
  Add redirect URI: truwell://auth/callback
  Authorized domain: add your Supabase project URL

FACEBOOK:
  Enable Facebook provider
  Set App ID and App Secret from Meta Developer Console
  Add redirect URI: truwell://auth/callback

LINKEDIN:
  Enable LinkedIn (OIDC) provider
  Set Client ID and Client Secret from LinkedIn Developer App
  Add redirect URI: truwell://auth/callback

APPLE:
  Enable Apple provider
  Set Services ID, Team ID, Key ID, and private key from Apple Developer account
  This is only needed for Android — iOS uses native Apple Authentication SDK

PHONE:
  Enable Phone provider
  Configure SMS provider: Twilio or Vonage (recommended for Nigerian market)
  For WhatsApp OTP: configure Vonage WhatsApp Business API
  Template: "Your TruWell AI code is: {{.Code}}"

Step 6.2 — Deep link handling for OAuth callbacks

In app/_layout.tsx or a new file lib/linkingConfig.ts:

Add a Linking subscription to handle the OAuth redirect:

import * as Linking from 'expo-linking';
import { supabase } from '@/lib/supabase';

useEffect(() => {
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        // OAuth callback landed — this fires when WebBrowser completes
        console.log('[auth] OAuth sign in complete:', session.user.id);
      }
    }
  );
  return () => subscription.unsubscribe();
}, []);

Step 6.3 — Verify existing supabase client config

Open lib/supabase.ts. Confirm it uses:
auth: {
  autoRefreshToken: true,
  persistSession: true,
  detectSessionInUrl: false,  // must be false for React Native
}

If detectSessionInUrl is true or missing: set it to false.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PHASE 7 — NAVIGATION AND ROUTING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Step 7.1 — Verify Stack registrations

Open app/(auth)/_layout.tsx. Confirm ALL of these are registered:

<Stack.Screen name="login" options={{ headerShown: false }} />
<Stack.Screen name="welcome" options={{ headerShown: false }} />

If the login screen has a "Back" button in the app bar showing: set headerShown: false.
The new login screen manages its own back navigation internally.

Step 7.2 — Remove any existing headerShown or title from login

The new design shows a full-screen immersive experience with no system nav bar.
No back arrow from native navigation should appear on the main login view.
Back navigation only appears in VIEW B (OTP) and VIEW D (PIN) as a designed element.

Step 7.3 — Post-auth navigation

After successful auth (VIEW C success screen, after 2500ms):
Use roleResolver.ts (which already exists and is confirmed working):
  const role = await resolveUserRole(userId);
  router.replace(role === 'expert' ? '/(expert)' : '/(tabs)');

This is the same logic used everywhere else in the app. Do not change roleResolver.ts.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PHASE 8 — KEYBOARD AND SAFE AREA HANDLING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Step 8.1 — Keyboard avoidance

Wrap the ScrollView in KeyboardAvoidingView:
  behavior: Platform.OS === 'ios' ? 'padding' : 'height'
  keyboardVerticalOffset: 0

When keyboard appears on email/phone input:
  The ScrollView should smoothly scroll to reveal the focused input
  Add scrollRef and use scrollRef.current?.scrollTo on input focus

Step 8.2 — Safe area

Use useSafeAreaInsets() for top and bottom padding.
paddingTop: insets.top + 12 (hero section)
paddingBottom: insets.bottom + 16 (trust strip)

Step 8.3 — Screen height awareness

Some devices (small Android phones) may not fit all content.
Ensure ScrollView has showsVerticalScrollIndicator: false
and the content collapses gracefully on small screens.
The hero shield can reduce to size={70} on screens shorter than 700px:
  const { height } = Dimensions.get('window');
  const shieldSize = height < 700 ? 70 : 88;

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PHASE 9 — HAPTIC FEEDBACK
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Use expo-haptics for all meaningful interactions:

import * as Haptics from 'expo-haptics';

Face ID / Touch ID tap: Haptics.impactAsync(ImpactFeedbackStyle.Medium)
Social login tap: Haptics.impactAsync(ImpactFeedbackStyle.Light)
PIN digit entry: Haptics.selectionAsync()
OTP digit entry: Haptics.selectionAsync()
Auth error: Haptics.notificationAsync(NotificationFeedbackType.Error)
Auth success: Haptics.notificationAsync(NotificationFeedbackType.Success)
Gold CTA tap: Haptics.impactAsync(ImpactFeedbackStyle.Medium)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PHASE 10 — FINAL CLEANUP AND DUPLICATE CHECK
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Step 10.1 — Search for any duplicate auth UI components

Run:
grep -r "Sign In\|signIn\|login\|Login\|AuthScreen\|signInWithPassword" \
  components/ --include="*.tsx" -l

If any component found is no longer used (no import anywhere): delete it.
If any component found is still used for something non-login: keep it.

Step 10.2 — Search for old social login references

grep -r "GoogleSignIn\|AppleAuthenticationButton\|FacebookLogin\|LinkedInAuth" \
  app/ components/ --include="*.tsx" -l

If any found outside of the new login.tsx and new authService.ts: remove or update.

Step 10.3 — TypeScript check

Run: npx tsc --noEmit
Expected: zero errors.
Fix every error. Do not use @ts-ignore.

Common issues to fix proactively:
- expo-local-authentication types: import type from 'expo-local-authentication'
- expo-apple-authentication: may need @types or included types
- react-native-passkey: if no types, add declare module 'react-native-passkey' in types.d.ts
- AuthSession.makeRedirectUri: correct usage varies by expo-auth-session version

Step 10.4 — Lint check

Run: npx expo-doctor
Fix any warnings about deprecated APIs or incorrect configuration.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PHASE 11 — BUILD AND TEST
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Step 11.1 — Clear cache and build

Run:
npx expo start --clear
Press Ctrl+C after Metro starts

npx expo run:android

Step 11.2 — Test checklist

Run each test. Clear app data between tests:
adb shell pm clear com.truwell.ai

TEST 1 — Visual match:
Open app, tap Sign In on welcome screen
Verify: shield animates (floats + orbit rings + pulse)
Verify: particles float upward in background
Verify: orbs drift slowly in background
Verify: wordmark shows "TRUWELL AI" with gold W
Verify: 4 instant-access tiles visible at top
Verify: 4 social buttons in 2x2 grid
Verify: Email/Phone tab toggle present
PASS or FAIL?

TEST 2 — Biometric:
Tap Face ID tile
Verify: system biometric prompt appears
Complete auth
Verify: success screen with confetti and guardian stats
Verify: after 2.5s redirects to correct dashboard
PASS or FAIL?

TEST 3 — Email sign in:
Tap Email tab
Enter owoichoadekwu@gmail.com + correct password
Tap "Sign In Securely"
Verify: loading spinner on button during auth
Verify: success screen appears
Verify: navigates to member tabs (Home, Scan, Wellness, SafeCircle, Profile)
PASS or FAIL?

TEST 4 — Email error state:
Enter wrong password
Verify: red error banner slides in
Verify: error auto-dismisses after 4 seconds
Verify: form shakes animation plays
PASS or FAIL?

TEST 5 — Phone OTP:
Tap Phone tab
Enter +234 and a test phone number
Tap "Send Verification Code"
Verify: transitions to OTP screen
Verify: countdown timer starts at 28
Verify: "Resend" becomes tappable after 28 seconds
Enter 6-digit code
Verify: auto-advances between boxes
Verify: auto-triggers verification when box 6 filled
PASS or FAIL?

TEST 6 — Google sign in:
Tap Google button
Verify: ripple effect on tap
Verify: WebBrowser opens with Google auth page
Complete Google auth
Verify: success screen
PASS or FAIL?

TEST 7 — Facebook sign in:
Tap Facebook button
Verify: WebBrowser opens with Facebook auth
PASS or FAIL?

TEST 8 — Apple sign in (iOS only):
Tap Apple button
Verify: native Apple auth sheet appears
PASS or FAIL? (mark N/A if testing on Android only)

TEST 9 — LinkedIn sign in:
Tap LinkedIn button
Verify: WebBrowser opens LinkedIn auth
PASS or FAIL?

TEST 10 — PIN entry:
Tap PIN tile
Verify: 6-box PIN entry screen
Enter 6 digits
Verify: auto-submits when 6th entered
Verify: gold fill on each box
Verify: "Use Face ID" link visible and functional
PASS or FAIL?

TEST 11 — Passkey:
Tap Passkey tile
If device supports passkeys: native passkey dialog appears
If not supported: graceful fallback to biometric or error message
PASS or FAIL?

TEST 12 — Expert login:
Clear app data
Enter expert credentials (truwellsmoke1775325714784@gmail.com)
Verify: success screen
Verify: navigates to expert dashboard (Home, Patients, Consult, Rx, Profile)
PASS or FAIL?

TEST 13 — Keyboard avoidance:
Tap email input
Verify: keyboard does not obscure the sign in button
Verify: form scrolls up to keep button visible
PASS or FAIL?

TEST 14 — Haptics:
Tap each auth method tile
Verify: haptic feedback on each tap
Verify: error haptic (different pattern) on wrong credentials
PASS or FAIL?

TEST 15 — No duplicate routes or components:
Run: grep -r "login\|Login" app/ components/ --include="*.tsx" -l
Verify: only app/(auth)/login.tsx and its registered components contain login UI
No duplicate OTP screen, no duplicate social login buttons elsewhere
PASS or FAIL?

Step 11.3 — Final report

After all 15 tests complete provide:
1. List of every new file created
2. List of every file modified
3. List of every file deleted
4. TypeScript: zero errors confirmed
5. Pass/Fail for all 15 tests
6. Any known limitations:
   - Passkeys: note if requires custom dev client
   - WhatsApp OTP: note if requires Vonage config
   - LinkedIn: note if requires Supabase LinkedIn OIDC activation
   - Apple sign in Android: note that Apple sign in uses OAuth on Android (not native SDK)
7. Next steps for production:
   - Add Supabase Google/Facebook/LinkedIn client IDs
   - Configure SMS/WhatsApp provider in Supabase dashboard
   - Test on physical iPhone for Face ID and Apple authentication
   - Add PIN setup flow during onboarding (after first successful sign in, offer to set PIN)
