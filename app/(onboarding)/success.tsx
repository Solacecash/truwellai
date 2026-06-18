import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Pressable,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ShieldLogo } from '@/components/onboarding/ShieldLogo';
import { ensureFamilyGroup } from '@/lib/familyPlan';
import { trackOnboardingEvent } from '@/lib/onboardingAnalytics';
import { supabase } from '@/lib/supabase';
import { useOnboardingStore } from '@/stores/onboardingStore';

import { OB_COLORS, OB_FONTS } from '@/lib/_obShared';
import { ONBOARDING_ROUTES } from '@/lib/onboardingRoutePaths';

const PARTICLE_COUNT = 28;
const CONFETTI_COLORS = [
  OB_COLORS.gold,
  OB_COLORS.goldLight,
  OB_COLORS.teal,
  OB_COLORS.sky,
  OB_COLORS.green,
  OB_COLORS.white,
] as const;

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

type ParticleSpec = {
  id: number;
  color: string;
  left: number;
  size: number;
  delay: number;
  duration: number;
  drift: number;
};

function ConfettiParticle({ spec }: { spec: ParticleSpec }) {
  const translateY = useSharedValue(-20);
  const translateX = useSharedValue(0);
  const opacity = useSharedValue(1);
  const rotate = useSharedValue(0);

  useEffect(() => {
    translateY.value = withDelay(
      spec.delay,
      withTiming(SCREEN_HEIGHT + 40, { duration: spec.duration })
    );
    translateX.value = withDelay(spec.delay, withTiming(spec.drift, { duration: spec.duration }));
    rotate.value = withDelay(spec.delay, withTiming(360, { duration: spec.duration }));
    opacity.value = withDelay(spec.delay + spec.duration * 0.65, withTiming(0, { duration: 500 }));
  }, [opacity, rotate, spec.delay, spec.duration, spec.drift, translateX, translateY]);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateY: translateY.value },
      { translateX: translateX.value },
      { rotate: `${rotate.value}deg` },
    ],
  }));

  return (
    <Animated.View
      style={[
        styles.particle,
        {
          left: spec.left,
          width: spec.size,
          height: spec.size * 1.5,
          backgroundColor: spec.color,
        },
        style,
      ]}
    />
  );
}

function Confetti() {
  const particles = useMemo<ParticleSpec[]>(
    () =>
      Array.from({ length: PARTICLE_COUNT }, (_, id) => ({
        id,
        color: CONFETTI_COLORS[id % CONFETTI_COLORS.length],
        left: Math.random() * (SCREEN_WIDTH - 12),
        size: 4 + Math.floor(Math.random() * 6),
        delay: Math.random() * 500,
        duration: 2200 + Math.floor(Math.random() * 900),
        drift: -30 + Math.random() * 60,
      })),
    []
  );

  return (
    <View style={styles.confettiLayer} pointerEvents="none">
      {particles.map((spec) => (
        <ConfettiParticle key={spec.id} spec={spec} />
      ))}
    </View>
  );
}

