import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Alert,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  Animated as RNAnimated,
  StyleSheet,
  Pressable,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withSequence,
  withRepeat,
  withDelay,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useReferralInvite } from '@/hooks/useReferralInvite';
import { applyPendingReferralIfNeeded } from '@/lib/referralLink';
import Svg, { Path, Circle, Rect, Line, G } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import * as AppleAuthentication from 'expo-apple-authentication';

import {
  signInWithEmail,
  sendPhoneOtp,
  verifyPhoneOtp,
  authenticateWithBiometric,
  signInWithPasskey,
  verifyPin,
  checkBiometricAvailability,
  hasPin,
  type AuthMethod,
} from '@/lib/authService';
import { signInWithGoogle as signInWithGoogleNative } from '@/lib/googleAuth';
import { supabase } from '@/lib/supabase';
import { resolveUserRole } from '@/lib/roleResolver';
import TruWellShieldAnimated from '@/components/auth/TruWellShieldAnimated';
import { TruWellShield } from '@/components/onboarding/TruWellShield';
import FloatingParticles from '@/components/auth/FloatingParticles';
import GoldShimmerButton from '@/components/auth/GoldShimmerButton';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

// ── Types ──────────────────────────────────────────────────────────────────
type ViewState = 'main' | 'verify' | 'success' | 'pin';
type TabState = 'email' | 'phone';

// ── Icon components ────────────────────────────────────────────────────────

function GoogleIcon() {
  return (
    <Svg width={15} height={15} viewBox="0 0 24 24">
      <Path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <Path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <Path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <Path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </Svg>
  );
}

function FaceIdIcon({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Rect x="2" y="2" width="5" height="5" rx="1.5" stroke={color} strokeWidth="1.8"/>
      <Rect x="17" y="2" width="5" height="5" rx="1.5" stroke={color} strokeWidth="1.8"/>
      <Rect x="2" y="17" width="5" height="5" rx="1.5" stroke={color} strokeWidth="1.8"/>
      <Rect x="17" y="17" width="5" height="5" rx="1.5" stroke={color} strokeWidth="1.8"/>
      <Path d="M9 9h.01" stroke={color} strokeWidth="2" strokeLinecap="round"/>
      <Path d="M15 9h.01" stroke={color} strokeWidth="2" strokeLinecap="round"/>
      <Path d="M9 15c0 1.657 1.343 2 3 2s3-.343 3-2" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
    </Svg>
  );
}

function FingerprintIcon({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path d="M12 1C6.48 1 2 5.48 2 11v2" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
      <Path d="M22 13v-2c0-5.52-4.48-10-10-10" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
      <Path d="M12 7c-2.21 0-4 1.79-4 4v6" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
      <Path d="M16 17V11a4 4 0 0 0-8 0" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
      <Path d="M12 11v6" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
    </Svg>
  );
}

function KeyIcon({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Circle cx="8" cy="15" r="5" stroke={color} strokeWidth="1.8"/>
      <Path d="M13 10l8 8" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
      <Path d="M18 10l2 2" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
    </Svg>
  );
}

function NumpadIcon({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Circle cx="5" cy="6" r="1.5" fill={color}/>
      <Circle cx="12" cy="6" r="1.5" fill={color}/>
      <Circle cx="19" cy="6" r="1.5" fill={color}/>
      <Circle cx="5" cy="12" r="1.5" fill={color}/>
      <Circle cx="12" cy="12" r="1.5" fill={color}/>
      <Circle cx="19" cy="12" r="1.5" fill={color}/>
      <Circle cx="12" cy="18" r="1.5" fill={color}/>
    </Svg>
  );
}

function PhoneOtpIcon({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.19 2.2z" stroke={color} strokeWidth="1.6" fill="none"/>
      <Circle cx="18" cy="5" r="3" fill={color} opacity="0.9"/>
        </Svg>
  );
}

function EnvelopeIcon({ color }: { color: string }) {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
      <Path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" stroke={color} strokeWidth="1.8"/>
      <Path d="M22 6l-10 7L2 6" stroke={color} strokeWidth="1.8"/>
    </Svg>
  );
}

function EyeIcon({ visible, color }: { visible: boolean; color: string }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      {visible ? (
        <>
          <Path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
          <Circle cx="12" cy="12" r="3" stroke={color} strokeWidth="1.8"/>
        </>
      ) : (
        <>
          <Path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
          <Line x1="1" y1="1" x2="23" y2="23" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
        </>
      )}
    </Svg>
  );
}

function LockIcon() {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Rect x="5" y="11" width="14" height="11" rx="2" stroke="#020A14" strokeWidth="2"/>
      <Path d="M8 11V7a4 4 0 0 1 8 0v4" stroke="#020A14" strokeWidth="2"/>
    </Svg>
  );
}

function BackArrowIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path d="M19 12H5M12 5l-7 7 7 7" stroke="#EEF2FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </Svg>
  );
}

function PersonIcon({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="8" r="4" stroke={color} strokeWidth="1.8"/>
      <Path d="M4 20c0-4 3.582-7 8-7s8 3 8 7" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
    </Svg>
  );
}

