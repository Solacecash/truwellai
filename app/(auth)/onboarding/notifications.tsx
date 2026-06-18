import { hapticError, hapticSelection, hapticSuccess } from '@/lib/haptics';
import { registerForPushNotifications } from '@/lib/notifications';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { SegmentedIndicator } from '@/components/ui/SegmentedIndicator';
import { useTheme } from '@/theme/ThemeContext';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle as SVGCircle, Path, Rect } from 'react-native-svg';

// ─── SVG icons for notification rows ─────────────────────────────────────────

function ShieldIcon({ color }: { color: string }) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 2 L21 6 L21 12 C21 17 12 22 12 22 C12 22 3 17 3 12 L3 6 Z"
        fill={`${color}18`}
        stroke={color}
        strokeWidth={1.8}
        strokeLinejoin="round"
      />
      <Path d="M12 10 L12 15" stroke={color} strokeWidth={2} strokeLinecap="round" />
      <SVGCircle cx={12} cy={17.5} r={1.2} fill={color} />
    </Svg>
  );
}

function FireIcon({ color }: { color: string }) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 2 C12 2 7 8 7 13 A5 5 0 0 0 17 13 C17 10 15 7.5 14 6.5 C14 6.5 14 10 12 11 C11 9 11 5.5 12 2Z"
        fill={color}
        opacity={0.9}
      />
      <SVGCircle cx={12} cy={17} r={2.5} fill={color} opacity={0.6} />
    </Svg>
  );
}

function CalendarIcon({ color }: { color: string }) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Rect x={3} y={5} width={18} height={16} rx={3} stroke={color} strokeWidth={1.8} fill={`${color}10`} />
      <Path d="M3 9 L21 9" stroke={color} strokeWidth={1.5} />
      <Path d="M8 3 L8 7" stroke={color} strokeWidth={2} strokeLinecap="round" />
      <Path d="M16 3 L16 7" stroke={color} strokeWidth={2} strokeLinecap="round" />
      <SVGCircle cx={8.5} cy={14} r={1.2} fill={color} />
      <SVGCircle cx={12}  cy={14} r={1.2} fill={color} />
      <SVGCircle cx={15.5} cy={14} r={1.2} fill={color} />
    </Svg>
  );
}

function PeopleIcon({ color }: { color: string }) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <SVGCircle cx={9}  cy={7}  r={3.5} stroke={color} strokeWidth={1.6} />
      <SVGCircle cx={17} cy={7}  r={3}   stroke={color} strokeWidth={1.4} opacity={0.6} />
      <Path
        d="M2 20 C2 16 5 14 9 14 C13 14 16 16 16 20"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        fill="none"
      />
      <Path
        d="M17 14 C19.5 14 22 15.5 22 19"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        fill="none"
        opacity={0.6}
      />
    </Svg>
  );
}

// ─── Notification items ───────────────────────────────────────────────────────

const NOTIF_ITEMS = [
  {
    key:         'ingredient_alerts' as const,
    name:        'Ingredient Alerts',
    description: 'When a saved product gets newly flagged',
    iconKey:     'shield' as const,
  },
  {
    key:         'streak_reminders' as const,
    name:        'Streak Reminders',
    description: 'Daily nudge to keep your scanning streak',
    iconKey:     'fire' as const,
  },
  {
    key:         'community_alerts' as const,
    name:        'Community Alerts',
    description: 'When SafeCircle flags something near you',
    iconKey:     'people' as const,
  },
] as const;

type NotifKey  = (typeof NOTIF_ITEMS)[number]['key'];
type NotifPrefs = Record<NotifKey, boolean>;
type Theme      = ReturnType<typeof useTheme>['theme'];

// ─── Icon renderer ────────────────────────────────────────────────────────────

