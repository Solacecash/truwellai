import { BackHeader } from '@/components/ui/BackHeader';
import { useTheme } from '@/theme/ThemeContext';
import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const EFFECTIVE_DATE = 'June 11, 2026';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const { theme } = useTheme();
  return (
    <View style={s.section}>
      <Text style={[s.sectionTitle, { color: theme.teal }]}>{title}</Text>
      {children}
    </View>
  );
}

function Para({ children }: { children: React.ReactNode }) {
  const { theme } = useTheme();
  return <Text style={[s.para, { color: theme.text2 }]}>{children}</Text>;
}

function Bullet({ children }: { children: string }) {
  const { theme } = useTheme();
  return (
    <View style={s.bulletRow}>
      <Text style={[s.bulletDot, { color: theme.teal }]}>•</Text>
      <Text style={[s.bulletText, { color: theme.text2 }]}>{children}</Text>
    </View>
  );
}

export default function TermsScreen() {
  const { theme } = useTheme();
  const router = useRouter();

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: theme.bg0 }]} edges={['top']}>
      <BackHeader title="Terms of Service" onBack={() => router.back()} />

      <ScrollView
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={[s.headerCard, { backgroundColor: theme.bg1, borderColor: theme.border }]}>
          <Text style={[s.appName, { color: theme.teal }]}>TruWell AI</Text>
          <Text style={[s.headerSub, { color: theme.text3 }]}>Terms of Service</Text>
          <View style={[s.datePill, { backgroundColor: `${theme.teal}12`, borderColor: `${theme.teal}30` }]}>
            <Text style={[s.dateText, { color: theme.teal }]}>Effective: {EFFECTIVE_DATE}</Text>
          </View>
        </View>

        <Section title="1. Acceptance of Terms">
          <Para>
            By downloading, installing, or using the TruWell AI mobile application ("App"), you agree
            to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, do
            not use the App. These Terms constitute a legally binding agreement between you and
            Alpha Earn LLC ("Company", "we", "us", or "our").
          </Para>
        </Section>

        <Section title="2. Description of Service">
          <Para>
            TruWell AI is a health and wellness platform that provides:
          </Para>
          <Bullet>Barcode scanning and AI-powered ingredient analysis</Bullet>
          <Bullet>Personalized health recommendations and diet planning</Bullet>
          <Bullet>SafeCircle community health network</Bullet>
          <Bullet>Wellness tracking and health profile management</Bullet>
          <Para>
            The App is available in two modes: Member (Family Guardian) and Healthcare Professional
            (Expert). Each mode has its own dedicated dashboard and feature set.
          </Para>
        </Section>

        <Section title="3. Medical Disclaimer">
          <Para>
            TRUWELL AI IS NOT A MEDICAL DEVICE AND DOES NOT PROVIDE MEDICAL ADVICE, DIAGNOSIS, OR
            TREATMENT. All content, including ingredient analyses, wellness scores, and AI
            recommendations, is for informational purposes only.
          </Para>
          <Para>
            Always consult a qualified healthcare professional before making any health decisions.
            Never disregard professional medical advice or delay seeking it because of information
            obtained through TruWell AI.
          </Para>
        </Section>

        <Section title="4. User Accounts">
          <Para>
            To use most features, you must create an account. You agree to:
          </Para>
          <Bullet>Provide accurate, current, and complete information during registration</Bullet>
          <Bullet>Maintain the security of your password and accept responsibility for all activity under your account</Bullet>
          <Bullet>Notify us immediately of any unauthorized use of your account</Bullet>
          <Bullet>Be at least 18 years of age (or the legal age of majority in your jurisdiction)</Bullet>
          <Para>
            You may not create an account on behalf of another person without their explicit consent.
            Healthcare Professionals must hold valid, active licenses in their jurisdiction and are
            responsible for maintaining credential accuracy within the App.
          </Para>
        </Section>

        <Section title="5. Subscriptions and Payments">
          <Para>
            TruWell AI offers a free tier and a paid TruWell AI subscription. Paid subscriptions
            are billed on a monthly or annual basis and are processed through Apple App Store or
            Google Play Store.
          </Para>
          <Bullet>Subscriptions automatically renew unless cancelled at least 24 hours before the renewal date</Bullet>
          <Bullet>You may manage or cancel your subscription through your device's App Store / Play Store account settings</Bullet>
          <Bullet>Refunds are subject to the refund policy of the relevant App Store</Bullet>
          <Bullet>We reserve the right to modify pricing with 30 days advance notice</Bullet>
          <Para>
            "Founding Member" pricing reflects our intention to honour early supporter pricing for as
            long as technically and commercially feasible. Pricing is subject to applicable App Store
            and Play Store terms and may change with 30 days advance notice to active subscribers.
          </Para>
        </Section>

        <Section title="6. Health Data and Privacy">
          <Para>
            You retain ownership of all health data you input into the App. By using TruWell AI,
            you grant us a limited license to process this data solely to provide the services
            described in these Terms.
          </Para>
          <Para>
            We do not sell your personal health data to third parties. Data is processed in
            accordance with our Privacy Policy, GDPR (EU users), and applicable data protection laws.
            Health data is stored end-to-end encrypted on servers located in the European Union.
          </Para>
        </Section>

        <Section title="7. Acceptable Use">
          <Para>You agree not to:</Para>
          <Bullet>Use the App for any unlawful purpose or in violation of any regulations</Bullet>
          <Bullet>Attempt to gain unauthorized access to any part of the App or its infrastructure</Bullet>
          <Bullet>Upload false, misleading, or fraudulent health information</Bullet>
          <Bullet>Impersonate any person, including healthcare professionals</Bullet>
          <Bullet>Transmit malware, viruses, or any other malicious code</Bullet>
          <Bullet>Use the App to harass, harm, or abuse other users</Bullet>
          <Bullet>Reverse engineer, decompile, or disassemble the App</Bullet>
        </Section>

        <Section title="8. Intellectual Property">
          <Para>
            The App, including its design, features, algorithms, content, and trademarks, is owned
            by Alpha Earn LLC and protected by copyright, trademark, and other intellectual property
            laws. You may not reproduce, distribute, or create derivative works without our express
            written permission.
          </Para>
          <Para>
            User-generated content (such as SafeCircle posts) remains your property. By posting,
            you grant TruWell AI a non-exclusive, royalty-free license to display and distribute
            that content within the App.
          </Para>
        </Section>

        <Section title="9. Limitation of Liability">
          <Para>
            TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, TRUWELL AI SHALL NOT BE LIABLE FOR
            ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES ARISING FROM YOUR
            USE OF OR INABILITY TO USE THE APP.
          </Para>
          <Para>
            Our total liability to you for any claims arising out of or related to these Terms or
            the App shall not exceed the amount you paid to us in the 12 months preceding the claim.
          </Para>
        </Section>

        <Section title="10. Termination">
          <Para>
            We may suspend or terminate your account at any time for violation of these Terms,
            without prior notice. You may delete your account at any time through the app's
            Privacy and Data settings. Upon termination, your right to use the App ceases
            immediately.
          </Para>
        </Section>

        <Section title="11. Changes to Terms">
          <Para>
            We reserve the right to modify these Terms at any time. Material changes will be
            communicated via in-app notification or email at least 14 days before taking effect.
            Continued use of the App after changes constitutes acceptance of the revised Terms.
          </Para>
        </Section>

        <Section title="12. Governing Law">
          <Para>
            These Terms are governed by the laws of the State of [your state], United States.
          </Para>
        </Section>

        <Section title="13. Contact Us">
          <Para>
            For questions about these Terms, please contact us at:
          </Para>
          <Para>
            Alpha Earn LLC{'\n'}
            support@truwellai.xyz{'\n'}
            https://truwellai.xyz
          </Para>
        </Section>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:   { flex: 1 },
  scroll: { paddingBottom: 48, paddingTop: 8 },

  headerCard: {
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 4,
    padding: 20,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    gap: 4,
  },
  appName:   { fontSize: 22, fontWeight: '900', letterSpacing: -0.5 },
  headerSub: { fontSize: 13, fontWeight: '500' },
  datePill: {
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
  },
  dateText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.2 },

  section: {
    marginHorizontal: 16,
    marginTop: 20,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: -0.2,
    marginBottom: 2,
  },
  para: {
    fontSize: 13,
    lineHeight: 21,
    fontWeight: '400',
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    paddingLeft: 4,
  },
  bulletDot:  { fontSize: 14, lineHeight: 21, fontWeight: '800' },
  bulletText: { flex: 1, fontSize: 13, lineHeight: 21, fontWeight: '400' },
});
