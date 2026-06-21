import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import * as AppleAuthentication from 'expo-apple-authentication';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  type TextInput as RNTextInput,
  View,
} from 'react-native';
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path as SvgPath } from 'react-native-svg';

import { buildOnboardingAuthMetadata } from '@/lib/onboardingAuthMetadata';
import { getPendingReferralCode } from '@/lib/referralLink';
import { signInWithGoogle } from '@/lib/googleAuth';
import { trackOnboardingEvent } from '@/lib/onboardingAnalytics';
import { ONBOARDING_PRIVACY_URL, ONBOARDING_TERMS_URL } from '@/lib/onboardingLegalUrls';
import { saveTruwellOnboarding } from '@/lib/saveTruwellOnboarding';
import { supabase } from '@/lib/supabase';
import {
  VERIFICATION_EMAIL_REDIRECT,
  checkEmailHref,
} from '@/lib/emailVerification';
import { useOnboardingStore } from '@/stores/onboardingStore';

import { OB_COLORS, OB_FONTS } from '@/lib/_obShared';
import { ONBOARDING_ROUTES } from '@/lib/onboardingRoutePaths';

function GoogleIcon() {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24">
      <SvgPath
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <SvgPath
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <SvgPath
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <SvgPath
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </Svg>
  );
}

export default function OnboardingAccountScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const selectedRole = useOnboardingStore((s) => s.selectedRole);
  const userName = useOnboardingStore((s) => s.userName);
  const guardianGoals = useOnboardingStore((s) => s.guardianGoals);
  const healthScore = useOnboardingStore((s) => s.healthScore);
  const setConversionFlowStep = useOnboardingStore((s) => s.setConversionFlowStep);

  const handleBack = useCallback(() => {
    if (router.canGoBack()) {
      setConversionFlowStep(9);
      router.back();
      return;
    }
    setConversionFlowStep(9);
    router.replace(ONBOARDING_ROUTES.blueprint as never);
  }, [router, setConversionFlowStep]);

  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [appleAvailable, setAppleAvailable] = useState(false);
  const [appleLoading, setAppleLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);
  const [accountCreated, setAccountCreated] = useState(false);
  const [phone, setPhone] = useState('');
  const [countryCode, setCountryCode] = useState('+1');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [referralCode, setReferralCode] = useState('');
  const [showReferral, setShowReferral] = useState(false);
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [termsShake, setTermsShake] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [nameError, setNameError] = useState('');

  const dotPulse = useSharedValue(1);
  const termsGlow = useSharedValue(0);

  const emailInputRef = useRef<RNTextInput>(null);
  const passwordInputRef = useRef<RNTextInput>(null);
  const confirmInputRef = useRef<RNTextInput>(null);
  const referralInputRef = useRef<RNTextInput>(null);

  useEffect(() => {
    setConversionFlowStep(11);
  }, [setConversionFlowStep]);

  useEffect(() => {
    if (Platform.OS === 'ios') {
      AppleAuthentication.isAvailableAsync()
        .then(setAppleAvailable)
        .catch(() => setAppleAvailable(false));
    }
  }, []);

  useEffect(() => {
    void getPendingReferralCode().then((code) => {
      if (code) {
        setReferralCode(code);
        setShowReferral(true);
      }
    });
  }, []);

  useEffect(() => {
    dotPulse.value = withRepeat(
      withSequence(withTiming(1.5, { duration: 600 }), withTiming(1, { duration: 600 })),
      -1,
      false
    );
  }, [dotPulse]);

  useEffect(() => {
    if (termsShake) {
      termsGlow.value = withSequence(
        withTiming(1, { duration: 150 }),
        withTiming(0, { duration: 700 })
      );
    }
  }, [termsShake, termsGlow]);

  const dotAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: dotPulse.value }],
    opacity: dotPulse.value > 1.2 ? 0.7 : 1,
  }));

  const termsGlowStyle = useAnimatedStyle(() => ({
    borderColor:
      termsGlow.value > 0.1 ? `rgba(201,168,76,${termsGlow.value})` : OB_COLORS.white40,
    backgroundColor: `rgba(201,168,76,${termsGlow.value * 0.2})`,
  }));

  function passwordStrength(pw: string): { score: number; label: string; color: string } {
    if (pw.length === 0) return { score: 0, label: '', color: 'transparent' };
    let score = 0;
    if (pw.length >= 8) score++;
    if (pw.length >= 12) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    if (score <= 1) return { score, label: 'Weak', color: '#ef4444' };
    if (score <= 3) return { score, label: 'Good', color: '#f59e0b' };
    return { score, label: 'Strong', color: '#16a34a' };
  }

  const requireTermsAccepted = (): boolean => {
    if (termsAccepted) return true;
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    setTermsShake(true);
    setTimeout(() => setTermsShake(false), 1000);
    Alert.alert(
      'Terms required',
      'Please accept the Terms of Service and Privacy Policy to continue.'
    );
    return false;
  };

  const finishSignup = async (uid: string, provider: 'apple' | 'google' | 'email') => {
    await saveTruwellOnboarding(uid);
    void trackOnboardingEvent('registration_completed', {
      role: selectedRole || 'unknown',
      provider,
    });
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setAccountCreated(true);
    // Brief pause so user sees the success state before routing
    await new Promise((resolve) => setTimeout(resolve, 800));
    router.push(ONBOARDING_ROUTES.subscription);
  };

  const handleAppleSignIn = async () => {
    if (!requireTermsAccepted()) return;
    if (appleLoading || googleLoading || emailLoading) return;
    setAppleLoading(true);
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      if (!credential.identityToken) {
        throw new Error('No identity token returned from Apple.');
      }

      const {
        error,
        data: { user },
      } = await supabase.auth.signInWithIdToken({
        provider: 'apple',
        token: credential.identityToken,
      });

      if (error || !user) {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        Alert.alert('Apple sign in failed', error?.message ?? 'Please try again.');
        return;
      }

      const metadata = buildOnboardingAuthMetadata(selectedRole, 'apple');
      if (credential.fullName) {
        const nameParts: string[] = [];
        if (credential.fullName.givenName) nameParts.push(credential.fullName.givenName);
        if (credential.fullName.middleName) nameParts.push(credential.fullName.middleName);
        if (credential.fullName.familyName) nameParts.push(credential.fullName.familyName);
        const fullName = nameParts.filter(Boolean).join(' ');
        if (fullName.trim()) {
          await supabase.auth.updateUser({
            data: {
              ...metadata,
              full_name: fullName,
              given_name: credential.fullName.givenName ?? '',
              family_name: credential.fullName.familyName ?? '',
            },
          });
        } else {
          await supabase.auth.updateUser({ data: metadata });
        }
      } else {
        await supabase.auth.updateUser({ data: metadata });
      }

      await finishSignup(user.id, 'apple');
    } catch (e: unknown) {
      const err = e as { code?: string; message?: string };
      if (err.code === 'ERR_REQUEST_CANCELED') return;
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Apple sign in failed', err.message ?? 'Please try again.');
    } finally {
      setAppleLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    if (!requireTermsAccepted()) return;
    if (appleLoading || googleLoading || emailLoading) return;
    setGoogleLoading(true);
    try {
      const result = await signInWithGoogle();
      if (!result.success) {
        if (result.cancelled) return;
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        Alert.alert('Google sign in failed', result.error);
        return;
      }

      await supabase.auth
        .updateUser({ data: buildOnboardingAuthMetadata(selectedRole, 'google') })
        .catch(() => {});

      await finishSignup(result.user.id, 'google');
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleEmailSignUp = async () => {
    if (!requireTermsAccepted()) return;
    if (!name.trim()) {
      Alert.alert('Name required', 'Please enter your full name.');
      return;
    }
    if (!email.trim() || !password.trim()) {
      Alert.alert('Missing fields', 'Please enter your email and password.');
      return;
    }
    if (password.length < 8) {
      Alert.alert('Password too short', 'Use at least 8 characters.');
      return;
    }
    if (confirmPassword && password !== confirmPassword) {
      Alert.alert('Passwords do not match', 'Please make sure both password fields are the same.');
      return;
    }

    setEmailLoading(true);
    try {
      const referralMeta = referralCode.trim()
        ? { referred_by: referralCode.trim().toUpperCase() }
        : {};

      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo: VERIFICATION_EMAIL_REDIRECT,
          data: {
            full_name: name.trim(),
            ...buildOnboardingAuthMetadata(selectedRole, 'email'),
            ...referralMeta,
            phone_number: phone.trim() ? `${countryCode}${phone.trim()}` : undefined,
          },
        },
      });

      if (error) {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        Alert.alert('Registration failed', error.message);
        return;
      }

      if (!data.session) {
        router.push(checkEmailHref(email.trim()));
        return;
      }

      if (!data.user?.id) {
        router.push(checkEmailHref(email.trim()));
        return;
      }

      await finishSignup(data.user.id, 'email');
    } finally {
      setEmailLoading(false);
    }
  };

  const openTerms = () => {
    void Linking.openURL(ONBOARDING_TERMS_URL);
  };

  const openPrivacy = () => {
    void Linking.openURL(ONBOARDING_PRIVACY_URL);
  };

  const authBusy = appleLoading || googleLoading || emailLoading;
  const topGoal = guardianGoals[0]?.toLowerCase() || 'your health';

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {!accountCreated ? (
        <View style={styles.headerRow}>
          <Pressable
            onPress={handleBack}
            style={styles.backBtn}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Text style={styles.backIcon}>{'\u2039'}</Text>
          </Pressable>
          <View style={styles.progressWrap}>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: '78%' }]} />
            </View>
          </View>
        </View>
      ) : null}
      <KeyboardAvoidingView
        style={styles.kav}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={insets.top}
      >
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingBottom: 20 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
        <Animated.View entering={FadeInDown.delay(80).springify()}>
          {accountCreated ? (
            /* POST-SIGNUP STATE — shown briefly before routing to subscription */
            <View style={[styles.trialBanner, styles.trialBannerSuccess]}>
              <Text style={styles.trialBannerSuccessText}>
                {'\u2713 Account created. Choosing your plan now'}
              </Text>
            </View>
          ) : (
            /* PRE-SIGNUP STATE — motivational, decision-aiding copy */
            <View style={styles.valueBanner}>
              <Text style={styles.valueBannerEyebrow}>
                {'\uD83D\uDEE1\uFE0F YOUR HEALTH GUARDIAN IS READY'}
              </Text>
              <Text style={styles.valueBannerText}>
                {userName && topGoal
                  ? `${userName}, your ${topGoal} plan is built and waiting. Claim it free — takes 30 seconds.`
                  : 'Your personalised health plan is built and waiting. Create your free account to access it.'}
              </Text>
              {healthScore > 0 ? (
                <View style={styles.scorePill}>
                  <Text style={styles.scorePillStar}>{'\u2605'}</Text>
                  <Text style={styles.scorePillText}>
                    {`Care Score: ${healthScore}/100 — ready to unlock`}
                  </Text>
                </View>
              ) : null}
            </View>
          )}

          <Text style={styles.h1}>
            {accountCreated
              ? 'One moment...'
              : userName
                ? `${userName}, your plan is ready`
                : 'Your plan is ready'}
          </Text>
          <Text style={styles.body}>
            {accountCreated
              ? 'Setting up your personalized experience.'
              : userName && healthScore
                ? `You scored ${healthScore}/100 on your care assessment. Lock in your free account to access your full plan — no card needed yet.`
                : 'Your health score, care plan, and AI companion are waiting. Free for 7 days. No card needed to start.'}
          </Text>

          {/* Trust micro-row — shown only before account creation */}
          {!accountCreated && (
            <View style={styles.trustMicroRow}>
              <Text style={styles.trustMicroItem}>{'\uD83D\uDD12 256-bit encrypted'}</Text>
              <Text style={styles.trustMicroDot}>·</Text>
              <Text style={styles.trustMicroItem}>{'\u2713 No card now'}</Text>
              <Text style={styles.trustMicroDot}>·</Text>
              <Text style={styles.trustMicroItem}>Cancel anytime</Text>
            </View>
          )}
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(160).springify()} style={styles.termsRow}>
          <Animated.View
            style={[
              styles.checkbox,
              termsAccepted && styles.checkboxChecked,
              termsGlowStyle,
            ]}
          >
            <Pressable
              onPress={() => {
                void Haptics.selectionAsync();
                setTermsAccepted((v) => !v);
              }}
              style={styles.checkboxPressable}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: termsAccepted }}
            >
              {termsAccepted ? <Text style={styles.checkMark}>{'\u2713'}</Text> : null}
            </Pressable>
          </Animated.View>
          <Text style={styles.termsText}>
            I agree to the{' '}
            <Text style={styles.link} onPress={openTerms} accessibilityRole="link">
              Terms of Service
            </Text>{' '}
            and{' '}
            <Text style={styles.link} onPress={openPrivacy} accessibilityRole="link">
              Privacy Policy
            </Text>
          </Text>
        </Animated.View>

        {!accountCreated ? (
          <Animated.View entering={FadeInDown.delay(200).springify()} style={styles.socialProofRow}>
            <Animated.View style={[styles.pulseDot, dotAnimStyle]} />
            <Text style={styles.socialProofText}>
              {'50,000+ families already protected by TruWell'}
            </Text>
          </Animated.View>
        ) : null}

        <Animated.View entering={FadeInDown.delay(240).springify()} style={styles.authStack}>
          <Pressable
            onPress={handleGoogleSignIn}
            disabled={authBusy}
            style={styles.authBtn}
            accessibilityRole="button"
          >
            {googleLoading ? <ActivityIndicator color={OB_COLORS.white} /> : <GoogleIcon />}
            <Text style={styles.authBtnText}>Continue with Google</Text>
          </Pressable>

          {appleAvailable ? (
            <AppleAuthentication.AppleAuthenticationButton
              buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_UP}
              buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.WHITE}
              cornerRadius={14}
              style={styles.appleBtn}
              onPress={handleAppleSignIn}
            />
          ) : null}

          {!showEmailForm ? (
            <Pressable
              onPress={() => {
                if (!requireTermsAccepted()) return;
                setShowEmailForm(true);
              }}
              disabled={authBusy}
              style={[styles.authBtn, styles.emailToggleBtn]}
              accessibilityRole="button"
            >
              <Text style={styles.authBtnText}>Continue with Email</Text>
            </Pressable>
          ) : (
            <Animated.View entering={FadeInDown.springify()} style={styles.emailForm}>
              <TextInput
                style={styles.input}
                placeholder="Full name"
                placeholderTextColor={OB_COLORS.white40}
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
                returnKeyType="next"
                onBlur={() => {
                  if (name.trim().length === 0) setNameError('Name is required');
                  else setNameError('');
                }}
                onSubmitEditing={() => emailInputRef.current?.focus()}
              />
              {nameError ? <Text style={styles.inputErrorText}>{nameError}</Text> : null}

              <View style={styles.phoneRow}>
                <Pressable
                  onPress={() => setShowCountryPicker(!showCountryPicker)}
                  style={styles.countryCodeBtn}
                >
                  <Text style={styles.countryCodeText}>{countryCode}</Text>
                  <Text style={styles.countryCodeChevron}>{'\u25BC'}</Text>
                </Pressable>
                <TextInput
                  style={[styles.input, styles.phoneInput]}
                  placeholder="Phone number (optional)"
                  placeholderTextColor={OB_COLORS.white40}
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                />
              </View>

              {showCountryPicker ? (
                <View style={styles.countryPickerWrap}>
                  {[
                    { code: '+1', label: '\uD83C\uDDFA\uD83C\uDDF8 USA / Canada (+1)' },
                    { code: '+44', label: '\uD83C\uDDEC\uD83C\uDDE7 UK (+44)' },
                    { code: '+61', label: '\uD83C\uDDE6\uD83C\uDDFA Australia (+61)' },
                    { code: '+27', label: '\uD83C\uDDFF\uD83C\uDDE6 South Africa (+27)' },
                    { code: '+234', label: '\uD83C\uDDF3\uD83C\uDDEC Nigeria (+234)' },
                    { code: '+233', label: '\uD83C\uDDEC\uD83C\uDDED Ghana (+233)' },
                    { code: '+254', label: '\uD83C\uDDF0\uD83C\uDDEA Kenya (+254)' },
                    { code: '+91', label: '\uD83C\uDDEE\uD83C\uDDF3 India (+91)' },
                    { code: '+971', label: '\uD83C\uDDE6\uD83C\uDDEA UAE (+971)' },
                    { code: '+49', label: '\uD83C\uDDE9\uD83C\uDDEA Germany (+49)' },
                    { code: '+33', label: '\uD83C\uDDEB\uD83C\uDDF7 France (+33)' },
                    { code: '+55', label: '\uD83C\uDDE7\uD83C\uDDF7 Brazil (+55)' },
                    { code: '+52', label: '\uD83C\uDDF2\uD83C\uDDFD Mexico (+52)' },
                    { code: '+65', label: '\uD83C\uDDF8\uD83C\uDDEC Singapore (+65)' },
                    { code: '+82', label: '\uD83C\uDDF0\uD83C\uDDF7 South Korea (+82)' },
                  ].map((c) => (
                    <Pressable
                      key={c.code}
                      onPress={() => {
                        setCountryCode(c.code);
                        setShowCountryPicker(false);
                        void Haptics.selectionAsync();
                      }}
                      style={[
                        styles.countryOption,
                        countryCode === c.code && styles.countryOptionSelected,
                      ]}
                    >
                      <Text style={styles.countryOptionText}>{c.label}</Text>
                    </Pressable>
                  ))}
                </View>
              ) : null}

              <TextInput
                ref={emailInputRef}
                style={[styles.input, emailError ? styles.inputError : null]}
                placeholder="Email address"
                placeholderTextColor={OB_COLORS.white40}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                returnKeyType="next"
                onBlur={() => {
                  const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
                  if (email.trim() && !valid) setEmailError('Enter a valid email address');
                  else setEmailError('');
                }}
                onSubmitEditing={() => passwordInputRef.current?.focus()}
              />
              {emailError ? <Text style={styles.inputErrorText}>{emailError}</Text> : null}

              <View style={styles.inputWrap}>
                <TextInput
                  ref={passwordInputRef}
                  style={[styles.input, styles.inputWithIcon]}
                  placeholder="Password (8+ characters)"
                  placeholderTextColor={OB_COLORS.white40}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  returnKeyType="next"
                  onSubmitEditing={() => confirmInputRef.current?.focus()}
                />
                <Pressable
                  onPress={() => setShowPassword((v) => !v)}
                  style={styles.eyeBtn}
                  accessibilityRole="button"
                  accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
                >
                  <Text style={styles.eyeIcon}>
                    {showPassword ? '\uD83D\uDEAB' : '\uD83D\uDC41'}
                  </Text>
                </Pressable>
              </View>
              {password.length > 0
                ? (() => {
                    const s = passwordStrength(password);
                    return (
                      <View style={styles.strengthWrap}>
                        <View style={styles.strengthTrack}>
                          {[1, 2, 3, 4, 5].map((i) => (
                            <View
                              key={i}
                              style={[
                                styles.strengthSeg,
                                { backgroundColor: i <= s.score ? s.color : OB_COLORS.white12 },
                              ]}
                            />
                          ))}
                        </View>
                        <Text style={[styles.strengthLabel, { color: s.color }]}>{s.label}</Text>
                      </View>
                    );
                  })()
                : null}

              <View style={styles.inputWrap}>
                <TextInput
                  ref={confirmInputRef}
                  style={[
                    styles.input,
                    styles.inputWithIcon,
                    confirmPassword.length > 0 && password !== confirmPassword && styles.inputError,
                  ]}
                  placeholder="Confirm password"
                  placeholderTextColor={OB_COLORS.white40}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showConfirmPassword}
                  autoCapitalize="none"
                  returnKeyType={showReferral ? 'next' : 'done'}
                  onSubmitEditing={() => {
                    if (showReferral) referralInputRef.current?.focus();
                    else void handleEmailSignUp();
                  }}
                />
                <Pressable
                  onPress={() => setShowConfirmPassword((v) => !v)}
                  style={styles.eyeBtn}
                  accessibilityRole="button"
                  accessibilityLabel={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  <Text style={styles.eyeIcon}>
                    {showConfirmPassword ? '\uD83D\uDEAB' : '\uD83D\uDC41'}
                  </Text>
                </Pressable>
              </View>
              {confirmPassword.length > 0 && password !== confirmPassword ? (
                <Text style={styles.inputErrorText}>Passwords do not match</Text>
              ) : null}

              <Pressable onPress={() => setShowReferral(!showReferral)} style={styles.referralToggle}>
                <Text style={styles.referralToggleText}>
                  {showReferral ? '\u25B2 Hide referral code' : '+ Have a referral code?'}
                </Text>
              </Pressable>
              {showReferral ? (
                <TextInput
                  ref={referralInputRef}
                  style={styles.input}
                  placeholder="Referral code (optional)"
                  placeholderTextColor={OB_COLORS.white40}
                  value={referralCode}
                  onChangeText={(t) => setReferralCode(t.toUpperCase())}
                  autoCapitalize="characters"
                  maxLength={8}
                  returnKeyType="done"
                  onSubmitEditing={() => void handleEmailSignUp()}
                />
              ) : null}
            </Animated.View>
          )}
        </Animated.View>

        {!accountCreated ? (
          <Animated.View entering={FadeInDown.delay(280).springify()} style={styles.signInRow}>
            <Text style={styles.signInPrompt}>Already have an account? </Text>
            <Pressable
              onPress={() => router.push('/(auth)/sign-in' as never)}
              hitSlop={8}
              accessibilityRole="link"
              accessibilityLabel="Sign in"
            >
              <Text style={styles.signInLink}>Sign in</Text>
            </Pressable>
          </Animated.View>
        ) : null}
        </ScrollView>

        {showEmailForm ? (
          <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
            <Pressable
              onPress={handleEmailSignUp}
              disabled={authBusy || (confirmPassword.length > 0 && password !== confirmPassword)}
              accessibilityRole="button"
            >
              <LinearGradient
                colors={[OB_COLORS.gold, OB_COLORS.goldLight]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[
                  styles.emailSubmit,
                  (authBusy || password !== confirmPassword) && { opacity: 0.5 },
                ]}
              >
                {emailLoading ? (
                  <ActivityIndicator color={OB_COLORS.navy} />
                ) : (
                  <Text style={styles.emailSubmitText}>
                    {userName ? `Lock in my plan, ${userName}` : 'Lock in my free plan'}
                  </Text>
                )}
              </LinearGradient>
            </Pressable>
          </View>
        ) : null}
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: OB_COLORS.navy },
  headerRow: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  backIcon: { color: OB_COLORS.white70, fontSize: 28, lineHeight: 32 },
  kav: { flex: 1, backgroundColor: OB_COLORS.navy },
  scroll: { paddingHorizontal: 24 },
  footer: {
    paddingHorizontal: 24,
    paddingTop: 12,
    backgroundColor: OB_COLORS.navy,
  },
  trialBanner: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(201,168,76,0.35)',
    backgroundColor: 'rgba(201,168,76,0.12)',
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 16,
  },
  trialBannerText: {
    fontFamily: OB_FONTS.semiBold,
    fontSize: 13,
    color: OB_COLORS.goldLight,
    textAlign: 'center',
  },
  h1: {
    fontFamily: OB_FONTS.bold,
    fontWeight: '700',
    fontSize: 26,
    lineHeight: 34,
    color: OB_COLORS.white,
    marginBottom: 8,
  },
  body: { fontFamily: OB_FONTS.body, fontSize: 15, lineHeight: 22, color: OB_COLORS.white70, marginBottom: 20 },
  termsRow: { flexDirection: 'row', gap: 12, alignItems: 'flex-start', marginBottom: 18 },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: OB_COLORS.white40,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  checkboxChecked: { borderColor: OB_COLORS.gold, backgroundColor: 'rgba(201,168,76,0.25)' },
  checkMark: { color: OB_COLORS.goldLight, fontSize: 12, fontWeight: '900' },
  termsText: { flex: 1, fontFamily: OB_FONTS.body, fontSize: 13, lineHeight: 20, color: OB_COLORS.white70 },
  link: { color: OB_COLORS.teal, textDecorationLine: 'underline' },
  authStack: { gap: 12 },
  authBtn: {
    height: 52,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: OB_COLORS.white12,
    backgroundColor: OB_COLORS.white07,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  authBtnText: { fontFamily: OB_FONTS.semiBold, fontSize: 15, color: OB_COLORS.white },
  appleBtn: { width: '100%', height: 52 },
  emailToggleBtn: { justifyContent: 'center' },
  emailForm: { gap: 10, marginTop: 4 },
  input: {
    height: 52,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: OB_COLORS.white12,
    backgroundColor: OB_COLORS.white07,
    paddingHorizontal: 14,
    fontFamily: OB_FONTS.body,
    fontSize: 15,
    color: OB_COLORS.white,
  },
  inputWrap: {
    position: 'relative',
    justifyContent: 'center',
  },
  inputWithIcon: {
    paddingRight: 48,
  },
  eyeBtn: {
    position: 'absolute',
    right: 14,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    width: 32,
  },
  eyeIcon: {
    fontSize: 16,
    color: OB_COLORS.white40,
  },
  emailSubmit: { height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  emailSubmitText: { fontFamily: OB_FONTS.bold, fontWeight: '700', fontSize: 16, color: OB_COLORS.navy },
  trialBannerSuccess: {
    borderColor: 'rgba(46,213,115,0.35)',
    backgroundColor: 'rgba(46,213,115,0.10)',
  },
  trialBannerSuccessText: {
    fontFamily: OB_FONTS.semiBold,
    fontSize: 13,
    color: '#2ED573',
    textAlign: 'center',
  },
  valueBanner: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(0,229,200,0.25)',
    backgroundColor: 'rgba(0,229,200,0.07)',
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 16,
    gap: 4,
  },
  valueBannerEyebrow: {
    fontFamily: OB_FONTS.semiBold,
    fontSize: 9,
    letterSpacing: 2,
    color: OB_COLORS.teal,
    textTransform: 'uppercase',
  },
  valueBannerText: {
    fontFamily: OB_FONTS.body,
    fontSize: 13,
    color: OB_COLORS.white70,
    lineHeight: 19,
  },
  trustMicroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 20,
    flexWrap: 'wrap',
  },
  trustMicroItem: {
    fontFamily: OB_FONTS.body,
    fontSize: 11,
    color: OB_COLORS.white40,
  },
  trustMicroDot: {
    fontSize: 11,
    color: 'rgba(240,244,255,0.20)',
  },
  phoneBtn: {
    borderColor: 'rgba(0,229,200,0.25)',
    backgroundColor: 'rgba(0,229,200,0.07)',
  },
  authBtnIcon: { fontSize: 16 },
  phoneRow: { flexDirection: 'row', gap: 8, alignItems: 'stretch' },
  countryCodeBtn: {
    height: 52,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: OB_COLORS.white12,
    backgroundColor: OB_COLORS.white07,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    paddingHorizontal: 10,
    gap: 4,
  },
  countryCodeText: { fontFamily: OB_FONTS.semiBold, fontSize: 13, color: OB_COLORS.white },
  countryCodeChevron: { fontSize: 8, color: OB_COLORS.white40 },
  phoneInput: { flex: 1 },
  countryPickerWrap: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: OB_COLORS.white12,
    backgroundColor: '#111D26',
    overflow: 'hidden',
  },
  countryOption: { paddingVertical: 12, paddingHorizontal: 14 },
  countryOptionSelected: { backgroundColor: 'rgba(201,168,76,0.12)' },
  countryOptionText: { fontFamily: OB_FONTS.body, fontSize: 13, color: OB_COLORS.white70 },
  strengthWrap: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: -4 },
  strengthTrack: { flex: 1, flexDirection: 'row', gap: 4 },
  strengthSeg: { flex: 1, height: 3, borderRadius: 100 },
  strengthLabel: { fontFamily: OB_FONTS.semiBold, fontSize: 11, minWidth: 44 },
  inputError: { borderColor: '#ef4444' },
  inputErrorText: {
    fontFamily: OB_FONTS.body,
    fontSize: 11,
    color: '#ef4444',
    marginTop: -6,
  },
  referralToggle: { paddingVertical: 6 },
  referralToggleText: { fontFamily: OB_FONTS.semiBold, fontSize: 12, color: OB_COLORS.teal },
  progressWrap: { flex: 1 },
  progressTrack: {
    height: 3,
    backgroundColor: OB_COLORS.white12,
    borderRadius: 100,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', borderRadius: 100, backgroundColor: OB_COLORS.gold },
  socialProofRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
    alignSelf: 'center',
  },
  pulseDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: OB_COLORS.green,
  },
  socialProofText: {
    fontFamily: OB_FONTS.medium,
    fontSize: 12,
    color: OB_COLORS.white70,
  },
  scorePill: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(201,168,76,0.35)',
    backgroundColor: 'rgba(201,168,76,0.10)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    alignSelf: 'flex-start',
    marginTop: 8,
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
  },
  scorePillStar: { color: OB_COLORS.gold, fontSize: 12 },
  scorePillText: {
    fontFamily: OB_FONTS.semiBold,
    fontSize: 11,
    color: OB_COLORS.goldLight,
  },
  checkboxPressable: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  signInRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginTop: 20,
    marginBottom: 8,
  },
  signInPrompt: {
    fontFamily: OB_FONTS.body,
    fontSize: 13,
    color: OB_COLORS.white70,
  },
  signInLink: {
    fontFamily: OB_FONTS.semiBold,
    fontSize: 13,
    color: OB_COLORS.teal,
  },
});
