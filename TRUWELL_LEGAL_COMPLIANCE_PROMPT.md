# TRUWELL AI — IN-APP LEGAL COMPLIANCE IMPLEMENTATION
# Complete Legal Restructuring Prompt for Claude Code in Cursor
# Based on comprehensive legal risk analysis — April 2026
# Version: 1.0

READ THIS ENTIRE PROMPT BEFORE TOUCHING ANY FILE.
Execute each phase in strict order. Never skip. Never combine phases.
After every phase: npx tsc --noEmit — zero errors required to continue.
This prompt implements legal compliance. Every word of copy matters.
Do not paraphrase the legally approved language provided below.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PRE-WORK — LEGAL COMPLIANCE CHECKLIST AUDIT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Before writing a single line of code, audit the entire codebase
against this checklist. Report FOUND or NOT FOUND for every item.
Show the exact file path and relevant code for every FOUND item.

RUN THESE SEARCHES AND SHOW COMPLETE OUTPUT:

grep -r "disclaimer\|medical advice\|not a medical\|educational" \
  app/ components/ lib/ --include="*.tsx" --include="*.ts" -l

grep -r "prescription\|Prescription\|prescribe\|Prescribe" \
  app/ components/ lib/ --include="*.tsx" --include="*.ts" -l

grep -r "stress.score\|stressScore\|stress_score" \
  app/ components/ lib/ stores/ --include="*.tsx" --include="*.ts" -l

grep -r "predictive\|Predictive\|impact.report\|predictive_report" \
  app/ components/ lib/ --include="*.tsx" --include="*.ts" -l

grep -r "banned\|Banned\|watchlist\|Watchlist\|global_watchlist" \
  app/ components/ lib/ --include="*.tsx" --include="*.ts" -l

grep -r "consent\|Consent\|health.profile\|healthProfile" \
  app/ components/ --include="*.tsx" -l

grep -r "age.*confirm\|18.*year\|adults.only\|adult" \
  app/ components/ --include="*.tsx" -l

grep -r "delete.*account\|deleteAccount\|delete.*user\|purge" \
  app/ components/ lib/ --include="*.tsx" --include="*.ts" -l

grep -r "jurisdiction\|licensed.*in\|gmc\|mdcn\|license.*country" \
  app/ components/ lib/ --include="*.tsx" --include="*.ts" -i -l

grep -r "powered.by.ai\|ai.generated\|AI.*disclosure" \
  app/ components/ --include="*.tsx" -i -l

grep -r "emergency\|Emergency\|call.*999\|call.*112\|dial.*emergency" \
  app/ components/ --include="*.tsx" -l

grep -r "RevenueCat\|revenuecat\|expo-iap\|StoreKit\|inAppPurchase" \
  app/ components/ lib/ --include="*.tsx" --include="*.ts" -l

CHECKLIST — Report FOUND or NOT FOUND for each:

LEGAL COPY AND DISCLAIMERS:
[ ] 1. Medical disclaimer component or text in AI Health Assistant
[ ] 2. Medical disclaimer on scan result screen
[ ] 3. Medical disclaimer in onboarding flow
[ ] 4. "Not a medical device" language in Terms of Service
[ ] 5. Emergency services prompt on health-related screens
[ ] 6. "Powered by AI" or similar disclosure on AI responses
[ ] 7. Safety grade disclaimer text below A-F grades
[ ] 8. Regulatory source citations on Global Watchlist alerts
[ ] 9. Brand dispute mechanism on watchlist alerts

CONSENT AND DATA:
[ ] 10. Standalone health data consent (separate from ToS checkbox)
[ ] 11. Age confirmation (18+) in onboarding with timestamp logging
[ ] 12. Full data deletion function in settings
[ ] 13. Terms of Service link accessible from settings

FEATURES REQUIRING RESTRUCTURING:
[ ] 14. Prescription feature renamed/restricted to Clinical Notes
[ ] 15. "Stress Score" removed as displayed health metric
[ ] 16. "Predictive Impact Reports" renamed to Ingredient Research Summaries
[ ] 17. Weight/health outcome predictions removed from reports
[ ] 18. Patient geography lock in telehealth matching
[ ] 19. Doctor jurisdiction badge on specialist profiles

PAYMENTS:
[ ] 20. RevenueCat or expo-iap for iOS/Android in-app subscriptions
[ ] 21. Cancellation instructions in subscription settings
[ ] 22. Clear refund/cancellation policy text

Report the audit results. Then proceed phase by phase.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PHASE 1 — CREATE THE LEGAL CONTENT LIBRARY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Step 1.1 — Create lib/legalContent.ts

This file is the single source of truth for ALL legal copy in the app.
No legal disclaimer, warning, or regulated language exists anywhere else.
Every screen that needs legal text imports from this file.
This makes future legal updates a one-file change.

Create lib/legalContent.ts with this exact content:

---
export const LEGAL = {

  APP_NOT_MEDICAL_DEVICE: 'TruWell AI is an educational health information platform, not a medical device or regulated healthcare service.',

  PRIMARY_DISCLAIMER: `TruWell AI provides educational health information based on publicly available scientific research and regulatory databases. This information is not medical advice, a clinical diagnosis, or a substitute for consultation with a qualified and licensed healthcare professional. Individual health needs, conditions, and circumstances vary. Always seek personalised guidance from a qualified healthcare professional before making decisions about your health, medications, or medical conditions. In an emergency, call your local emergency services immediately.`,

  SHORT_DISCLAIMER: 'Educational information only. Not medical advice. Always consult a qualified healthcare professional.',

  AI_RESPONSE_FOOTER: 'This information is for educational purposes only and is not medical advice. For personalised guidance, please consult a qualified and licensed healthcare professional.',

  AI_FIRST_OPEN: `Before we begin, please note:\n\nTruWell AI provides educational health information sourced from publicly available scientific and regulatory databases.\n\nI am not a doctor, nurse, or licensed healthcare professional. I cannot diagnose conditions, prescribe treatments, or provide personalised medical advice.\n\nFor any health concerns, always consult a qualified healthcare professional. In an emergency, call your local emergency services immediately.`,

  SCAN_RESULT_DISCLAIMER: 'Safety grades reflect the regulatory and research status of listed ingredients in specified databases as of the date shown. They do not constitute a personalised safety assessment. Individual sensitivities, allergies, and health conditions vary. This information is for educational purposes only.',

  WATCHLIST_DISCLAIMER: 'Regulatory status information is sourced from publicly available government and scientific databases. It reflects the stated position of the cited regulatory body at the time of last database update. TruWell AI is not responsible for regulatory changes that have not yet been reflected in the referenced databases. If you believe this information is incorrect or outdated, please use the dispute button below.',

  INGREDIENT_SUMMARY_DISCLAIMER: 'This ingredient research summary presents information from publicly available scientific literature and regulatory databases. References to consumption patterns reflect population-level research trends and do not constitute a prediction or diagnosis for any individual. Individual responses to ingredients vary significantly based on genetics, existing health conditions, medications, and other factors.',

  TELEHEALTH_PLATFORM_NOTICE: 'TruWell AI is a technology platform that connects patients with independent, self-employed licensed healthcare professionals. TruWell AI is not a healthcare provider, does not employ the healthcare professionals listed, and is not responsible for the clinical judgement, advice, prescriptions, or actions of any healthcare professional accessed through this platform. The professional relationship is solely between you and the healthcare professional you choose to consult.',

  CLINICAL_NOTES_NOTICE: 'Clinical notes created through TruWell AI are consultation summaries for informational and record-keeping purposes. They do not constitute a legally issued prescription. Any prescription or medicine order must be issued through the appropriate regulated clinical system in the practitioner\'s licensed jurisdiction and in compliance with the applicable Pharmacy and Medicines Acts.',

  HOME_REMEDIES_DISCLAIMER: 'The remedies and information presented here are drawn from traditional knowledge, peer-reviewed research, and publicly available health literature. They are provided for educational and informational purposes only. They are not a substitute for professional medical advice, diagnosis, or treatment. Some remedies may interact with medications or be unsuitable for certain health conditions. Always consult a qualified healthcare professional before trying any remedy, particularly if you are pregnant, breastfeeding, taking medications, or have a pre-existing health condition.',

  EMERGENCY_NOTICE: 'If you or someone else is experiencing a medical emergency, call your local emergency services immediately:\nNigeria: 112 or 767\nUK: 999\nUSA: 911\nDo not rely on this app in an emergency situation.',

  BREATHING_EXERCISE_DISCLAIMER: 'Breathing exercises are intended for general wellness and relaxation purposes. If you experience dizziness, chest pain, shortness of breath, or any discomfort, stop immediately and consult a healthcare professional. These exercises are not a treatment for any medical condition.',

  HEALTH_PROFILE_CONSENT_TEXT: 'Your health information — including conditions, allergens, medications, and life stage — is stored securely and used solely to personalise your ingredient safety results. This is sensitive health data. It is encrypted, never sold, and never shared with third parties without your explicit consent. You may delete your health profile or your entire account at any time from Settings.',

  DATA_PROCESSING_NOTICE: 'By creating a health profile, you consent to the storage and processing of your health information for the purpose of personalising your TruWell AI experience. This processing is conducted under our Privacy Policy and applicable data protection law including the UK GDPR and the Nigeria Data Protection Act 2023. You have the right to access, correct, and delete your data at any time.',

  AGE_CONFIRMATION_TEXT: 'I confirm that I am 18 years of age or older. TruWell AI is intended for adults only. Health information, telehealth services, and account features are not suitable for users under 18.',

  SUBSCRIPTION_CANCELLATION_NOTICE: 'You may cancel your subscription at any time. On iOS, manage your subscription through your Apple ID settings. On Android, through your Google Play account settings. Cancellation takes effect at the end of your current billing period. You will retain access to paid features until that date. For assistance, contact support@truwell.ai.',

  SAFETY_GRADE_EXPLANATION: 'Safety grades (A to F) reflect the regulatory status and peer-reviewed research profile of a product\'s listed ingredients, based on information in our referenced databases at the time of the last update. Grade A does not guarantee a product is safe for every individual. Grade F indicates one or more ingredients have significant regulatory restrictions or adverse research profiles. This grading is for educational reference only and does not constitute a safety certification.',

  TERMS_GOVERNING_LAW: 'These Terms of Service are governed by and construed in accordance with the laws of England and Wales. Any disputes arising under these Terms shall be subject to the exclusive jurisdiction of the English courts, except where mandatory consumer protection laws in your country of residence provide otherwise.',

  WATCHLIST_CITATION_PREFIX: 'Regulatory basis:',

  GEOGRAPHIC_RESTRICTION_NOTICE: 'This healthcare professional is licensed to practise in the following jurisdiction(s):',

  JURISDICTION_MISMATCH_WARNING: 'This specialist\'s verified licence does not cover consultations with patients in your location. Connecting with a healthcare professional who is not licensed in your jurisdiction may not be legally permitted. Please select a specialist whose licence covers your location, or contact support for assistance.',

} as const;

export type LegalKey = keyof typeof LEGAL;
---

Step 1.2 — TypeScript check

Run: npx tsc --noEmit
Fix all errors. Confirm zero errors before proceeding.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PHASE 2 — CREATE REUSABLE LEGAL COMPONENTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Step 2.1 — Create components/legal/LegalDisclaimer.tsx

---
import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Modal,
  ScrollView, SafeAreaView
} from 'react-native';
import { LEGAL } from '@/lib/legalContent';

interface Props {
  text: string;
  variant?: 'banner' | 'inline' | 'footer' | 'card';
  expandable?: boolean;
  fullText?: string;
  style?: object;
}

export default function LegalDisclaimer({
  text,
  variant = 'footer',
  expandable = false,
  fullText,
  style,
}: Props) {
  const [expanded, setExpanded] = useState(false);

  const containerStyle = [
    styles.base,
    variant === 'banner' && styles.banner,
    variant === 'inline' && styles.inline,
    variant === 'footer' && styles.footer,
    variant === 'card' && styles.card,
    style,
  ];

  return (
    <View style={containerStyle}>
      <Text style={styles.text}>{text}</Text>
      {expandable && fullText && (
        <>
          <TouchableOpacity
            onPress={() => setExpanded(true)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.readMore}>Read full notice</Text>
          </TouchableOpacity>
          <Modal
            visible={expanded}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={() => setExpanded(false)}
          >
            <SafeAreaView style={styles.modalSafe}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Important Notice</Text>
                <TouchableOpacity onPress={() => setExpanded(false)}>
                  <Text style={styles.modalClose}>Done</Text>
                </TouchableOpacity>
              </View>
              <ScrollView
                style={styles.modalScroll}
                contentContainerStyle={{ paddingBottom: 40 }}
              >
                <Text style={styles.modalText}>{fullText}</Text>
              </ScrollView>
            </SafeAreaView>
          </Modal>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingHorizontal: 12,
  },
  banner: {
    backgroundColor: 'rgba(255,165,2,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,165,2,0.18)',
    borderRadius: 10,
    padding: 10,
    marginHorizontal: 16,
    marginBottom: 10,
  },
  inline: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 8,
    padding: 10,
  },
  footer: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  card: {
    backgroundColor: 'rgba(0,229,200,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(0,229,200,0.15)',
    borderRadius: 10,
    padding: 12,
    marginHorizontal: 16,
    marginBottom: 12,
  },
  text: {
    fontSize: 10,
    color: 'rgba(238,242,255,0.42)',
    lineHeight: 15,
    fontStyle: 'italic',
  },
  readMore: {
    fontSize: 10,
    color: '#00E5C8',
    fontWeight: '700',
    marginTop: 4,
  },
  modalSafe: {
    flex: 1,
    backgroundColor: '#020A14',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#EEF2FF',
  },
  modalClose: {
    fontSize: 15,
    fontWeight: '700',
    color: '#00E5C8',
  },
  modalScroll: {
    flex: 1,
    padding: 20,
  },
  modalText: {
    fontSize: 13,
    color: 'rgba(238,242,255,0.72)',
    lineHeight: 20,
  },
});
---

Step 2.2 — Create components/legal/AIDisclosureBadge.tsx

This badge appears on every AI-generated response.
Required under EU AI Act transparency obligations.

---
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface Props {
  compact?: boolean;
}

