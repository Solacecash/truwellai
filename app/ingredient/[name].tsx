import { BackHeader } from '@/components/ui/BackHeader';
import { SegmentedIndicator } from '@/components/ui/SegmentedIndicator';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
import { hapticLight } from '@/lib/haptics';
import { supabase } from '@/lib/supabase';
import { useScanStore } from '@/stores/scanStore';
import { useTheme } from '@/theme/ThemeContext';
import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StyleSheet, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInUp } from 'react-native-reanimated';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type RiskLevel = 'safe' | 'moderate' | 'avoid';

interface IngredientDetail {
  name: string;
  safety_rating: RiskLevel;
  description: string | null;
  risk_category: string | null;
  ewg_score: number | null;
  fda_status: string | null;
  eu_status: string | null;
  is_eu_banned: boolean;
  common_in: string[];
  alternatives: string[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const RISK_CONFIG: Record<RiskLevel, { label: string; colorKey: 'green' | 'amber' | 'red'; segValue: number }> = {
  safe:     { label: 'Low Risk',      colorKey: 'green', segValue: 20 },
  moderate: { label: 'Moderate Risk', colorKey: 'amber', segValue: 60 },
  avoid:    { label: 'High Risk',     colorKey: 'red',   segValue: 100 },
};

function trafficToRisk(traffic: string): RiskLevel {
  if (traffic === 'green') return 'safe';
  if (traffic === 'yellow' || traffic === 'moderate') return 'moderate';
  return 'avoid';
}

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export default function IngredientDetailScreen() {
  const { name: rawName } = useLocalSearchParams<{ name: string }>();
  const router = useRouter();
  const { theme } = useTheme();
  const ingredientName = decodeURIComponent(rawName ?? '');

  // Try to find the ingredient in the last scan result first (fast, offline)
  const lastScan = useScanStore((s) => s.lastResult);
  const scanIngredient = lastScan?.ingredients.find(
    (i) => i.name.toLowerCase() === ingredientName.toLowerCase()
  );

  // Query the ingredients table for enriched data
  const detailQuery = useQuery<IngredientDetail | null>({
    queryKey: ['ingredient-detail', ingredientName],
    staleTime: 30 * 60 * 1000,
    queryFn: async () => {
      const { data } = await supabase
        .from('ingredients_database')
        .select(
          'name, safety_rating, description, risk_category, ewg_score, fda_status, eu_status, is_eu_banned, common_in, alternatives'
        )
        .ilike('name', ingredientName)
        .maybeSingle();
      return data as IngredientDetail | null;
    },
  });

  // Products in the current scan that contain this ingredient (via scan store)
  const relatedProducts = lastScan?.productName
    ? [{ name: lastScan.productName, grade: lastScan.grade }]
    : [];

  // Resolve display data: DB row > scan store > defaults
  const detail = detailQuery.data;
  const rawRisk = detail?.safety_rating ?? (scanIngredient ? trafficToRisk(scanIngredient.traffic) : 'moderate');
  const risk = rawRisk as RiskLevel;
  const riskCfg = RISK_CONFIG[risk];
  const color = theme[riskCfg.colorKey];
  const description = detail?.description ?? scanIngredient?.note ?? 'No detailed information available for this ingredient yet.';

  const isLoading = detailQuery.isLoading;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg0 }]} edges={['top']}>
      <BackHeader title="Ingredient" onBack={() => router.back()} />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* ── Hero ────────────────────────────────────────────────────── */}
        <Animated.View entering={FadeInUp.duration(300).springify()}>
          <View style={[styles.heroCard, { backgroundColor: theme.bg1, borderColor: theme.border }]}>
            <Text style={[styles.ingredientName, { color: theme.text1 }]}>{ingredientName}</Text>

            {/* Risk badge */}
            <View style={[styles.riskBadge, { backgroundColor: `${color}14`, borderColor: `${color}40` }]}>
              <View style={[styles.riskDot, { backgroundColor: color }]} />
              <Text style={[styles.riskLabel, { color }]}>{riskCfg.label}</Text>
            </View>

            {/* Risk segment bar */}
            <SegmentedIndicator
              value={riskCfg.segValue}
              count={10}
              color={color}
              height={5}
              style={styles.riskSeg}
            />
          </View>
        </Animated.View>

        {/* ── Description ──────────────────────────────────────────── */}
        <Animated.View entering={FadeInUp.delay(60).duration(300).springify()}>
          <View style={[styles.block, { backgroundColor: theme.bg1, borderColor: theme.border }]}>
            <Text style={[styles.blockTitle, { color: theme.text1 }]}>What is it?</Text>
            {isLoading ? (
              <View style={styles.skWrap}>
                <SkeletonLoader width="100%" height={14} borderRadius={6} />
                <SkeletonLoader width="85%" height={14} borderRadius={6} />
                <SkeletonLoader width="70%" height={14} borderRadius={6} />
              </View>
            ) : (
              <Text style={[styles.bodyText, { color: theme.text2 }]}>{description}</Text>
            )}
          </View>
        </Animated.View>

        {/* ── Regulatory status ─────────────────────────────────────── */}
        {(detail?.ewg_score != null || detail?.fda_status || detail?.eu_status) && (
          <Animated.View entering={FadeInUp.delay(120).duration(300).springify()}>
            <View style={[styles.block, { backgroundColor: theme.bg1, borderColor: theme.border }]}>
              <Text style={[styles.blockTitle, { color: theme.text1 }]}>Regulatory Status</Text>
              <View style={styles.regGrid}>
                {detail.ewg_score != null && (
                  <View style={[styles.regChip, { backgroundColor: theme.bg2, borderColor: theme.border }]}>
                    <Text style={[styles.regChipLabel, { color: theme.text3 }]}>EWG Score</Text>
                    <Text style={[styles.regChipValue, { color: theme.text1 }]}>{detail.ewg_score}/10</Text>
                  </View>
                )}
                {detail.fda_status && (
                  <View style={[styles.regChip, { backgroundColor: theme.bg2, borderColor: theme.border }]}>
                    <Text style={[styles.regChipLabel, { color: theme.text3 }]}>FDA</Text>
                    <Text style={[styles.regChipValue, { color: theme.text1 }]}>{detail.fda_status}</Text>
                  </View>
                )}
                {detail.eu_status && (
                  <View style={[
                    styles.regChip,
                    {
                      backgroundColor: detail.is_eu_banned ? `${theme.red}14` : theme.bg2,
                      borderColor: detail.is_eu_banned ? `${theme.red}40` : theme.border,
                    },
                  ]}>
                    <Text style={[styles.regChipLabel, { color: theme.text3 }]}>EU</Text>
                    <Text style={[styles.regChipValue, { color: detail.is_eu_banned ? theme.red : theme.text1 }]}>
                      {detail.is_eu_banned ? 'Banned' : detail.eu_status}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </Animated.View>
        )}

        {/* ── Risk category ─────────────────────────────────────────── */}
        {detail?.risk_category && (
          <Animated.View entering={FadeInUp.delay(160).duration(300).springify()}>
            <View style={[styles.block, { backgroundColor: theme.bg1, borderColor: theme.border }]}>
              <Text style={[styles.blockTitle, { color: theme.text1 }]}>Risk Category</Text>
              <View style={[styles.catPill, { backgroundColor: `${color}14`, borderColor: `${color}30` }]}>
                <Text style={[styles.catText, { color }]}>{detail.risk_category}</Text>
              </View>
            </View>
          </Animated.View>
        )}

        {/* ── Common in products ───────────────────────────────────── */}
        {(detail?.common_in?.length ?? 0) > 0 && (
          <Animated.View entering={FadeInUp.delay(200).duration(300).springify()}>
            <View style={[styles.block, { backgroundColor: theme.bg1, borderColor: theme.border }]}>
              <Text style={[styles.blockTitle, { color: theme.text1 }]}>Commonly Found In</Text>
              <View style={styles.chipRow}>
                {detail!.common_in.map((item) => (
                  <View key={item} style={[styles.chip, { backgroundColor: theme.bg2, borderColor: theme.border }]}>
                    <Text style={[styles.chipText, { color: theme.text2 }]}>{item}</Text>
                  </View>
                ))}
              </View>
            </View>
          </Animated.View>
        )}

        {/* ── Safer alternatives ───────────────────────────────────── */}
        {(detail?.alternatives?.length ?? 0) > 0 && (
          <Animated.View entering={FadeInUp.delay(240).duration(300).springify()}>
            <View style={[styles.block, { backgroundColor: theme.bg1, borderColor: theme.border }]}>
              <Text style={[styles.blockTitle, { color: theme.text1 }]}>Safer Alternatives</Text>
              <View style={styles.chipRow}>
                {detail!.alternatives.map((alt) => (
                  <View key={alt} style={[styles.chip, { backgroundColor: `${theme.teal}10`, borderColor: `${theme.teal}30` }]}>
                    <Text style={[styles.chipText, { color: theme.teal }]}>{alt}</Text>
                  </View>
                ))}
              </View>
            </View>
          </Animated.View>
        )}

        {/* ── Found in your scan ────────────────────────────────────── */}
        {relatedProducts.length > 0 && (
          <Animated.View entering={FadeInUp.delay(280).duration(300).springify()}>
            <View style={[styles.block, { backgroundColor: theme.bg1, borderColor: theme.border }]}>
              <Text style={[styles.blockTitle, { color: theme.text1 }]}>Found in Your Scan</Text>
              {relatedProducts.map((p) => (
                <View key={p.name} style={[styles.productRow, { borderTopColor: theme.border }]}>
                  <Text style={[styles.productName, { color: theme.text1 }]} numberOfLines={1}>{p.name}</Text>
                  <View style={[styles.gradePill, { backgroundColor: `${theme.gold}14`, borderColor: `${theme.gold}30` }]}>
                    <Text style={[styles.gradeText, { color: theme.gold }]}>Grade {p.grade ?? '?'}</Text>
                  </View>
                </View>
              ))}
            </View>
          </Animated.View>
        )}

        {/* ── Ask AI ────────────────────────────────────────────────── */}
        <Animated.View entering={FadeInUp.delay(320).duration(300).springify()}>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => {
              hapticLight();
              router.push({
                pathname: '/assistant',
                params: {
                  ingredientName,
                  productName: lastScan?.productName ?? '',
                },
              } as never);
            }}
            style={[styles.aiBtn, { backgroundColor: `${theme.purple}14`, borderColor: `${theme.purple}40` }]}
          >
            <Text style={[styles.aiBtnText, { color: theme.purple }]}>
              Ask AI about {ingredientName}
            </Text>
          </TouchableOpacity>
        </Animated.View>

        {/* ── Disclaimer ────────────────────────────────────────────── */}
        <Text style={[styles.disclaimer, { color: theme.text3 }]}>
          This is educational information only. For personalized medical advice, consult a qualified
          licensed health professional.
        </Text>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { padding: 16, paddingBottom: 48, gap: 12 },

  heroCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    gap: 10,
  },
  ingredientName: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  riskBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
  },
  riskDot: { width: 7, height: 7, borderRadius: 3.5 },
  riskLabel: { fontSize: 12, fontWeight: '700' },
  riskSeg: { marginTop: 4 },

  block: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    gap: 10,
  },
  blockTitle: { fontSize: 14, fontWeight: '800', letterSpacing: -0.2 },
  bodyText: { fontSize: 13, lineHeight: 20, fontWeight: '400' },

  skWrap: { gap: 8 },

  regGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  regChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    gap: 2,
    minWidth: 80,
    alignItems: 'center',
  },
  regChipLabel: { fontSize: 9, fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase' },
  regChipValue: { fontSize: 13, fontWeight: '800', letterSpacing: -0.1 },

  catPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  catText: { fontSize: 12, fontWeight: '700' },

  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
  },
  chipText: { fontSize: 12, fontWeight: '500' },

  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: 8,
  },
  productName: { flex: 1, fontSize: 13, fontWeight: '600' },
  gradePill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  gradeText: { fontSize: 11, fontWeight: '700' },

  aiBtn: {
    paddingVertical: 14,
    borderRadius: 50,
    borderWidth: 1,
    alignItems: 'center',
  },
  aiBtnText: { fontSize: 14, fontWeight: '800', letterSpacing: -0.1 },

  disclaimer: {
    fontSize: 11,
    fontWeight: '400',
    lineHeight: 16,
    textAlign: 'center',
  },
});
