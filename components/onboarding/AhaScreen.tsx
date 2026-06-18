import AsyncStorage from '@react-native-async-storage/async-storage';
import MaskedView from '@react-native-masked-view/masked-view';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { memo, useEffect, useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { supabase } from '@/lib/supabase';
import { useOnboardingStore } from '@/stores/onboardingStore';

import { TruWellShield } from './TruWellShield';
import { OB } from './tokens';
import type { BurstEffectRef } from './ui/BurstEffect';
import { BurstEffect } from './ui/BurstEffect';
import { CtaButton } from './ui/CtaButton';
import { PulseRing } from './ui/PulseRing';
import { StatCard } from './ui/StatCard';

const STORAGE_KEY = 'truwell_onboarding_complete';

type Props = {
  visible: boolean;
};

function AhaScreenInner({ visible }: Props) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const setOnboardingComplete = useOnboardingStore((s) => s.setOnboardingComplete);
  const burstRef = useRef<BurstEffectRef>(null);

  const op = useSharedValue(0);
  const scale = useSharedValue(0.95);

  useEffect(() => {
    if (!visible) {
      op.value = 0;
      return;
    }
    op.value = withSpring(1, { damping: 20, stiffness: 200 });
    scale.value = withSpring(1, { damping: 20, stiffness: 200 });
    const t = setTimeout(() => burstRef.current?.megaBurst(), 300);
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    return () => clearTimeout(t);
  }, [op, scale, visible]);

  const rootStyle = useAnimatedStyle(() => ({
    opacity: op.value,
    transform: [{ scale: scale.value }],
  }));

  const handleLaunch = async () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    burstRef.current?.megaBurst();
    try {
      await AsyncStorage.setItem(STORAGE_KEY, 'true');
    } catch {
      /* ignore */
    }
    setOnboardingComplete(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.id) {
        if (__DEV__) console.log('[AhaScreen] no session, going to welcome');
        router.replace('/(auth)/welcome');
        return;
      }

      if (__DEV__) console.log('[AhaScreen] launching guardian home');
      router.replace('/enter' as never);
    } catch (err) {
      if (__DEV__) console.error('[AhaScreen] handleLaunch error:', err);
      router.replace('/enter' as never);
    }
  };

  if (!visible) return null;

  return (
    <Animated.View style={[styles.root, rootStyle]}>
      <BurstEffect ref={burstRef} />
      <LinearGradient
        colors={['rgba(201,168,76,0.08)', 'transparent', 'rgba(0,229,200,0.06)']}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      <View style={[styles.body, { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 24 }]}>
        <View style={styles.shieldBlock}>
          <View style={styles.pulseLayer}>
            <PulseRing size={140} color="rgba(201,168,76,0.38)" delay={0} />
            <PulseRing size={190} color="rgba(0,229,200,0.22)" delay={0.6} />
            <PulseRing size={240} color="rgba(201,168,76,0.12)" delay={1.2} />
          </View>
          <View style={styles.shieldFront}>
            <TruWellShield size={100} showCheckmark animated />
          </View>
        </View>

        <View style={styles.headlineRow}>
          <Text style={styles.headline}>Your Guardian is </Text>
          <MaskedView
            style={styles.hlMask}
            maskElement={
              <Text style={styles.hlMaskText}>Active</Text>
            }
          >
            <LinearGradient
              colors={[OB.goldLight, OB.gold, OB.goldDark]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFillObject}
            />
          </MaskedView>
        </View>

        <Text style={styles.para}>
          You now have <Text style={styles.strong}>10 free scans</Text> ready. Walk into any store.
          Scan anything. Know exactly what you are about to put on or in your body, or give to the
          people you love. Your protection starts right now.
        </Text>

        <View style={styles.stats}>
          <StatCard value="10" label="Free scans ready" />
          <StatCard value="47" label="Databases watching" valueColor={OB.teal} />
          <StatCard value="∞" label="Products covered" valueColor={OB.green} />
        </View>

        <CtaButton
          tall
          largeText
          label="Open My Scanner Now →"
          onPress={handleLaunch}
        />
        <Text style={styles.legal}>No credit card · Cancel anytime · Your data is always yours</Text>
      </View>
    </Animated.View>
  );
}

export const AhaScreen = memo(AhaScreenInner);

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 300,
    backgroundColor: OB.ink,
    justifyContent: 'center',
  },
  body: {
    paddingHorizontal: 28,
    alignItems: 'center',
  },
  shieldBlock: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 200,
    marginBottom: 32,
    width: '100%',
    position: 'relative',
  },
  pulseLayer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shieldFront: { zIndex: 2, alignItems: 'center', justifyContent: 'center' },
  headlineRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'baseline',
    marginBottom: 16,
  },
  headline: {
    fontSize: 34,
    fontWeight: '700',
    color: OB.t100,
    lineHeight: 40,
    letterSpacing: -0.5,
  },
  hlMask: { height: 44, justifyContent: 'center' },
  hlMaskText: {
    fontSize: 34,
    fontWeight: '700',
    color: '#000',
    lineHeight: 40,
  },
  para: {
    fontSize: 15,
    lineHeight: 26,
    color: OB.t45,
    textAlign: 'center',
    maxWidth: 340,
    marginBottom: 20,
  },
  strong: { color: OB.t70, fontWeight: '600' },
  stats: {
    flexDirection: 'row',
    gap: 7,
    width: '100%',
    marginBottom: 20,
  },
  legal: {
    marginTop: 12,
    fontSize: 11,
    color: OB.t20,
    textAlign: 'center',
  },
});
