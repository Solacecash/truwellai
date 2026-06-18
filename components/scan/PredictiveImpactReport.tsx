import {
  checkPredictiveReportQuota,
  generatePredictiveReport,
  recordPredictiveReportUsage,
  type PredictiveImpact,
  type PredictiveReportQuota,
} from '@/lib/predictiveReport';
import LegalDisclaimer from '@/components/legal/LegalDisclaimer';
import { LEGAL } from '@/lib/legalContent';
import { useTheme } from '@/theme/ThemeContext';
import type { Theme } from '@/theme';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

type Recommendation = PredictiveImpact['recommendation'];

interface Props {
  ingredients: string[];
  userId?: string | null;
  userConditions?: string[];
  productName?: string | null;
  productId?: string | null;
  productType?: 'food' | 'cosmetic' | 'supplement' | 'household' | 'unknown';
  style?: object;
  autoLoad?: boolean;
}

const RECOMMENDATION_LABEL: Record<Recommendation, string> = {
  avoid: 'High Risk',
  limit: 'Use With Caution',
  safe: 'Generally Safe',
  excellent: 'Excellent Choice',
};

function recommendationColors(theme: Theme, rec: Recommendation) {
  switch (rec) {
    case 'avoid':
      return { bg: `${theme.red}20`, fg: theme.red, border: `${theme.red}50` };
    case 'limit':
      return { bg: `${theme.amber}22`, fg: theme.amber, border: `${theme.amber}55` };
    case 'excellent':
      return { bg: `${theme.green}20`, fg: theme.green, border: `${theme.green}50` };
    case 'safe':
    default:
      return { bg: `${theme.teal}22`, fg: theme.teal, border: `${theme.teal}55` };
  }
}

