import { BackHeader } from '@/components/ui/BackHeader';
import { hapticLight, hapticSelection } from '@/lib/haptics';
import { signOutGoogle } from '@/lib/googleAuth';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { useTheme } from '@/theme/ThemeContext';
import { File, Paths } from 'expo-file-system';
import { useRouter } from 'expo-router';
import * as Sharing from 'expo-sharing';
import { useEffect, useState } from 'react';
import {
  Alert,
  Linking,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// ─── URLs (fallback browser links if in-app screens are unavailable) ─────────

const PRIVACY_POLICY_URL = 'https://truwellai.xyz/privacy';
const TERMS_URL          = 'https://truwellai.xyz/terms';

// ─── Row components ───────────────────────────────────────────────────────────

function ToggleRow({
  label,
  subtitle,
  value,
  onChange,
  theme,
}: {
  label: string;
  subtitle?: string;
  value: boolean;
  onChange: (v: boolean) => void;
  theme: ReturnType<typeof useTheme>['theme'];
}) {
  return (
    <View style={[pr.row, { borderBottomColor: theme.border }]}>
      <View style={pr.rowLeft}>
        <Text style={[pr.rowLabel, { color: theme.text1 }]}>{label}</Text>
        {subtitle ? <Text style={[pr.rowSub, { color: theme.text3 }]}>{subtitle}</Text> : null}
      </View>
      <Switch
        value={value}
        onValueChange={(v) => { hapticSelection(); onChange(v); }}
        trackColor={{ false: theme.text4, true: theme.teal }}
        thumbColor={value ? theme.bg0 : theme.text2}
      />
    </View>
  );
}

function ActionRow({
  label,
  subtitle,
  onPress,
  destructive,
  chevron = true,
  theme,
}: {
  label: string;
  subtitle?: string;
  onPress: () => void;
  destructive?: boolean;
  chevron?: boolean;
  theme: ReturnType<typeof useTheme>['theme'];
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.75}
      style={[pr.row, { borderBottomColor: theme.border }]}
    >
      <View style={pr.rowLeft}>
        <Text style={[pr.rowLabel, { color: destructive ? theme.red : theme.text1 }]}>{label}</Text>
        {subtitle ? <Text style={[pr.rowSub, { color: theme.text3 }]}>{subtitle}</Text> : null}
      </View>
      {chevron && !destructive ? <Text style={[pr.chev, { color: theme.text3 }]}>›</Text> : null}
    </TouchableOpacity>
  );
}

