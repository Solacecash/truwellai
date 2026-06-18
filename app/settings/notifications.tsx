import { BackHeader } from '@/components/ui/BackHeader';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
import { hapticLight, hapticSuccess } from '@/lib/haptics';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { useTheme } from '@/theme/ThemeContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Alert,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ExpoNotifications from 'expo-notifications';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface NotifPrefs {
  push_enabled: boolean;
  smart_alerts: boolean;
  scan_reminders: boolean;
  wellness_reminders: boolean;
  community_updates: boolean;
  marketing: boolean;
}

const DEFAULT_PREFS: NotifPrefs = {
  push_enabled: true,
  smart_alerts: true,
  scan_reminders: true,
  wellness_reminders: true,
  community_updates: false,
  marketing: false,
};

// ---------------------------------------------------------------------------
// Row component
// ---------------------------------------------------------------------------

function ToggleRow({
  label,
  subtitle,
  value,
  onValueChange,
  disabled,
  theme,
}: {
  label: string;
  subtitle?: string;
  value: boolean;
  onValueChange: (v: boolean) => void;
  disabled?: boolean;
  theme: ReturnType<typeof useTheme>['theme'];
}) {
  return (
    <View style={[styles.row, { borderBottomColor: theme.border, opacity: disabled ? 0.5 : 1 }]}>
      <View style={styles.rowLeft}>
        <Text style={[styles.rowLabel, { color: theme.text1 }]}>{label}</Text>
        {subtitle ? <Text style={[styles.rowSub, { color: theme.text3 }]}>{subtitle}</Text> : null}
      </View>
      <Switch
        value={value}
        onValueChange={(v) => { hapticLight(); onValueChange(v); }}
        disabled={disabled}
        trackColor={{ false: theme.bg3, true: `${theme.teal}80` }}
        thumbColor={value ? theme.teal : theme.text3}
      />
    </View>
  );
}

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export default function NotificationsSettingsScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const qc = useQueryClient();
  const session = useAuthStore((s) => s.session);
  const userId = session?.user?.id;

  const [prefs, setPrefs] = useState<NotifPrefs>(DEFAULT_PREFS);
  const [systemGranted, setSystemGranted] = useState<boolean | null>(null);
  const [saving, setSaving] = useState(false);

  // ── Check system permission ───────────────────────────────────────────────
  useEffect(() => {
    ExpoNotifications.getPermissionsAsync().then(({ status }) => {
      setSystemGranted(status === 'granted');
    });
  }, []);

  // ── Load prefs from DB ────────────────────────────────────────────────────
  const prefsQuery = useQuery({
    queryKey: ['notification-preferences', userId],
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data } = await supabase
        .from('user_preferences')
        .select(
          'push_enabled, smart_alerts, scan_reminders, wellness_reminders, community_updates, marketing'
        )
        .eq('user_id', userId!)
        .maybeSingle();
      return data as Partial<NotifPrefs> | null;
    },
  });

  useEffect(() => {
    if (!prefsQuery.data) return;
    setPrefs((prev) => ({ ...prev, ...prefsQuery.data }));
  }, [prefsQuery.data]);

  // ── Save ──────────────────────────────────────────────────────────────────
  const save = async () => {
    if (!userId) return;
    setSaving(true);
    const { error } = await supabase
      .from('user_preferences')
      .upsert(
        { user_id: userId, ...prefs, updated_at: new Date().toISOString() },
        { onConflict: 'user_id' }
      );
    setSaving(false);
    if (error) {
      Alert.alert('Error', error.message);
    } else {
      hapticSuccess();
      void qc.invalidateQueries({ queryKey: ['notification-preferences', userId] });
      void qc.invalidateQueries({ queryKey: ['user-preferences', userId] });
      router.back();
    }
  };

  // ── Request system permission ─────────────────────────────────────────────
  const requestPermission = async () => {
    const { status } = await ExpoNotifications.requestPermissionsAsync();
    const granted = status === 'granted';
    setSystemGranted(granted);
    if (!granted) {
      Alert.alert(
        'Permission denied',
        'Enable notifications in your device settings to receive alerts.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Open Settings',
            onPress: () => {
              if (Platform.OS === 'ios') void Linking.openURL('app-settings:');
              else void Linking.openSettings();
            },
          },
        ]
      );
    }
  };

  const set = (key: keyof NotifPrefs) => (value: boolean) =>
    setPrefs((prev) => ({ ...prev, [key]: value }));

  const masterOff = !prefs.push_enabled || systemGranted === false;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg0 }]} edges={['top']}>
      <BackHeader title="Notifications" onBack={() => router.back()} />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* ── System permission banner ─────────────────────────────────── */}
        {systemGranted === false && (
          <TouchableOpacity
            onPress={() => void requestPermission()}
            style={[styles.permBanner, { backgroundColor: `${theme.gold}14`, borderColor: `${theme.gold}30` }]}
          >
            <Text style={[styles.permText, { color: theme.gold }]}>
              Notifications are disabled in device settings. Tap to enable.
            </Text>
          </TouchableOpacity>
        )}

        {prefsQuery.isLoading ? (
          <View style={styles.skWrap}>
            {[0, 1, 2, 3, 4].map((i) => (
              <SkeletonLoader key={i} width="100%" height={52} borderRadius={12} />
            ))}
          </View>
        ) : (
          <>
            {/* ── Master toggle ────────────────────────────────────────── */}
            <Text style={[styles.sectionLabel, { color: theme.text3 }]}>Push notifications</Text>
            <View style={[styles.block, { backgroundColor: theme.bg1, borderColor: theme.border }]}>
              <ToggleRow
                label="Enable push notifications"
                subtitle="Receive all TruWell alerts on this device"
                value={prefs.push_enabled && systemGranted !== false}
                onValueChange={set('push_enabled')}
                theme={theme}
              />
            </View>

            {/* ── Alerts ───────────────────────────────────────────────── */}
            <Text style={[styles.sectionLabel, { color: theme.text3 }]}>Alert types</Text>
            <View style={[styles.block, { backgroundColor: theme.bg1, borderColor: theme.border }]}>
              <ToggleRow
                label="Smart ingredient alerts"
                subtitle="Personalized warnings based on your health profile"
                value={prefs.smart_alerts}
                onValueChange={set('smart_alerts')}
                disabled={masterOff}
                theme={theme}
              />
              <ToggleRow
                label="Scan reminders"
                subtitle="Reminders to scan new products"
                value={prefs.scan_reminders}
                onValueChange={set('scan_reminders')}
                disabled={masterOff}
                theme={theme}
              />
              <ToggleRow
                label="Wellness reminders"
                subtitle="Hydration, breathing, and habit nudges"
                value={prefs.wellness_reminders}
                onValueChange={set('wellness_reminders')}
                disabled={masterOff}
                theme={theme}
              />
              <ToggleRow
                label="Community updates"
                subtitle="New posts and reviews in SafeCircle"
                value={prefs.community_updates}
                onValueChange={set('community_updates')}
                disabled={masterOff}
                theme={theme}
              />
              <ToggleRow
                label="Marketing"
                subtitle="Tips, promotions, and product news"
                value={prefs.marketing}
                onValueChange={set('marketing')}
                disabled={masterOff}
                theme={theme}
              />
            </View>

            {/* ── Wellness reminders deep-link ────────────────────────── */}
            <Text style={[styles.sectionLabel, { color: theme.text3 }]}>Wellness schedule</Text>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => router.push('/settings/wellness-reminders' as never)}
              style={[styles.block, { backgroundColor: theme.bg1, borderColor: theme.border, padding: 16 }]}
            >
              <Text style={[styles.rowLabel, { color: theme.text1 }]}>
                Hydration & breathing reminders
              </Text>
              <Text style={[styles.rowSub, { color: theme.text3, marginTop: 4 }]}>
                Pick reminder sounds and times — water and breathing each have their own schedule.
              </Text>
            </TouchableOpacity>

            {/* ── Save ─────────────────────────────────────────────────── */}
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => void save()}
              disabled={saving}
              style={[
                styles.saveBtn,
                {
                  backgroundColor: saving ? `${theme.teal}14` : `${theme.teal}18`,
                  borderColor: `${theme.teal}50`,
                  opacity: saving ? 0.7 : 1,
                },
              ]}
            >
              <Text style={[styles.saveText, { color: theme.teal }]}>
                {saving ? 'Saving...' : 'Save Preferences'}
              </Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { padding: 16, paddingBottom: 48 },
  skWrap: { gap: 10 },

  permBanner: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 14,
  },
  permText: { fontSize: 13, fontWeight: '600', lineHeight: 19 },

  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginTop: 18,
    marginBottom: 8,
  },
  block: {
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowLeft: { flex: 1, marginRight: 12 },
  rowLabel: { fontSize: 14, fontWeight: '600' },
  rowSub: { fontSize: 11, fontWeight: '500', marginTop: 2 },

  saveBtn: {
    marginTop: 20,
    paddingVertical: 16,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
  },
  saveText: { fontSize: 15, fontWeight: '800', letterSpacing: -0.1 },
});
