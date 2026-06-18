import { BackHeader } from '@/components/ui/BackHeader';
import { useTheme } from '@/theme/ThemeContext';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';
import { SafeAreaView } from 'react-native-safe-area-context';

type TabKey = 'hospitals' | 'doctors' | 'clinics' | 'pharmacies';

const TABS: { key: TabKey; label: string; path: string }[] = [
  { key: 'hospitals', label: 'Hospitals', path: 'hospital+near+me' },
  { key: 'doctors', label: 'Doctors', path: 'doctor+near+me' },
  { key: 'clinics', label: 'Clinics', path: 'clinic+near+me' },
  { key: 'pharmacies', label: 'Pharmacies', path: 'pharmacy+near+me' },
];

function HospitalIcon({ color }: { color: string }) {
  return (
    <Svg width={28} height={28} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 21V5a2 2 0 012-2h6v4h2V3h6a2 2 0 012 2v16"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M9 10h2v2H9v-2zm4 0h2v2h-2v-2z" fill={color} />
      <Rect x={7} y={14} width={10} height={7} rx={1} stroke={color} strokeWidth={1.6} />
    </Svg>
  );
}

export default function NearbyHealthServicesScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const [granted, setGranted] = useState(false);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [checking, setChecking] = useState(true);

  const refresh = useCallback(async () => {
    setChecking(true);
    try {
      const { status } = await Location.getForegroundPermissionsAsync();
      if (status !== 'granted') {
        setGranted(false);
        setCoords(null);
        return;
      }
      setGranted(true);
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
    } catch {
      setGranted(false);
      setCoords(null);
    } finally {
      setChecking(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const openMaps = (path: string) => {
    if (!coords) return;
    const { lat, lng } = coords;
    const url = `https://www.google.com/maps/search/${path}/@${lat},${lng},14z`;
    void Linking.openURL(url);
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg0 }]} edges={['top']}>
      <BackHeader title="Nearby Health Services" onBack={() => router.back()} />

      {!granted || !coords ? (
        <View style={[styles.card, { backgroundColor: theme.bg1, borderColor: theme.border }]}>
          <HospitalIcon color={theme.teal} />
          <Text style={[styles.cardTitle, { color: theme.text1 }]}>
            Enable location to find hospitals, clinics, and doctors near you
          </Text>
          <TouchableOpacity
            onPress={async () => {
              const { status } = await Location.requestForegroundPermissionsAsync();
              if (status === 'granted') void refresh();
            }}
            activeOpacity={0.85}
            style={[styles.primaryBtn, { backgroundColor: theme.teal }]}
          >
            <Text style={[styles.primaryBtnText, { color: theme.bg0 }]}>Enable Location</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <Text style={[styles.hint, { color: theme.text3 }]}>
            Choose a category to open Google Maps near your current location.
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabRow}
            style={styles.tabScroll}
          >
            {TABS.map((t) => (
              <TouchableOpacity
                key={t.key}
                onPress={() => openMaps(t.path)}
                activeOpacity={0.85}
                style={[styles.tabPill, { backgroundColor: theme.bg2, borderColor: theme.border }]}
              >
                <Text style={[styles.tabLabel, { color: theme.teal }]}>{t.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <View style={[styles.mapCard, { backgroundColor: theme.bg1, borderColor: theme.border }]}>
            <Text style={[styles.coordsLabel, { color: theme.text3 }]}>Using your location</Text>
            <Text style={[styles.coords, { color: theme.text2 }]}>
              {coords.lat.toFixed(4)}, {coords.lng.toFixed(4)}
            </Text>
            <Text style={[styles.tapHint, { color: theme.text3 }]}>
              Tap a tab above to search in Google Maps.
            </Text>
          </View>
        </>
      )}

      {checking ? (
        <Text style={[styles.checking, { color: theme.text3 }]}>Checking location…</Text>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, paddingHorizontal: 16 },
  card: {
    marginTop: 16,
    padding: 20,
    borderRadius: 18,
    borderWidth: 1,
    gap: 14,
    alignItems: 'flex-start',
  },
  cardTitle: { fontSize: 15, fontWeight: '700', lineHeight: 22 },
  primaryBtn: {
    alignSelf: 'stretch',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  primaryBtnText: { fontSize: 15, fontWeight: '800' },
  hint: { marginTop: 16, fontSize: 13, lineHeight: 19 },
  tabScroll: { maxHeight: 48, marginTop: 14 },
  tabRow: { gap: 10, paddingVertical: 4 },
  tabPill: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
  },
  tabLabel: { fontSize: 13, fontWeight: '800' },
  mapCard: {
    marginTop: 20,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 6,
  },
  coordsLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 0.4, textTransform: 'uppercase' },
  coords: { fontSize: 14, fontWeight: '600' },
  tapHint: { fontSize: 12, marginTop: 8 },
  checking: { marginTop: 12, fontSize: 12 },
});