export default function AIDisclosureBadge({ compact = false }: Props) {
  if (compact) {
    return (
      <View style={styles.compactBadge}>
        <Text style={styles.compactText}>AI-generated · Educational only</Text>
      </View>
    );
  }

  return (
    <View style={styles.badge}>
      <View style={styles.dot} />
      <Text style={styles.text}>
        Generated by AI · For educational purposes only · Not medical advice
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginTop: 6,
    alignSelf: 'flex-start',
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#C9A84C',
  },
  text: {
    fontSize: 9,
    color: 'rgba(238,242,255,0.35)',
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  compactBadge: {
    backgroundColor: 'rgba(201,168,76,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(201,168,76,0.15)',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  compactText: {
    fontSize: 8,
    color: 'rgba(201,168,76,0.7)',
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
---

Step 2.3 — Create components/legal/HealthDataConsentModal.tsx

This modal captures standalone, explicit health data consent.
This is separate from the Terms of Service checkbox and is required
under GDPR Article 9 for special category health data.
It must be shown during health profile setup, BEFORE health data is stored.

---
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, Modal, TouchableOpacity,
  ScrollView, SafeAreaView, Alert
} from 'react-native';
import { LEGAL } from '@/lib/legalContent';
import { supabase } from '@/lib/supabase';

interface Props {
  visible: boolean;
  userId: string;
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

      const { error } = await supabase
        .from('profiles')
        .update({
          health_data_consent_given: true,
          health_data_consent_timestamp: consentTimestamp,
          health_data_consent_version: '1.0',
        })
        .eq('id', userId);

      if (error) {
        console.error('[HealthDataConsent] error:', error.message);
        Alert.alert('Error', 'Could not record your consent. Please try again.');
        return;
      }

      onConsented();
    } catch (err) {
      console.error('[HealthDataConsent] unexpected error:', err);
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
              advertisers or insurers. Processed under UK GDPR and Nigeria
              Data Protection Act 2023.
            </Text>
          </View>

          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>Your rights</Text>
            <Text style={styles.infoBody}>
              You may view, update, or permanently delete your health profile
              at any time from Settings → Privacy. Deletion is permanent and
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
            style={[styles.cta, !checked && styles.ctaDisabled, isLoading && styles.ctaDisabled]}
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
---

Step 2.4 — Create components/legal/EmergencyNotice.tsx

---
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Linking } from 'react-native';
import { LEGAL } from '@/lib/legalContent';

interface Props {
  compact?: boolean;
}

export default function EmergencyNotice({ compact = false }: Props) {
  const callEmergency = () => {
    Linking.openURL('tel:112');
  };

  if (compact) {
    return (
      <TouchableOpacity style={styles.compact} onPress={callEmergency}>
        <Text style={styles.compactText}>
          Medical emergency? Call 112 (NG) · 999 (UK) · 911 (US) immediately
        </Text>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.card}>
      <Text style={styles.icon}>🚨</Text>
      <Text style={styles.text}>{LEGAL.EMERGENCY_NOTICE}</Text>
      <TouchableOpacity style={styles.callBtn} onPress={callEmergency}>
        <Text style={styles.callText}>Call Emergency Services Now</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(255,71,87,0.08)',
    borderWidth: 1, borderColor: 'rgba(255,71,87,0.25)',
    borderRadius: 12, padding: 14, margin: 16, alignItems: 'center',
  },
  icon: { fontSize: 24, marginBottom: 8 },
  text: {
    fontSize: 11, color: 'rgba(238,242,255,0.72)',
    lineHeight: 17, textAlign: 'center', marginBottom: 12,
  },
  callBtn: {
    backgroundColor: '#FF4757', borderRadius: 10,
    paddingVertical: 10, paddingHorizontal: 20,
  },
  callText: { fontSize: 13, fontWeight: '800', color: '#FFF' },
  compact: {
    backgroundColor: 'rgba(255,71,87,0.06)',
    borderWidth: 1, borderColor: 'rgba(255,71,87,0.18)',
    borderRadius: 8, padding: 8, marginHorizontal: 16, marginBottom: 8,
  },
  compactText: {
    fontSize: 10, color: '#FF4757', fontWeight: '700', textAlign: 'center',
  },
});
---

Step 2.5 — Create components/legal/WatchlistDisputeButton.tsx

---
import React, { useState } from 'react';
import {
  TouchableOpacity, Text, StyleSheet, Alert, TextInput,
  Modal, View, SafeAreaView
} from 'react-native';
import { supabase } from '@/lib/supabase';

interface Props {
  ingredientName: string;
  jurisdiction: string;
  userId: string;
}

export default function WatchlistDisputeButton({
  ingredientName, jurisdiction, userId
}: Props) {
  const [modalVisible, setModalVisible] = useState(false);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const handleSubmit = async () => {
    if (!message.trim()) {
      Alert.alert('Please describe the issue before submitting.');
      return;
    }

    setSending(true);
    try {
      await supabase.from('watchlist_disputes').insert({
        user_id: userId,
        ingredient_name: ingredientName,
        jurisdiction,
        dispute_description: message.trim(),
        status: 'pending',
        created_at: new Date().toISOString(),
      });

      setModalVisible(false);
      setMessage('');
      Alert.alert(
        'Dispute Submitted',
        'Thank you. Our team will review this information within 48 hours. If our database needs updating, we will correct it promptly.'
      );
    } catch (err) {
      console.error('[WatchlistDispute] error:', err);
      Alert.alert('Could not submit dispute. Please email legal@truwell.ai directly.');
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <TouchableOpacity
        style={styles.btn}
        onPress={() => setModalVisible(true)}
      >
        <Text style={styles.btnText}>Is this information incorrect?</Text>
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalVisible(false)}
      >
        <SafeAreaView style={styles.safe}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Dispute Regulatory Information</Text>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Text style={styles.cancel}>Cancel</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.body}>
            <Text style={styles.info}>
              Flagged: {ingredientName} ({jurisdiction})
            </Text>
            <Text style={styles.label}>
              Please describe why you believe this information may be incorrect
              or outdated, and include any regulatory references if available:
            </Text>
            <TextInput
              style={styles.input}
              placeholder="Describe the issue..."
              placeholderTextColor="rgba(238,242,255,0.25)"
              multiline
              numberOfLines={5}
              value={message}
              onChangeText={setMessage}
              textAlignVertical="top"
            />
            <TouchableOpacity
              style={[styles.submitBtn, sending && styles.disabledBtn]}
              onPress={handleSubmit}
              disabled={sending}
            >
              <Text style={styles.submitText}>
                {sending ? 'Submitting...' : 'Submit Dispute'}
              </Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  btn: {
    paddingVertical: 8, paddingHorizontal: 12, marginTop: 6,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 8, alignSelf: 'flex-start',
  },
  btnText: { fontSize: 10, color: 'rgba(238,242,255,0.45)', fontWeight: '600' },
  safe: { flex: 1, backgroundColor: '#020A14' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', padding: 16,
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  headerTitle: { fontSize: 16, fontWeight: '700', color: '#EEF2FF' },
  cancel: { fontSize: 14, fontWeight: '700', color: '#00E5C8' },
  body: { padding: 20 },
  info: {
    fontSize: 12, color: '#FFA502', fontWeight: '700',
    marginBottom: 14, padding: 10,
    backgroundColor: 'rgba(255,165,2,0.08)',
    borderRadius: 8,
  },
  label: {
    fontSize: 12, color: 'rgba(238,242,255,0.65)',
    lineHeight: 17, marginBottom: 12,
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12, padding: 14,
    fontSize: 13, color: '#EEF2FF', minHeight: 120,
    marginBottom: 16,
  },
  submitBtn: {
    backgroundColor: '#00E5C8', borderRadius: 12,
    paddingVertical: 14, alignItems: 'center',
  },
  disabledBtn: { opacity: 0.5 },
  submitText: { fontSize: 14, fontWeight: '800', color: '#020A14' },
});
---

Step 2.6 — Create Supabase table for disputes

Run in Supabase SQL editor:

CREATE TABLE IF NOT EXISTS watchlist_disputes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  ingredient_name TEXT NOT NULL,
  jurisdiction TEXT,
  dispute_description TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
  resolution_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);
ALTER TABLE watchlist_disputes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_disputes" ON watchlist_disputes
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users_read_own_disputes" ON watchlist_disputes
  FOR SELECT USING (auth.uid() = user_id);

Also add consent columns to profiles:

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS health_data_consent_given BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS health_data_consent_timestamp TIMESTAMPTZ;
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS health_data_consent_version TEXT;
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS doctor_license_jurisdictions TEXT[] DEFAULT '{}';

Run: npx tsc --noEmit
Fix all errors. Confirm zero before proceeding.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PHASE 3 — RESTRUCTURE THE PRESCRIPTION FEATURE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Step 3.1 — Find and document the prescription feature

Find the prescription files:
find app -name "*prescription*" -o -name "*Prescription*" 2>/dev/null
find components -name "*prescription*" -o -name "*Prescription*" 2>/dev/null
grep -r "prescri" app/ components/ lib/ --include="*.tsx" --include="*.ts" -l

Show complete content of every file found.

Step 3.2 — Rename and restructure the feature

The prescription feature becomes "Clinical Notes."
This is not cosmetic — it is a legal restructuring of what the feature
is and what it can be used for.

In EVERY file that contains prescription-related code:

RENAME these UI strings:
"New Rx" tab label → "Notes"
"Prescriptions" tab label → "Clinical Notes"
"New Prescription" → "New Clinical Note"
"Issue Prescription" → "Create Consultation Note"
"Medication prescribed" → "Medication discussed"
"Dosage" field label → "Noted dosage"
"Prescription issued" → "Consultation note created"
"View Prescription" → "View Consultation Note"

CHANGE the database table if it is named prescriptions:
Do NOT rename the DB table (migration risk) but rename all UI references.
In the code, wherever prescriptions table is queried, add a comment:
// This table stores consultation notes, not legally issued prescriptions.
// Prescriptions must be issued through the appropriate clinical system.

ADD this notice at the top of the Clinical Notes screen
(above the list of notes):

<View style={noticeStyle}>
  <Text style={noticeTitleStyle}>Consultation Notes</Text>
  <Text style={noticeBodyStyle}>
    {LEGAL.CLINICAL_NOTES_NOTICE}
  </Text>
</View>

REMOVE or DISABLE any button or field that says:
- "Issue prescription"
- "Send prescription to pharmacy"
- "Print prescription"
- Any field that captures a "prescription number"

These specific actions suggest a legally issued prescription.
Replace with: "Save Consultation Note" and "Share Summary with Patient."

RENAME in navigation:
Tab name: "Rx" → "Notes"
Route names in code can remain as-is (internal only)
but ALL visible text must use the new language.

Step 3.3 — Add the clinical notes disclaimer

In app/(expert)/prescriptions/index.tsx (or wherever the feature renders):

Import LEGAL from '@/lib/legalContent'
Import LegalDisclaimer from '@/components/legal/LegalDisclaimer'

Add this at the very top of the screen content (below any header):

<LegalDisclaimer
  text={LEGAL.CLINICAL_NOTES_NOTICE}
  variant="card"
/>

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PHASE 4 — RESTRUCTURE THE AI HEALTH ASSISTANT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Step 4.1 — Find the AI assistant screen and Claude API call

find app -name "*assistant*" -o -name "*chat*" -o -name "*ai*" 2>/dev/null | grep -v node_modules
grep -r "ai-health-assistant\|claude.*api\|anthropic" app/ lib/ --include="*.tsx" --include="*.ts" -l

Show the complete content of the main AI chat screen
and the AI API call function.

Step 4.2 — Update the Claude system prompt

Find the system prompt string passed to the Claude API.
It is likely in a function like callAIAssistant() or in a Supabase Edge Function.

REPLACE the existing system prompt with this legally hardened version:

const SYSTEM_PROMPT = `You are TruWell AI's educational health information assistant. You help users understand ingredient safety, nutritional information, and general health topics using publicly available scientific and regulatory information.

MANDATORY RULES — you must follow every rule on every response:

1. NEVER diagnose any medical condition. Never say "you might have", "this sounds like", "this could be", or any language suggesting a specific diagnosis.

2. NEVER recommend specific medications, supplements, or treatments by name for treating any condition. You may describe what research generally shows about an ingredient or substance.

3. NEVER claim to predict individual health outcomes. Use "research suggests" or "studies indicate" followed by general population findings, not individual predictions.

4. ALWAYS recommend consulting a qualified and licensed healthcare professional for any personal health concerns.

5. ALWAYS end every response that touches on health, symptoms, or wellness with this exact sentence: "For personalised guidance on any health matter, please consult a qualified and licensed healthcare professional."

6. If a user describes symptoms that may indicate a medical emergency (chest pain, difficulty breathing, sudden severe headache, signs of stroke, etc.), your first and only priority is to tell them to call emergency services immediately.

7. You provide information based on publicly available scientific and regulatory databases. You are not a medical professional and do not have access to the user's individual health records, clinical history, or the ability to conduct a physical examination.

8. When discussing ingredients, always frame findings as: "[Ingredient] has been associated with [effect] in [type of research]. Regulatory status: [status in specific jurisdiction]."

9. Never mention specific brand names in a negative context unless citing a documented regulatory action.

10. Your role is educational only. You help users understand information — not make medical decisions.`;

Step 4.3 — Add the first-open disclaimer modal

In the AI assistant screen component:

Import AsyncStorage from '@react-native-async-storage/async-storage'
Import LEGAL from '@/lib/legalContent'

Add at the top of the component:

const [showDisclaimer, setShowDisclaimer] = useState(false);

useEffect(() => {
  const checkFirstOpen = async () => {
    const seen = await AsyncStorage.getItem('truwell_ai_disclaimer_seen_v2');
    if (!seen) {
      setShowDisclaimer(true);
    }
  };
  checkFirstOpen();
}, []);

const dismissDisclaimer = async () => {
  await AsyncStorage.setItem('truwell_ai_disclaimer_seen_v2', 'true');
  setShowDisclaimer(false);
};

Add the disclaimer modal (before the chat ScrollView):

{showDisclaimer && (
  <Modal
    visible={showDisclaimer}
    animationType="fade"
    transparent
    onRequestClose={dismissDisclaimer}
  >
    <View style={disclaimerOverlayStyle}>
      <View style={disclaimerCardStyle}>
        <Text style={disclaimerTitleStyle}>Before We Begin</Text>
        <Text style={disclaimerBodyStyle}>
          {LEGAL.AI_FIRST_OPEN}
        </Text>
        <TouchableOpacity
          style={disclaimerBtnStyle}
          onPress={dismissDisclaimer}
        >
          <Text style={disclaimerBtnTextStyle}>I Understand — Continue</Text>
        </TouchableOpacity>
      </View>
    </View>
  </Modal>
)}

Step 4.4 — Add AI disclosure badge to every message bubble

In the AI message bubble component (wherever AI responses are rendered):

Import AIDisclosureBadge from '@/components/legal/AIDisclosureBadge'

After the AI message text, add:
<AIDisclosureBadge compact />

Step 4.5 — Add legal footer to AI responses

Every AI response rendered must end with this footer text below the message:

<Text style={aiFooterStyle}>{LEGAL.AI_RESPONSE_FOOTER}</Text>

The footer style: fontSize 9, color rgba(238,242,255,0.30), fontStyle italic, marginTop 4

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PHASE 5 — RESTRUCTURE SCAN RESULTS AND INGREDIENT DATA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Step 5.1 — Find all scan result screens and ingredient display components

grep -r "safety.*grade\|SafetyGrade\|scanResult\|scan_result\|ScanResult" \
  app/ components/ --include="*.tsx" -l

Step 5.2 — Add safety grade disclaimer

On every screen that displays a safety grade (A-F), add BELOW the grade display:

<LegalDisclaimer
  text={LEGAL.SAFETY_GRADE_EXPLANATION}
  variant="footer"
  expandable={false}
/>

Step 5.3 — Rename "Predictive Impact Reports" throughout

Find every file that uses the word "Predictive" or "predictive":
grep -r "Predictive\|predictive" app/ components/ --include="*.tsx" -l

In every file found, replace these strings EXACTLY:

"Predictive Impact Report" → "Ingredient Research Summary"
"Predictive Impact Reports" → "Ingredient Research Summaries"
"Predictive Health Impact" → "Ingredient Research"
"Predict" (in health context only) → "Research suggests"
"predicted" (in health context) → "indicated by research"
"If you consume this daily →" → "Studies on this ingredient pattern note:"
"risk of +Xkg weight gain" → "research has associated similar consumption patterns with weight changes in studied populations"
"May worsen insulin resistance" → "Some research has associated high consumption of this ingredient profile with metabolic considerations. Consult a healthcare professional if you have concerns."

Step 5.4 — Update the Ingredient Research Summary system prompt

Find the AI call for predictive reports. Update the system prompt addition to:

"Analyse this product's ingredients and provide an ingredient research summary. Frame all findings as research observations, not individual predictions. Use language such as 'studies suggest', 'research has associated', 'regulatory bodies have noted'. Never frame findings as predictions for the specific user. Always note that individual responses vary and professional consultation is recommended.

Response must be in this JSON structure with the exact field names.
For any field that would typically contain predictive language, reframe as research findings."

Step 5.5 — Update Global Watchlist alerts

Find GlobalWatchlistAlert.tsx or equivalent.

CHANGE: Every display of "banned" standalone → "restricted under [regulation]"
CHANGE: "Banned in EU" → "Restricted under EU Cosmetics Regulation 1223/2009"
CHANGE: "Banned in USA" → "Restricted by FDA 21 CFR [section]" or "Not approved for use in cosmetics by the US FDA"
CHANGE: "Recalled" → "Subject to regulatory recall action (see source)"

ADD after every watchlist alert citation:
<Text style={citationStyle}>
  {LEGAL.WATCHLIST_CITATION_PREFIX} {item.source}
</Text>

ADD the LegalDisclaimer below every watchlist card:
<LegalDisclaimer
  text={LEGAL.WATCHLIST_DISCLAIMER}
  variant="inline"
/>

ADD the WatchlistDisputeButton component below every watchlist item:
<WatchlistDisputeButton
  ingredientName={item.ingredient}
  jurisdiction={item.jurisdiction}
  userId={userId}
/>

Step 5.6 — Add scan result screen disclaimer

On the main scan result screen, add at the bottom ABOVE any share/save buttons:
<LegalDisclaimer
  text={LEGAL.SCAN_RESULT_DISCLAIMER}
  variant="footer"
/>

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PHASE 6 — RESTRUCTURE BREATHING AND WELLNESS FEATURES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Step 6.1 — Rename stress score throughout

grep -r "stressScore\|stress_score\|StressScore\|Stress Score\|stress score" \
  app/ components/ lib/ stores/ --include="*.tsx" --include="*.ts" -l

In EVERY file found, rename:
"Stress Score" → "Session Readiness"
"stressScore" → "sessionReadiness" (variable name, for new code only — existing DB columns keep their names to avoid migration)
"Stress: 72%" → "Readiness: 72%"
"Your stress score is X" → "Based on your inputs, we recommend:"
"Stress score calculated" → "Session personalised"

For the display of the score value:
REMOVE any display that shows it as a percentage of stress
REPLACE with: "Session type recommended based on your inputs"

In breathingStore.ts or similar — the stressScore field can remain
as the variable name for internal computation but must NEVER be
displayed to the user as "stress score" — only "session readiness."

Step 6.2 — Remove health outcome claims from breathing reward screen

Find the breathing reward screen (app/breathing/reward.tsx or similar).

REMOVE these specific strings or patterns:
"Stress reduced by X%" → REMOVE ENTIRELY or replace with "Session completed"
"Heart rhythm stabilised" → REMOVE (medical claim)
"Your nervous system is resetting" → Replace with "You completed your session"
"Stress ↓ X%" → REMOVE

REPLACE reward screen with factual session data only:
"X cycles completed"
"X minutes of guided breathing"
"Session complete"
"[X] XP earned"

ADD at bottom of reward screen:
<LegalDisclaimer
  text={LEGAL.BREATHING_EXERCISE_DISCLAIMER}
  variant="footer"
/>

Step 6.3 — Add breathing disclaimer to session start

In the breathing exercise selection, before a session starts, show:
(Use AsyncStorage — show once per exercise type, not every time)

<LegalDisclaimer
  text={LEGAL.BREATHING_EXERCISE_DISCLAIMER}
  variant="banner"
/>

Step 6.4 — Add home remedies disclaimer

Find the home remedies screen or component.
Add at the TOP of the screen (always visible, not collapsed):

<LegalDisclaimer
  text={LEGAL.HOME_REMEDIES_DISCLAIMER}
  variant="card"
/>

Also add a compact disclaimer at the bottom of each expanded remedy:
<LegalDisclaimer
  text={LEGAL.SHORT_DISCLAIMER}
  variant="footer"
/>

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PHASE 7 — TELEHEALTH LEGAL RESTRUCTURING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Step 7.1 — Find the telehealth specialist screens

find app -name "*telehealth*" -o -name "*specialist*" -o -name "*consult*" 2>/dev/null | grep -v node_modules
grep -r "specialist\|telehealth\|consultation\|booking" app/ components/ --include="*.tsx" -l

Show the specialist list screen and specialist profile screen.

Step 7.2 — Add platform notice to telehealth hub

At the TOP of the main telehealth screen (above the specialist list):

<View style={platformNoticeStyle}>
  <Text style={platformNoticeTitleStyle}>Telehealth Marketplace</Text>
  <Text style={platformNoticeBodyStyle}>
    {LEGAL.TELEHEALTH_PLATFORM_NOTICE}
  </Text>
</View>

Style: card with teal accent border, subtle background

Step 7.3 — Add jurisdiction badge to each specialist card

In the specialist list card component, add after the specialist's title:

<View style={jurisdictionBadgeContainer}>
  <Text style={jurisdictionLabelStyle}>
    {LEGAL.GEOGRAPHIC_RESTRICTION_NOTICE}
  </Text>
  {specialist.licensed_jurisdictions?.map((j: string) => (
    <View key={j} style={jurisdictionPill}>
      <Text style={jurisdictionPillText}>{j}</Text>
    </View>
  ))}
</View>

Step 7.4 — Implement patient geography verification before booking

In the booking flow (when user taps "Book Consultation"):

BEFORE the payment or scheduling step, add a location verification step:

const handleBookingAttempt = async (specialist: Specialist) => {
  const { data: profile } = await supabase
    .from('profiles')
    .select('health_profile')
    .eq('id', userId)
    .single();

  const userCountry = profile?.health_profile?.country ?? null;

  if (!userCountry) {
    // Ask user to confirm their location
    Alert.alert(
      'Confirm Your Location',
      'To ensure this specialist is licensed to consult with you, please confirm which country you are currently located in.',
      [
        { text: 'Set My Location', onPress: () => router.push('/settings/location') },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
    return;
  }

  const licensedJurisdictions = specialist.licensed_jurisdictions ?? [];

  const isLicensed = licensedJurisdictions.some(
    (j: string) => j.toLowerCase() === userCountry.toLowerCase()
  );

  if (!isLicensed && licensedJurisdictions.length > 0) {
    Alert.alert(
      'Jurisdiction Notice',
      LEGAL.JURISDICTION_MISMATCH_WARNING + '\n\nThis specialist is licensed in: ' +
      licensedJurisdictions.join(', ') + '\n\nYour confirmed location: ' + userCountry,
      [
        { text: 'Find Other Specialists', onPress: () => {} },
        {
          text: 'I Understand — Continue Anyway',
          style: 'destructive',
          onPress: () => proceedToBooking(specialist),
        },
      ]
    );
    return;
  }

  proceedToBooking(specialist);
};

Note: The "Continue Anyway" option is retained because cross-border
consultations are not universally prohibited — some jurisdictions
allow them. The warning fulfils TruWell AI's due diligence obligation.
The user assumes responsibility if they proceed with full knowledge.

Step 7.5 — Add telehealth disclaimer to booking confirmation

Before the payment step, display a confirmation screen that includes:

<LegalDisclaimer
  text={LEGAL.TELEHEALTH_PLATFORM_NOTICE}
  variant="card"
/>

And a checkbox the user must tick:

[ ] I understand that TruWell AI is a technology platform and
    is not responsible for the clinical judgement of the
    healthcare professional I am consulting with.

This checkbox must be ticked to proceed to payment.
Log this confirmation in the booking record with a timestamp.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PHASE 8 — ONBOARDING LEGAL RESTRUCTURING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Step 8.1 — Find onboarding wizard screens

find app components -name "*onboarding*" -o -name "*wizard*" -o -name "*welcome*" 2>/dev/null | grep -v node_modules

Show the content of each wizard step file.

Step 8.2 — Update age confirmation step

Find the step that asks the user to confirm their age or
the Terms of Service acceptance step.

The age confirmation MUST be:
1. A STANDALONE checkbox (not combined with ToS)
2. The text must use LEGAL.AGE_CONFIRMATION_TEXT exactly
3. Cannot be pre-checked
4. Must be required to proceed
5. The confirmation timestamp must be stored in the profile

If no age confirmation step exists: ADD one as the first wizard step.

Step that captures age confirmation must:

const [ageConfirmed, setAgeConfirmed] = useState(false);

// On step completion:
await supabase.from('profiles').update({
  age_confirmed: true,
  age_confirmed_at: new Date().toISOString(),
}).eq('id', userId);

Step 8.3 — Update Terms of Service acceptance

The ToS acceptance checkbox must link to the actual Terms of Service.
Find where ToS is accepted in onboarding.

The ToS checkbox text must include a tappable link:

<Text style={tosText}>
  I have read and agree to TruWell AI's{' '}
  <Text
    style={tosLinkStyle}
    onPress={() => Linking.openURL('https://truwell.ai/terms-and-conditions')}
  >
    Terms of Service
  </Text>
  {' '}and{' '}
  <Text
    style={tosLinkStyle}
    onPress={() => Linking.openURL('https://truwell.ai/privacy-policy')}
  >
    Privacy Policy
  </Text>
  .
</Text>

Step 8.4 — Add health data consent before health profile step

In the onboarding wizard, the step BEFORE the health profile wizard step
(conditions, allergens, medications) must show HealthDataConsentModal.

const [consentGiven, setConsentGiven] = useState(false);
const [showConsentModal, setShowConsentModal] = useState(false);

Before health profile steps render:
if (!consentGiven) {
  return (
    <HealthDataConsentModal
      visible={true}
      userId={userId}
      onConsented={() => setConsentGiven(true)}
      onDeclined={() => {
        setConsentGiven(false);
        // Skip health profile steps, go to final step
        goToStep(FINAL_STEP);
      }}
    />
  );
}

Add the AlsoAdd: Add LEGAL.APP_NOT_MEDICAL_DEVICE as a small footer line
on the onboarding welcome/splash screen:
<Text style={styles.nonMedicalNote}>{LEGAL.APP_NOT_MEDICAL_DEVICE}</Text>

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PHASE 9 — DATA DELETION IMPLEMENTATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Step 9.1 — Find settings screen

Find where account settings and deletion options live in the app.
Look in app/(tabs)/profile.tsx and app/settings/ directory.

Step 9.2 — Create lib/accountDeletion.ts

---
import { supabase } from './supabase';
import { Alert } from 'react-native';

export async function requestAccountDeletion(userId: string): Promise<void> {
  return new Promise((resolve, reject) => {
    Alert.alert(
      'Delete Account and All Data',
      'This action is permanent and cannot be undone.\n\nThe following will be permanently deleted:\n• Your health profile and all health data\n• Your complete scan history\n• All AI conversation history\n• Your telehealth consultation records\n• Your breathing session history\n• Your account and login credentials\n\nThis process begins immediately and completes within 30 days in compliance with data protection law.\n\nAre you absolutely certain?',
      [
        { text: 'Cancel', style: 'cancel', onPress: () => resolve() },
        {
          text: 'Delete Everything',
          style: 'destructive',
          onPress: async () => {
            try {
              await executeAccountDeletion(userId);
              resolve();
            } catch (err) {
              reject(err);
            }
          },
        },
      ]
    );
  });
}

async function executeAccountDeletion(userId: string): Promise<void> {
  const deletionTimestamp = new Date().toISOString();

  // Step 1: Mark account for deletion (audit trail)
  await supabase.from('profiles').update({
    deletion_requested: true,
    deletion_requested_at: deletionTimestamp,
    subscription_plan: 'free',
  }).eq('id', userId);

  // Step 2: Purge all health-related data immediately
  const tablesToPurge = [
    'usage_quotas',
    'scan_history',
    'breathing_sessions',
    'breathing_progress',
    'stress_history',
    'predictive_reports',
    'subscription_events',
    'watchlist_disputes',
  ];

  for (const table of tablesToPurge) {
    const { error } = await supabase
      .from(table)
      .delete()
      .eq('user_id', userId);

    if (error) {
      console.error(`[accountDeletion] error purging ${table}:`, error.message);
    }
  }

  // Step 3: Anonymise profile (do not delete — needed for audit/billing records)
  await supabase.from('profiles').update({
    display_name: '[Deleted User]',
    health_profile: null,
    founder_member: false,
    health_data_consent_given: false,
  }).eq('id', userId);

  // Step 4: Sign out
  await supabase.auth.signOut();

  Alert.alert(
    'Account Deletion Initiated',
    'Your health data has been deleted immediately. Your account and all remaining data will be fully removed within 30 days. If you subscribed via the App Store, please also cancel your subscription through your Apple ID or Google Play account to stop future charges.'
  );
}
---

Add deletion columns to profiles in Supabase:
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS deletion_requested BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS deletion_requested_at TIMESTAMPTZ;

Step 9.3 — Add deletion option to settings

In app/(tabs)/profile.tsx or app/settings/ wherever account settings appear:

Import requestAccountDeletion from '@/lib/accountDeletion'

Add a "Delete Account" button in a "Danger Zone" section:

<View style={dangerZoneStyle}>
  <Text style={dangerZoneTitleStyle}>Danger Zone</Text>
  <TouchableOpacity
    style={deleteAccountBtnStyle}
    onPress={() => requestAccountDeletion(userId)}
  >
    <Text style={deleteAccountTextStyle}>Delete Account and All Data</Text>
  </TouchableOpacity>
  <Text style={deleteAccountNoteStyle}>
    This permanently deletes your health data, scan history, and account.
    Cannot be undone.
  </Text>
</View>

Step 9.4 — Add subscription cancellation instructions to settings

In the subscription settings screen or profile screen, add:

<View style={cancellationInfoStyle}>
  <Text style={cancellationTitleStyle}>Manage Subscription</Text>
  <Text style={cancellationBodyStyle}>
    {LEGAL.SUBSCRIPTION_CANCELLATION_NOTICE}
  </Text>
  <TouchableOpacity
    onPress={() => Linking.openURL('https://truwell.ai/support')}
  >
    <Text style={cancellationLinkStyle}>Contact Support</Text>
  </TouchableOpacity>
</View>

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PHASE 10 — EMERGENCY SERVICES INTEGRATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Step 10.1 — Find the emergency button and emergency features

grep -r "emergency\|Emergency\|first.aid\|FirstAid" \
  app/ components/ --include="*.tsx" -l

Step 10.2 — Add emergency notice to health-adjacent screens

Import EmergencyNotice from '@/components/legal/EmergencyNotice'

Add the compact EmergencyNotice to these screens:
- AI Health Assistant screen (compact version, below the input field)
- Scan result screen (compact, at very bottom)
- Home remedies screen (compact, at top)
- Breathing panic mode screen (full version)

Pattern for compact emergency notice:
<EmergencyNotice compact />

Step 10.3 — Verify emergency feature already shows emergency numbers

Find the existing emergency sheet or emergency feature.
Confirm it displays:
- Nigeria: 112 or 767
- UK: 999
- USA: 911

If any are missing, add them.
Add: <EmergencyNotice /> to the emergency hub screen itself.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PHASE 11 — SUBSCRIPTION PAYMENT COMPLIANCE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Step 11.1 — Check current subscription payment implementation

grep -r "RevenueCat\|revenuecat\|expo-iap\|purchaseSubscription\|StoreKit" \
  app/ lib/ --include="*.tsx" --include="*.ts" -l

Show lib/stripe.ts or equivalent payment file completely.

Step 11.2 — If subscriptions are currently through Stripe on iOS/Android

CRITICAL: If lib/stripe.ts handles Guardian Pro, Family Plan, or Lifetime
subscriptions for mobile (not just telehealth), this is non-compliant
with Apple App Store guidelines Section 3.1.1 and Google Play billing policy.

Install RevenueCat:
npm install react-native-purchases --save
npx expo install react-native-purchases

Create lib/revenueCat.ts:

---
import Purchases, {
  PurchasesPackage,
  CustomerInfo,
  PACKAGE_TYPE,
} from 'react-native-purchases';
import { Platform } from 'react-native';
import { supabase } from './supabase';

const REVENUECAT_API_KEY_IOS = process.env.EXPO_PUBLIC_REVENUECAT_KEY_IOS ?? '';
const REVENUECAT_API_KEY_ANDROID = process.env.EXPO_PUBLIC_REVENUECAT_KEY_ANDROID ?? '';

export async function initRevenueCat(userId: string): Promise<void> {
  const apiKey = Platform.OS === 'ios'
    ? REVENUECAT_API_KEY_IOS
    : REVENUECAT_API_KEY_ANDROID;

  if (!apiKey) {
    console.warn('[RevenueCat] API key not configured');
    return;
  }

  await Purchases.configure({ apiKey });
  await Purchases.logIn(userId);
}

export async function getAvailablePackages(): Promise<PurchasesPackage[]> {
  const offerings = await Purchases.getOfferings();
  return offerings.current?.availablePackages ?? [];
}

export async function purchaseMobileSubscription(
  packageToPurchase: PurchasesPackage
): Promise<{ success: boolean; customerInfo?: CustomerInfo; error?: string }> {
  try {
    const { customerInfo } = await Purchases.purchasePackage(packageToPurchase);

    // Sync with Supabase
    const planId = mapRevenueCatPackageToPlan(packageToPurchase);
    if (planId) {
      await supabase.from('profiles').update({
        subscription_plan: planId,
        subscription_tier: 'pro',
      }).eq('id', (await supabase.auth.getUser()).data.user?.id ?? '');

      await supabase.from('subscription_events').insert({
        user_id: (await supabase.auth.getUser()).data.user?.id,
        event_type: 'purchased',
        plan: planId,
        amount_cents: getPackagePriceCents(packageToPurchase),
        created_at: new Date().toISOString(),
      });
    }

    return { success: true, customerInfo };
  } catch (err: any) {
    if (err.userCancelled) {
      return { success: false, error: 'cancelled' };
    }
    console.error('[RevenueCat] purchase error:', err);
    return { success: false, error: err.message ?? 'Purchase failed' };
  }
}

export async function restorePurchases(): Promise<CustomerInfo> {
  return Purchases.restorePurchases();
}

function mapRevenueCatPackageToPlan(pkg: PurchasesPackage): string | null {
  switch (pkg.packageType) {
    case PACKAGE_TYPE.MONTHLY: return 'pro_monthly';
    case PACKAGE_TYPE.ANNUAL: return 'pro_yearly';
    case PACKAGE_TYPE.LIFETIME: return 'lifetime';
    default:
      if (pkg.identifier.includes('family')) return 'family';
      return null;
  }
}

function getPackagePriceCents(pkg: PurchasesPackage): number {
  return Math.round(pkg.product.price * 100);
}
---

Add to .env:
EXPO_PUBLIC_REVENUECAT_KEY_IOS=appl_xxxxx
EXPO_PUBLIC_REVENUECAT_KEY_ANDROID=goog_xxxxx

Note: RevenueCat account must be created at app.revenuecat.com
Products must be configured in App Store Connect and Google Play Console
before this works. Telehealth payments continue using Stripe (legal).

Step 11.3 — Update subscription screen to use RevenueCat for iOS/Android

In app/settings/subscription.tsx:
Replace Stripe purchase calls for subscription products
with purchaseMobileSubscription() from lib/revenueCat.ts

Keep purchaseTelehealth() using Stripe — telehealth is exempt.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PHASE 12 — FINAL LANGUAGE AUDIT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Step 12.1 — Search for and replace remaining high-risk language

Run these searches and REPLACE every match found:

grep -rn "diagnos\|diagnose\|diagnosis" app/ components/ --include="*.tsx"
→ Remove or replace with "helps you understand" or "provides information about"

grep -rn "treat\|treatment\|treats" app/ components/ --include="*.tsx"
→ Remove treatment claims. Replace "treats X" with "is used in research on X"

grep -rn "cure\|cures\|healing" app/ components/ --include="*.tsx"
→ Remove cure claims. Replace with "supports wellness" if the context requires it

grep -rn "guarantee\|guaranteed\|certif" app/ components/ --include="*.tsx"
→ Remove guarantee language. Replace with "based on available research"

grep -rn "safe for\|safe to\|definitely safe\|completely safe" \
  app/ components/ --include="*.tsx"
→ Replace with "no significant regulatory restrictions identified" or
  "not listed in major regulatory ban/restriction databases"

grep -rn "dangerous\|harmful\|toxic" app/ components/ --include="*.tsx"
→ Replace with "has regulatory restrictions" or "has adverse research profiles"
  Always cite the specific regulation or research basis

grep -rn "100%\|absolutely\|always works\|proven to" \
  app/ components/ --include="*.tsx"
→ Remove absolute claims in health contexts. Use "research suggests" instead

Step 12.2 — Add governing law notice to Terms of Service display

Find where Terms of Service is displayed in-app.
Add at the very bottom of the ToS text:

<Text style={governingLawStyle}>
  {LEGAL.TERMS_GOVERNING_LAW}
</Text>

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PHASE 13 — TYPESCRIPT AND BUILD VERIFICATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Step 13.1 — TypeScript check

Run: npx tsc --noEmit
Expected: Zero errors. Fix every error. Do not use @ts-ignore.

Step 13.2 — Confirm all imports are resolved

grep -r "from '@/components/legal\|from '@/lib/legalContent" \
  app/ components/ --include="*.tsx"

Every import should resolve without error.

Step 13.3 — Build and run

npx expo start --clear then Ctrl+C
npx expo run:android

Step 13.4 — Legal compliance verification checklist

Test each item and report PASS or FAIL:

[ ] 1. Open AI Health Assistant fresh (clear AsyncStorage first)
    → Disclaimer modal appears before chat
    → Cannot close without tapping "I Understand"
    PASS or FAIL?

[ ] 2. Send any AI message
    → AI response has "AI-generated · Educational only" badge
    → AI response ends with educational disclaimer footer
    → AI does not make any diagnostic or treatment claims
    PASS or FAIL?

[ ] 3. Scan any product
    → Safety grade shows legal disclaimer below it
    → Scan result page shows compact emergency notice
    → "Predictive" language is gone — replaced with "Ingredient Research"
    PASS or FAIL?

[ ] 4. Open Global Watchlist alert
    → Shows "Restricted under [specific regulation citation]" not just "Banned"
    → Shows regulatory source citation
    → Shows watchlist disclaimer
    → Shows "Is this information incorrect?" dispute button
    PASS or FAIL?

[ ] 5. Go through fresh onboarding signup
    → Age confirmation checkbox appears as standalone step
    → Health data consent modal appears before health profile setup
    → Both checkboxes required to proceed — cannot be skipped by tapping CTA
    PASS or FAIL?

[ ] 6. Open Expert dashboard Clinical Notes tab
    → Tab is labelled "Notes" not "Rx" or "Prescriptions"
    → Clinical notes disclaimer appears at top of screen
    → No "Issue Prescription" or "Send to Pharmacy" buttons exist
    PASS or FAIL?

[ ] 7. Open Telehealth specialist list
    → Platform notice appears at top
    → Each specialist card shows jurisdiction badge
    → Tapping "Book" triggers location verification if country not set
    → Jurisdiction mismatch shows warning before proceeding
    PASS or FAIL?

[ ] 8. Open Breathing Hub → complete a session
    → Breathing disclaimer shows before first session
    → Reward screen does NOT say "Stress reduced by X%"
    → Reward screen shows sessions completed and XP only
    PASS or FAIL?

[ ] 9. Open Home Remedies
    → Legal disclaimer visible at top of screen (always visible, not collapsed)
    → Each expanded remedy has short disclaimer at bottom
    PASS or FAIL?

[ ] 10. Open Settings → look for account deletion
    → "Delete Account and All Data" option exists in settings
    → Tapping shows confirmation with detailed list of what will be deleted
    → Confirms deletion process and signs out
    PASS or FAIL?

[ ] 11. Open Settings → Subscription
    → Cancellation instructions visible
    → States how to cancel on iOS (Apple ID) and Android (Google Play)
    → Contact support link present
    PASS or FAIL?

[ ] 12. Subscription purchase flow (iOS)
    → Purchase goes through RevenueCat / StoreKit not Stripe
    → Stripe is only used for telehealth consultations
    PASS or FAIL?

[ ] 13. Check stress score is gone as displayed metric
    → No screen shows "Stress Score: X" or "Stress: X%"
    → Breathing recommendation shows "Based on your inputs:" not stress score
    PASS or FAIL?

[ ] 14. TypeScript — zero errors
    Run: npx tsc --noEmit
    PASS or FAIL?

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PHASE 14 — FINAL REPORT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

After all 14 phases complete and all checklist tests pass:

Generate this report:

TRUWELL AI LEGAL COMPLIANCE IMPLEMENTATION REPORT
Date: [today]
TypeScript: ZERO ERRORS

FILES CREATED:
- List every new file

FILES MODIFIED:
- List every modified file with what changed

FEATURES RESTRUCTURED:
- Prescription feature → Clinical Notes: [DONE]
- Stress Score display removed: [DONE]
- Predictive Impact Reports → Ingredient Research Summaries: [DONE]
- Watchlist "banned" → regulatory citation language: [DONE]

LEGAL COMPONENTS ADDED:
- LegalDisclaimer: [screens where added]
- AIDisclosureBadge: [screens where added]
- HealthDataConsentModal: [where integrated]
- EmergencyNotice: [screens where added]
- WatchlistDisputeButton: [where integrated]

CHECKLIST RESULTS:
Tests 1-14: [PASS/FAIL for each]

OUTSTANDING ITEMS (require external action, not code):
1. Apple App Store IAP — RevenueCat configured in code.
   Action needed: Create RevenueCat account, configure products
   in App Store Connect and Google Play Console, add API keys to .env

2. Supabase DPA — must be signed in Supabase dashboard

3. ICO registration (UK) — gov.uk/data-protection/make-a-notification

4. Trademark applications — file at gov.uk/apply-for-a-trademark

5. Legal opinion on prescription feature — engage Nigerian solicitor

6. EWG data licensing — contact partnerships@ewg.org

7. Anthropic enterprise agreement — contact enterprise@anthropic.com

VERDICT: [LEGALLY COMPLIANT AT CODE LEVEL] or [ISSUES REMAINING]
