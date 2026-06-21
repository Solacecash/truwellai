import { AlternativesCarousel } from '@/components/scan/AlternativesCarousel';
import { BatchIntelligenceCard } from '@/components/scan/BatchIntelligenceCard';
import { GlobalWatchlistAlert } from '@/components/scan/GlobalWatchlistAlert';
import { GradeScoreCard } from '@/components/scan/GradeScoreCard';
import { IngredientRow, Ingredient } from '@/components/scan/IngredientRow';
import { PredictiveImpactReport } from '@/components/scan/PredictiveImpactReport';
import LegalDisclaimer from '@/components/legal/LegalDisclaimer';
import EmergencyNotice from '@/components/legal/EmergencyNotice';
import { LEGAL } from '@/lib/legalContent';
import { QuotaWarningBanner } from '@/components/subscription/QuotaWarningBanner';
import { UpgradePromptCard } from '@/components/subscription/UpgradePromptCard';
import { getQuotaStatus, type QuotaStatus } from '@/lib/quotaManager';
import { canAccessFeature } from '@/lib/subscriptionPlans';
import { UpgradeChip } from '@/components/subscription/UpgradeChip';
import { AlertBanner } from '@/components/ui/AlertBanner';
import { BackHeader } from '@/components/ui/BackHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { recordWellnessActivityDay } from '@/lib/activityStreak';
import { fetchAlternatives, type AltDto } from '@/lib/edge';
import {
  checkGlobalWatchlist,
  jurisdictionForCountry,
  type WatchlistResult,
} from '@/lib/globalWatchlist';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { useRewardStore } from '@/stores/rewardStore';
import { useScanStore, type GradedIngredient } from '@/stores/scanStore';
import { useTheme } from '@/theme/ThemeContext';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { Grade } from '@/components/ui/GradeCard';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const VALID_GRADES: Grade[] = ['A+', 'A', 'B', 'C', 'D', 'F'];

function toGrade(raw: string | null | undefined): Grade {
  const up = (raw ?? 'C').toUpperCase() as Grade;
  return VALID_GRADES.includes(up) ? up : 'C';
}

function mapIngredient(g: GradedIngredient, idx: number): Ingredient {
  return {
    id: `${g.name}-${idx}`,
    name: g.name,
    safety_rating: g.traffic,
    description: g.note,
  };
}

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

interface HealthProfileCtx {
  conditions: string[];
  countryCode?: string | null;
}