// ── Ambient orbs (React Native Animated, not Reanimated) ─────────────────────
function AmbientOrbs() {
  const orb1X = useRef(new RNAnimated.Value(0)).current;
  const orb1Y = useRef(new RNAnimated.Value(0)).current;
  const orb2X = useRef(new RNAnimated.Value(0)).current;
  const orb2Y = useRef(new RNAnimated.Value(0)).current;

  useEffect(() => {
    const animateOrb1 = () => {
      RNAnimated.loop(
        RNAnimated.sequence([
          RNAnimated.parallel([
            RNAnimated.timing(orb1X, { toValue: 15, duration: 9000, useNativeDriver: true }),
            RNAnimated.timing(orb1Y, { toValue: -10, duration: 9000, useNativeDriver: true }),
          ]),
          RNAnimated.parallel([
            RNAnimated.timing(orb1X, { toValue: -8, duration: 9000, useNativeDriver: true }),
            RNAnimated.timing(orb1Y, { toValue: 10, duration: 9000, useNativeDriver: true }),
          ]),
          RNAnimated.parallel([
            RNAnimated.timing(orb1X, { toValue: 0, duration: 9000, useNativeDriver: true }),
            RNAnimated.timing(orb1Y, { toValue: 0, duration: 9000, useNativeDriver: true }),
          ]),
        ])
      ).start();
    };
    const animateOrb2 = () => {
      RNAnimated.loop(
        RNAnimated.sequence([
          RNAnimated.parallel([
            RNAnimated.timing(orb2X, { toValue: -15, duration: 12000, useNativeDriver: true }),
            RNAnimated.timing(orb2Y, { toValue: 10, duration: 12000, useNativeDriver: true }),
          ]),
          RNAnimated.parallel([
            RNAnimated.timing(orb2X, { toValue: 8, duration: 12000, useNativeDriver: true }),
            RNAnimated.timing(orb2Y, { toValue: -10, duration: 12000, useNativeDriver: true }),
          ]),
          RNAnimated.parallel([
            RNAnimated.timing(orb2X, { toValue: 0, duration: 12000, useNativeDriver: true }),
            RNAnimated.timing(orb2Y, { toValue: 0, duration: 12000, useNativeDriver: true }),
          ]),
        ])
      ).start();
    };
    animateOrb1();
    animateOrb2();
  }, []);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <RNAnimated.View style={{
        position: 'absolute', top: -120, left: -80,
        width: 350, height: 350, borderRadius: 175,
        backgroundColor: 'rgba(0,229,200,0.07)',
        transform: [{ translateX: orb1X }, { translateY: orb1Y }],
      }}/>
      <RNAnimated.View style={{
        position: 'absolute', bottom: -80, right: -70,
        width: 300, height: 300, borderRadius: 150,
        backgroundColor: 'rgba(201,168,76,0.07)',
        transform: [{ translateX: orb2X }, { translateY: orb2Y }],
      }}/>
    </View>
  );
}

// ── Section label with flanking lines ────────────────────────────────────────
function SectionLabel({ text }: { text: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 10 }}>
      <View style={{ flex: 1, height: 1, backgroundColor: 'rgba(238,242,255,0.10)' }}/>
      <Text style={{ fontSize: 9, letterSpacing: 2.5, color: '#00E5C8', fontWeight: '700' }}>{text}</Text>
      <View style={{ flex: 1, height: 1, backgroundColor: 'rgba(238,242,255,0.10)' }}/>
    </View>
  );
}

// ── Confetti for success screen ───────────────────────────────────────────────
const CONFETTI_COLORS = ['#C9A84C', '#E8C96B', '#00E5C8', '#2ED573', '#FF4757', '#EEF2FF', '#1E90FF', '#FF6B9D'];

function ConfettiPiece({ color, x, delay }: { color: string; x: number; delay: number }) {
  const y = useRef(new RNAnimated.Value(-20)).current;
  const opacity = useRef(new RNAnimated.Value(0)).current;

  useEffect(() => {
    setTimeout(() => {
      RNAnimated.parallel([
        RNAnimated.timing(y, {
          toValue: SCREEN_H * 0.7,
          duration: 1400 + Math.random() * 1800,
          useNativeDriver: true,
        }),
        RNAnimated.sequence([
          RNAnimated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
          RNAnimated.delay(1000 + Math.random() * 800),
          RNAnimated.timing(opacity, { toValue: 0, duration: 400, useNativeDriver: true }),
        ]),
      ]).start();
    }, delay);
  }, []);

  const size = 3 + Math.floor(Math.random() * 8);
  const rotation = Math.random() * 360;

  return (
    <RNAnimated.View style={{
      position: 'absolute',
      left: `${x}%`,
      top: 0,
      width: size,
      height: size * 1.6,
      backgroundColor: color,
      borderRadius: 2,
      opacity,
      transform: [{ translateY: y }, { rotate: `${rotation}deg` }],
    }}/>
  );
}

