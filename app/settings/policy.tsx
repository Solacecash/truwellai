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

function TableRow({ label, value }: { label: string; value: string }) {
  const { theme } = useTheme();
  return (
    <View style={[s.tableRow, { borderBottomColor: theme.border }]}>
      <Text style={[s.tableLabel, { color: theme.text3 }]}>{label}</Text>
      <Text style={[s.tableValue, { color: theme.text1 }]}>{value}</Text>
    </View>
  );
}

export default function PolicyScreen() {
  const { theme } = useTheme();
  const router = useRouter();

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: theme.bg0 }]} edges={['top']}>
      <BackHeader title="Privacy Policy" onBack={() => router.back()} />

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={[s.headerCard, { backgroundColor: theme.bg1, borderColor: theme.border }]}>
          <Text style={[s.appName, { color: theme.teal }]}>TruWell AI</Text>
          <Text style={[s.headerSub, { color: theme.text3 }]}>Privacy Policy</Text>
          <View style={[s.datePill, { backgroundColor: `${theme.teal}12`, borderColor: `${theme.teal}30` }]}>
            <Text style={[s.dateText, { color: theme.teal }]}>Effective: {EFFECTIVE_DATE}</Text>
          </View>
        </View>

        <Section title="Overview">
          <Para>
            TruWell AI Ltd ("we", "our", "us") is committed to protecting your privacy. This Policy
            explains what data we collect, why we collect it, how we use it, and your rights over
            that data. We comply with the General Data Protection Regulation (GDPR), the UK GDPR,
            and applicable data protection laws worldwide.
          </Para>
        </Section>

        <Section title="1. Data We Collect">
          <Para>When you use TruWell AI, we may collect:</Para>
          <Bullet>Account information: name, email address, password (hashed), date of birth</Bullet>
          <Bullet>Health profile: age, biological sex, medical conditions, allergens, activity level, medications, supplements</Bullet>
          <Bullet>Scan history: barcodes scanned, ingredient analysis results, timestamps</Bullet>
          <Bullet>Wellness data: wellness scores, meal plans, diet preferences</Bullet>
          <Bullet>Device information: device model, OS version, app version, unique device identifiers</Bullet>
          <Bullet>Usage analytics: features used, screens viewed, session duration (anonymized)</Bullet>
          <Bullet>Crash reports: technical error logs to improve app stability</Bullet>
          <Bullet>For Healthcare Professionals: specialty, license number, institution details, patient interaction records (within the App)</Bullet>
        </Section>

        <Section title="2. How We Use Your Data">
          <Para>We use your data to:</Para>
          <Bullet>Provide, personalize, and improve the TruWell AI service</Bullet>
          <Bullet>Deliver AI-powered ingredient analysis tailored to your health profile</Bullet>
          <Bullet>Send important service notifications and safety alerts</Bullet>
          <Bullet>Analyze anonymous usage patterns to improve features</Bullet>
          <Bullet>Comply with legal obligations and prevent fraud</Bullet>
          <Para>
            We do NOT use your health data for advertising, sell it to data brokers, or share it
            with insurance companies.
          </Para>
        </Section>

        <Section title="3. Legal Basis for Processing (GDPR)">
          <View style={[s.table, { backgroundColor: theme.bg1, borderColor: theme.border }]}>
            <TableRow label="Account & service delivery" value="Contractual necessity" />
            <TableRow label="Health profile data" value="Explicit consent" />
            <TableRow label="Analytics (anonymized)" value="Legitimate interests" />
            <TableRow label="Legal compliance" value="Legal obligation" />
            <TableRow label="Marketing communications" value="Consent (opt-in only)" />
          </View>
        </Section>

        <Section title="4. Data Sharing">
          <Para>We share data only in the following limited circumstances:</Para>
          <Bullet>With Supabase (our cloud infrastructure provider) for secure data storage</Bullet>
          <Bullet>With Anthropic (AI processing) for ingredient analysis — data is anonymized before sending</Bullet>
          <Bullet>With payment processors (Apple/Google) for subscription billing — we never see your payment card details</Bullet>
          <Bullet>With law enforcement when required by valid legal process</Bullet>
          <Para>
            All third-party service providers are bound by data processing agreements and may not
            use your data for their own purposes.
          </Para>
        </Section>

        <Section title="5. Data Storage and Security">
          <Para>
            Your data is stored on Supabase-managed secure cloud
            infrastructure. We implement:
          </Para>
          <Bullet>End-to-end encryption for sensitive health data</Bullet>
          <Bullet>AES-256 encryption at rest</Bullet>
          <Bullet>TLS 1.3 encryption in transit</Bullet>
          <Bullet>Row-level security (RLS) policies ensuring users can only access their own data</Bullet>
          <Bullet>Regular security audits and penetration testing</Bullet>
        </Section>

        <Section title="6. Data Retention">
          <Para>
            We retain your data for as long as your account is active. If you delete your account:
          </Para>
          <Bullet>Personal profile data is deleted within 30 days</Bullet>
          <Bullet>Scan history is deleted immediately</Bullet>
          <Bullet>Anonymized aggregate analytics data may be retained indefinitely</Bullet>
          <Bullet>Financial records are retained for 7 years as required by law</Bullet>
        </Section>

        <Section title="7. Your Rights">
          <Para>Under GDPR and applicable laws, you have the right to:</Para>
          <Bullet>Access: request a copy of all data we hold about you</Bullet>
          <Bullet>Rectification: correct any inaccurate or incomplete data</Bullet>
          <Bullet>Erasure: request deletion of your personal data ("right to be forgotten")</Bullet>
          <Bullet>Restriction: limit how we process your data in certain circumstances</Bullet>
          <Bullet>Portability: receive your data in a machine-readable format (use "Download My Data" in app)</Bullet>
          <Bullet>Objection: object to processing based on legitimate interests</Bullet>
          <Bullet>Withdraw consent: for any consent-based processing, at any time</Bullet>
          <Para>
            To exercise any of these rights, use the Privacy and Data section in your profile
            settings, or contact us at privacy@truwellai.xyz. We respond to all requests within
            30 days.
          </Para>
        </Section>

        <Section title="8. Children's Privacy">
          <Para>
            TruWell AI is not intended for use by anyone under 18 years of age. We do not knowingly
            collect personal information from children. If you believe a child has provided us with
            personal information, please contact us immediately and we will delete it.
          </Para>
        </Section>

        <Section title="9. Cookies and Tracking">
          <Para>
            The mobile app does not use browser cookies. We use anonymized analytics through
            Supabase's built-in analytics only. You can disable analytics in your Privacy and
            Data settings at any time.
          </Para>
        </Section>

        <Section title="10. International Transfers">
          <Para>
            If your data is transferred internationally, such transfers
            are protected by appropriate safeguards including Standard
            Contractual Clauses or equivalent mechanisms recognised
            under applicable data protection law.
          </Para>
        </Section>

        <Section title="11. Changes to This Policy">
          <Para>
            We may update this Privacy Policy periodically. Material changes will be communicated
            via in-app notification at least 14 days before taking effect. Your continued use of
            the App after changes constitutes acceptance of the updated Policy.
          </Para>
        </Section>

        <Section title="12. Contact and DPO">
          <Para>
            For privacy questions, to exercise your rights, or to contact our Data Protection
            Officer:
          </Para>
          <Para>
            Privacy Team: privacy@truwellai.xyz{'\n'}
            Support: support@truwellai.xyz{'\n'}
            Website: https://truwellai.xyz/privacy{'\n'}
            TruWell AI Ltd, United Kingdom
          </Para>
          <Para>
            You also have the right to lodge a complaint with your local data protection authority
            (e.g. the ICO in the UK: ico.org.uk).
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

  table: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
  },
  tableRow: {
    flexDirection: 'row',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  tableLabel: { flex: 1, fontSize: 12, fontWeight: '600', lineHeight: 18 },
  tableValue: { flex: 1, fontSize: 12, fontWeight: '700', lineHeight: 18, textAlign: 'right' },
});