export default function ScanResultScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const queryClient = useQueryClient();
  const session = useAuthStore((s) => s.session);
  const userId = session?.user.id;
  const result = useScanStore((s) => s.lastResult);
  const addXp = useRewardStore((s) => s.addXp);
  const incrementScanCount = useRewardStore((s) => s.incrementScanCount);
  const [alts, setAlts] = useState<AltDto[]>([]);
  const [alertDismissed, setAlertDismissed] = useState(false);
  const [watchlist, setWatchlist] = useState<WatchlistResult | null>(null);
  const [healthCtx, setHealthCtx] = useState<HealthProfileCtx>({ conditions: [], countryCode: null });
  const [reportQuota, setReportQuota] = useState<QuotaStatus | null>(null);

  useEffect(() => {
    if (!userId) return;
    getQuotaStatus(userId).then(setReportQuota).catch(() => {});
  }, [userId]);
  const xpIssued = useRef(false);
  const habitCounted = useRef(new Set<string>());

  const grade = toGrade(result?.grade);
  const score = result?.score ?? 0;

  // ?? Preserved: XP issuance ???????????????????????????????????????????????
  useEffect(() => {
    if (xpIssued.current) return;
    xpIssued.current = true;
    addXp(10);
  }, [addXp]);

  // ?? Preserved: habit / streak counting ??????????????????????????????????
  useEffect(() => {
    const k = result?.barcode ?? result?.productName ?? '';
    if (!k || habitCounted.current.has(k)) return;
    habitCounted.current.add(k);
    incrementScanCount();
    void recordWellnessActivityDay();
    void queryClient.invalidateQueries({ queryKey: ['scans-count', userId] });
    void queryClient.invalidateQueries({ queryKey: ['scan-metrics-live', userId] });
    void queryClient.invalidateQueries({ queryKey: ['user-score', userId] });
  }, [result, incrementScanCount, queryClient, userId]);

  // ?? Preserved: alternatives fetching ????????????????????????????????????
  useEffect(() => {
    if (!result?.barcode) { setAlts([]); return; }
    let cancelled = false;
    void (async () => {
      try {
        const { items } = await fetchAlternatives({ excludeBarcode: result.barcode });
        if (!cancelled) setAlts(items ?? []);
      } catch {
        if (!cancelled) setAlts([]);
      }
    })();
    return () => { cancelled = true; };
  }, [result?.barcode]);

  // ?? Load user health profile (conditions + country_code) for AI context ?
  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    void (async () => {
      try {
        const { data } = await supabase
          .from('user_health_profiles')
          .select('conditions, country_code')
          .eq('user_id', userId)
          .maybeSingle();
        if (cancelled) return;
        const raw = data as { conditions?: unknown; country_code?: string | null } | null;
        const conditions = Array.isArray(raw?.conditions)
          ? (raw!.conditions as unknown[]).map((x) => String(x)).filter(Boolean)
          : [];
        setHealthCtx({ conditions, countryCode: raw?.country_code ?? null });
      } catch {
        if (!cancelled) setHealthCtx({ conditions: [], countryCode: null });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  // ?? Cross-reference ingredients against global_watchlist ?????????????????
  useEffect(() => {
    if (!result) return;
    const ingredientNames = result.ingredients.map((i) => i.name).filter(Boolean);
    if (ingredientNames.length === 0 && !result.productName) {
      setWatchlist(null);
      return;
    }
    let cancelled = false;
    void (async () => {
      const r = await checkGlobalWatchlist(ingredientNames, result.productName ?? null);
      if (!cancelled) setWatchlist(r);
    })();
    return () => {
      cancelled = true;
    };
  }, [result]);

  // ?? Empty state ??????????????????????????????????????????????????????????
  if (!result) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg0 }]}>
        <BackHeader title="Scan Result" onBack={() => router.back()} />
        <EmptyState
          icon="?-?"
          title="No scan yet"
          subtitle="Capture a barcode or label to see ingredients and scores."
          ctaLabel="Open scanner"
          onCta={() => router.replace('/scan')}
        />
      </SafeAreaView>
    );
  }

  const ingredients: Ingredient[] = result.ingredients.map(mapIngredient);
  const riskFlags = result.riskNotes ?? [];
  const hasPersonalizedAlert = riskFlags.length > 0;
  const ingredientNames = result.ingredients.map((i) => i.name).filter(Boolean);
  const userJurisdiction = useMemo(
    () => jurisdictionForCountry(healthCtx.countryCode ?? null),
    [healthCtx.countryCode]
  );
  const scanMethod = result.scanMethod ?? 'barcode';

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg0 }]} edges={['top']}>
      <BackHeader title={result.productName ?? 'Scan Result'} onBack={() => router.back()} />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* ?? Scan method badge (OCR / QR) ????????????????????????????????? */}
        {(scanMethod === 'ocr' || scanMethod === 'qr') && (
          <View style={styles.methodBadgeWrap}>
            <View
              style={[
                styles.methodBadge,
                {
                  backgroundColor: scanMethod === 'ocr' ? `${theme.gold}1F` : `${theme.teal}1F`,
                  borderColor: scanMethod === 'ocr' ? `${theme.gold}66` : `${theme.teal}66`,
                },
              ]}
            >
              <Text
                style={[
                  styles.methodBadgeTxt,
                  { color: scanMethod === 'ocr' ? theme.gold : theme.teal },
                ]}
              >
                {scanMethod === 'ocr' ? 'Scanned via Label OCR' : 'Scanned via QR Code'}
              </Text>
            </View>
          </View>
        )}

        {/* ?? Global Watchlist Alert (top of report) ??????????????????????? */}
        {watchlist?.hasAlerts && (
          <View style={styles.card}>
            <GlobalWatchlistAlert watchlist={watchlist} userJurisdiction={userJurisdiction} />
          </View>
        )}

        {/* ?? Grade + Score hero ??????????????????????????????????????????? */}
        <GradeScoreCard
          grade={grade}
          score={score}
          productName={result.productName}
          style={styles.card}
        />

        {/* ?? Batch Intelligence (only for QR scans with GS1 data) ????????? */}
        {result.batchData && (
          <View style={[styles.card, { position: 'relative', overflow: 'hidden' }]}>
            <BatchIntelligenceCard
              batch={{
                gtin: result.batchData.gtin,
                batchLot: result.batchData.batchLot,
                expiryDate: result.batchData.expiryDate,
                productionDate: result.batchData.productionDate,
                serialNumber: result.batchData.serialNumber,
                raw: result.batchData.raw ?? '',
              }}
              productName={result.productName}
            />
            {reportQuota && !canAccessFeature(reportQuota.planId, 'hasBatchTracking') && (
              <View style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(2,10,20,0.80)', alignItems: 'center', justifyContent: 'center' }}>
                <UpgradeChip onPress={() => router.push('/settings/subscription')} label="Unlock Batch Tracking" />
              </View>
            )}
          </View>
        )}

        {/* ?? Personalized alerts ????????????????????????????????????????? */}
        {hasPersonalizedAlert && !alertDismissed && (
          <View style={styles.card}>
            <Text style={[styles.sectionTitle, { color: theme.text1 }]}>
              Personalized Flags
            </Text>
            {riskFlags.map((flag, i) => (
              <AlertBanner
                key={i}
                message={flag}
                onDismiss={i === 0 ? () => setAlertDismissed(true) : undefined}
                style={i < riskFlags.length - 1 ? styles.alertSpacing : undefined}
              />
            ))}
          </View>
        )}

        {/* ?? Ingredient breakdown ???????????????????????????????????????? */}
        {ingredients.length > 0 && (
          <View style={[styles.ingredientBlock, { backgroundColor: theme.bg1, borderColor: theme.border }]}>
            <Text style={[styles.sectionTitle, styles.sectionPad, { color: theme.text1 }]}>
              Ingredients ({ingredients.length})
            </Text>
            {ingredients.map((ing) => (
              <IngredientRow key={ing.id} ingredient={ing} />
            ))}
          </View>
        )}

        {/* ?? Predictive Impact Report ???????????????????????????????????? */}
        {ingredientNames.length > 0 && userId && (
          reportQuota?.isAtReportLimit ? (
            <View style={styles.card}>
              <UpgradePromptCard
                featureName="Predictive Impact Reports"
                description="You have used all 5 free reports this month. Upgrade for unlimited health impact analysis."
                onUpgrade={() => router.push('/settings/subscription' as never)}
              />
            </View>
          ) : (
            <View style={styles.card}>
              {reportQuota?.isNearReportLimit && (
                <QuotaWarningBanner
                  quotaStatus={reportQuota}
                  onUpgrade={() => router.push('/settings/subscription' as never)}
                  type="report"
                />
              )}
              <PredictiveImpactReport
                ingredients={ingredientNames}
                userId={userId}
                userConditions={healthCtx.conditions}
                productName={result.productName ?? null}
                productId={result.barcode ?? null}
                productType={result.productType ?? 'unknown'}
              />
            </View>
          )
        )}

        {/* ?? Watchlist Clear pill (when no alerts) ??????????????????????? */}
        {watchlist && !watchlist.hasAlerts && (
          <View style={styles.card}>
            <GlobalWatchlistAlert watchlist={watchlist} userJurisdiction={userJurisdiction} />
          </View>
        )}

        {/* ?? Ask AI button ??????????????????????????????????????????????? */}
        <TouchableOpacity
          activeOpacity={0.85}
          style={[styles.askAiBtn, { backgroundColor: `${theme.purple}18`, borderColor: `${theme.purple}40` }]}
          onPress={() =>
            router.push({
              pathname: '/assistant',
              params: {
                productName: result.productName ?? '',
                ingredientName: result.ingredients[0]?.name ?? '',
              },
            } as never)
          }
        >
          <Text style={[styles.askAiText, { color: theme.purple }]}>
            Ask AI about these ingredients
          </Text>
        </TouchableOpacity>

        {/* ?? Smart Alternatives ?????????????????????????????????????????? */}
        {alts.length > 0 && (
          <AlternativesCarousel
            excludeBarcode={result.barcode}
            items={alts.map((a) => ({
              id: a.id,
              name: a.name,
              brand: a.brand,
              grade: a.grade,
              score: a.score,
              priceBand: a.priceBand,
              imageUrl: a.imageUrl,
            }))}
          />
        )}

        {/* ?? Legal disclaimers ??????????????????????????????????????????? */}
        <LegalDisclaimer
          text={LEGAL.SAFETY_GRADE_EXPLANATION}
          variant="footer"
          style={styles.card}
        />
        <LegalDisclaimer
          text={LEGAL.SCAN_RESULT_DISCLAIMER}
          variant="footer"
          style={styles.card}
        />
        <EmergencyNotice compact />

        {/* ?? Action buttons ?????????????????????????????????????????????? */}
        <View style={styles.actions}>
          <TouchableOpacity
            activeOpacity={0.85}
            style={[styles.actionBtn, { backgroundColor: `${theme.teal}14`, borderColor: `${theme.teal}40` }]}
            onPress={async () => {
              if (!userId || !result.barcode) return;
              await supabase.from('user_safe_products').upsert({
                user_id: userId,
                barcode: result.barcode,
                product_name: result.productName ?? '',
                added_at: new Date().toISOString(),
              });
            }}
          >
            <Text style={[styles.actionBtnText, { color: theme.teal }]}>Add to Safe List</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.85}
            style={[styles.actionBtn, { backgroundColor: `${theme.gold}14`, borderColor: `${theme.gold}40` }]}
            onPress={() =>
              router.push({
                pathname: '/review/new',
                params: {
                  barcode: result.barcode ?? '',
                  productName: result.productName ?? '',
                },
              } as never)
            }
          >
            <Text style={[styles.actionBtnText, { color: theme.gold }]}>Write Review</Text>
            <Text style={[styles.actionBtnSub, { color: `${theme.gold}70` }]}>
              Posts to SafeCircle community
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={{
          fontSize: 10,
          color: 'rgba(160,174,192,0.5)',
          textAlign: 'center',
          paddingHorizontal: 20,
          paddingVertical: 12,
          lineHeight: 14,
        }}>
          TruWell AI is not a medical device and does
          not diagnose, treat, or prevent any condition.
          For informational purposes only.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { paddingBottom: 40 },

  card: { marginHorizontal: 16, marginTop: 14 },

  // Section headers
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.2,
    marginBottom: 10,
  },
  sectionPad: { paddingHorizontal: 16, paddingTop: 14 },

  // Personalized alerts
  alertSpacing: { marginBottom: 8 },

  // Ingredient block
  ingredientBlock: {
    marginHorizontal: 16,
    marginTop: 14,
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
  },

  // Ask AI button
  askAiBtn: {
    marginHorizontal: 16,
    marginTop: 14,
    paddingVertical: 14,
    borderRadius: 50,
    borderWidth: 1,
    alignItems: 'center',
  },
  askAiText: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: -0.1,
  },

  // Action buttons
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginHorizontal: 16,
    marginTop: 16,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
  },
  actionBtnText: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: -0.1,
  },
  actionBtnSub: {
    fontSize: 9,
    fontWeight: '600',
    marginTop: 2,
    letterSpacing: 0.2,
  },

  methodBadgeWrap: { alignItems: 'center', marginTop: 10 },
  methodBadge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
  },
  methodBadgeTxt: { fontSize: 11, fontWeight: '800', letterSpacing: 0.2 },
});
