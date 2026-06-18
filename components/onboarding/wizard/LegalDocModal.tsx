/**
 * LegalDocModal — renders Terms of Service or Privacy Policy in a native Modal.
 *
 * Why a Modal instead of router.push:
 * The wizard is an Animated.View at zIndex 200. Calling router.push from within
 * it navigates behind the overlay and the screen is never seen. React Native's
 * Modal renders at the OS window level, above all JavaScript view hierarchy and
 * zIndex stacking, so it always appears correctly from inside any overlay.
 */
import React, { memo } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

import { OB } from '../tokens';

export type LegalDocType = 'terms' | 'privacy';

type Props = {
  visible: boolean;
  type: LegalDocType;
  onClose: () => void;
};

// ---------------------------------------------------------------------------
// Shared sub-components (dark theme, using OB tokens)
// ---------------------------------------------------------------------------

function H({ children }: { children: string }) {
  return <Text style={s.heading}>{children}</Text>;
}
function P({ children }: { children: React.ReactNode }) {
  return <Text style={s.para}>{children}</Text>;
}
function B({ children }: { children: string }) {
  return (
    <View style={s.bulletRow}>
      <Text style={s.bulletDot}>•</Text>
      <Text style={s.bulletText}>{children}</Text>
    </View>
  );
}
function TableRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={s.tableRow}>
      <Text style={s.tableLabel}>{label}</Text>
      <Text style={s.tableValue}>{value}</Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Document content
// ---------------------------------------------------------------------------

function TermsContent() {
  return (
    <>
      <H>1. Acceptance of Terms</H>
      <P>
        By downloading, installing, or using the TruWell AI mobile application ("App"), you agree to be
        bound by these Terms of Service. If you do not agree, do not use the App. These Terms constitute
        a legally binding agreement between you and TruWell AI Ltd ("Company", "we", "us", "our").
      </P>

      <H>2. Description of Service</H>
      <P>TruWell AI is a health and wellness platform that provides:</P>
      <B>Barcode scanning and AI-powered ingredient analysis</B>
      <B>Personalized health recommendations and diet planning</B>
      <B>SafeCircle community health network</B>
      <B>Wellness tracking and health profile management</B>
      <P>
        The App is available in two modes: Member (Family Guardian) and Healthcare Professional (Expert).
      </P>

      <H>3. Medical Disclaimer</H>
      <P>
        TRUWELL AI IS NOT A MEDICAL DEVICE AND DOES NOT PROVIDE MEDICAL ADVICE, DIAGNOSIS, OR TREATMENT.
        All content is for informational purposes only.
      </P>
      <P>
        Always consult a qualified healthcare professional before making health decisions. Never disregard
        professional medical advice because of information obtained through TruWell AI.
      </P>

      <H>4. User Accounts</H>
      <P>To use most features, you must create an account. You agree to:</P>
      <B>Provide accurate, current, and complete information during registration</B>
      <B>Maintain the security of your password and accept responsibility for all activity under your account</B>
      <B>Be at least 18 years of age (or the legal age of majority in your jurisdiction)</B>

      <H>5. Subscriptions and Payments</H>
      <P>TruWell AI offers a free tier and a paid subscription billed monthly or annually.</P>
      <B>Subscriptions automatically renew unless cancelled 24 hours before renewal</B>
      <B>Manage or cancel through your App Store / Play Store account settings</B>
      <B>Refunds are subject to the relevant App Store refund policy</B>

      <H>6. Health Data and Privacy</H>
      <P>
        You retain ownership of all health data you input. We do not sell your personal health data to
        third parties. Data is stored end-to-end encrypted in the EU in accordance with our Privacy Policy.
      </P>

      <H>7. Acceptable Use</H>
      <P>You agree not to:</P>
      <B>Use the App for any unlawful purpose</B>
      <B>Upload false, misleading, or fraudulent health information</B>
      <B>Impersonate any person, including healthcare professionals</B>
      <B>Reverse engineer, decompile, or disassemble the App</B>

      <H>8. Intellectual Property</H>
      <P>
        The App, including its design, features, algorithms, and trademarks, is owned by TruWell AI Ltd.
        You may not reproduce or distribute any part without express written permission.
      </P>

      <H>9. Limitation of Liability</H>
      <P>
        TO THE MAXIMUM EXTENT PERMITTED BY LAW, TRUWELL AI SHALL NOT BE LIABLE FOR ANY INDIRECT,
        INCIDENTAL, SPECIAL, OR CONSEQUENTIAL DAMAGES ARISING FROM USE OF THE APP.
      </P>

      <H>10. Governing Law</H>
      <P>
        These Terms are governed by the laws of England and Wales. Questions: support@truwellai.xyz
      </P>
    </>
  );
}