export default function OnboardingSuccessScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const setConversionFlowComplete = useOnboardingStore((s) => s.setConversionFlowComplete);
  const setOnboardingComplete = useOnboardingStore((s) => s.setOnboardingComplete);
  const selectedRole = useOnboardingStore((s) => s.selectedRole);
  const healthScore = useOnboardingStore((s) => s.healthScore);
  const [familyInviteCode, setFamilyInviteCode] = useState<string | null>(null);
  const [isFamilyPlan, setIsFamilyPlan] = useState(false);

  useEffect(() => {
    setConversionFlowComplete(true);
    setOnboardingComplete(true);
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    async function persistCompletion() {
      try {
        const { data } = await supabase.auth.getSession();
        const uid = data.session?.user?.id;
        if (uid) {
          await supabase.from('profiles').update({ onboarding_complete: true }).eq('id', uid);
        }
      } catch {
        /* non-fatal */
      }
      void trackOnboardingEvent('onboarding_completed');
    }

    void persistCompletion();
  }, [setConversionFlowComplete, setOnboardingComplete]);

  useEffect(() => {
    const check = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.id) return;
      const { data: profile } = await supabase
        .from('profiles')
        .select('subscription_tier, family_role')
        .eq('id', user.id)
        .single();
      if (profile?.subscription_tier === 'family' && profile?.family_role === 'owner') {
        setIsFamilyPlan(true);
        const result = await ensureFamilyGroup(user.id);
        if (result?.inviteCode) setFamilyInviteCode(result.inviteCode);
      }
    };
    void check();
  }, []);

  const roleLabel = selectedRole === 'guardian' ? 'Guardian' : 'Member';

  const statPills = [
    { value: String(healthScore), label: 'Health score' },
    { value: roleLabel, label: 'Role set' },
    { value: isFamilyPlan ? 'Family' : 'Ready', label: 'Plan' },
  ];

  const ctaLabel = isFamilyPlan ? 'Go to Family Hub →' : 'Enter TruWell AI';
  const onCtaPress = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    useOnboardingStore.getState().setConversionFlowComplete(true);
    void useOnboardingStore.getState().persistConversionSnapshot();
    if (isFamilyPlan) {
      router.replace('/family' as never);
      return;
    }
    router.replace('/enter' as never);
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top, paddingBottom: insets.bottom + 16 }]}>
      <Confetti />
      <Animated.View entering={FadeInDown.delay(120).springify()} style={styles.content}>
        <ShieldLogo size={96} animated />
        <Text style={styles.h1}>You're all set.</Text>
        <Text style={styles.body}>
          Your TruWell care plan is ready. Your AI health companion is waiting.
        </Text>

        <View style={styles.statsRow}>
          {statPills.map((pill) => (
            <View key={pill.label} style={styles.statPill}>
              <Text style={styles.statValue}>{pill.value}</Text>
              <Text style={styles.statLabel}>{pill.label}</Text>
            </View>
          ))}
        </View>

        {isFamilyPlan ? (
          <View style={successStyles.familyBlock}>
            <View style={successStyles.familyHeader}>
              <Text style={successStyles.familyHeaderTitle}>Your Family Plan is active</Text>
              <Text style={successStyles.familyHeaderSub}>
                Share this code with up to 5 family members. They enter it in TruWell AI to get
                full Premium access on your plan — no extra payment needed.
              </Text>
            </View>

            {familyInviteCode ? (
              <View style={successStyles.codeWrap}>
                <Text style={successStyles.codeLabel}>YOUR FAMILY INVITE CODE</Text>
                <Text style={successStyles.codeText}>{familyInviteCode}</Text>
                <View style={successStyles.codeBtnRow}>
                  <Pressable
                    style={successStyles.codeBtnCopy}
                    onPress={() => {
                      void Clipboard.setStringAsync(familyInviteCode);
                      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                    }}
                  >
                    <Text style={successStyles.codeBtnCopyText}>Copy code</Text>
                  </Pressable>
                  <Pressable
                    style={successStyles.codeBtnShare}
                    onPress={() => {
                      void Share.share({
                        message:
                          `You've been invited to join my TruWell AI Family Plan!\n\n` +
                          `Use code: ${familyInviteCode}\n\n` +
                          `Download TruWell AI and enter this code in ` +
                          `Profile → Family Plan → Join a Family Plan ` +
                          `to get full Premium access included in my plan.\n\n` +
                          `Download: https://truwellai.xyz`,
                      });
                      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    }}
                  >
                    <Text style={successStyles.codeBtnShareText}>Share invite</Text>
                  </Pressable>
                </View>
              </View>
            ) : (
              <View style={successStyles.codeWrap}>
                <ActivityIndicator color={OB_COLORS.teal} />
                <Text style={[successStyles.codeLabel, { marginTop: 8 }]}>
                  Generating your invite code...
                </Text>
              </View>
            )}

            <View style={successStyles.privacyNote}>
              <Text style={successStyles.privacyNoteText}>
                🔒 Each member&apos;s health data stays completely private. You only see their scan
                count — never their health details.
              </Text>
            </View>
          </View>
        ) : null}

        <Pressable onPress={onCtaPress} accessibilityRole="button" style={styles.ctaWrap}>
          <LinearGradient
            colors={[OB_COLORS.teal, OB_COLORS.sky]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.cta}
          >
            <Text style={styles.ctaText}>{ctaLabel}</Text>
          </LinearGradient>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: OB_COLORS.navy,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  confettiLayer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  particle: {
    position: 'absolute',
    top: 0,
    borderRadius: 2,
  },
  content: { alignItems: 'center', gap: 16, maxWidth: 320, width: '100%' },
  h1: {
    marginTop: 12,
    fontFamily: OB_FONTS.bold,
    fontWeight: '700',
    fontSize: 28,
    lineHeight: 34,
    color: OB_COLORS.white,
    textAlign: 'center',
  },
  body: {
    fontFamily: OB_FONTS.body,
    fontSize: 15,
    lineHeight: 22,
    color: OB_COLORS.white70,
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
    width: '100%',
    marginTop: 4,
  },
  statPill: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: OB_COLORS.white07,
    borderWidth: 1,
    borderColor: OB_COLORS.white12,
    alignItems: 'center',
  },
  statValue: {
    fontFamily: OB_FONTS.bold,
    fontWeight: '800',
    fontSize: 16,
    color: OB_COLORS.gold,
  },
  statLabel: {
    fontFamily: OB_FONTS.body,
    fontSize: 10,
    color: OB_COLORS.white40,
    marginTop: 2,
    textAlign: 'center',
  },
  ctaWrap: { width: '100%', marginTop: 4 },
  cta: {
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaText: {
    fontFamily: OB_FONTS.bold,
    fontWeight: '800',
    fontSize: 15,
    color: '#020A14',
  },
});

