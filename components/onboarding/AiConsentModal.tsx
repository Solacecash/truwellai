import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useState } from 'react';
import {
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { useTheme } from '@/theme/ThemeContext';

const AI_CONSENT_KEY = 'truwell_ai_consent_v1';
const PRIVACY_URL = 'https://truwellai.xyz/privacy';

interface Props {
  visible: boolean;
  onAgree: () => void;
}

export function AiConsentModal({ visible, onAgree }: Props) {
  const { theme } = useTheme();
  const uid = useAuthStore((s) => s.session?.user?.id);
  const [loading, setLoading] = useState(false);

  const handleAgree = useCallback(async () => {
    setLoading(true);
    try {
      await AsyncStorage.setItem(
        AI_CONSENT_KEY,
        new Date().toISOString()
      );
      if (uid) {
        await supabase
          .from('profiles')
          .update({
            ai_consent_given: true,
            ai_consent_date: new Date().toISOString(),
          })
          .eq('id', uid);
      }
      onAgree();
    } catch {
      onAgree();
    } finally {
      setLoading(false);
    }
  }, [uid, onAgree]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <View style={[
          styles.card,
          {
            backgroundColor: '#020A14',
            borderColor: 'rgba(0,229,200,0.25)',
          }
        ]}>
          <Text style={[styles.title, { color: '#F0F4FF' }]}>
            AI Data Sharing
          </Text>
          <Text style={[styles.subtitle, { color: '#00E5C8' }]}>
            Required Disclosure
          </Text>

          <ScrollView
            style={styles.scroll}
            showsVerticalScrollIndicator={false}
          >
            <Text style={[styles.sectionTitle,
              { color: '#F0F4FF', marginTop: 0 }]}>
              To analyse your scans
            </Text>

            <Text style={[styles.body, { color: '#A0AEC0' }]}>
              TruWell shares your scan images, product
              photos, and ingredient data with trusted
              AI partners like Anthropic Claude, Google
              Gemini, and OpenAI to provide safety
              analysis for educational purposes.
            </Text>

            <Text style={[styles.body,
              { color: '#A0AEC0', marginTop: 12 }]}>
              We never sell your data or use it for
              advertising.
            </Text>

            <Text style={[styles.disclaimer,
              { color: '#64748B' }]}>
              TruWell AI is not a medical device and
              does not diagnose, treat, or prevent any
              condition. Analysis is for informational
              purposes only.
            </Text>
          </ScrollView>

          <Pressable
            onPress={handleAgree}
            disabled={loading}
            style={[
              styles.agreeBtn,
              { backgroundColor: '#00E5C8' },
              loading && { opacity: 0.6 },
            ]}
          >
            <Text style={styles.agreeBtnText}>
              {loading ? 'Saving...' : 'I Understand & Agree'}
            </Text>
          </Pressable>

          <Pressable
            onPress={() => Linking.openURL(PRIVACY_URL)}
            style={styles.learnMore}
          >
            <Text style={[styles.learnMoreText,
              { color: '#00E5C8' }]}>
              View Privacy Policy
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

export async function hasAiConsent(): Promise<boolean> {
  try {
    const val = await AsyncStorage.getItem(AI_CONSENT_KEY);
    return val !== null;
  } catch {
    return false;
  }
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxHeight: '85%',
    borderRadius: 20,
    borderWidth: 1,
    padding: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: 20,
  },
  scroll: {
    maxHeight: 380,
    marginBottom: 16,
  },
  body: {
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 8,
    marginTop: 12,
  },
  providerRow: {
    borderBottomWidth: 0.5,
    paddingVertical: 8,
    marginBottom: 4,
  },
  providerName: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 2,
  },
  providerUse: {
    fontSize: 12,
  },
  bullet: {
    fontSize: 13,
    lineHeight: 22,
  },
  disclaimer: {
    fontSize: 11,
    lineHeight: 17,
    marginTop: 16,
    fontStyle: 'italic',
  },
  agreeBtn: {
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  agreeBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#020A14',
  },
  learnMore: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  learnMoreText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
