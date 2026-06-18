import { GlowCard } from '@/components/ui/GlowCard';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { Screen } from '@/components/ui/Screen';
import { fetchAlternatives } from '@/lib/edge';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';

function oneParam(v: string | string[] | undefined): string | undefined {
  if (v == null) return undefined;
  return Array.isArray(v) ? v[0] : v;
}

const PRICE_CHIPS = ['', '$', '$$', '$$$'] as const;

export default function ComparisonScreen() {
  const { t } = useTranslation();
  const { id, excludeBarcode } = useLocalSearchParams<{ id: string; excludeBarcode?: string }>();
  const idStr = useMemo(() => oneParam(id), [id]);
  const excl = useMemo(() => oneParam(excludeBarcode), [excludeBarcode]);

  const [priceBand, setPriceBand] = useState('');
  const [brandDraft, setBrandDraft] = useState('');
  const [brandFilter, setBrandFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [left, setLeft] = useState<{ name: string; brand: string; grade: string } | null>(null);
  const [right, setRight] = useState<{ name: string; brand: string; grade: string } | null>(null);

  useEffect(() => {
    let cancel = false;
    setLoading(true);
    void (async () => {
      try {
        const { items } = await fetchAlternatives({
          excludeBarcode: excl,
          brand: brandFilter || undefined,
          priceBand: priceBand || undefined,
        });
        if (cancel) return;
        const list = items ?? [];
        if (!list.length) {
          setLeft(null);
          setRight(null);
          return;
        }
        const pick = list.find((p) => p.id === idStr) ?? list[0];
        const other = list.find((p) => p.id !== pick.id) ?? list[1] ?? pick;
        setLeft({ name: pick.name, brand: pick.brand, grade: pick.grade });
        setRight({ name: other.name, brand: other.brand, grade: other.grade });
      } catch {
        if (!cancel) {
          setLeft({ name: 'Product A', brand: 'Demo', grade: 'B' });
          setRight({ name: 'Product B', brand: 'Demo', grade: 'A' });
        }
      } finally {
        if (!cancel) setLoading(false);
      }
    })();
    return () => {
      cancel = true;
    };
  }, [idStr, excl, brandFilter, priceBand]);

  return (
    <Screen edges={['top']}>
      <ScrollView contentContainerStyle={styles.pad}>
        <Text style={[typography.headlineSm]}>{t('comparison.title')}</Text>
        <Text style={[typography.caption, styles.sub]}>{t('comparison.subtitle')}</Text>

        <Text style={[typography.caption, styles.label]}>{t('comparison.priceLabel')}</Text>
        <View style={styles.chips}>
          {PRICE_CHIPS.map((pb) => {
            const label = pb === '' ? t('comparison.priceAll') : pb;
            const on = priceBand === pb;
            return (
              <Pressable
                key={pb || 'all'}
                onPress={() => setPriceBand(pb)}
                style={[styles.chip, on && styles.chipOn]}
              >
                <Text style={[typography.caption, on && styles.chipLabelOn]}>{label}</Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={[typography.caption, styles.label]}>{t('comparison.brandPlaceholder')}</Text>
        <TextInput
          style={styles.input}
          placeholder={t('comparison.brandPlaceholder')}
          placeholderTextColor={colors.textMuted}
          value={brandDraft}
          onChangeText={setBrandDraft}
          autoCapitalize="none"
        />
        <PrimaryButton
          label={t('comparison.apply')}
          onPress={() => setBrandFilter(brandDraft.trim())}
          style={styles.apply}
        />

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator color={colors.tealGlow} size="large" />
            <Text style={[typography.caption, styles.mt]}>{t('comparison.loading')}</Text>
          </View>
        ) : !left || !right ? (
          <Text style={[typography.body, styles.mt]}>{t('comparison.empty')}</Text>
        ) : (
          <View style={styles.row}>
            <GlowCard style={styles.col}>
              <Text style={[typography.caption]}>Selected</Text>
              <Text style={[typography.bodyStrong]}>{left.name}</Text>
              <Text style={[typography.caption]}>{left.brand}</Text>
              <Text style={[typography.headline, styles.grade]}>{left.grade}</Text>
            </GlowCard>
            <GlowCard style={styles.col}>
              <Text style={[typography.caption]}>Alternative</Text>
              <Text style={[typography.bodyStrong]}>{right.name}</Text>
              <Text style={[typography.caption]}>{right.brand}</Text>
              <Text style={[typography.headline, styles.grade]}>{right.grade}</Text>
            </GlowCard>
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  pad: { padding: 20, paddingBottom: 40 },
  sub: { marginTop: 6, marginBottom: 14 },
  label: { marginBottom: 6, marginTop: 12 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    backgroundColor: colors.cardBg,
  },
  chipOn: { borderColor: colors.tealGlow, backgroundColor: 'rgba(0,229,200,0.12)' },
  chipLabelOn: { color: colors.tealGlow },
  input: {
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: 12,
    padding: 12,
    color: colors.textPrimary,
  },
  apply: { marginTop: 10, marginBottom: 8 },
  row: { flexDirection: 'row', gap: 12, marginTop: 16 },
  col: { flex: 1 },
  grade: { marginTop: 12, color: colors.tealGlow },
  center: { alignItems: 'center', marginTop: 24 },
  mt: { marginTop: 12 },
});
