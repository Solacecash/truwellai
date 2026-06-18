import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  Alert,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  VERIFICATION_EMAIL_REDIRECT,
  getVerificationStatus,
  routeAfterEmailVerified,
} from '@/lib/emailVerification';
import { supabase } from '@/lib/supabase';
import { colors } from '@/theme/colors';

export default function CheckEmailScreen() {
  const { email } = useLocalSearchParams<{ email?: string }>();
  const router = useRouter();
  const [resending, setResending] = useState(false);

  const emailDisplay = typeof email === 'string' ? email : Array.isArray(email) ? email[0] : '';

  const checkIfVerified = useCallback(async () => {
    await supabase.auth.refreshSession();
    const status = await getVerificationStatus();
    if (status.emailConfirmed) {
      await routeAfterEmailVerified(router);
    }
  }, [router]);

  useFocusEffect(
    useCallback(() => {
      void checkIfVerified();
    }, [checkIfVerified])
  );

  const handleOpenEmail = () => {
    void Linking.openURL('mailto:');
  };

  const handleResendEmail = async () => {
    if (!emailDisplay) return;
    setResending(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: emailDisplay,
        options: { emailRedirectTo: VERIFICATION_EMAIL_REDIRECT },
      });
      if (error) {
        Alert.alert('Could not resend', error.message);
        return;
      }
      Alert.alert('Email sent', 'Check your inbox for a new verification link.');
    } finally {
      setResending(false);
    }
  };

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/login' as never);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <Pressable style={styles.backBtn} onPress={handleBack}>
        <Text style={styles.backText}>{'\u2039'} Back</Text>
      </Pressable>
      <View style={styles.content}>
        <Text style={styles.emoji}>📧</Text>

        <Text style={styles.title}>Check your email</Text>

        <Text style={styles.body}>
          We sent a verification link to{'\n'}
          <Text style={styles.emailHighlight}>{emailDisplay || 'your email'}</Text>
          {'\n\n'}
          Tap the link in the email to verify your account, then return here to continue.
        </Text>

        <Pressable style={styles.primaryBtn} onPress={handleOpenEmail}>
          <Text style={styles.primaryBtnText}>Open Email App</Text>
        </Pressable>

        <Pressable style={styles.secondaryBtn} onPress={() => void checkIfVerified()}>
          <Text style={styles.secondaryBtnText}>I have verified. Continue</Text>
        </Pressable>

        <Pressable onPress={() => void handleResendEmail()} disabled={resending}>
          <Text style={styles.resendText}>
            {resending ? 'Sending…' : 'Resend verification email'}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#020B14',
  },
  backBtn: {
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  backText: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.42)',
  },
  content: {
    flex: 1,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    fontSize: 48,
  },
  title: {
    fontSize: 26,
    color: '#FFFFFF',
    fontWeight: '800',
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 12,
  },
  body: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.55)',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  emailHighlight: {
    color: colors.tealGlow,
    fontWeight: '700',
  },
  primaryBtn: {
    backgroundColor: '#00A878',
    borderRadius: 50,
    paddingVertical: 14,
    paddingHorizontal: 32,
    marginBottom: 16,
    width: '100%',
    alignItems: 'center',
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryBtn: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.20)',
    borderRadius: 50,
    paddingVertical: 14,
    paddingHorizontal: 32,
    marginBottom: 16,
    width: '100%',
    alignItems: 'center',
  },
  secondaryBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  resendText: {
    color: 'rgba(255,255,255,0.40)',
    fontSize: 14,
  },
});