function PrivacyContent() {
  return (
    <>
      <H>Overview</H>
      <P>
        TruWell AI Ltd is committed to protecting your privacy. This Policy explains what data we collect,
        why we collect it, how we use it, and your rights. We comply with GDPR, UK GDPR, and applicable
        data protection laws worldwide.
      </P>

      <H>1. Data We Collect</H>
      <P>When you use TruWell AI, we may collect:</P>
      <B>Account information: name, email address, password (hashed), date of birth</B>
      <B>Health profile: age, sex, medical conditions, allergens, medications</B>
      <B>Scan history: barcodes scanned, ingredient analysis results, timestamps</B>
      <B>Wellness data: wellness scores, meal plans, diet preferences</B>
      <B>Device information: device model, OS version, unique device identifiers</B>
      <B>Usage analytics: features used, screens viewed, session duration (anonymized)</B>

      <H>2. How We Use Your Data</H>
      <P>We use your data to:</P>
      <B>Provide and personalize the TruWell AI service</B>
      <B>Deliver AI-powered ingredient analysis tailored to your health profile</B>
      <B>Analyze anonymous usage patterns to improve features</B>
      <P>We do NOT use your health data for advertising or sell it to data brokers.</P>

      <H>3. Legal Basis for Processing (GDPR)</H>
      <View style={s.table}>
        <TableRow label="Account & service delivery" value="Contractual necessity" />
        <TableRow label="Health profile data" value="Explicit consent" />
        <TableRow label="Analytics (anonymized)" value="Legitimate interests" />
        <TableRow label="Legal compliance" value="Legal obligation" />
        <TableRow label="Marketing" value="Consent (opt-in only)" />
      </View>

      <H>4. Data Sharing</H>
      <P>We share data only in limited circumstances:</P>
      <B>With Supabase (cloud infrastructure) for secure data storage</B>
      <B>With Anthropic Claude, Google Gemini, and OpenAI (AI processing) to provide personalised ingredient and health analysis — this may include relevant health profile context such as allergies and conditions, as described in our Privacy Policy</B>
      <B>With payment processors (Apple/Google) for subscription billing</B>
      <B>With law enforcement when required by valid legal process</B>

      <H>5. Data Storage and Security</H>
      <P>Your data is stored on Supabase servers in the EU (Frankfurt, Germany). We implement:</P>
      <B>End-to-end encryption for sensitive health data</B>
      <B>AES-256 encryption at rest and TLS 1.3 in transit</B>
      <B>Row-level security ensuring users can only access their own data</B>

      <H>6. Data Retention</H>
      <P>We retain your data for as long as your account is active. If you delete your account:</P>
      <B>Personal profile data is deleted within 30 days</B>
      <B>Scan history is deleted immediately</B>
      <B>Financial records are retained for 7 years as required by law</B>

      <H>7. Your Rights</H>
      <P>Under GDPR you have the right to:</P>
      <B>Access: request a copy of all data we hold about you</B>
      <B>Rectification: correct any inaccurate data</B>
      <B>Erasure: request deletion of your personal data</B>
      <B>Portability: receive your data in a machine-readable format</B>
      <B>Withdraw consent: for any consent-based processing, at any time</B>
      <P>Contact us at privacy@truwellai.xyz. We respond within 30 days.</P>

      <H>8. Children's Privacy</H>
      <P>
        TruWell AI is not intended for anyone under 18. We do not knowingly collect data from children.
        Contact us immediately if you believe a child has provided personal information.
      </P>

      <H>9. Contact and DPO</H>
      <P>
        Privacy Team: privacy@truwellai.xyz{'\n'}
        Support: support@truwellai.xyz{'\n'}
        TruWell AI Ltd, United Kingdom
      </P>
    </>
  );
}