const successStyles = StyleSheet.create({
  familyBlock: {
    width: '100%',
    maxWidth: 320,
    marginBottom: 20,
    gap: 12,
  },
  familyHeader: {
    backgroundColor: 'rgba(0,229,200,0.08)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(0,229,200,0.25)',
    padding: 14,
    gap: 6,
  },
  familyHeaderTitle: {
    fontFamily: OB_FONTS.bold,
    fontSize: 14,
    fontWeight: '700',
    color: OB_COLORS.teal,
    textAlign: 'center',
  },
  familyHeaderSub: {
    fontFamily: OB_FONTS.body,
    fontSize: 12,
    color: OB_COLORS.white70,
    lineHeight: 18,
    textAlign: 'center',
  },
  codeWrap: {
    backgroundColor: 'rgba(201,168,76,0.07)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(201,168,76,0.30)',
    padding: 16,
    alignItems: 'center',
    gap: 8,
  },
  codeLabel: {
    fontFamily: OB_FONTS.semiBold,
    fontSize: 9,
    letterSpacing: 3,
    color: OB_COLORS.gold,
    textTransform: 'uppercase',
  },
  codeText: {
    fontFamily: OB_FONTS.bold,
    fontSize: 36,
    fontWeight: '900',
    color: OB_COLORS.gold,
    letterSpacing: 8,
  },
  codeBtnRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
    marginTop: 4,
  },
  codeBtnCopy: {
    flex: 1,
    height: 40,
    borderRadius: 10,
    backgroundColor: 'rgba(240,244,255,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(240,244,255,0.20)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  codeBtnCopyText: {
    fontFamily: OB_FONTS.semiBold,
    fontSize: 12,
    color: OB_COLORS.white,
  },
  codeBtnShare: {
    flex: 1,
    height: 40,
    borderRadius: 10,
    backgroundColor: OB_COLORS.teal,
    alignItems: 'center',
    justifyContent: 'center',
  },
  codeBtnShareText: {
    fontFamily: OB_FONTS.bold,
    fontWeight: '700',
    fontSize: 12,
    color: '#020A14',
  },
  privacyNote: {
    padding: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(240,244,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(240,244,255,0.10)',
  },
  privacyNoteText: {
    fontFamily: OB_FONTS.body,
    fontSize: 11,
    color: OB_COLORS.white40,
    lineHeight: 16,
    textAlign: 'center',
  },
});
