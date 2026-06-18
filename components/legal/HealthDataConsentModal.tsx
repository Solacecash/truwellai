import React, { useState } from 'react';
import {
  View, Text, StyleSheet, Modal, TouchableOpacity,
  ScrollView, SafeAreaView, Alert
} from 'react-native';
import { LEGAL } from '@/lib/legalContent';
import { supabase } from '@/lib/supabase';

interface Props {
  visible: boolean;
  userId: string | null | undefined;
  onConsented: () => void;
  onDeclined: () => void;
}

export default function HealthDataConsentModal({
  visible, userId, onConsented, onDeclined
}: Props) {
  const [checked, setChecked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleConsent = async () => {
    if (!checked) {
      Alert.alert(
        'Consent Required',
        'Please tick the checkbox to confirm your consent before continuing.'
      );
      return;
    }

    setIsLoading(true);
    try {
      const consentTimestamp = new Date().toISOString();

      // Only persist to DB if we already have a userId (post-registration context).
      // During onboarding registration, consent is recorded when the profile is created.
      if (userId) {
        const { error } = await supabase
          .from('profiles')
          .update({
            health_data_consent_given: true,
            health_data_consent_timestamp: consentTimestamp,
            health_data_consent_version: '1.0',
          })
          .eq('id', userId);

        if (error) {
          if (__DEV__) console.error('[HealthDataConsent] error:', error.message);
          Alert.alert('Error', 'Could not record your consent. Please try again.');
          return;
        }
      }

      onConsented();
    } catch (err) {
      if (__DEV__) console.error('[HealthDataConsent] unexpected error:', err);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDecline = () => {
    Alert.alert(
      'Skip Health Profile',
      'Without a health profile, TruWell AI cannot personalise your ingredient safety results. You can add your health information later from Settings. Do you want to skip for now?',
      [
        { text: 'Go Back', style: 'cancel' },
        { text: 'Skip for Now', style: 'default', onPress: onDeclined },
      ]
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleDecline}
    >
      <SafeAreaView style={styles.safe}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.iconRow}>
            <View style={styles.iconWrap}>
              <Text style={styles.iconText}>🛡</Text>
            </View>
          </View>

          <Text style={styles.title}>Your Health Information</Text>
          <Text style={styles.subtitle}>
            Before we set up your health profile, please read this carefully.
          </Text>

          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>What we collect</Text>
            <Text style={styles.infoBody}>
              Health conditions, allergens, medications, life stage (e.g. pregnancy),
              and dietary preferences.
            </Text>
          </View>

          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>Why we collect it</Text>
            <Text style={styles.infoBody}>
              Solely to personalise your ingredient safety results. A product
              flagged for people with thyroid conditions will be highlighted
              specifically for you.
            </Text>
          </View>

          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>How we protect it</Text>
            <Text style={styles.infoBody}>
              Encrypted at rest and in transit. Never sold. Never shared with
              advertisers or insurers. Processed under applicable data
              protection law in your jurisdiction.
            </Text>
          </View>

          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>Your rights</Text>
            <Text style={styles.infoBody}>
              You may view, update, or permanently delete your health profile
              at any time from Settings. Deletion is permanent and
              irreversible.
            </Text>
          </View>

          <Text style={styles.processingNotice}>
            {LEGAL.DATA_PROCESSING_NOTICE}
          </Text>

          <TouchableOpacity
            style={styles.checkRow}
            onPress={() => setChecked(!checked)}
            activeOpacity={0.7}
          >
            <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
              {checked && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <Text style={styles.checkLabel}>
              I understand and consent to the storage and processing of my
              health information by TruWell AI as described above.
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.cta, (!checked || isLoading) && styles.ctaDisabled]}
            onPress={handleConsent}
            disabled={!checked || isLoading}
            activeOpacity={0.85}
          >
            <Text style={styles.ctaText}>
              {isLoading ? 'Saving...' : 'I Consent — Continue'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.skipBtn} onPress={handleDecline}>
            <Text style={styles.skipText}>Skip health profile for now</Text>
          </TouchableOpacity>

        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#020A14' },
  scroll: { padding: 22, paddingBottom: 40 },
  iconRow: { alignItems: 'center', marginBottom: 18 },
  iconWrap: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: 'rgba(0,229,200,0.08)',
    borderWidth: 1, borderColor: 'rgba(0,229,200,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  iconText: { fontSize: 28 },
  title: {
    fontSize: 22, fontWeight: '800', letterSpacing: -0.5,
    color: '#EEF2FF', textAlign: 'center', marginBottom: 6,
  },
  subtitle: {
    fontSize: 13, color: 'rgba(238,242,255,0.55)',
    textAlign: 'center', lineHeight: 19, marginBottom: 22,
  },
  infoCard: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12, padding: 14, marginBottom: 10,
  },
  infoTitle: {
    fontSize: 12, fontWeight: '700', color: '#EEF2FF', marginBottom: 5,
  },
  infoBody: {
    fontSize: 12, color: 'rgba(238,242,255,0.62)', lineHeight: 17,
  },
  processingNotice: {
    fontSize: 10, color: 'rgba(238,242,255,0.35)',
    lineHeight: 15, marginVertical: 14, fontStyle: 'italic',
  },
  checkRow: {
    flexDirection: 'row', gap: 12, alignItems: 'flex-start',
    marginBottom: 22, padding: 12,
    backgroundColor: 'rgba(0,229,200,0.04)',
    borderWidth: 1, borderColor: 'rgba(0,229,200,0.15)',
    borderRadius: 12,
  },
  checkbox: {
    width: 22, height: 22, borderRadius: 6,
    borderWidth: 1.5, borderColor: 'rgba(238,242,255,0.3)',
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    marginTop: 1,
  },
  checkboxChecked: {
    backgroundColor: '#00E5C8', borderColor: '#00E5C8',
  },
  checkmark: { fontSize: 13, fontWeight: '800', color: '#020A14' },
  checkLabel: {
    flex: 1, fontSize: 12, color: 'rgba(238,242,255,0.75)',
    lineHeight: 17,
  },
  cta: {
    backgroundColor: '#00E5C8', borderRadius: 14,
    paddingVertical: 16, alignItems: 'center', marginBottom: 12,
  },
  ctaDisabled: { opacity: 0.45 },
  ctaText: { fontSize: 15, fontWeight: '800', color: '#020A14' },
  skipBtn: { alignItems: 'center', paddingVertical: 8 },
  skipText: {
    fontSize: 12, color: 'rgba(238,242,255,0.38)', fontWeight: '600',
  },
});