// ---------------------------------------------------------------------------
// Modal wrapper
// ---------------------------------------------------------------------------

function LegalDocModalInner({ visible, type, onClose }: Props) {
  const insets = useSafeAreaInsets();

  const title = type === 'terms' ? 'Terms of Service' : 'Privacy Policy';

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[s.sheet, { paddingTop: Platform.OS === 'android' ? insets.top : 0 }]}>
        {/* Header bar */}
        <View style={s.header}>
          <View style={s.headerLeft}>
            <Text style={s.appName}>TruWell AI</Text>
            <Text style={s.titleText}>{title}</Text>
          </View>
          <Pressable
            onPress={onClose}
            hitSlop={12}
            style={s.closeBtn}
            accessibilityRole="button"
            accessibilityLabel="Close"
          >
            <Svg width={18} height={18} viewBox="0 0 24 24">
              <Path
                d="M18 6L6 18M6 6l12 12"
                stroke={OB.t70}
                strokeWidth={2.5}
                strokeLinecap="round"
              />
            </Svg>
          </Pressable>
        </View>

        <View style={[s.divider, { backgroundColor: OB.glassBorder }]} />

        {/* Content */}
        <ScrollView
          style={s.scroll}
          contentContainerStyle={[s.scrollContent, { paddingBottom: insets.bottom + 40 }]}
          showsVerticalScrollIndicator={false}
        >
          {type === 'terms' ? <TermsContent /> : <PrivacyContent />}
        </ScrollView>

        {/* Done button */}
        <View style={[s.footer, { paddingBottom: insets.bottom + 16 }]}>
          <Pressable onPress={onClose} style={s.doneBtn}>
            <Text style={s.doneTxt}>Done</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

export const LegalDocModal = memo(LegalDocModalInner);

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const s = StyleSheet.create({
  sheet: {
    flex: 1,
    backgroundColor: OB.navy,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 14,
    gap: 12,
  },
  headerLeft: { flex: 1, gap: 2 },
  appName: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 3,
    textTransform: 'uppercase',
    color: OB.teal,
  },
  titleText: {
    fontSize: 20,
    fontWeight: '800',
    color: OB.t100,
    letterSpacing: -0.3,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: OB.glass1,
    borderWidth: 1,
    borderColor: OB.glassBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginHorizontal: 20,
  },
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    gap: 0,
  },

  heading: {
    fontSize: 13,
    fontWeight: '800',
    color: OB.teal,
    letterSpacing: -0.1,
    marginTop: 20,
    marginBottom: 6,
  },
  para: {
    fontSize: 13,
    lineHeight: 21,
    color: OB.t70,
    marginBottom: 6,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    paddingLeft: 4,
    marginBottom: 4,
  },
  bulletDot: {
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '800',
    color: OB.teal,
  },
  bulletText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 21,
    color: OB.t70,
  },
  table: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: OB.glassBorder,
    overflow: 'hidden',
    marginBottom: 6,
  },
  tableRow: {
    flexDirection: 'row',
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: OB.glassBorder,
    gap: 12,
  },
  tableLabel: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 18,
    color: OB.t45,
  },
  tableValue: {
    flex: 1,
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 18,
    textAlign: 'right',
    color: OB.t100,
  },

  footer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: OB.glassBorder,
    backgroundColor: OB.navy,
  },
  doneBtn: {
    backgroundColor: OB.teal,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
  },
  doneTxt: {
    fontSize: 15,
    fontWeight: '800',
    color: OB.ink,
    letterSpacing: -0.2,
  },
});
