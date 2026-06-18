import { BackHeader } from '@/components/ui/BackHeader';
import { hapticLight } from '@/lib/haptics';
import { TRUWELL_LOGO } from '@/lib/brandAssets';
import { useTheme } from '@/theme/ThemeContext';
import { darkTheme, lightTheme } from '@/theme/index';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Circle as SVGCircle, Path, Rect, Svg } from 'react-native-svg';

// ---------------------------------------------------------------------------
// Phone mockup previews
// ---------------------------------------------------------------------------

function PhoneMockup({ isDark }: { isDark: boolean }) {
  const bg0 = isDark ? darkTheme.bg0 : lightTheme.bg0;
  const bg1 = isDark ? darkTheme.bg1 : lightTheme.bg1;
  const teal = isDark ? darkTheme.teal : lightTheme.teal;
  const border = isDark ? darkTheme.border : lightTheme.border;
  const text1 = isDark ? darkTheme.text1 : lightTheme.text1;
  const text3 = isDark ? darkTheme.text3 : lightTheme.text3;

  return (
    <Svg width={72} height={108} viewBox="0 0 72 108">
      {/* Phone body */}
      <Rect x={2} y={2} width={68} height={104} rx={12} fill={bg0} stroke={border} strokeWidth={1.5} />
      {/* Status bar notch */}
      <Rect x={26} y={6} width={20} height={5} rx={2.5} fill={bg1} />
      {/* Nav bar top faux content */}
      <Rect x={8} y={18} width={56} height={8} rx={4} fill={bg1} />
      {/* Big card */}
      <Rect x={8} y={32} width={56} height={28} rx={6} fill={bg1} stroke={border} strokeWidth={0.5} />
      {/* Teal accent bar inside card */}
      <Rect x={12} y={36} width={24} height={4} rx={2} fill={teal} opacity={0.85} />
      {/* Text lines */}
      <Rect x={12} y={43} width={36} height={3} rx={1.5} fill={text1} opacity={0.5} />
      <Rect x={12} y={49} width={20} height={3} rx={1.5} fill={text3} opacity={0.5} />
      {/* Circle avatar */}
      <SVGCircle cx={54} cy={44} r={8} fill={`${teal}30`} />
      {/* Two small cards */}
      <Rect x={8} y={66} width={26} height={18} rx={5} fill={bg1} stroke={border} strokeWidth={0.5} />
      <Rect x={38} y={66} width={26} height={18} rx={5} fill={bg1} stroke={border} strokeWidth={0.5} />
      {/* Teal dots */}
      <SVGCircle cx={21} cy={75} r={4} fill={teal} opacity={0.7} />
      <SVGCircle cx={51} cy={75} r={4} fill={teal} opacity={0.4} />
      {/* Bottom nav line */}
      <Rect x={24} y={92} width={24} height={3} rx={1.5} fill={text3} opacity={0.3} />
    </Svg>
  );
}

// ---------------------------------------------------------------------------
// App icon preview
// ---------------------------------------------------------------------------

