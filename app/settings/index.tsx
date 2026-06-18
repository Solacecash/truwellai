import { BackHeader } from '@/components/ui/BackHeader';
import { signOutGoogle } from '@/lib/googleAuth';
import { hapticLight } from '@/lib/haptics';
import { useOnboardingStore } from '@/stores/onboardingStore';
import { supabase } from '@/lib/supabase';
import { useTheme } from '@/theme/ThemeContext';
import { useRouter } from 'expo-router';
import { Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScrollView } from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';

// ---------------------------------------------------------------------------
// Row component
// ---------------------------------------------------------------------------

function SettingsRow({
  label,
  subtitle,
  onPress,
  destructive = false,
  theme,
}: {
  label: string;
  subtitle?: string;
  onPress: () => void;
  destructive?: boolean;
  theme: ReturnType<typeof useTheme>['theme'];
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.75}
      style={[styles.row, { borderBottomColor: theme.border }]}
    >
      <View style={styles.rowLeft}>
        <Text style={[styles.rowLabel, { color: destructive ? theme.red : theme.text1 }]}>
          {label}
        </Text>
        {subtitle ? (
          <Text style={[styles.rowSub, { color: theme.text3 }]}>{subtitle}</Text>
        ) : null}
      </View>
      {!destructive && (
        <Text style={[styles.rowChev, { color: theme.text3 }]}>›</Text>
      )}
    </TouchableOpacity>
  );
}

// ---------------------------------------------------------------------------
// Social icon buttons
// ---------------------------------------------------------------------------

function XIcon({ color }: { color: string }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill={color}>
      <Path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.747l7.73-8.835L1.254 2.25H8.08l4.253 5.622 5.911-5.622Zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </Svg>
  );
}

function LinkedInIcon({ color }: { color: string }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill={color}>
      <Path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </Svg>
  );
}

function FacebookIcon({ color }: { color: string }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill={color}>
      <Path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </Svg>
  );
}

type SocialHandle = {
  name: string;
  url: string;
  icon: (color: string) => React.ReactNode;
  brandColor: string;
};