function InfoRow({
  text,
  theme,
}: {
  text: string;
  theme: ReturnType<typeof useTheme>['theme'];
}) {
  return (
    <View style={[pr.row, { borderBottomColor: 'transparent' }]}>
      <Text style={[pr.infoText, { color: theme.text3 }]}>{text}</Text>
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function PrivacyScreen() {
  const { theme }  = useTheme();
  const router     = useRouter();
  const session    = useAuthStore((s) => s.session);

  const [analytics,      setAnalytics]      = useState(true);
  const [crashReporting, setCrashReporting] = useState(true);
  const [saving,         setSaving]         = useState(false);

  // Load saved preferences on mount
  useEffect(() => {
    if (!session?.user?.id) return;
    void supabase
      .from('user_privacy_preferences')
      .select('usage_analytics, crash_reporting')
      .eq('user_id', session.user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setAnalytics(data.usage_analytics ?? true);
          setCrashReporting(data.crash_reporting ?? true);
        }
      });
  }, [session?.user?.id]);

  const savePrefs = async (key: 'usage_analytics' | 'crash_reporting', value: boolean) => {
    if (!session?.user?.id) return;
    setSaving(true);
    await supabase
      .from('user_privacy_preferences')
      .upsert({ user_id: session.user.id, [key]: value, updated_at: new Date().toISOString() }, { onConflict: 'user_id' });
    setSaving(false);
  };

  const handleAnalyticsChange = async (v: boolean) => {
    setAnalytics(v);
    await savePrefs('usage_analytics', v);
  };

  const handleCrashChange = async (v: boolean) => {
    setCrashReporting(v);
    await savePrefs('crash_reporting', v);
  };

  // ── Download: fetch all user tables and share a JSON file ──────────────────
  const handleDownloadData = async () => {
    if (!session?.user?.id) return;
    hapticLight();
    try {
      const uid = session.user.id;
      const [profileRes, scansRes, wellnessRes, mealPlansRes, notifRes, privacyRes] =
        await Promise.all([
          supabase.from('user_health_profiles').select('*').eq('user_id', uid).maybeSingle(),
          supabase.from('scan_history').select('*').eq('user_id', uid).limit(200),
          supabase.from('user_wellness').select('*').eq('user_id', uid).maybeSingle(),
          supabase.from('meal_plans').select('*').eq('user_id', uid).limit(100),
          supabase.from('user_notification_preferences').select('*').eq('user_id', uid).maybeSingle(),
          supabase.from('user_privacy_preferences').select('*').eq('user_id', uid).maybeSingle(),
        ]);

      const payload = {
        exported_at:               new Date().toISOString(),
        user_id:                   uid,
        email:                     session.user.email,
        health_profile:            profileRes.data,
        scan_history:              scansRes.data ?? [],
        wellness:                  wellnessRes.data,
        meal_plans:                mealPlansRes.data ?? [],
        notification_preferences:  notifRes.data,
        privacy_preferences:       privacyRes.data,
      };

      const json  = JSON.stringify(payload, null, 2);
      const fname = `truwell-data-${Date.now()}.json`;
      const file  = new File(Paths.cache, fname);
      file.write(json);
      const fileUri = file.uri;

      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(fileUri, {
          mimeType:    'application/json',
          dialogTitle: 'Export Your TruWell Data',
          UTI:         'public.json',
        });
      } else {
        Alert.alert('Export Ready', `Your data has been saved to:\n${fileUri}`);
      }
    } catch {
      Alert.alert('Export Failed', 'Could not export your data. Please try again.');
    }
  };

  // ── Delete account ─────────────────────────────────────────────────────────
  const handleDeleteAccount = () => {
    hapticLight();
    Alert.alert(
      'Delete Account',
      'This will permanently delete your account, health data, and scan history. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete My Account',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Are you absolutely sure?',
              'Your account and all associated data will be permanently removed.',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Yes, Delete Everything',
                  style: 'destructive',
                  onPress: async () => {
                    const { error } = await supabase.functions.invoke('delete-account', {
                      body: { user_id: session?.user?.id },
                    });
                    if (error) {
                      Alert.alert('Error', 'Could not delete account. Please contact support@truwellai.xyz');
                    } else {
                      await signOutGoogle();
                      await supabase.auth.signOut();
                      router.replace('/(auth)/welcome');
                    }
                  },
                },
              ]
            );
          },
        },
      ]
    );
  };

  // ── Legal links ────────────────────────────────────────────────────────────
  const openUrl = async (url: string) => {
    hapticLight();
    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert('Could not open link', `Please visit ${url} in your browser.`);
    }
  };

  return (
    <SafeAreaView style={[pr.safe, { backgroundColor: theme.bg0 }]} edges={['top']}>
      <BackHeader title="Privacy and Data" onBack={() => router.back()} />

      <ScrollView contentContainerStyle={pr.scroll} showsVerticalScrollIndicator={false}>

        {/* ── Data Collection ───────────────────────────────────────────────── */}
        <Text style={[pr.sectionLabel, { color: theme.text3 }]}>Data Collection</Text>
        <View style={[pr.block, { backgroundColor: theme.bg1, borderColor: theme.border }]}>
          <ToggleRow
            label="Usage Analytics"
            subtitle="Help us improve the app with anonymous usage data"
            value={analytics}
            onChange={(v) => void handleAnalyticsChange(v)}
            theme={theme}
          />
          <ToggleRow
            label="Crash Reporting"
            subtitle="Automatically send crash reports to fix bugs faster"
            value={crashReporting}
            onChange={(v) => void handleCrashChange(v)}
            theme={theme}
          />
        </View>
        {saving ? (
          <Text style={[pr.savingText, { color: theme.text3 }]}>Saving…</Text>
        ) : null}

        {/* ── Your Data ─────────────────────────────────────────────────────── */}
        <Text style={[pr.sectionLabel, { color: theme.text3 }]}>Your Data</Text>
        <View style={[pr.block, { backgroundColor: theme.bg1, borderColor: theme.border }]}>
          <ActionRow
            label="Download My Data"
            subtitle="Export your profile, scans, and history as a JSON file"
            onPress={() => void handleDownloadData()}
            theme={theme}
          />
          <ActionRow
            label="Delete My Account"
            subtitle="Permanently remove your account and all data"
            onPress={handleDeleteAccount}
            destructive
            chevron={false}
            theme={theme}
          />
        </View>

        {/* ── Legal ─────────────────────────────────────────────────────────── */}
        <Text style={[pr.sectionLabel, { color: theme.text3 }]}>Legal</Text>
        <View style={[pr.block, { backgroundColor: theme.bg1, borderColor: theme.border }]}>
          <ActionRow
            label="Privacy Policy"
            subtitle="How we collect and use your data"
            onPress={() => router.push('/settings/policy' as never)}
            theme={theme}
          />
          <ActionRow
            label="Terms of Service"
            subtitle="Rules governing your use of TruWell AI"
            onPress={() => router.push('/settings/terms' as never)}
            theme={theme}
          />
          <ActionRow
            label="View Online"
            subtitle="Open truwellai.xyz in your browser"
            onPress={() => void openUrl(PRIVACY_POLICY_URL)}
            theme={theme}
          />
        </View>

        {/* ── Data Storage ──────────────────────────────────────────────────── */}
        <Text style={[pr.sectionLabel, { color: theme.text3 }]}>Data Storage</Text>
        <View style={[pr.block, { backgroundColor: theme.bg1, borderColor: theme.border }]}>
          <InfoRow
            text="Your health data is stored end-to-end encrypted on Supabase servers located in the European Union (Frankfurt, Germany). We comply with GDPR and never sell your personal data to third parties."
            theme={theme}
          />
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const pr = StyleSheet.create({
  safe:   { flex: 1 },
  scroll: { paddingBottom: 48, paddingTop: 8 },

  sectionLabel: {
    fontSize:        11,
    fontWeight:      '700',
    letterSpacing:   0.5,
    textTransform:   'uppercase',
    paddingHorizontal: 20,
    marginTop:       22,
    marginBottom:    8,
  },
  block: {
    marginHorizontal: 16,
    borderRadius:     18,
    borderWidth:      1,
    overflow:         'hidden',
  },
  savingText: {
    fontSize:         11,
    fontWeight:       '500',
    paddingHorizontal: 20,
    marginTop:        4,
  },

  row: {
    flexDirection:    'row',
    alignItems:       'center',
    paddingHorizontal: 16,
    paddingVertical:  14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap:              12,
  },
  rowLeft:  { flex: 1 },
  rowLabel: { fontSize: 14, fontWeight: '600' },
  rowSub:   { fontSize: 11, fontWeight: '500', marginTop: 2, lineHeight: 16 },
  chev:     { fontSize: 22, fontWeight: '300' },
  infoText: { fontSize: 13, lineHeight: 20, fontWeight: '400' },
});