function Confetti() {
  const pieces = useRef(
    Array.from({ length: 34 }, (_, i) => ({
      id: i,
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      x: 5 + Math.random() * 90,
      delay: Math.random() * 700,
    }))
  ).current;

  return (
    <View style={[StyleSheet.absoluteFill, { pointerEvents: 'none' }]}>
      {pieces.map(p => <ConfettiPiece key={p.id} color={p.color} x={p.x} delay={p.delay}/>)}
    </View>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function LoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const shieldSize = SCREEN_H < 700 ? 70 : 88;

  // View state
  const [view, setView] = useState<ViewState>('main');
  const [activeTab, setActiveTab] = useState<TabState>('email');

  // Form state
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
  const [hasPinSet, setHasPinSet] = useState(false);
  const [authMethod, setAuthMethod] = useState<AuthMethod>('email');
  const [resendCountdown, setResendCountdown] = useState(28);
  const [appleAvailable, setAppleAvailable] = useState(false);
  const [appleLoading, setAppleLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const { referralCode, fromInviteLink, setReferralCode, persistReferral } = useReferralInvite();
  const [showReferral, setShowReferral] = useState(false);

  const otpRefs = useRef<Array<TextInput | null>>(Array(6).fill(null));
  const pinRefs = useRef<Array<TextInput | null>>(Array(6).fill(null));
  const scrollRef = useRef<ScrollView>(null);
  const passwordRef = useRef<TextInput>(null);
  const resendTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Animations
  const errorBannerY = useSharedValue(-60);
  const errorBannerOp = useSharedValue(0);
  const formShakeX = useSharedValue(0);
  const successOp = useSharedValue(0);
  const successY = useSharedValue(20);
  const checkScale = useSharedValue(0.3);

  // Mount effects
  useEffect(() => {
    checkBiometricAvailability().then(setBiometricInfo);
    hasPin().then(setHasPinSet);
    if (Platform.OS === 'ios') {
      AppleAuthentication.isAvailableAsync().then(setAppleAvailable).catch(() => setAppleAvailable(false));
    }
  }, []);

  useEffect(() => {
    if (fromInviteLink && referralCode) setShowReferral(true);
  }, [fromInviteLink, referralCode]);

  // Auto-dismiss error after 4 seconds
  useEffect(() => {
    if (!error) return;
    const t = setTimeout(() => dismissError(), 4000);
    return () => clearTimeout(t);
  }, [error]);

  const showError = (msg: string) => {
    setError(msg);
    errorBannerY.value = withSpring(0, { damping: 15 });
    errorBannerOp.value = withTiming(1, { duration: 200 });
    formShakeX.value = withSequence(
      withTiming(-8, { duration: 60 }),
      withTiming(8, { duration: 60 }),
      withTiming(-5, { duration: 60 }),
      withTiming(5, { duration: 60 }),
      withTiming(0, { duration: 60 })
    );
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  };

  const dismissError = () => {
    errorBannerY.value = withTiming(-60, { duration: 200 });
    errorBannerOp.value = withTiming(0, { duration: 200 });
    setTimeout(() => setError(null), 200);
  };

  const handleAuthBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(onboarding)/welcome' as never);
    }
  }, [router]);

  const startResendCountdown = () => {
    setResendCountdown(28);
    if (resendTimerRef.current) clearInterval(resendTimerRef.current);
    resendTimerRef.current = setInterval(() => {
      setResendCountdown(c => {
        if (c <= 1) {
          if (resendTimerRef.current) clearInterval(resendTimerRef.current);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
  };

  useEffect(() => () => {
    if (resendTimerRef.current) clearInterval(resendTimerRef.current);
  }, []);

  // ── Auth handlers ─────────────────────────────────────────────────────────
  const handlePostAuthSuccess = useCallback(async (userId: string, method: AuthMethod) => {
    await applyPendingReferralIfNeeded(userId);
    setAuthMethod(method);
    successOp.value = withTiming(1, { duration: 500 });
    successY.value = withTiming(0, { duration: 500 });
    checkScale.value = withDelay(100, withSpring(1.0, { damping: 10, stiffness: 200 }));
    setView('success');
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setTimeout(async () => {
      const role = await resolveUserRole(userId);
      router.replace('/(tabs)' as never);
    }, 2500);
  }, []);

  const handleEmailSignIn = async () => {
    if (!email.trim() || !password.trim()) {
      showError('Please enter your email and password');
      return;
    }
    setIsLoading(true);
    const result = await signInWithEmail(email, password);
    setIsLoading(false);
    if (!result.success) {
      showError(result.error ?? 'Sign in failed');
      return;
    }
    await handlePostAuthSuccess(result.userId!, 'email');
  };

  const handleSendOtp = async () => {
    const fullPhone = `${countryCode}${phone.replace(/\s/g, '')}`;
    setIsLoading(true);
    const result = await sendPhoneOtp(fullPhone);
    setIsLoading(false);
    if (!result.success) {
      showError(result.error ?? 'Failed to send code');
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
      showError(result.error ?? 'Invalid code');
      return;
    }
    await handlePostAuthSuccess(result.userId!, 'phone');
  };

  const handleBiometric = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const result = await authenticateWithBiometric();
    if (result.success) {
      const { data: { session } } = await supabase.auth.getSession();
      await handlePostAuthSuccess(session!.user.id, 'biometric');
    } else if (result.error !== 'cancelled') {
      showError(result.error ?? 'Biometric failed');
    }
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
        Alert.alert('Sign in failed', error.message);
        return;
      }

      if (user && credential.fullName) {
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
            },
          });
        }
      }

      if (user) {
        await applyPendingReferralIfNeeded(user.id);
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        router.replace('/' as never);
      }
    } catch (e: unknown) {
      const err = e as { code?: string; message?: string };
      if (err.code === 'ERR_REQUEST_CANCELED') return;
      Alert.alert('Apple sign in failed', err.message ?? 'Please try again.');
    } finally {
      setAppleLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    if (googleLoading || appleLoading) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setGoogleLoading(true);
    try {
      const result = await signInWithGoogleNative();
      if (!result.success) {
        if (result.cancelled) return;
        Alert.alert('Google sign in failed', result.error);
        return;
      }
      if (result.user?.id) await applyPendingReferralIfNeeded(result.user.id);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace('/' as never);
    } finally {
      setGoogleLoading(false);
    }
  };

  const handlePasskey = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const result = await signInWithPasskey();
    if (result.success && result.userId) await handlePostAuthSuccess(result.userId, 'passkey');
    else if (result.error !== 'cancelled') showError(result.error ?? 'Passkey authentication failed');
  };

  const handlePinConfirm = async () => {
    const code = pin.join('');
    if (code.length < 6) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsLoading(true);
    const result = await verifyPin(code);
    setIsLoading(false);
    if (!result.success) {
      showError(result.error ?? 'Incorrect PIN');
      setPin(['', '', '', '', '', '']);
      pinRefs.current[0]?.focus();
      return;
    }
    await handlePostAuthSuccess(result.userId!, 'pin');
  };

  // ── OTP/PIN box handlers ──────────────────────────────────────────────────
  const handleOtpChange = (val: string, idx: number) => {
    if (val.length > 1) {
      // Paste support
      const digits = val.replace(/\D/g, '').slice(0, 6);
      const newOtp = [...otp];
      digits.split('').forEach((d, i) => { if (i < 6) newOtp[i] = d; });
      setOtp(newOtp);
      otpRefs.current[Math.min(digits.length - 1, 5)]?.focus();
      if (digits.length === 6) setTimeout(() => handleVerifyOtp(), 250);
      return;
    }
    Haptics.selectionAsync();
    const newOtp = [...otp];
    newOtp[idx] = val;
    setOtp(newOtp);
    if (val && idx < 5) otpRefs.current[idx + 1]?.focus();
    if (newOtp.every(d => d !== '') && newOtp.join('').length === 6) {
      setTimeout(() => handleVerifyOtp(), 250);
    }
  };

  const handleOtpKeyPress = (key: string, idx: number) => {
    if (key === 'Backspace' && !otp[idx] && idx > 0) {
      const newOtp = [...otp];
      newOtp[idx - 1] = '';
      setOtp(newOtp);
      otpRefs.current[idx - 1]?.focus();
    }
  };

  const handlePinChange = (val: string, idx: number) => {
    Haptics.selectionAsync();
    const newPin = [...pin];
    newPin[idx] = val.replace(/\D/g, '').slice(-1);
    setPin(newPin);
    if (val && idx < 5) pinRefs.current[idx + 1]?.focus();
    if (newPin.every(d => d !== '')) setTimeout(() => handlePinConfirm(), 250);
  };

  const handlePinKeyPress = (key: string, idx: number) => {
    if (key === 'Backspace' && !pin[idx] && idx > 0) {
      const newPin = [...pin];
      newPin[idx - 1] = '';
      setPin(newPin);
      pinRefs.current[idx - 1]?.focus();
    }
  };

  // ── Animated styles ───────────────────────────────────────────────────────
  const errorBannerStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: errorBannerY.value }],
    opacity: errorBannerOp.value,
  }));

  const formShakeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: formShakeX.value }],
  }));

  const successStyle = useAnimatedStyle(() => ({
    opacity: successOp.value,
    transform: [{ translateY: successY.value }],
  }));

  const checkScaleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: checkScale.value }],
  }));

  // ── Success subtitle ───────────────────────────────────────────────────────
  const successSubtitle =
    {
      email: 'Signed in securely. Your health intelligence is watching.',
      google: 'Welcome via Google. TruWell AI is ready.',
      apple: 'Welcome via Apple. TruWell AI is ready.',
      biometric: 'Biometric verified. Instant access granted.',
      phone: 'Phone verified. Your guardian is active.',
      pin: 'PIN confirmed. Welcome back, Guardian.',
      passkey: 'Passkey verified. Instant access granted.',
    }[authMethod as 'email' | 'google' | 'apple' | 'biometric' | 'phone' | 'pin' | 'passkey']
    ?? 'Signed in securely. Your health intelligence is watching.';

  // ── Biometric tile icon/label ─────────────────────────────────────────────
  const biometricLabel = biometricInfo.type === 'faceId' ? 'Face ID'
    : biometricInfo.type === 'fingerprint' ? 'Touch ID'
    : 'Biometrics';

  const BiometricTileIcon = biometricInfo.type === 'fingerprint'
    ? () => <FingerprintIcon color="#00E5C8"/>
    : () => <FaceIdIcon color="#00E5C8"/>;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <View style={{ flex: 1, backgroundColor: '#020A14' }}>
      {/* Background layers */}
      <AmbientOrbs/>
      <FloatingParticles/>

      {/* Error banner */}
      <Animated.View style={[errorBannerStyle, {
        position: 'absolute', top: insets.top + 8, left: 16, right: 16, zIndex: 100,
        backgroundColor: 'rgba(255,71,87,0.10)', borderWidth: 1, borderColor: 'rgba(255,71,87,0.30)',
        borderRadius: 12, padding: 10,
      }]}>
        <Pressable onPress={dismissError}>
          <Text style={{ fontSize: 12, color: '#FF4757', textAlign: 'center' }}>{error}</Text>
        </Pressable>
      </Animated.View>

      {/* ── SUCCESS VIEW ──────────────────────────────────────────────────── */}
      {view === 'success' && (
        <Animated.View style={[StyleSheet.absoluteFill, successStyle, {
          backgroundColor: '#020A14', alignItems: 'center', justifyContent: 'center',
          paddingHorizontal: 24, zIndex: 50,
        }]}>
          <Confetti/>
          <Animated.View style={[checkScaleStyle, { alignItems: 'center', gap: 16 }]}>
            <TruWellShield size={76} showCheckmark animated />
            <Text style={{ fontSize: 20, fontWeight: '800', color: '#EEF2FF', letterSpacing: -0.4, textAlign: 'center' }}>
              Guardian activated
            </Text>
            <Text style={{ fontSize: 13, color: 'rgba(238,242,255,0.55)', textAlign: 'center', lineHeight: 20 }}>
              {successSubtitle}
            </Text>
          </Animated.View>

          {/* Stats card */}
          <View style={{
            marginTop: 28, width: '100%',
            backgroundColor: 'rgba(0,229,200,0.06)', borderWidth: 1, borderColor: 'rgba(0,229,200,0.16)',
            borderRadius: 14, flexDirection: 'row',
          }}>
            {[
              { value: '47', color: '#C9A84C', label: 'databases' },
              { value: '10', color: '#2ED573', label: 'free scans' },
              { value: 'L1', color: '#EEF2FF', label: 'level' },
            ].map((item, i) => (
              <View key={item.label} style={{
                flex: 1, alignItems: 'center', paddingVertical: 14,
                borderRightWidth: i < 2 ? 1 : 0, borderRightColor: 'rgba(0,229,200,0.10)',
              }}>
                <Text style={{ fontSize: 18, fontWeight: '800', color: item.color }}>{item.value}</Text>
                <Text style={{ fontSize: 8, color: 'rgba(238,242,255,0.38)', marginTop: 2 }}>{item.label}</Text>
              </View>
            ))}
      </View>

          {/* Plan chip */}
          <View style={{
            marginTop: 12, width: '100%', flexDirection: 'row', alignItems: 'center',
            backgroundColor: 'rgba(201,168,76,0.07)', borderWidth: 1, borderColor: 'rgba(201,168,76,0.18)',
            borderRadius: 12, padding: 12, gap: 10,
          }}>
            <PersonIcon color="#C9A84C"/>
            <View>
              <Text style={{ fontSize: 10, fontWeight: '700', color: '#C9A84C' }}>Guardian Profile</Text>
              <Text style={{ fontSize: 9, color: 'rgba(238,242,255,0.38)' }}>Free plan - Upgrade for unlimited scans</Text>
            </View>
          </View>

          <View style={{ marginTop: 24, width: '100%' }}>
            <GoldShimmerButton
              label="Enter Dashboard"
              onPress={async () => {
                const { data: { session } } = await supabase.auth.getSession();
                if (session) {
                  const role = await resolveUserRole(session.user.id);
                  router.replace('/(tabs)' as never);
                }
              }}
            />
          </View>
      </Animated.View>
      )}

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top : 0}
      >
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={{ paddingBottom: insets.bottom + 140 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* ── MAIN VIEW ──────────────────────────────────────────────────── */}
          {(view === 'main') && (
            <Animated.View style={formShakeStyle}>
              {/* Hero section */}
              <View style={{ paddingTop: insets.top + 12, paddingHorizontal: 24 }}>
                <Pressable onPress={handleAuthBack} style={{ marginBottom: 12 }}>
                  <Text style={{ fontSize: 16, color: 'rgba(238,242,255,0.42)' }}>{'\u2039'} Back</Text>
                </Pressable>
              </View>
              <View style={{ alignItems: 'center', paddingTop: 4, paddingHorizontal: 24 }}>
                <TruWellShieldAnimated size={shieldSize}/>

                <Text style={{ fontSize: 22, fontWeight: '900', letterSpacing: 1.5, color: '#EEF2FF', marginTop: 8 }}>
                  TRUL<Text style={{ color: '#C9A84C' }}>W</Text>ELL AI
                </Text>
                <Text style={{ fontSize: 11, color: 'rgba(238,242,255,0.42)', fontStyle: 'italic', marginTop: 2, marginBottom: 10 }}>
                  Scan. Understand. Choose Better.
                </Text>
                <Text style={{ fontSize: 16, fontWeight: '700', color: '#EEF2FF', marginBottom: 3 }}>
                  Welcome back, Guardian
                </Text>
                <Text style={{ fontSize: 11, color: 'rgba(238,242,255,0.42)', marginBottom: 20 }}>
                  Your health intelligence is waiting
                </Text>
              </View>

              <View style={{ paddingHorizontal: 20, gap: 16 }}>
                {/* Instant access section */}
                <SectionLabel text="INSTANT ACCESS"/>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  {/* Biometric tile */}
                  <TouchableOpacity
                    onPress={handleBiometric}
                    style={{
                      flex: 1, height: 70, borderRadius: 16, alignItems: 'center', justifyContent: 'center', gap: 4,
                      backgroundColor: 'rgba(0,229,200,0.08)',
                      borderWidth: 1.5, borderColor: 'rgba(0,229,200,0.28)',
                    }}
                  >
                    <BiometricTileIcon/>
                    <Text style={{ fontSize: 10, fontWeight: '700', color: '#00E5C8' }}>{biometricLabel}</Text>
                  </TouchableOpacity>

                  {/* Passkey tile */}
                  <TouchableOpacity
                    onPress={handlePasskey}
                    style={{
                      flex: 1, height: 70, borderRadius: 16, alignItems: 'center', justifyContent: 'center', gap: 4,
                      backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.09)',
                    }}
                  >
                    <KeyIcon color="rgba(238,242,255,0.5)"/>
                    <Text style={{ fontSize: 10, fontWeight: '600', color: 'rgba(238,242,255,0.55)' }}>Passkey</Text>
                  </TouchableOpacity>

                  {/* PIN tile */}
                  <TouchableOpacity
                    onPress={() => { setPin(['', '', '', '', '', '']); setView('pin'); }}
                    style={{
                      flex: 1, height: 70, borderRadius: 16, alignItems: 'center', justifyContent: 'center', gap: 4,
                      backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.09)',
                    }}
                  >
                    <NumpadIcon color="rgba(238,242,255,0.5)"/>
                    <Text style={{ fontSize: 10, fontWeight: '600', color: 'rgba(238,242,255,0.55)' }}>PIN</Text>
                  </TouchableOpacity>

                  {/* OTP tile */}
                  <TouchableOpacity
                    onPress={() => { setActiveTab('phone'); scrollRef.current?.scrollToEnd({ animated: true }); }}
                    style={{
                      flex: 1, height: 70, borderRadius: 16, alignItems: 'center', justifyContent: 'center', gap: 4,
                      backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.09)',
                    }}
                  >
                    <PhoneOtpIcon color="rgba(238,242,255,0.5)"/>
                    <Text style={{ fontSize: 10, fontWeight: '600', color: 'rgba(238,242,255,0.55)' }}>OTP</Text>
                  </TouchableOpacity>
                </View>

                {/* Social sign-in section */}
                <SectionLabel text="SOCIAL SIGN-IN"/>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  {appleAvailable && Platform.OS === 'ios' ? (
                    <View
                      style={{
                        flex: 1,
                        minWidth: '45%',
                        height: 50,
                        opacity: appleLoading || googleLoading ? 0.55 : 1,
                      }}
                      pointerEvents={appleLoading || googleLoading ? 'none' : 'auto'}
                    >
                      <AppleAuthentication.AppleAuthenticationButton
                        buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
                        buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
                        cornerRadius={14}
                        style={{ flex: 1, height: 50 }}
                        onPress={() => void handleAppleSignIn()}
                      />
                    </View>
                  ) : null}
                  <TouchableOpacity
                    onPress={() => void handleGoogleSignIn()}
                    disabled={googleLoading || appleLoading}
                    style={{
                      flex: 1, height: 50, borderRadius: 14, flexDirection: 'row', alignItems: 'center',
                      justifyContent: 'center', gap: 8, minWidth: '45%',
                      opacity: googleLoading || appleLoading ? 0.55 : 1,
                      backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'rgba(234,67,53,0.22)',
                    }}
                  >
                    <GoogleIcon/>
                    <Text style={{ fontSize: 13, fontWeight: '700', color: '#EEF2FF' }}>Google</Text>
                  </TouchableOpacity>
                </View>

                {/* Divider */}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <View style={{ flex: 1, height: 1, backgroundColor: 'rgba(238,242,255,0.10)' }}/>
                  <Text style={{ fontSize: 9, color: 'rgba(238,242,255,0.32)', fontWeight: '600', letterSpacing: 1.5 }}>
                    OR SIGN IN WITH
                  </Text>
                  <View style={{ flex: 1, height: 1, backgroundColor: 'rgba(238,242,255,0.10)' }}/>
                </View>

                {/* Auth method tabs */}
                <View style={{
                  flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.04)',
                  borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
                  borderRadius: 999, padding: 3,
                }}>
                  {(['email', 'phone'] as TabState[]).map(tab => (
                    <TouchableOpacity
                      key={tab}
                      onPress={() => setActiveTab(tab)}
                      style={{
                        flex: 1, paddingVertical: 7, borderRadius: 999, alignItems: 'center',
                        backgroundColor: activeTab === tab ? 'rgba(201,168,76,0.15)' : 'transparent',
                        borderWidth: activeTab === tab ? 1 : 0,
                        borderColor: 'rgba(201,168,76,0.30)',
                      }}
                    >
                      <Text style={{
                        fontSize: 12, fontWeight: '700',
                        color: activeTab === tab ? '#C9A84C' : 'rgba(238,242,255,0.40)',
                      }}>
                        {tab.charAt(0).toUpperCase() + tab.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Email form */}
                {activeTab === 'email' && (
                  <View style={{ gap: 12 }}>
                    <View style={{ gap: 6 }}>
                      <Text style={s.inputLabel}>EMAIL ADDRESS</Text>
                      <View>
            <TextInput
                          style={s.input}
              value={email}
              onChangeText={setEmail}
                          placeholder="guardian@email.com"
                          placeholderTextColor="rgba(238,242,255,0.22)"
                          keyboardType="email-address"
                          autoCapitalize="none"
                          autoCorrect={false}
                          returnKeyType="next"
                          onSubmitEditing={() => passwordRef.current?.focus()}
                        />
                        <View style={s.inputRight}><EnvelopeIcon color="rgba(238,242,255,0.38)"/></View>
                      </View>
          </View>

                    <View style={{ gap: 6 }}>
                      <Text style={s.inputLabel}>PASSWORD</Text>
            <View>
              <TextInput
                          ref={passwordRef}
                          style={[s.input, { paddingRight: 44 }]}
                value={password}
                onChangeText={setPassword}
                          placeholder="Your password"
                          placeholderTextColor="rgba(238,242,255,0.22)"
                          secureTextEntry={!showPassword}
                          textContentType="password"
                          returnKeyType="done"
                          onSubmitEditing={() => void handleEmailSignIn()}
                        />
                        <TouchableOpacity style={s.inputRight} onPress={() => setShowPassword(v => !v)}>
                          <EyeIcon visible={showPassword} color="rgba(238,242,255,0.38)"/>
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
                      style={{ alignSelf: 'flex-end' }}
                      onPress={() => {
                        if (!email.trim()) { showError('Enter your email first'); return; }
                        supabase.auth.resetPasswordForEmail(email.trim())
                          .then(({ error: e }) => {
                            if (e) showError(e.message);
                            else setError('Password reset email sent - check your inbox');
                          });
                      }}
                    >
                      <Text style={{ fontSize: 11, color: '#00E5C8', fontWeight: '700' }}>Forgot password?</Text>
          </TouchableOpacity>

                    <GoldShimmerButton
                      label="Sign In Securely"
                      onPress={() => void handleEmailSignIn()}
                      loading={isLoading}
                      icon={<LockIcon/>}
                    />
                  </View>
                )}

                {/* Phone form */}
                {activeTab === 'phone' && (
                  <View style={{ gap: 12 }}>
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                      <TextInput
                        style={[s.input, { width: 72 }]}
                        value={countryCode}
                        onChangeText={setCountryCode}
                        keyboardType="phone-pad"
                        placeholder="+234"
                        placeholderTextColor="rgba(238,242,255,0.22)"
                      />
                      <TextInput
                        style={[s.input, { flex: 1 }]}
                        value={phone}
                        onChangeText={setPhone}
                        keyboardType="phone-pad"
                        placeholder="080 0000 0000"
                        placeholderTextColor="rgba(238,242,255,0.22)"
                      />
                    </View>

                    <View style={{ flexDirection: 'row', gap: 8 }}>
                      {(['sms', 'whatsapp'] as const).map(ch => (
          <TouchableOpacity
                          key={ch}
                          onPress={() => setOtpChannel(ch)}
                          style={{
                            paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, borderWidth: 1,
                            backgroundColor: ch === 'sms'
                              ? (otpChannel === ch ? 'rgba(0,229,200,0.08)' : 'transparent')
                              : (otpChannel === ch ? 'rgba(37,211,102,0.08)' : 'transparent'),
                            borderColor: ch === 'sms'
                              ? (otpChannel === ch ? 'rgba(0,229,200,0.2)' : 'rgba(255,255,255,0.08)')
                              : (otpChannel === ch ? 'rgba(37,211,102,0.2)' : 'rgba(255,255,255,0.08)'),
                          }}
                        >
                          <Text style={{
                            fontSize: 11, fontWeight: '600',
                            color: ch === 'sms'
                              ? (otpChannel === ch ? '#00E5C8' : 'rgba(238,242,255,0.4)')
                              : (otpChannel === ch ? '#25D366' : 'rgba(238,242,255,0.4)'),
                          }}>
                            {ch === 'sms' ? 'SMS' : 'WhatsApp'}
            </Text>
          </TouchableOpacity>
                      ))}
                    </View>
                    <Text style={{ fontSize: 10, color: 'rgba(238,242,255,0.30)', marginTop: -4 }}>
                      We'll send a 6-digit code via {otpChannel === 'sms' ? 'SMS' : 'WhatsApp'}
                    </Text>

                    <GoldShimmerButton
                      label="Send Verification Code"
                      onPress={() => void handleSendOtp()}
                      loading={isLoading}
                      icon={<LockIcon/>}
                    />
          </View>
                )}

                {/* Referral code (from invite link or manual entry) */}
                <View style={{ marginTop: 10, gap: 8 }}>
                  {fromInviteLink && referralCode ? (
                    <View
                      style={{
                        paddingHorizontal: 12,
                        paddingVertical: 10,
                        borderRadius: 12,
                        backgroundColor: 'rgba(0,229,200,0.08)',
                        borderWidth: 1,
                        borderColor: 'rgba(0,229,200,0.2)',
                      }}
                    >
                      <Text style={{ fontSize: 11, fontWeight: '700', color: '#00E5C8' }}>
                        Invite link applied
                      </Text>
                      <Text style={{ fontSize: 10, color: 'rgba(238,242,255,0.45)', marginTop: 3 }}>
                        Join for health intelligence, safety alerts, and health-minded community
                      </Text>
                    </View>
                  ) : null}

                  <Pressable onPress={() => setShowReferral((v) => !v)}>
                    <Text
                      style={{
                        fontSize: 11,
                        fontWeight: '600',
                        color: showReferral || referralCode ? '#00E5C8' : 'rgba(238,242,255,0.38)',
                        textAlign: 'center',
                      }}
                    >
                      {showReferral || referralCode ? 'Referral code' : '+ Have a referral code?'}
                    </Text>
                  </Pressable>

                  {showReferral || referralCode ? (
                    <TextInput
                      style={[s.input, { letterSpacing: 2, textAlign: 'center', fontWeight: '700' }]}
                      value={referralCode}
                      onChangeText={setReferralCode}
                      onBlur={() => void persistReferral()}
                      placeholder="ENTER CODE"
                      placeholderTextColor="rgba(238,242,255,0.22)"
                      autoCapitalize="characters"
                      maxLength={12}
                    />
                  ) : null}
                </View>

                {/* Signup row */}
                <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 4 }}>
                  <Text style={{ fontSize: 12, color: 'rgba(238,242,255,0.38)' }}>New to TruWell AI? </Text>
                  <TouchableOpacity
                    onPress={() => {
                      void persistReferral();
                      router.push(
                        referralCode
                          ? ({ pathname: '/(auth)/welcome', params: { ref: referralCode } } as never)
                          : ('/(auth)/welcome' as never)
                      );
                    }}
                  >
                    <Text style={{ fontSize: 12, fontWeight: '700', color: '#00E5C8' }}>Create account</Text>
            </TouchableOpacity>
                </View>

                {/* Trust strip */}
                <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 16, marginTop: 8 }}>
                  {['256-bit TLS', 'GDPR safe', 'No data sold'].map(t => (
                    <Text key={t} style={{ fontSize: 9, color: 'rgba(238,242,255,0.25)', fontWeight: '600' }}>{t}</Text>
                  ))}
                </View>
              </View>
            </Animated.View>
          )}

          {/* ── OTP VERIFY VIEW ──────────────────────────────────────────── */}
          {view === 'verify' && (
            <View style={{ paddingHorizontal: 22, paddingTop: insets.top + 20 }}>
              <TouchableOpacity onPress={() => setView('main')} style={{ marginBottom: 24 }}>
                <BackArrowIcon/>
            </TouchableOpacity>

              <View style={{ alignItems: 'center', gap: 12 }}>
                <View style={{
                  width: 60, height: 60, borderRadius: 30, backgroundColor: 'rgba(0,229,200,0.12)',
                  alignItems: 'center', justifyContent: 'center',
                }}>
                  <PhoneOtpIcon color="#00E5C8"/>
                </View>
                <Text style={{ fontSize: 17, fontWeight: '800', color: '#EEF2FF' }}>Check your inbox</Text>
                <Text style={{ fontSize: 11, color: 'rgba(238,242,255,0.42)' }}>We sent a 6-digit code to</Text>
                <Text style={{ fontSize: 14, fontWeight: '700', color: '#00E5C8' }}>
                  {countryCode}{phone}
                </Text>

                {/* OTP boxes */}
                <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
                  {otp.map((digit, i) => (
                    <TextInput
                      key={i}
                      ref={r => { otpRefs.current[i] = r; }}
                      style={{
                        width: 42, height: 52, borderRadius: 13, textAlign: 'center',
                        fontSize: 22, fontWeight: '800',
                        color: digit ? '#C9A84C' : '#EEF2FF',
                        backgroundColor: digit ? 'rgba(201,168,76,0.06)' : 'rgba(255,255,255,0.055)',
                        borderWidth: 1.5,
                        borderColor: digit ? 'rgba(201,168,76,0.50)' : 'rgba(255,255,255,0.10)',
                      }}
                      value={digit}
                      onChangeText={v => handleOtpChange(v, i)}
                      onKeyPress={({ nativeEvent: { key } }) => handleOtpKeyPress(key, i)}
                      keyboardType="number-pad"
                      maxLength={6}
                      selectTextOnFocus
                    />
                  ))}
                </View>

                <View style={{ width: '100%', marginTop: 8 }}>
                  <GoldShimmerButton
                    label="Verify Code"
                    onPress={() => void handleVerifyOtp()}
                    loading={isLoading}
                    color="teal"
                  />
                </View>

                <View style={{ flexDirection: 'row', gap: 4, alignItems: 'center', marginTop: 4 }}>
                  <Text style={{ fontSize: 11, color: 'rgba(238,242,255,0.35)' }}>Didn't receive it?</Text>
                  {resendCountdown > 0 ? (
                    <Text style={{ fontSize: 11, color: 'rgba(238,242,255,0.35)' }}>
                      Resend in 0:{String(resendCountdown).padStart(2, '0')}
                    </Text>
                  ) : (
                    <TouchableOpacity onPress={() => { void handleSendOtp(); }}>
                      <Text style={{ fontSize: 11, color: '#00E5C8', fontWeight: '700' }}>Resend</Text>
            </TouchableOpacity>
                  )}
          </View>
              </View>
            </View>
          )}

          {/* ── PIN VIEW ────────────────────────────────────────────────── */}
          {view === 'pin' && (
            <View style={{ paddingHorizontal: 22, paddingTop: insets.top + 20, alignItems: 'center' }}>
              <TouchableOpacity onPress={() => setView('main')} style={{ alignSelf: 'flex-start', marginBottom: 24 }}>
                <BackArrowIcon/>
              </TouchableOpacity>

              <View style={{
                width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(201,168,76,0.12)',
                alignItems: 'center', justifyContent: 'center', marginBottom: 16,
              }}>
                <NumpadIcon color="#C9A84C"/>
              </View>

              <Text style={{ fontSize: 16, fontWeight: '800', color: '#EEF2FF', marginBottom: 4 }}>Enter your PIN</Text>
              <Text style={{ fontSize: 12, color: 'rgba(238,242,255,0.42)', marginBottom: 4 }}>Your 6-digit security PIN</Text>
              <Text style={{ fontSize: 10, color: 'rgba(238,242,255,0.28)', marginBottom: 24 }}>You set this PIN when you first signed in</Text>

              {/* PIN boxes */}
              <View style={{
                flexDirection: 'row', gap: 8,
                borderWidth: 1.5, borderColor: 'rgba(201,168,76,0.25)', borderRadius: 18, padding: 12,
              }}>
                {pin.map((digit, i) => (
                  <TextInput
                    key={i}
                    ref={r => { pinRefs.current[i] = r; }}
                    style={{
                      width: 42, height: 52, borderRadius: 13, textAlign: 'center',
                      fontSize: 22, fontWeight: '800',
                      color: digit ? '#C9A84C' : '#EEF2FF',
                      backgroundColor: digit ? 'rgba(201,168,76,0.06)' : 'rgba(255,255,255,0.055)',
                      borderWidth: 1.5,
                      borderColor: digit ? 'rgba(201,168,76,0.50)' : 'rgba(255,255,255,0.10)',
                    }}
                    value={digit ? '•' : ''}
                    onChangeText={v => handlePinChange(v, i)}
                    onKeyPress={({ nativeEvent: { key } }) => handlePinKeyPress(key, i)}
                    keyboardType="number-pad"
                    maxLength={1}
                    secureTextEntry
                    selectTextOnFocus
                  />
                ))}
              </View>

              {biometricInfo.available && (
                <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center', marginTop: 16 }}>
                  <Text style={{ fontSize: 11, color: 'rgba(238,242,255,0.35)' }}>Use biometrics instead?</Text>
                  <TouchableOpacity onPress={handleBiometric}>
                    <Text style={{ fontSize: 11, color: '#00E5C8', fontWeight: '700' }}>
                      Use {biometricLabel}
            </Text>
                  </TouchableOpacity>
          </View>
              )}

              <View style={{ width: '100%', marginTop: 20 }}>
                <GoldShimmerButton
                  label="Confirm PIN"
                  onPress={() => void handlePinConfirm()}
                  loading={isLoading}
                />
              </View>

              <TouchableOpacity onPress={() => setView('main')} style={{ marginTop: 16 }}>
                <Text style={{ fontSize: 12, color: 'rgba(238,242,255,0.42)', fontWeight: '600' }}>Back</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const s = StyleSheet.create({
  inputLabel: {
    fontSize: 10, fontWeight: '700', letterSpacing: 1, color: 'rgba(238,242,255,0.48)',
  },
  input: {
    height: 50, borderRadius: 14, paddingHorizontal: 14,
    fontSize: 14, fontWeight: '500', color: '#EEF2FF',
    backgroundColor: 'rgba(255,255,255,0.055)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)',
  },
  inputRight: {
    position: 'absolute', right: 14, top: 0, bottom: 0,
    justifyContent: 'center', alignItems: 'center',
  },
});