const SOCIAL_HANDLES: SocialHandle[] = [
  {
    name: 'X (Twitter)',
    url: 'https://x.com/Truwellai',
    icon: (c) => <XIcon color={c} />,
    brandColor: '#1D9BF0',
  },
  {
    name: 'LinkedIn',
    url: 'https://www.linkedin.com/company/truwell-ai',
    icon: (c) => <LinkedInIcon color={c} />,
    brandColor: '#0A66C2',
  },
  {
    name: 'Facebook',
    url: 'https://www.facebook.com/profile.php?id=61573169953847',
    icon: (c) => <FacebookIcon color={c} />,
    brandColor: '#1877F2',
  },
];

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export default function SettingsIndexScreen() {
  const router = useRouter();
  const { theme } = useTheme();

  const signOut = async () => {
    hapticLight();
    useOnboardingStore.getState().reset();
    await signOutGoogle();
    await supabase.auth.signOut();
  };

  const openUrl = (url: string) => {
    hapticLight();
    void Linking.openURL(url);
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg0 }]} edges={['top']}>
      <BackHeader title="Settings" onBack={() => router.back()} />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* ── Account ────────────────────────────────────────────────────── */}
        <Text style={[styles.sectionLabel, { color: theme.text3 }]}>Account</Text>
        <View style={[styles.block, { backgroundColor: theme.bg1, borderColor: theme.border }]}>
          <SettingsRow
            label="Health Profile"
            subtitle="Allergies, conditions, and preferences"
            onPress={() => { hapticLight(); router.push('/settings/health-profile' as never); }}
            theme={theme}
          />
          <SettingsRow
            label="Subscription"
            subtitle="Manage your plan"
            onPress={() => { hapticLight(); router.push('/settings/subscription' as never); }}
            theme={theme}
          />
          <SettingsRow
            label="Notifications"
            subtitle="Alerts and reminders"
            onPress={() => { hapticLight(); router.push('/settings/notifications' as never); }}
            theme={theme}
          />
        </View>

        {/* ── App ────────────────────────────────────────────────────────── */}
        <Text style={[styles.sectionLabel, { color: theme.text3 }]}>App</Text>
        <View style={[styles.block, { backgroundColor: theme.bg1, borderColor: theme.border }]}>
          <SettingsRow
            label="Appearance"
            subtitle="Dark and light mode"
            onPress={() => { hapticLight(); router.push('/settings/appearance' as never); }}
            theme={theme}
          />
          <SettingsRow
            label="Privacy and Data"
            subtitle="Data sharing preferences"
            onPress={() => { hapticLight(); router.push('/settings/privacy' as never); }}
            theme={theme}
          />
          <SettingsRow
            label="Patient Health Brief"
            subtitle="Consult-ready TruWell wellness outline for your clinician"
            onPress={() => { hapticLight(); router.push('/settings/patient-health-brief' as never); }}
            theme={theme}
          />
          <SettingsRow
            label="Language"
            subtitle="App language"
            onPress={() => { hapticLight(); router.push('/settings/language' as never); }}
            theme={theme}
          />
        </View>

        {/* ── Legal ──────────────────────────────────────────────────────── */}
        <Text style={[styles.sectionLabel, { color: theme.text3 }]}>Legal</Text>
        <View style={[styles.block, { backgroundColor: theme.bg1, borderColor: theme.border }]}>
          <SettingsRow
            label="Terms of Service"
            onPress={() => { hapticLight(); router.push('/settings/terms' as never); }}
            theme={theme}
          />
          <SettingsRow
            label="Privacy Policy"
            onPress={() => { hapticLight(); router.push('/settings/policy' as never); }}
            theme={theme}
          />
        </View>

        {/* ── Follow us ──────────────────────────────────────────────────── */}
        <Text style={[styles.sectionLabel, { color: theme.text3 }]}>Follow TruWell AI</Text>
        <View style={[styles.socialBlock, { backgroundColor: theme.bg1, borderColor: theme.border }]}>
          <Text style={[styles.socialDesc, { color: theme.text3 }]}>
            Stay updated with wellness tips, new features, and health insights.
          </Text>
          <View style={styles.socialRow}>
            {SOCIAL_HANDLES.map((s) => (
              <TouchableOpacity
                key={s.name}
                onPress={() => openUrl(s.url)}
                activeOpacity={0.75}
                style={[
                  styles.socialBtn,
                  { backgroundColor: `${s.brandColor}14`, borderColor: `${s.brandColor}30` },
                ]}
                accessibilityLabel={`Follow TruWell AI on ${s.name}`}
              >
                {s.icon(s.brandColor)}
                <Text style={[styles.socialName, { color: s.brandColor }]}>{s.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ── Danger zone ────────────────────────────────────────────────── */}
        <View style={[styles.block, { backgroundColor: theme.bg1, borderColor: theme.border, marginTop: 24 }]}>
          <SettingsRow
            label="Sign Out"
            onPress={() => void signOut()}
            destructive
            theme={theme}
          />
        </View>

        <Text style={[styles.version, { color: theme.text3 }]}>TruWell AI v1.0.0</Text>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:   { flex: 1 },
  scroll: { paddingBottom: 48, paddingTop: 8 },

  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    paddingHorizontal: 20,
    marginTop: 22,
    marginBottom: 8,
  },
  block: {
    marginHorizontal: 16,
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowLeft:  { flex: 1 },
  rowLabel: { fontSize: 14, fontWeight: '600' },
  rowSub:   { fontSize: 11, fontWeight: '500', marginTop: 2 },
  rowChev:  { fontSize: 22, fontWeight: '300' },

  // Social follow section
  socialBlock: {
    marginHorizontal: 16,
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    gap: 14,
  },
  socialDesc: { fontSize: 12, fontWeight: '500', lineHeight: 17 },
  socialRow:  { flexDirection: 'row', gap: 10 },
  socialBtn: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 7,
  },
  socialName: { fontSize: 10, fontWeight: '700', letterSpacing: 0.1, textAlign: 'center' },

  version: { fontSize: 12, fontWeight: '500', textAlign: 'center', marginTop: 24 },
});