function NotifIcon({ iconKey, color }: { iconKey: (typeof NOTIF_ITEMS)[number]['iconKey']; color: string }) {
  switch (iconKey) {
    case 'shield':   return <ShieldIcon color={color} />;
    case 'fire':     return <FireIcon color={color} />;
    case 'people':   return <PeopleIcon color={color} />;
  }
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function NotificationsScreen() {
  const { theme } = useTheme();
  const router    = useRouter();
  const session   = useAuthStore((s) => s.session);

  const [loading, setLoading] = useState(false);
  const [prefs, setPrefs]     = useState<NotifPrefs>({
    ingredient_alerts:    true,
    streak_reminders:     true,
    community_alerts:     true,
  });

  const toggle = (key: NotifKey) => {
    hapticSelection();
    setPrefs((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const saveAndContinue = async (enableNotifications: boolean) => {
    if (!session?.user?.id) {
      router.replace('/enter');
      return;
    }

    // Determine role from session metadata (fast path, no DB race).
    const meta = session.user.user_metadata as Record<string, unknown> | undefined;
    const metaType = typeof meta?.user_type === 'string' ? meta.user_type : null;
    const role: 'expert' | 'user' = metaType === 'expert' ? 'expert' : 'user';
    if (__DEV__) console.log('[notifications] saveAndContinue role:', role, '(metaType:', metaType, ')');

    setLoading(true);
    try {
      if (enableNotifications) {
        await registerForPushNotifications(session.user.id);
      }

      // Upsert profile using the ACTUAL role from session metadata.
      // Never hardcode 'user' here — experts must keep their role.
      await supabase.from('profiles').upsert(
        {
          id:                session.user.id,
          display_name:      (session.user.user_metadata?.full_name as string | undefined)
                               ?? session.user.email
                               ?? '',
          user_type:         role,
          subscription_tier: 'free',
        },
        { onConflict: 'id' }
      );

      await supabase
        .from('user_notification_preferences')
        .upsert(
          {
            user_id:              session.user.id,
            ingredient_alerts:    prefs.ingredient_alerts,
            streak_reminders:     prefs.streak_reminders,
            community_alerts:     prefs.community_alerts,
            updated_at:           new Date().toISOString(),
          },
          { onConflict: 'user_id' }
        );

      hapticSuccess();
    } catch {
      hapticError();
    } finally {
      setLoading(false);
      if (__DEV__) console.log('[notifications] navigating to', role === 'expert' ? '/(expert)' : '/enter');
      router.replace((role === 'expert' ? '/(expert)' : '/enter') as never);
    }
  };

  return (
    <SafeAreaView style={[ns.safe, { backgroundColor: theme.bg0 }]} edges={['top']}>
      <ScrollView
        contentContainerStyle={ns.scroll}
        showsVerticalScrollIndicator={false}
      >
        <SegmentedIndicator value={100} count={3} color={theme.teal} height={6} style={ns.segIndicator} />

        <Text style={[ns.stepLabel, { color: theme.teal }]}>Step 3 of 3</Text>
        <Text style={[ns.title, { color: theme.text1 }]}>Stay protected</Text>
        <Text style={[ns.subtitle, { color: theme.text3 }]}>
          We will alert you when products you use get flagged
        </Text>

        {/* Toggle rows */}
        <View style={[ns.toggleList, { borderColor: theme.border }]}>
          {NOTIF_ITEMS.map((item, idx) => (
            <View
              key={item.key}
              style={[
                ns.toggleRow,
                {
                  backgroundColor: theme.bg2,
                  borderBottomColor: theme.border,
                  borderBottomWidth: idx < NOTIF_ITEMS.length - 1 ? StyleSheet.hairlineWidth : 0,
                },
              ]}
            >
              <View style={[ns.iconWrap, { backgroundColor: `${theme.teal}12` }]}>
                <NotifIcon iconKey={item.iconKey} color={theme.teal} />
              </View>
              <View style={ns.toggleInfo}>
                <Text style={[ns.toggleName, { color: theme.text1 }]}>{item.name}</Text>
                <Text style={[ns.toggleDesc, { color: theme.text3 }]}>{item.description}</Text>
              </View>
              <Switch
                value={prefs[item.key]}
                onValueChange={() => toggle(item.key)}
                trackColor={{ false: theme.text4, true: theme.teal }}
                thumbColor={prefs[item.key] ? theme.bg0 : theme.text2}
              />
            </View>
          ))}
        </View>

        {/* Enable notifications */}
        <Pressable
          style={[ns.enableBtn, { backgroundColor: theme.teal }, loading && { opacity: 0.6 }]}
          onPress={() => void saveAndContinue(true)}
          disabled={loading}
        >
          <Text style={[ns.enableText, { color: theme.bg0 }]}>
            {loading ? 'Setting up…' : 'Enable Notifications'}
          </Text>
        </Pressable>

        {/* Skip link */}
        <Pressable
          style={ns.skipBtn}
          onPress={() => { hapticSelection(); void saveAndContinue(false); }}
          disabled={loading}
        >
          <Text style={[ns.skipText, { color: theme.text3 }]}>Skip for now</Text>
        </Pressable>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const ns = StyleSheet.create({
  safe:  { flex: 1 },
  scroll: { paddingHorizontal: 24, paddingTop: 16 },

  segIndicator: { marginBottom: 20 },

  stepLabel: { fontSize: 12, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 },
  title:     { fontSize: 24, fontWeight: '900', letterSpacing: -0.5, marginBottom: 6 },
  subtitle:  { fontSize: 14, lineHeight: 20, marginBottom: 28 },

  toggleList: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 24,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 14,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  toggleInfo: { flex: 1 },
  toggleName: { fontSize: 15, fontWeight: '700', marginBottom: 2 },
  toggleDesc: { fontSize: 12, lineHeight: 18 },

  enableBtn: {
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  enableText: { fontSize: 16, fontWeight: '800' },

  skipBtn: { alignItems: 'center', paddingVertical: 12 },
  skipText: { fontSize: 14, fontWeight: '600' },
});
