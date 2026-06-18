import { hapticError, hapticSelection, hapticSuccess } from '@/lib/haptics';
import { signInWithGoogle } from '@/lib/googleAuth';
import { completeConversionOnboarding } from '@/lib/completeConversionOnboarding';
import { saveTruwellOnboarding } from '@/lib/saveTruwellOnboarding';
import { trackOnboardingEvent } from '@/lib/onboardingAnalytics';
import {
  applyPendingReferralIfNeeded,
  applyReferralToUser,
  normalizeReferralCode,
} from '@/lib/referralLink';
import { supabase } from '@/lib/supabase';
import {
  VERIFICATION_EMAIL_REDIRECT,
  checkEmailHref,
  routeAfterEmailVerified,
} from '@/lib/emailVerification';
import { ONBOARDING_ROUTES } from '@/lib/onboardingRoutePaths';
import { useReferralInvite } from '@/hooks/useReferralInvite';
import { useOnboardingStore } from '@/stores/onboardingStore';
import { useTheme } from '@/theme/ThemeContext';
import { psychBrand } from '@/theme/colors';
import type { Href } from 'expo-router';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as AppleAuthentication from 'expo-apple-authentication';
import { forwardRef, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  type TextInput as RNTextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { KeyboardScreen } from '@/components/KeyboardScreen';
import Svg, { Path as SvgPath } from 'react-native-svg';
import { SafeAreaView } from 'react-native-safe-area-context';

// ─── Types ────────────────────────────────────────────────────────────────────

type Errors = Record<string, string>;

function RegisterGoogleIcon() {
  return (
    <Svg width={15} height={15} viewBox="0 0 24 24">
      <SvgPath d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <SvgPath d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <SvgPath d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <SvgPath d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </Svg>
  );
}

type Theme = ReturnType<typeof useTheme>['theme'];

// ─── Field input ──────────────────────────────────────────────────────────────

const FieldInput = forwardRef<
  RNTextInput,
  {
    label: string;
    value: string;
    onChangeText: (v: string) => void;
    placeholder?: string;
    secure?: boolean;
    email?: boolean;
    numeric?: boolean;
    multiline?: boolean;
    error?: string;
    maxLength?: number;
    theme: Theme;
    returnKeyType?: 'next' | 'done' | 'go';
    onSubmitEditing?: () => void;
  }
>(function FieldInput(
  {
    label,
    value,
    onChangeText,
    placeholder,
    secure,
    email,
    numeric,
    multiline,
    error,
    maxLength,
    theme,
    returnKeyType = 'next',
    onSubmitEditing,
  },
  ref
) {
  return (
    <View style={fs.field}>
      <Text style={[fs.fieldLabel, { color: theme.text3 }]}>{label}</Text>
      <TextInput
        ref={ref}
        style={[
          fs.input,
          { backgroundColor: theme.bg2, borderColor: error ? theme.red : theme.border, color: theme.text1 },
          multiline && { height: 100, textAlignVertical: 'top', paddingTop: 14 },
        ]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.text4}
        secureTextEntry={secure}
        keyboardType={email ? 'email-address' : numeric ? 'numeric' : 'default'}
        autoCapitalize={email || numeric ? 'none' : 'words'}
        multiline={multiline}
        maxLength={maxLength}
        returnKeyType={returnKeyType}
        onSubmitEditing={onSubmitEditing}
        blurOnSubmit={!multiline}
      />
      {error ? <Text style={[fs.errorText, { color: theme.red }]}>{error}</Text> : null}
    </View>
  );
});

// ─── Dropdown picker ──────────────────────────────────────────────────────────

function DropdownPicker({
  label,
  value,
  options,
  onSelect,
  error,
  theme,
}: {
  label: string;
  value: string;
  options: readonly string[];
  onSelect: (v: string) => void;
  error?: string;
  theme: Theme;
}) {
  const [open, setOpen] = useState(false);
  return (
    <View style={fs.field}>
      <Text style={[fs.fieldLabel, { color: theme.text3 }]}>{label}</Text>
      <Pressable
        style={[fs.input, fs.dropdownBtn, { backgroundColor: theme.bg2, borderColor: error ? theme.red : theme.border }]}
        onPress={() => { hapticSelection(); setOpen(true); }}
      >
        <Text style={{ color: value ? theme.text1 : theme.text4, fontSize: 15 }}>
          {value || `Select ${label.toLowerCase()}`}
        </Text>
        <Text style={{ color: theme.text3 }}>▾</Text>
      </Pressable>
      {error ? <Text style={[fs.errorText, { color: theme.red }]}>{error}</Text> : null}
      <Modal visible={open} transparent animationType="fade">
        <Pressable style={fs.overlay} onPress={() => setOpen(false)}>
          <View style={[fs.sheet, { backgroundColor: theme.bg2, borderColor: theme.border }]}>
            <Text style={[fs.sheetTitle, { color: theme.text1 }]}>{label}</Text>
            {options.map((opt) => (
              <Pressable
                key={opt}
                style={[fs.sheetOpt, { borderBottomColor: theme.border }]}
                onPress={() => { hapticSelection(); onSelect(opt); setOpen(false); }}
              >
                <Text style={[fs.sheetOptText, { color: opt === value ? theme.teal : theme.text2 }]}>
                  {opt}
                </Text>
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

// ─── Multi-select pills ───────────────────────────────────────────────────────

function PillRow({
  options,
  selected,
  onToggle,
  activeColor,
  theme,
}: {
  options: readonly string[];
  selected: string[];
  onToggle: (v: string) => void;
  activeColor: string;
  theme: Theme;
}) {
  return (
    <View style={fs.pillWrap}>
      {options.map((opt) => {
        const active = selected.includes(opt);
        return (
          <Pressable
            key={opt}
            onPress={() => { hapticSelection(); onToggle(opt); }}
            style={[
              fs.pill,
              {
                backgroundColor: active ? activeColor : theme.bg2,
                borderColor: active ? activeColor : theme.border,
              },
            ]}
          >
            <Text style={[fs.pillText, { color: active ? theme.bg0 : theme.text2 }]}>{opt}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

// ─── Pending approval screen ──────────────────────────────────────────────────

function PendingApproval({ theme }: { theme: Theme }) {
  const router = useRouter();
  return (
    <View style={[fs.pendingWrap, { backgroundColor: theme.bg0 }]}>
      <Text style={fs.pendingEmoji}>🛡️</Text>
      <Text style={[fs.pendingTitle, { color: theme.gold }]}>Application Received</Text>
      <Text style={[fs.pendingBody, { color: theme.text2 }]}>
        Your application is under review.{'\n'}We will email you within 24 hours.
      </Text>
      <Pressable
        style={[fs.pendingBtn, { borderColor: theme.teal }]}
        onPress={() => router.replace('/login')}
      >
        <Text style={[fs.pendingBtnText, { color: theme.teal }]}>Back to Login</Text>
      </Pressable>
    </View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function RegisterScreen() {
  const { theme } = useTheme();
  const router    = useRouter();
  const params = useLocalSearchParams<{
    psych?: string;
    role?: string;
    conversionFlow?: string;
    fromOnboardingAccount?: string;
  }>();
  const goToStep = useOnboardingStore((s) => s.goToStep);
  const setConversionFlowStep = useOnboardingStore((s) => s.setConversionFlowStep);

  const conversionSignup =
    params.conversionFlow === '1' ||
    (Array.isArray(params.conversionFlow) && params.conversionFlow[0] === '1');

  const [loading, setLoading]     = useState(false);
  const [appleLoading, setAppleLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errors, setErrors]       = useState<Errors>({});

  // Shared fields
  const [name, setName]                     = useState('');
  const [email, setEmail]                   = useState('');
  const [password, setPassword]             = useState('');
  const [confirmPw, setConfirmPw]           = useState('');
  const [agreedToTerms, setAgreedToTerms]   = useState(false);
  const { referralCode, fromInviteLink, setReferralCode, persistReferral } = useReferralInvite();
  const [showReferral, setShowReferral] = useState(false);

  const emailRef = useRef<RNTextInput>(null);
  const passwordRef = useRef<RNTextInput>(null);
  const confirmRef = useRef<RNTextInput>(null);
  const referralRef = useRef<RNTextInput>(null);

  const guardianGoals = useOnboardingStore((s) => s.guardianGoals);
  const guardianDailyMinutes = useOnboardingStore((s) => s.guardianDailyMinutes);

  useEffect(() => {
    if (fromInviteLink && referralCode) setShowReferral(true);
  }, [fromInviteLink, referralCode]);

  useEffect(() => {
    let cancelled = false;
    void supabase.auth.getSession().then(({ data: { session } }) => {
      if (cancelled || !session?.user) return;
      router.replace('/enter' as never);
    });
    return () => { cancelled = true; };
  }, [router]);

  const validate = (): boolean => {
    const e: Errors = {};
    if (!name.trim())                          e.name = 'Full name is required';
    if (!email.trim())                         e.email = 'Email is required';
    else if (!/^\S+@\S+\.\S+$/.test(email))   e.email = 'Enter a valid email address';
    if (password.length < 8)                   e.password = 'Password must be at least 8 characters';
    if (password !== confirmPw)                e.confirmPw = 'Passwords do not match';
    if (!agreedToTerms)                        e.terms = 'You must accept the terms of service';
    setErrors(e);
    if (Object.keys(e).length > 0) hapticError();
    return Object.keys(e).length === 0;
  };

  const handleAppleSignIn = async () => {
    if (appleLoading || googleLoading) return;
    setAppleLoading(true);
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      if (!credential.identityToken) {
        throw new Error('No identityToken.');
      }

      const {
        error,
        data: { user },
      } = await supabase.auth.signInWithIdToken({
        provider: 'apple',
        token: credential.identityToken,
      });

      if (error) {
        hapticError();
        Alert.alert('Sign in failed', error.message);
        return;
      }

      if (!user) return;

      await applyPendingReferralIfNeeded(user.id);

      if (credential.fullName) {
        const nameParts: string[] = [];
        if (credential.fullName.givenName) nameParts.push(credential.fullName.givenName);
        if (credential.fullName.middleName) nameParts.push(credential.fullName.middleName);
        if (credential.fullName.familyName) nameParts.push(credential.fullName.familyName);

        const fullName = nameParts.filter(Boolean).join(' ');

        if (fullName.trim()) {
          await supabase.auth.updateUser({
            data: {
              full_name: fullName,
              given_name: credential.fullName.givenName ?? '',
              family_name: credential.fullName.familyName ?? '',
              provider: 'apple',
              role: 'user',
            },
          });
        } else {
          await supabase.auth.updateUser({
            data: {
              provider: 'apple',
              role: 'user',
            },
          });
        }
      } else {
        await supabase.auth.updateUser({
          data: {
            provider: 'apple',
            role: 'user',
          },
        });
      }

      const isNewUser = !!(credential.fullName?.givenName || credential.fullName?.familyName);

      if (isNewUser) {
        hapticSuccess();
        if (conversionSignup) {
          const uid = (await supabase.auth.getUser()).data.user?.id;
          if (uid) {
            await saveTruwellOnboarding(uid);
            void trackOnboardingEvent('registration_completed', {
              role: useOnboardingStore.getState().selectedRole || 'unknown',
              provider: 'apple',
            });
          }
          await completeConversionOnboarding((href) => router.replace(href));
          return;
        }
        const psychOn =
          params.psych === '1' ||
          (Array.isArray(params.psych) && params.psych[0] === '1');
        if (psychOn) {
          goToStep(10);
          router.replace('/settings/subscription?psychFlow=1' as Href);
          return;
        }
        router.replace('/(auth)/onboarding/health-profile');
        return;
      }

      router.replace('/' as never);
    } catch (e: unknown) {
      const err = e as { code?: string; message?: string };
      if (err.code === 'ERR_REQUEST_CANCELED') return;
      hapticError();
      Alert.alert('Apple sign in failed', err.message ?? 'Please try again.');
    } finally {
      setAppleLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    if (googleLoading || appleLoading) return;
    setGoogleLoading(true);
    try {
      const result = await signInWithGoogle();
      if (!result.success) {
        if (result.cancelled) return;
        hapticError();
        Alert.alert('Google sign in failed', result.error);
        return;
      }

      await supabase.auth
        .updateUser({
          data: { role: 'user' },
        })
        .catch(() => {});

      const uid = (await supabase.auth.getUser()).data.user?.id;
      if (uid) await applyPendingReferralIfNeeded(uid);

      if (result.isNew) {
        hapticSuccess();
        if (conversionSignup) {
          const uid = (await supabase.auth.getUser()).data.user?.id;
          if (uid) {
            await saveTruwellOnboarding(uid);
            void trackOnboardingEvent('registration_completed', {
              role: useOnboardingStore.getState().selectedRole || 'unknown',
              provider: 'google',
            });
          }
          await completeConversionOnboarding((href) => router.replace(href));
          return;
        }
        const psychOn =
          params.psych === '1' ||
          (Array.isArray(params.psych) && params.psych[0] === '1');
        if (psychOn) {
          goToStep(10);
          router.replace('/settings/subscription?psychFlow=1' as Href);
          return;
        }
        router.replace('/(auth)/onboarding/health-profile');
        return;
      }

      router.replace('/' as never);
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const meta: Record<string, unknown> = {
        full_name: name.trim(),
        role: 'user',
      };
      if (referralCode.trim()) {
        meta.referred_by = normalizeReferralCode(referralCode);
      }

      const { data: authData, error: authErr } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: meta,
          emailRedirectTo: VERIFICATION_EMAIL_REDIRECT,
        },
      });

      if (authErr) {
        hapticError();
        Alert.alert('Registration failed', authErr.message);
        return;
      }

      hapticSuccess();

      if (authData.user?.id && referralCode.trim()) {
        await applyReferralToUser(authData.user.id, referralCode);
      }

      if (!authData.session) {
        router.push(checkEmailHref(email.trim()));
        return;
      }

      if (conversionSignup) {
        if (authData.user?.id) {
          await saveTruwellOnboarding(authData.user.id);
          void trackOnboardingEvent('registration_completed', {
            role: useOnboardingStore.getState().selectedRole || 'unknown',
            provider: 'email',
          });
        }
        await completeConversionOnboarding((href) => router.replace(href));
        return;
      }

      const psychOn =
        params.psych === '1' ||
        (Array.isArray(params.psych) && params.psych[0] === '1');
      if (psychOn) {
        goToStep(10);
        router.replace('/settings/subscription?psychFlow=1' as Href);
        return;
      }

      await routeAfterEmailVerified(router);
    } finally {
      setLoading(false);
    }
  };

  const submitFooter = (
    <View>
      <Pressable
        style={[
          fs.submitBtn,
          { backgroundColor: theme.teal },
          loading && { opacity: 0.6 },
        ]}
        onPress={() => void handleSubmit()}
        disabled={loading}
      >
        <Text style={[fs.submitText, { color: theme.bg0 }]}>
          {loading ? 'Creating account…' : 'Create Account'}
        </Text>
      </Pressable>
      <View style={fs.signInRow}>
        <Text style={[fs.signInPrompt, { color: theme.text3 }]}>
          Already have an account?{' '}
        </Text>
        <Pressable
          onPress={() => {
            hapticSelection();
            void persistReferral();
            router.push(
              referralCode
                ? ({ pathname: '/(auth)/sign-in', params: { ref: referralCode } } as Href)
                : ('/(auth)/sign-in' as Href),
            );
          }}
          hitSlop={8}
          accessibilityRole="link"
          accessibilityLabel="Sign in"
        >
          <Text style={[fs.signInLink, { color: theme.teal }]}>Sign in</Text>
        </Pressable>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[fs.safe, { backgroundColor: theme.bg0 }]} edges={['top']}>
      <KeyboardScreen
        style={fs.flex}
        backgroundColor={theme.bg0}
        horizontalPadding={0}
        contentStyle={fs.scroll}
        hasFixedFooter
        extraPadding={20}
        footer={submitFooter}
      >
          {/* Back */}
          <Pressable
            style={fs.backBtn}
            onPress={() => {
              if (router.canGoBack()) {
                router.back();
              } else {
                router.replace('/login' as never);
              }
            }}
          >
            <Text style={[fs.backText, { color: theme.text3 }]}>{'\u2039'} Back</Text>
          </Pressable>

          <Text style={[fs.title, { color: theme.text1 }]}>Create Account</Text>
          <Text style={[fs.subtitle, { color: theme.text3 }]}>
            Join TruWell AI and start protecting your health
          </Text>

          {conversionSignup ? (
            <View
              style={[
                fs.planReminder,
                {
                  backgroundColor: psychBrand.trustPillBg,
                  borderColor: psychBrand.tealBorder,
                },
              ]}
            >
              <Text style={[fs.planReminderTitle, { color: theme.text1 }]}>
                🛡️ Your wellness plan
              </Text>
              <View style={fs.planReminderRow}>
                <Text style={[fs.planReminderItem, { color: theme.text2 }]}>
                  🎯 {guardianGoals?.[0] ?? 'Health goals set'}
                </Text>
                <Text style={[fs.planReminderItem, { color: theme.text2 }]}>
                  ⏱ {guardianDailyMinutes || 20} min daily
                </Text>
                <Text style={[fs.planReminderItem, { color: theme.text2 }]}>✅ AI plan ready</Text>
              </View>
            </View>
          ) : null}

          <View
            style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              gap: 8,
              marginBottom: 20,
              opacity: appleLoading || googleLoading ? 0.55 : 1,
            }}
            pointerEvents={appleLoading || googleLoading ? 'none' : 'auto'}
          >
            {Platform.OS === 'ios' ? (
              <AppleAuthentication.AppleAuthenticationButton
                buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
                buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
                cornerRadius={12}
                style={{ flex: 1, height: 48, minWidth: '45%' }}
                onPress={() => void handleAppleSignIn()}
              />
            ) : null}
            <TouchableOpacity
              onPress={() => void handleGoogleSignIn()}
              activeOpacity={0.85}
              style={{
                flex: 1,
                minWidth: '45%',
                height: 48,
                borderRadius: 12,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                backgroundColor: 'rgba(255,255,255,0.04)',
                borderWidth: 1,
                borderColor: 'rgba(234,67,53,0.22)',
              }}
            >
              <RegisterGoogleIcon />
              <Text style={{ fontSize: 13, fontWeight: '700', color: theme.text1 }}>Google</Text>
            </TouchableOpacity>
          </View>

          {/* Shared fields */}
          <FieldInput
            label="Full Name"
            value={name}
            onChangeText={setName}
            placeholder="Jane Smith"
            error={errors.name}
            theme={theme}
            returnKeyType="next"
            onSubmitEditing={() => emailRef.current?.focus()}
          />
          <FieldInput
            ref={emailRef}
            label="Email"
            value={email}
            onChangeText={setEmail}
            placeholder="jane@example.com"
            email
            error={errors.email}
            theme={theme}
            returnKeyType="next"
            onSubmitEditing={() => passwordRef.current?.focus()}
          />
          <FieldInput
            ref={passwordRef}
            label="Password"
            value={password}
            onChangeText={setPassword}
            placeholder="Min. 8 characters"
            secure
            error={errors.password}
            theme={theme}
            returnKeyType="next"
            onSubmitEditing={() => confirmRef.current?.focus()}
          />
          <FieldInput
            ref={confirmRef}
            label="Confirm Password"
            value={confirmPw}
            onChangeText={setConfirmPw}
            placeholder="Re-enter password"
            secure
            error={errors.confirmPw}
            theme={theme}
            returnKeyType={showReferral || referralCode ? 'next' : 'done'}
            onSubmitEditing={() => {
              if (showReferral || referralCode) referralRef.current?.focus();
              else void handleSubmit();
            }}
          />

          <View style={fs.field}>
              {fromInviteLink && referralCode ? (
                <View
                  style={[
                    fs.referralBanner,
                    { backgroundColor: `${theme.teal}12`, borderColor: `${theme.teal}30` },
                  ]}
                >
                  <Text style={[fs.referralBannerTitle, { color: theme.teal }]}>Invite link applied</Text>
                  <Text style={[fs.referralBannerSub, { color: theme.text3 }]}>
                    Health intelligence, alerts, and a health-minded community await
                  </Text>
                </View>
              ) : null}
              <Pressable onPress={() => setShowReferral((v) => !v)} style={{ paddingVertical: 6 }}>
                <Text style={{ fontSize: 12, fontWeight: '600', color: theme.teal }}>
                  {showReferral || referralCode ? 'Referral code' : '+ Have a referral code?'}
                </Text>
              </Pressable>
              {showReferral || referralCode ? (
                <TextInput
                  ref={referralRef}
                  style={[
                    fs.input,
                    {
                      backgroundColor: theme.bg2,
                      borderColor: theme.border,
                      color: theme.text1,
                      letterSpacing: 2,
                      textAlign: 'center',
                      fontWeight: '700',
                      minHeight: 52,
                    },
                  ]}
                  value={referralCode}
                  onChangeText={setReferralCode}
                  onBlur={() => void persistReferral()}
                  placeholder="ENTER CODE"
                  placeholderTextColor={theme.text4}
                  autoCapitalize="characters"
                  maxLength={12}
                  returnKeyType="done"
                  onSubmitEditing={() => void handleSubmit()}
                />
              ) : null}
            </View>

          {/* Terms */}
          <Pressable
            style={fs.termsRow}
            onPress={() => { hapticSelection(); setAgreedToTerms((v) => !v); }}
          >
            <View
              style={[
                fs.checkbox,
                {
                  backgroundColor: agreedToTerms ? theme.teal : 'transparent',
                  borderColor: errors.terms ? theme.red : agreedToTerms ? theme.teal : theme.border,
                },
              ]}
            >
              {agreedToTerms ? <Text style={{ color: theme.bg0, fontSize: 11 }}>✓</Text> : null}
            </View>
            <Text style={[fs.termsText, { color: theme.text3 }]}>
              I accept the{' '}
              <Text style={{ color: theme.teal }}>Terms of Service</Text>
              {' '}and{' '}
              <Text style={{ color: theme.teal }}>Privacy Policy</Text>
            </Text>
          </Pressable>
          {errors.terms ? (
            <Text style={[fs.errorText, { color: theme.red, marginTop: -4, marginBottom: 8 }]}>
              {errors.terms}
            </Text>
          ) : null}

        </KeyboardScreen>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const fs = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
  scroll: { paddingHorizontal: 24, paddingTop: 8, paddingBottom: 24 },

  backBtn: { marginBottom: 16 },
  backText: { fontSize: 16 },

  title:    { fontSize: 26, fontWeight: '900', letterSpacing: -0.5, marginBottom: 6 },
  subtitle: { fontSize: 14, lineHeight: 20, marginBottom: 24 },

  planReminder: {
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 22,
    gap: 10,
  },
  planReminderTitle: { fontSize: 17, fontWeight: '900' },
  planReminderRow: { gap: 6 },
  planReminderItem: { fontSize: 13, lineHeight: 20, fontWeight: '600' },

  // Toggle
  toggleRow: {
    flexDirection: 'row',
    borderRadius: 16,
    borderWidth: 1,
    padding: 4,
    marginBottom: 24,
  },
  togglePill: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
  },
  toggleText: { fontSize: 12, fontWeight: '700', textAlign: 'center' },

  // Fields
  field:      { marginBottom: 16 },
  fieldLabel: { fontSize: 12, fontWeight: '700', letterSpacing: 0.4, marginBottom: 6, textTransform: 'uppercase' },
  referralBanner: {
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 10,
  },
  referralBannerTitle: { fontSize: 12, fontWeight: '800' },
  referralBannerSub: { fontSize: 11, marginTop: 4, lineHeight: 16 },
  input: {
    height: 52,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 16,
    fontSize: 15,
  },
  errorText:   { fontSize: 12, marginTop: 4 },
  dropdownBtn: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },

  // Dropdown modal
  overlay:    { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'center', padding: 28 },
  sheet:      { borderRadius: 18, borderWidth: 1, overflow: 'hidden' },
  sheetTitle: { fontSize: 16, fontWeight: '800', padding: 16, paddingBottom: 10 },
  sheetOpt:   { paddingVertical: 14, paddingHorizontal: 16, borderBottomWidth: 1 },
  sheetOptText: { fontSize: 15 },

  // Pills
  pillWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 2 },
  pill: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 50, borderWidth: 1 },
  pillText: { fontSize: 13, fontWeight: '600' },

  // Terms
  termsRow:  { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 12 },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
    flexShrink: 0,
  },
  termsText: { fontSize: 13, lineHeight: 20, flex: 1 },

  signInRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginTop: 12,
  },
  signInPrompt: { fontSize: 13 },
  signInLink: { fontSize: 13, fontWeight: '700' },

  // Submit
  submitBtn: {
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    marginBottom: 12,
  },
  submitText: { fontSize: 16, fontWeight: '800' },

  // Pending
  pendingWrap:    { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  pendingEmoji:   { fontSize: 56, marginBottom: 20 },
  pendingTitle:   { fontSize: 22, fontWeight: '900', marginBottom: 14, textAlign: 'center' },
  pendingBody:    { fontSize: 15, lineHeight: 24, textAlign: 'center', marginBottom: 32 },
  pendingBtn:     { paddingHorizontal: 32, paddingVertical: 14, borderRadius: 14, borderWidth: 1.5 },
  pendingBtnText: { fontSize: 15, fontWeight: '700' },
});
