import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { joinFamilyGroup } from '@/lib/familyPlan';
import { useAuthStore } from '@/stores/authStore';

const TEAL = '#00E5C8';
const GOLD = '#C9A84C';
const BG = '#080E1A';
const WHITE = '#F0F4FF';
const WHITE70 = 'rgba(240,244,255,0.70)';
const WHITE40 = 'rgba(240,244,255,0.40)';
const WHITE12 = 'rgba(240,244,255,0.12)';

export default function JoinFamilyScreen() {
  const router = useRouter();
  const session = useAuthStore((s) => s.session);
  const userId = session?.user?.id;

  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleJoin = async () => {
    if (code.trim().length < 6) {
      Alert.alert('Invalid code', 'Invite codes are 6 characters. Please check and try again.');
      return;
    }
    if (!userId) {
      Alert.alert('Sign in required', 'Please sign in to join a family plan.');
      return;
    }

    setLoading(true);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const result = await joinFamilyGroup(code.trim(), userId);
      if (result.success) {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert(
          'Welcome to the family!',
          'You now have full Premium access on this family plan.',
          [{ text: 'Continue', onPress: () => router.back() }]
        );
      } else {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        Alert.alert('Could not join', result.error ?? 'Please check your invite code.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={jStyles.root} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={jStyles.inner}>
          <Pressable onPress={() => router.back()} style={jStyles.backBtn}>
            <Text style={jStyles.backIcon}>‹</Text>
          </Pressable>

          <Animated.View entering={FadeInDown.delay(80).springify()}>
            <Text style={jStyles.eyebrow}>JOIN FAMILY PLAN</Text>
            <Text style={jStyles.title}>Enter your invite code</Text>
            <Text style={jStyles.body}>
              Ask the plan owner for their 6-character invite code. Once joined, you get full
              Premium access on their plan.
            </Text>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(160).springify()} style={jStyles.codeWrap}>
            <TextInput
              style={jStyles.codeInput}
              placeholder="A B C 1 2 3"
              placeholderTextColor={WHITE40}
              value={code}
              onChangeText={(t) =>
                setCode(t.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6))
              }
              autoCapitalize="characters"
              maxLength={6}
              autoFocus
              keyboardType="default"
            />
            <Text style={jStyles.codeHint}>{code.length}/6 characters</Text>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(240).springify()} style={jStyles.privacyNote}>
            <Text style={jStyles.privacyIcon}>🔒</Text>
            <Text style={jStyles.privacyText}>
              Your health data stays completely private. The plan owner can only see your scan
              count and last active date, never your health scores or reports.
            </Text>
          </Animated.View>

          <Pressable
            onPress={handleJoin}
            disabled={loading || code.length < 6}
            style={[jStyles.cta, (loading || code.length < 6) && { opacity: 0.5 }]}
          >
            {loading ? (
              <ActivityIndicator color="#020A14" />
            ) : (
              <Text style={jStyles.ctaText}>Join Family Plan</Text>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const jStyles = StyleSheet.create({
  root: { flex: 1, backgroundColor: BG },
  inner: { flex: 1, paddingHorizontal: 24, paddingTop: 8 },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: WHITE12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  backIcon: { fontSize: 24, color: WHITE, lineHeight: 28 },
  eyebrow: {
    fontFamily: 'Montserrat_600SemiBold',
    fontSize: 10,
    letterSpacing: 3,
    color: TEAL,
    marginBottom: 6,
  },
  title: {
    fontFamily: 'Montserrat_800ExtraBold',
    fontSize: 24,
    color: WHITE,
    letterSpacing: -0.3,
    marginBottom: 10,
  },
  body: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 14,
    color: WHITE70,
    lineHeight: 21,
    marginBottom: 28,
  },
  codeWrap: { alignItems: 'center', marginBottom: 24 },
  codeInput: {
    fontFamily: 'Montserrat_800ExtraBold',
    fontSize: 34,
    color: GOLD,
    letterSpacing: 14,
    textAlign: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'rgba(201,168,76,0.4)',
    paddingBottom: 8,
    width: '100%',
  },
  codeHint: { fontFamily: 'DMSans_400Regular', fontSize: 11, color: WHITE40, marginTop: 8 },
  privacyNote: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
    padding: 14,
    backgroundColor: 'rgba(0,229,200,0.05)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,229,200,0.15)',
    marginBottom: 28,
  },
  privacyIcon: { fontSize: 16 },
  privacyText: {
    flex: 1,
    fontFamily: 'DMSans_400Regular',
    fontSize: 12,
    color: WHITE70,
    lineHeight: 18,
  },
  cta: {
    height: 56,
    borderRadius: 16,
    backgroundColor: TEAL,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 'auto',
    marginBottom: 16,
  },
  ctaText: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 16,
    color: '#020A14',
    fontWeight: '700',
  },
});