export function PredictiveImpactReport({
  ingredients,
  userId,
  userConditions,
  productName,
  productId,
  productType,
  style,
  autoLoad = false,
}: Props) {
  const { theme } = useTheme();
  const router = useRouter();
  const [quota, setQuota] = useState<PredictiveReportQuota | null>(null);
  const [report, setReport] = useState<PredictiveImpact | null>(null);
  const [loading, setLoading] = useState(false);
  const [expandedWarning, setExpandedWarning] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dismissUpgrade, setDismissUpgrade] = useState(false);
  const loadedOnce = useRef(false);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    void (async () => {
      try {
        const q = await checkPredictiveReportQuota(userId);
        if (!cancelled) setQuota(q);
      } catch {
        if (!cancelled) setQuota(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const runReport = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    try {
      const q = quota ?? (await checkPredictiveReportQuota(userId));
      if (!q.canAccess) {
        setQuota(q);
        setReport((prev) =>
          prev
            ? { ...prev, upgradeRequired: true }
            : {
                shortTerm: [],
                longTerm: [],
                riskFlags: [],
                ingredientWarnings: [],
                overallRiskScore: 0,
                recommendation: 'limit',
                upgradeRequired: true,
              }
        );
        return;
      }
      const result = await generatePredictiveReport({
        ingredients,
        productName: productName ?? undefined,
        productType: productType ?? 'unknown',
        userConditions,
      });
      setReport(result);
      void recordPredictiveReportUsage(userId, result, { productId, productName });
      try {
        const next = await checkPredictiveReportQuota(userId);
        setQuota(next);
      } catch {
        /* ignore */
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to generate report');
    } finally {
      setLoading(false);
    }
  }, [userId, quota, ingredients, productName, productType, userConditions, productId]);

  useEffect(() => {
    if (!autoLoad) return;
    if (loadedOnce.current) return;
    if (!userId || ingredients.length === 0) return;
    loadedOnce.current = true;
    void runReport();
  }, [autoLoad, userId, ingredients, runReport]);

  if (ingredients.length === 0) return null;

  const showUpgrade =
    (report?.upgradeRequired || (quota && !quota.isPro && !quota.canAccess)) && !dismissUpgrade;
  const recColors = report
    ? recommendationColors(theme, report.recommendation)
    : recommendationColors(theme, 'limit');

  return (
    <View style={[styles.wrap, { backgroundColor: theme.bg1, borderColor: theme.border }, style]}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: theme.text1 }]}>Ingredient Research Summary</Text>
          <Text style={[styles.subtitle, { color: theme.text3 }]}>Based on available research</Text>
        </View>
        {report && (
          <View style={[styles.recBadge, { backgroundColor: recColors.bg, borderColor: recColors.border }]}>
            <Text style={[styles.recBadgeText, { color: recColors.fg }]}>
              {RECOMMENDATION_LABEL[report.recommendation]}
            </Text>
          </View>
        )}
      </View>

      {!report && !loading && !showUpgrade && (
        <TouchableOpacity
          activeOpacity={0.85}
          style={[styles.generateBtn, { backgroundColor: `${theme.teal}18`, borderColor: `${theme.teal}55` }]}
          onPress={() => void runReport()}
        >
          <Text style={[styles.generateTxt, { color: theme.teal }]}>Generate ingredient research summary</Text>
        </TouchableOpacity>
      )}

      {loading && (
        <View style={styles.loadingBox}>
          <ActivityIndicator color={theme.teal} />
          <Text style={[styles.loadingTxt, { color: theme.text3 }]}>
            Analysing ingredient research data...
          </Text>
        </View>
      )}

      {error && !loading && (
        <View style={[styles.errorBox, { backgroundColor: `${theme.red}16`, borderColor: `${theme.red}40` }]}>
          <Text style={[styles.errorTxt, { color: theme.red }]}>{error}</Text>
          <TouchableOpacity onPress={() => void runReport()}>
            <Text style={[styles.retryTxt, { color: theme.teal }]}>Try again</Text>
          </TouchableOpacity>
        </View>
      )}

      {report && !loading && (
        <>
          {report.shortTerm.length > 0 && (
            <View style={[styles.card, { backgroundColor: `${theme.teal}10`, borderLeftColor: theme.teal }]}>
              <Text style={[styles.sectionLabel, { color: theme.teal }]}>RESEARCH: SHORT TERM (1-4 WEEKS)</Text>
              {report.shortTerm.map((item, i) => (
                <View key={i} style={styles.bulletRow}>
                  <View style={[styles.bulletDot, { backgroundColor: theme.teal }]} />
                  <Text style={[styles.bulletTxt, { color: theme.text2 }]}>{item}</Text>
                </View>
              ))}
            </View>
          )}

          {report.longTerm.length > 0 && (
            <View style={[styles.card, { backgroundColor: `${theme.gold}10`, borderLeftColor: theme.gold }]}>
              <Text style={[styles.sectionLabel, { color: theme.gold }]}>RESEARCH: LONG TERM (3-12 MONTHS)</Text>
              {report.longTerm.map((item, i) => (
                <View key={i} style={styles.bulletRow}>
                  <View style={[styles.bulletDot, { backgroundColor: theme.gold }]} />
                  <Text style={[styles.bulletTxt, { color: theme.text2 }]}>{item}</Text>
                </View>
              ))}
            </View>
          )}

          {report.calorieImpact && (
            <View
              style={[
                styles.calorieCard,
                { backgroundColor: 'rgba(201,168,76,0.06)', borderColor: 'rgba(201,168,76,0.35)' },
              ]}
            >
              <Text style={[styles.sectionLabel, { color: theme.gold }]}>CALORIE INTELLIGENCE</Text>
              <Text style={[styles.calorieBig, { color: theme.gold }]}>
                {Math.round(report.calorieImpact.dailyCalories)}
                <Text style={[styles.calorieUnit, { color: theme.text3 }]}> kcal/day</Text>
              </Text>
              <View style={styles.calorieRow}>
                <Text style={[styles.calorieRowLabel, { color: theme.text3 }]}>Weekly</Text>
                <Text style={[styles.calorieRowVal, { color: theme.text2 }]} numberOfLines={2}>
                  {report.calorieImpact.weeklyImpact || '—'}
                </Text>
              </View>
              <View style={styles.calorieRow}>
                <Text style={[styles.calorieRowLabel, { color: theme.text3 }]}>Monthly</Text>
                <Text style={[styles.calorieRowVal, { color: theme.text2 }]} numberOfLines={3}>
                  {report.calorieImpact.monthlyImpact || '—'}
                </Text>
              </View>
              {report.calorieImpact.weightRiskPerMonth > 0 && (
                <View style={[styles.weightWarn, { backgroundColor: `${theme.red}18`, borderColor: `${theme.red}40` }]}>
                  <Text style={[styles.weightWarnTxt, { color: theme.red }]}>
                    Research has associated similar consumption patterns with weight changes of approximately {report.calorieImpact.weightRiskPerMonth.toFixed(1)}kg/month in studied populations
                  </Text>
                </View>
              )}
            </View>
          )}

          {report.riskFlags.length > 0 && (
            <View style={styles.flagsWrap}>
              {report.riskFlags.map((flag, i) => {
                const c =
                  flag.risk === 'high'
                    ? { bg: `${theme.red}18`, fg: theme.red, border: `${theme.red}40` }
                    : flag.risk === 'medium'
                      ? { bg: `${theme.amber}1a`, fg: theme.amber, border: `${theme.amber}40` }
                      : { bg: `${theme.teal}14`, fg: theme.teal, border: `${theme.teal}40` };
                return (
                  <View
                    key={`${flag.condition}-${i}`}
                    style={[styles.flagCard, { backgroundColor: c.bg, borderColor: c.border }]}
                  >
                    <View style={styles.flagHeader}>
                      <Text style={[styles.flagCondition, { color: theme.text1 }]} numberOfLines={1}>
                        {flag.condition}
                      </Text>
                      <View style={[styles.riskPill, { backgroundColor: c.fg }]}>
                        <Text style={[styles.riskPillTxt, { color: theme.bg0 }]}>
                          {flag.risk.toUpperCase()}
                        </Text>
                      </View>
                    </View>
                    <Text style={[styles.flagExplanation, { color: theme.text2 }]}>
                      {flag.explanation}
                    </Text>
                  </View>
                );
              })}
            </View>
          )}

          {report.ingredientWarnings.length > 0 && (
            <View style={styles.warningsWrap}>
              <Text style={[styles.sectionLabel, { color: theme.text3 }]}>INGREDIENT WARNINGS</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.warningChips}
              >
                {report.ingredientWarnings.map((w) => {
                  const open = expandedWarning === w.ingredient;
                  return (
                    <TouchableOpacity
                      key={w.ingredient}
                      activeOpacity={0.85}
                      onPress={() => setExpandedWarning(open ? null : w.ingredient)}
                      style={[
                        styles.warningChip,
                        {
                          backgroundColor: open ? `${theme.red}18` : `${theme.amber}12`,
                          borderColor: open ? `${theme.red}50` : `${theme.amber}40`,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.warningChipTxt,
                          { color: open ? theme.red : theme.amber },
                        ]}
                        numberOfLines={1}
                      >
                        {w.ingredient}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
              {expandedWarning &&
                (() => {
                  const w = report.ingredientWarnings.find((x) => x.ingredient === expandedWarning);
                  if (!w) return null;
                  return (
                    <View style={[styles.warningBox, { backgroundColor: theme.bg2, borderColor: theme.border }]}>
                      <Text style={[styles.warningTitle, { color: theme.text1 }]}>{w.ingredient}</Text>
                      <Text style={[styles.warningBody, { color: theme.text2 }]}>{w.warning}</Text>
                      {w.affectedConditions.length > 0 && (
                        <Text style={[styles.warningMeta, { color: theme.text3 }]}>
                          Relevant to: {w.affectedConditions.join(', ')}
                        </Text>
                      )}
                    </View>
                  );
                })()}
            </View>
          )}
        </>
      )}

      {quota && !quota.isPro && (
        <View style={styles.quotaBox}>
          <Text style={[styles.quotaTxt, { color: theme.text3 }]}>
            {quota.used} of {quota.limit} free reports used this month
          </Text>
          <View style={[styles.segmentRow, { backgroundColor: theme.bg2 }]}>
            {Array.from({ length: quota.limit }).map((_, i) => (
              <View
                key={i}
                style={[
                  styles.segment,
                  {
                    backgroundColor: i < quota.used ? theme.gold : 'transparent',
                  },
                ]}
              />
            ))}
          </View>
        </View>
      )}

      {showUpgrade && (
        <View
          style={[
            styles.upgradeCard,
            { backgroundColor: `${theme.gold}14`, borderColor: `${theme.gold}55` },
          ]}
        >
          <Text style={[styles.upgradeTitle, { color: theme.gold }]}>
            Unlock Unlimited Ingredient Research Summaries
          </Text>
          <Text style={[styles.upgradeBody, { color: theme.text2 }]}>
            You have used all {quota?.limit ?? 5} free research summaries this month. Upgrade TruWell AI for unlimited
            ingredient research analysis.
          </Text>
          <View style={styles.upgradeRow}>
            <TouchableOpacity
              activeOpacity={0.85}
              style={[styles.upgradeBtn, { backgroundColor: theme.gold }]}
              onPress={() => router.push('/settings/subscription' as never)}
            >
              <Text style={[styles.upgradeBtnTxt, { color: theme.bg0 }]}>Upgrade Now</Text>
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={0.85}
              style={[styles.upgradeDismiss, { borderColor: theme.border }]}
              onPress={() => setDismissUpgrade(true)}
            >
              <Text style={[styles.upgradeDismissTxt, { color: theme.text3 }]}>Remind Me Later</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <LegalDisclaimer
        text={LEGAL.INGREDIENT_SUMMARY_DISCLAIMER}
        variant="footer"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
    gap: 12,
  },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  title: { fontSize: 16, fontWeight: '800', letterSpacing: -0.2 },
  subtitle: { fontSize: 11, marginTop: 2 },

  recBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12, borderWidth: 1 },
  recBadgeText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.3 },

  generateBtn: {
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
  },
  generateTxt: { fontSize: 13, fontWeight: '800', letterSpacing: 0.2 },

  loadingBox: { alignItems: 'center', gap: 8, paddingVertical: 18 },
  loadingTxt: { fontSize: 11 },

  errorBox: { padding: 10, borderRadius: 12, borderWidth: 1, gap: 6 },
  errorTxt: { fontSize: 12, fontWeight: '700' },
  retryTxt: { fontSize: 11, fontWeight: '800' },

  card: {
    borderLeftWidth: 3,
    borderRadius: 10,
    padding: 10,
    gap: 6,
  },
  sectionLabel: { fontSize: 9, fontWeight: '800', letterSpacing: 0.6 },
  bulletRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 6 },
  bulletDot: { width: 5, height: 5, borderRadius: 3, marginTop: 6 },
  bulletTxt: { flex: 1, fontSize: 13, lineHeight: 18 },

  calorieCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    gap: 8,
  },
  calorieBig: { fontSize: 24, fontWeight: '900', letterSpacing: -0.5 },
  calorieUnit: { fontSize: 12, fontWeight: '700' },
  calorieRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  calorieRowLabel: { fontSize: 11, fontWeight: '800', width: 64 },
  calorieRowVal: { flex: 1, fontSize: 12 },
  weightWarn: {
    borderRadius: 8,
    borderWidth: 1,
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginTop: 4,
  },
  weightWarnTxt: { fontSize: 12, fontWeight: '800' },

  flagsWrap: { gap: 8 },
  flagCard: { borderRadius: 12, borderWidth: 1, padding: 10, gap: 6 },
  flagHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  flagCondition: { flex: 1, fontSize: 13, fontWeight: '800' },
  riskPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  riskPillTxt: { fontSize: 9, fontWeight: '900', letterSpacing: 0.6 },
  flagExplanation: { fontSize: 12, lineHeight: 17 },

  warningsWrap: { gap: 8 },
  warningChips: { gap: 8, paddingRight: 12 },
  warningChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    maxWidth: 180,
  },
  warningChipTxt: { fontSize: 11, fontWeight: '800' },
  warningBox: { padding: 10, borderRadius: 10, borderWidth: 1, gap: 4 },
  warningTitle: { fontSize: 13, fontWeight: '800' },
  warningBody: { fontSize: 12, lineHeight: 17 },
  warningMeta: { fontSize: 10, fontStyle: 'italic' },

  quotaBox: { gap: 6 },
  quotaTxt: { fontSize: 11, fontWeight: '700' },
  segmentRow: { flexDirection: 'row', gap: 4, padding: 3, borderRadius: 6 },
  segment: { flex: 1, height: 6, borderRadius: 4 },

  upgradeCard: { borderRadius: 14, borderWidth: 1, padding: 12, gap: 8 },
  upgradeTitle: { fontSize: 13, fontWeight: '900', letterSpacing: -0.1 },
  upgradeBody: { fontSize: 12, lineHeight: 17 },
  upgradeRow: { flexDirection: 'row', gap: 8, marginTop: 4 },
  upgradeBtn: { flex: 1, paddingVertical: 11, borderRadius: 12, alignItems: 'center' },
  upgradeBtnTxt: { fontSize: 12, fontWeight: '900' },
  upgradeDismiss: { flex: 1, paddingVertical: 11, borderRadius: 12, borderWidth: 1, alignItems: 'center' },
  upgradeDismissTxt: { fontSize: 12, fontWeight: '700' },
});