function AppIconPreview({ size = 44, opacity = 1 }: { size?: number; opacity?: number }) {
  return (
    <Image
      source={TRUWELL_LOGO}
      style={{ width: size, height: size, opacity }}
      contentFit="contain"
      accessibilityLabel="TruWell AI app icon"
    />
  );
}

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export default function AppearanceScreen() {
  const router = useRouter();
  const { theme, isDark, toggleTheme } = useTheme();

  const handleThemeChange = (dark: boolean) => {
    if (dark !== isDark) {
      void Haptics.selectionAsync();
      toggleTheme();
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg0 }]} edges={['top']}>
      <BackHeader title="Appearance" onBack={() => router.back()} />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* ── Section: Color Theme ─────────────────────────────────────── */}
        <Text style={[styles.sectionLabel, { color: theme.text3 }]}>Color Theme</Text>

        <View style={styles.themeRow}>
          {/* Dark card */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => handleThemeChange(true)}
            style={[
              styles.themeCard,
              {
                backgroundColor: theme.bg1,
                borderColor: isDark ? theme.teal : theme.border,
                borderWidth: isDark ? 2 : 1,
              },
            ]}
          >
            <View style={styles.mockupWrap}>
              <PhoneMockup isDark={true} />
              {isDark && (
                <View style={[styles.selectedCheck, { backgroundColor: theme.teal }]}>
                  <Text style={styles.selectedCheckText}>✓</Text>
                </View>
              )}
            </View>
            <Text style={[styles.themeCardLabel, { color: isDark ? theme.teal : theme.text2 }]}>
              Dark Mode
            </Text>
            <View style={[styles.defaultBadge, { backgroundColor: `${theme.teal}18`, borderColor: `${theme.teal}30` }]}>
              <Text style={[styles.defaultBadgeText, { color: theme.teal }]}>Default</Text>
            </View>
          </TouchableOpacity>

          {/* Light card */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => handleThemeChange(false)}
            style={[
              styles.themeCard,
              {
                backgroundColor: theme.bg1,
                borderColor: !isDark ? theme.teal : theme.border,
                borderWidth: !isDark ? 2 : 1,
              },
            ]}
          >
            <View style={styles.mockupWrap}>
              <PhoneMockup isDark={false} />
              {!isDark && (
                <View style={[styles.selectedCheck, { backgroundColor: theme.teal }]}>
                  <Text style={styles.selectedCheckText}>✓</Text>
                </View>
              )}
            </View>
            <Text style={[styles.themeCardLabel, { color: !isDark ? theme.teal : theme.text2 }]}>
              Light Mode
            </Text>
            <View style={[styles.defaultBadge, { backgroundColor: 'transparent', borderColor: 'transparent' }]}>
              <Text style={styles.defaultBadgeText}> </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* ── Section: Text Size ───────────────────────────────────────── */}
        <Text style={[styles.sectionLabel, { color: theme.text3 }]}>Text Size</Text>

        <View style={[styles.block, { backgroundColor: theme.bg1, borderColor: theme.border }]}>
          <Text style={[styles.blockDesc, { color: theme.text3 }]}>
            Adjust the text size throughout the app.
          </Text>
          <View style={styles.textSizeRow}>
            {(['Small', 'Default', 'Large'] as const).map((size) => {
              const isDefault = size === 'Default';
              const isComingSoon = !isDefault;
              return (
                <TouchableOpacity
                  key={size}
                  activeOpacity={isDefault ? 0.85 : 1}
                  onPress={() => { if (isDefault) hapticLight(); }}
                  style={[
                    styles.sizePill,
                    {
                      backgroundColor: isDefault ? `${theme.teal}18` : theme.bg2,
                      borderColor: isDefault ? `${theme.teal}50` : theme.border,
                      opacity: isComingSoon ? 0.5 : 1,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.sizePillText,
                      { color: isDefault ? theme.teal : theme.text3, fontSize: size === 'Small' ? 11 : size === 'Large' ? 15 : 13 },
                    ]}
                  >
                    {size}
                  </Text>
                  {isComingSoon && (
                    <Text style={[styles.comingSoon, { color: theme.text3 }]}>Soon</Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* ── Section: App Icon ────────────────────────────────────────── */}
        <Text style={[styles.sectionLabel, { color: theme.text3 }]}>App Icon</Text>

        <View style={[styles.block, { backgroundColor: theme.bg1, borderColor: theme.border }]}>
          <Text style={[styles.blockDesc, { color: theme.text3 }]}>
            Choose an alternate app icon to personalize your home screen.
          </Text>
          <View style={styles.iconRow}>
            {/* Classic */}
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => hapticLight()}
              style={[
                styles.iconCard,
                { backgroundColor: theme.bg2, borderColor: theme.teal, borderWidth: 2 },
              ]}
            >
              <AppIconPreview />
              <Text style={[styles.iconLabel, { color: theme.teal }]}>Classic</Text>
              <View style={[styles.selectedPip, { backgroundColor: theme.teal }]} />
            </TouchableOpacity>

            {/* Minimal — coming soon */}
            <View
              style={[
                styles.iconCard,
                { backgroundColor: theme.bg2, borderColor: theme.border, borderWidth: 1, opacity: 0.45 },
              ]}
            >
              <AppIconPreview opacity={0.5} />
              <Text style={[styles.iconLabel, { color: theme.text3 }]}>Minimal</Text>
              <View style={[styles.comingSoonBadge, { backgroundColor: `${theme.text3}20`, borderColor: `${theme.text3}30` }]}>
                <Text style={[styles.comingSoonBadgeText, { color: theme.text3 }]}>Coming Soon</Text>
              </View>
            </View>
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { paddingBottom: 48, paddingTop: 8 },

  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    paddingHorizontal: 20,
    marginTop: 22,
    marginBottom: 12,
  },

  // Theme cards
  themeRow: {
    flexDirection: 'row',
    marginHorizontal: 16,
    gap: 12,
  },
  themeCard: {
    flex: 1,
    borderRadius: 18,
    padding: 14,
    alignItems: 'center',
    gap: 8,
  },
  mockupWrap: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedCheck: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedCheckText: { fontSize: 10, fontWeight: '900', color: '#000' },
  themeCardLabel: { fontSize: 13, fontWeight: '700' },
  defaultBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
  },
  defaultBadgeText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.3 },

  // Block container
  block: {
    marginHorizontal: 16,
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  blockDesc: { fontSize: 12, fontWeight: '500', lineHeight: 18 },

  // Text size pills
  textSizeRow: { flexDirection: 'row', gap: 8 },
  sizePill: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    gap: 4,
  },
  sizePillText: { fontWeight: '700' },
  comingSoon: { fontSize: 8, fontWeight: '700', letterSpacing: 0.2 },

  // App icon cards
  iconRow: { flexDirection: 'row', gap: 12 },
  iconCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    gap: 8,
  },
  iconLabel: { fontSize: 12, fontWeight: '700' },
  selectedPip: { width: 8, height: 8, borderRadius: 4 },
  comingSoonBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
  },
  comingSoonBadgeText: { fontSize: 8, fontWeight: '700' },
});
