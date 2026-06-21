import { Grade } from '@/components/ui/GradeCard';
import { RingChart } from '@/components/ui/RingChart';
import { SegmentedIndicator, SegmentedIndicatorRef } from '@/components/ui/SegmentedIndicator';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
import { resolveLiveHealthMetrics, type ScanRow } from '@/lib/healthScores';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { useTheme } from '@/theme/ThemeContext';
import { useQuery } from '@tanstack/react-query';
import { forwardRef, useCallback, useImperativeHandle, useMemo, useRef, useState } from 'react';
import {
  Dimensions,
  FlatList,
  ListRenderItemInfo,
  StyleSheet,
  Text,
  View,
  ViewToken,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';

const CARD_H_PADDING = 20;
const CARD_GAP = 12;

function carouselSlideWidth() {
  return Dimensions.get('window').width - CARD_H_PADDING * 2;
}

function toGradeFromPct(avg: number): Grade {
  if (avg >= 92) return 'A+';
  if (avg >= 85) return 'A';
  if (avg >= 75) return 'B';
  if (avg >= 65) return 'C';
  if (avg >= 50) return 'D';
  return 'F';
}

function toGradeLetter(raw: string | null | undefined): Grade | null {
  const valid: Grade[] = ['A+', 'A', 'B', 'C', 'D', 'F'];
  const up = (raw ?? '').toUpperCase() as Grade;
  return valid.includes(up) ? up : null;
}

const SlideRow = forwardRef<
  SegmentedIndicatorRef,
  { label: string; pct: number; color: string; animate: boolean; valueLabel?: string }
>(function SlideRow({ label, pct, color, animate, valueLabel }, ref) {
  const { theme } = useTheme();
  const innerRef = useRef<SegmentedIndicatorRef | null>(null);
  useImperativeHandle(ref, () => ({
    triggerAnimation: () => innerRef.current?.triggerAnimation(),
  }));
  const displayValue = valueLabel ?? (pct > 0 ? `${Math.round(pct)}%` : '—');
  return (
    <View style={slideRowStyles.row}>
      <View style={slideRowStyles.labelRow}>
        <Text style={[slideRowStyles.lbl, { color: theme.text3 }]} numberOfLines={1}>
          {label}
        </Text>
        <Text style={[slideRowStyles.val, { color: theme.text2 }]}>{displayValue}</Text>
      </View>
      <SegmentedIndicator
        ref={innerRef}
        value={Math.min(100, Math.max(0, pct))}
        count={10}
        color={color}
        height={3}
        gap={2}
        animated={animate}
      />
    </View>
  );
});

const slideRowStyles = StyleSheet.create({
  row: { gap: 4, width: '100%', overflow: 'hidden' },
  labelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  lbl: { fontSize: 9, fontWeight: '700', letterSpacing: 0.4, textTransform: 'uppercase', flex: 1 },
  val: { fontSize: 10, fontWeight: '800', fontVariant: ['tabular-nums'] },
});

type SlideKey = 'lifestyle' | 'scan' | 'wellness' | 'personal';

export function HealthScoreCarousel({
  scoreLoading,
  storedScores,
  scoreDelta7d,
  streakDays,
  xpLevel,
}: {
  scoreLoading: boolean;
  /** Cached row from user_scores; scan-derived metrics take priority when available. */
  storedScores: {
    overall_score?: number | null;
    overall_grade?: string | null;
    skin_safety_pct?: number | null;
    ingredient_purity_pct?: number | null;
    allergen_risk_pct?: number | null;
  } | null;
  scoreDelta7d: number;
  streakDays: number;
  xpLevel: number;
}) {
  const { theme } = useTheme();
  const userId = useAuthStore((s) => s.session?.user?.id);
  const [focused, setFocused] = useState(0);
  const slideW = carouselSlideWidth();

  const segRef0 = useRef<SegmentedIndicatorRef | null>(null);
  const segRef1 = useRef<SegmentedIndicatorRef | null>(null);
  const segRef2 = useRef<SegmentedIndicatorRef | null>(null);
  const segRef3 = useRef<SegmentedIndicatorRef | null>(null);
  const segRef4 = useRef<SegmentedIndicatorRef | null>(null);
  const wellnessQ = useQuery({
    queryKey: ['user-wellness-carousel', userId],
    enabled: !!userId,
    staleTime: 30 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_wellness')
        .select('daily_water_cups, water_goal, breathing_sessions_today, breathing_goal, calories_consumed, calorie_target')
        .eq('user_id', userId!)
        .maybeSingle();
      if (error) return null;
      return data;
    },
  });

  const scansAggQ = useQuery({
    queryKey: ['scan-metrics-live', userId],
    enabled: !!userId,
    staleTime: 60 * 1000,
    queryFn: async () => {
      const [scansRes, historyRes] = await Promise.all([
        supabase
          .from('scans')
          .select('score, grade, result_summary, raw_payload, created_at')
          .eq('user_id', userId!)
          .order('created_at', { ascending: false })
          .limit(40),
        supabase
          .from('scan_history')
          .select(
            'overall_score, overall_grade, skin_safety_pct, ingredient_purity_pct, allergen_risk_pct, personalized_risk_flags, created_at'
          )
          .eq('user_id', userId!)
          .order('created_at', { ascending: false })
          .limit(40),
      ]);

      const fromScans: ScanRow[] = (scansRes.data ?? []).map((r) => ({
        score: r.score,
        grade: r.grade,
        result_summary: r.result_summary,
        raw_payload: r.raw_payload,
      }));

      const fromHistory: ScanRow[] = (historyRes.data ?? []).map((r) => ({
        score: r.overall_score,
        grade: r.overall_grade,
        skin_safety_pct: r.skin_safety_pct,
        ingredient_purity_pct: r.ingredient_purity_pct,
        allergen_risk_pct: r.allergen_risk_pct,
        personalized_risk_flags: r.personalized_risk_flags,
      }));

      return fromScans.length > 0 ? fromScans : fromHistory;
    },
  });

  const liveMetrics = useMemo(
    () => resolveLiveHealthMetrics(storedScores, scansAggQ.data ?? []),
    [storedScores, scansAggQ.data]
  );

  const skinPct = liveMetrics.skinSafetyPct;
  const purityPct = liveMetrics.ingredientPurityPct;
  const allergenPct = liveMetrics.allergenRiskPct;
  const overallScore = liveMetrics.overallScore;
  const overallGrade = liveMetrics.overallGrade ?? storedScores?.overall_grade ?? null;

  const flaggedCount = useMemo(() => {
    let n = 0;
    for (const r of scansAggQ.data ?? []) {
      const flags = r.personalized_risk_flags as string[] | undefined;
      if (flags?.length) n += flags.length;
      const summary = r.result_summary as { riskNotes?: string[] } | null | undefined;
      if (summary?.riskNotes?.length) n += summary.riskNotes.length;
    }
    if (n === 0 && liveMetrics.scanCount > 0) {
      return Math.max(0, Math.round((100 - skinPct) / 12));
    }
    return n;
  }, [scansAggQ.data, liveMetrics.scanCount, skinPct]);

  const topCategoryQ = useQuery({
    queryKey: ['scan-flag-categories', userId],
    enabled: !!userId,
    staleTime: 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('scan_history')
        .select('personalized_risk_flags')
        .eq('user_id', userId!)
        .limit(80);
      if (error) {
        const { data: scanData } = await supabase
          .from('scans')
          .select('result_summary')
          .eq('user_id', userId!)
          .limit(80);
        const rows = scanData ?? [];
        const catCounts: Record<string, number> = {};
        for (const r of rows) {
          const summary = r.result_summary as { riskNotes?: string[]; high_risk_ingredients?: { name: string; reason: string }[] } | null;
          const flags = summary?.riskNotes ?? summary?.high_risk_ingredients?.map((h) => h.reason) ?? [];
          for (const f of flags) {
            const low = f.toLowerCase();
            let bucket = 'Other';
            if (/preserv|paraben|benzoate/i.test(low)) bucket = 'Preservatives';
            else if (/fragrance|perfume|scent/i.test(low)) bucket = 'Fragrances';
            else if (/sulfate|sls/i.test(low)) bucket = 'Sulfates';
            else if (/dye|color/i.test(low)) bucket = 'Colorants';
            catCounts[bucket] = (catCounts[bucket] ?? 0) + 1;
          }
        }
        let topCategory: string | null = null;
        let max = 0;
        for (const [k, v] of Object.entries(catCounts)) {
          if (v > max) {
            max = v;
            topCategory = k;
          }
        }
        return max > 0 ? topCategory : null;
      }
      const rows = data ?? [];
      const catCounts: Record<string, number> = {};
      for (const r of rows) {
        const flags = r.personalized_risk_flags as string[] | null | undefined;
        if (!flags?.length) continue;
        for (const f of flags) {
          const low = f.toLowerCase();
          let bucket = 'Other';
          if (/preserv|paraben|benzoate/i.test(low)) bucket = 'Preservatives';
          else if (/fragrance|perfume|scent/i.test(low)) bucket = 'Fragrances';
          else if (/sulfate|sls/i.test(low)) bucket = 'Sulfates';
          else if (/dye|color/i.test(low)) bucket = 'Colorants';
          catCounts[bucket] = (catCounts[bucket] ?? 0) + 1;
        }
      }
      let topCategory: string | null = null;
      let max = 0;
      for (const [k, v] of Object.entries(catCounts)) {
        if (v > max) {
          max = v;
          topCategory = k;
        }
      }
      return max > 0 ? topCategory : null;
    },
  });

  const hpQ = useQuery({
    queryKey: ['user-hp-carousel', userId],
    enabled: !!userId,
    staleTime: 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_health_profiles')
        .select('conditions, allergies, avoids, diet_preference, city, country')
        .eq('user_id', userId!)
        .maybeSingle();
      if (error) return null;
      return data as Record<string, unknown> | null;
    },
  });

  const scansCountQ = useQuery({
    queryKey: ['scans-count-carousel', userId],
    enabled: !!userId,
    staleTime: 30 * 1000,
    queryFn: async () => {
      const [a, b] = await Promise.all([
        supabase.from('scans').select('id', { count: 'exact', head: true }).eq('user_id', userId!),
        supabase.from('scan_history').select('id', { count: 'exact', head: true }).eq('user_id', userId!),
      ]);
      return Math.max(a.count ?? 0, b.count ?? 0);
    },
  });

  const w = wellnessQ.data;
  const waterGoal = w?.water_goal ?? 8;
  const waterCups = w?.daily_water_cups ?? 0;
  const breathGoal = w?.breathing_goal ?? 3;
  const breathDone = w?.breathing_sessions_today ?? 0;
  const calTarget = w?.calorie_target ?? 2200;
  const calDone = w?.calories_consumed ?? 0;

  const hydrationPct = waterGoal > 0 ? Math.min(100, (waterCups / waterGoal) * 100) : 0;
  const breathPct = breathGoal > 0 ? Math.min(100, (breathDone / breathGoal) * 100) : 0;
  const calPct = calTarget > 0 ? Math.min(100, (calDone / calTarget) * 100) : 0;
  const streakPct = Math.min(100, (streakDays / 21) * 100);

  const hasLifestyleSignal =
    liveMetrics.scanCount > 0 ||
    skinPct > 0 ||
    purityPct > 0 ||
    allergenPct > 0 ||
    hydrationPct > 0 ||
    streakDays > 0;
  const lifestyleAvg = hasLifestyleSignal
    ? (skinPct + purityPct + allergenPct + hydrationPct + streakPct) / 5
    : 0;
  const noScoreYet = liveMetrics.scanCount === 0 && overallScore === 0 && hydrationPct === 0 && streakDays === 0;
  const lifestyleGrade = hasLifestyleSignal
    ? toGradeFromPct(lifestyleAvg)
    : (toGradeLetter(overallGrade) ?? null);

  const euProxy = purityPct;
  const fdaProxy = skinPct;

  const wellnessRingPct = (hydrationPct + breathPct + calPct + streakPct) / 4;

  const hp = hpQ.data;
  const profileSections = [
    Array.isArray(hp?.conditions) && (hp!.conditions as unknown[]).length > 0,
    (Array.isArray(hp?.allergies) && (hp!.allergies as unknown[]).length > 0) ||
      (Array.isArray(hp?.avoids) && (hp!.avoids as unknown[]).length > 0),
    hp?.diet_preference != null && String(hp.diet_preference).length > 0,
    (hp?.city != null && String(hp.city).length > 0) || (hp?.country != null && String(hp.country).length > 0),
    (scansCountQ.data ?? 0) >= 1,
  ];
  const completeN = profileSections.filter(Boolean).length;
  const personalizationPct = Math.round((completeN / 5) * 100);

  const onViewableItemsChanged = useCallback(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    const idx = viewableItems[0]?.index;
    if (idx != null) {
      setFocused(idx);
      setTimeout(() => {
        segRef0.current?.triggerAnimation();
        segRef1.current?.triggerAnimation();
        segRef2.current?.triggerAnimation();
        segRef3.current?.triggerAnimation();
        segRef4.current?.triggerAnimation();
      }, 120);
    }
  }, []);

  const viewConfig = useRef({ viewAreaCoveragePercentThreshold: 55 }).current;

  const slides: SlideKey[] = ['lifestyle', 'scan', 'wellness', 'personal'];

  const renderSlide = (key: SlideKey) => {
    const ringAnimKey = `${focused}-${key}`;
    if (key === 'lifestyle') {
      const up = scoreDelta7d > 0;
      const showTrend = scoreDelta7d !== 0;
      return (
        <View style={[styles.slideInner, { width: slideW }]}>
          <View style={styles.slideTop}>
            <View style={styles.slideTopLeft}>
              <Text style={[styles.bigGrade, { color: theme.teal }]}>
                {lifestyleGrade ?? '—'}
              </Text>
              <Text style={[styles.slideTitle, { color: theme.text1 }]}>Overall Health Score</Text>
              {noScoreYet && (
                <Text style={[styles.breakLine, { color: theme.text3, marginTop: 2 }]}>
                  Scan your first product to see your score
                </Text>
              )}
              {showTrend && (
                <View style={[styles.trendBadge, { borderColor: up ? theme.green : theme.red }]}>
                  <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
                    <Path
                      d={up ? 'M12 5l7 7H5l7-7z' : 'M12 19l-7-7h14l-7 7z'}
                      fill={up ? theme.green : theme.red}
                    />
                  </Svg>
                  <Text style={{ color: up ? theme.green : theme.red, fontSize: 10, fontWeight: '800' }}>
                    {up ? 'Up' : 'Down'} 7d
                  </Text>
                </View>
              )}
            </View>
            <RingChart
              value={hasLifestyleSignal ? lifestyleAvg : Math.min(100, overallScore)}
              size={72}
              strokeWidth={8}
              color={theme.teal}
              animationKey={focused === 0 ? ringAnimKey : 'idle'}
            >
              <Text style={[styles.smallRingPct, { color: theme.teal }]}>
                {Math.round(hasLifestyleSignal ? lifestyleAvg : Math.min(100, overallScore))}
              </Text>
            </RingChart>
          </View>
          <View style={styles.segBlock}>
            <SlideRow
              ref={segRef0}
              label="Scan Safety"
              pct={skinPct}
              color={theme.teal}
              animate={focused === 0}
            />
            <SlideRow
              ref={segRef1}
              label="Ingredient Purity"
              pct={purityPct}
              color={theme.gold}
              animate={focused === 0}
            />
            <SlideRow
              ref={segRef2}
              label="Allergen Risk"
              pct={allergenPct}
              color={theme.amber}
              animate={focused === 0}
            />
            <SlideRow
              ref={segRef3}
              label="Hydration"
              pct={hydrationPct}
              color={theme.teal}
              animate={focused === 0}
              valueLabel={waterGoal > 0 ? `${waterCups}/${waterGoal} cups` : '—'}
            />
            <SlideRow
              ref={segRef4}
              label="Streak Activity"
              pct={streakPct}
              color={theme.purple}
              animate={focused === 0}
              valueLabel={streakDays > 0 ? `${streakDays} day${streakDays === 1 ? '' : 's'}` : '—'}
            />
          </View>
        </View>
      );
    }
    if (key === 'scan') {
      return (
        <View style={[styles.slideInner, { width: slideW }]}>
          <Text style={[styles.slideTitle, { color: theme.text1, marginBottom: 8 }]}>Scan Safety Report</Text>
          <View style={styles.ringRow}>
            <View style={styles.ringWrap}>
              <RingChart
                value={skinPct}
                size={90}
                strokeWidth={9}
                color={theme.teal}
                animationKey={focused === 1 ? ringAnimKey : 'idle'}
              >
                <View style={styles.ringCenter}>
                  <Text style={[styles.ringPct, { color: theme.teal }]}>{Math.round(skinPct)}%</Text>
                </View>
              </RingChart>
            </View>
            <View style={styles.breakdownCol}>
              <Text style={[styles.breakLine, { color: theme.text2 }]}>
                EU-style safety proxy: {Math.round(euProxy)}%
              </Text>
              <Text style={[styles.breakLine, { color: theme.text2 }]}>
                Label quality proxy: {Math.round(fdaProxy)}%
              </Text>
              <Text style={[styles.breakLine, { color: theme.text3 }]}>
                Flagged signals: {flaggedCount}
              </Text>
            </View>
          </View>
          {topCategoryQ.data ? (
            <Text style={[styles.catLine, { color: theme.text3 }]}>
              Your most flagged category: {topCategoryQ.data}
            </Text>
          ) : (
            <Text style={[styles.catLine, { color: theme.text3 }]}>
              No flagged ingredients yet — keep scanning
            </Text>
          )}
        </View>
      );
    }
    if (key === 'wellness') {
      return (
        <View style={[styles.slideInner, { width: slideW }]}>
          <Text style={[styles.slideTitle, { color: theme.text1, marginBottom: 8 }]}>Wellness Score</Text>
          <View style={styles.ringRow}>
            <View style={styles.ringWrap}>
              <RingChart
                value={wellnessRingPct}
                size={90}
                strokeWidth={9}
                color={theme.purple}
                animationKey={focused === 2 ? ringAnimKey : 'idle'}
              >
                <View style={styles.ringCenter}>
                  <Text style={[styles.ringPct, { color: theme.purple }]}>{Math.round(wellnessRingPct)}%</Text>
                </View>
              </RingChart>
            </View>
            <View style={styles.breakdownCol}>
              <Text style={[styles.breakLine, { color: theme.text2 }]}>Streak: {streakDays}d</Text>
              <Text style={[styles.breakLine, { color: theme.text2 }]}>
                Water: {Math.round(hydrationPct)}%
              </Text>
              <Text style={[styles.breakLine, { color: theme.text2 }]}>
                Breathing (today): {breathDone}
              </Text>
              <Text style={[styles.breakLine, { color: theme.text2 }]}>
                Calorie log: {Math.round(calPct)}%
              </Text>
            </View>
          </View>
          <View style={[styles.levelBadge, { borderColor: `${theme.gold}50`, backgroundColor: `${theme.gold}12` }]}>
            <Text style={[styles.levelTxt, { color: theme.gold }]}>Guardian Level {xpLevel}</Text>
          </View>
        </View>
      );
    }
    return (
        <View style={[styles.slideInner, { width: slideW }]}>
        <Text style={[styles.slideTitle, { color: theme.text1, marginBottom: 8 }]}>Personalization</Text>
        <Text style={[styles.persPct, { color: theme.teal }]}>{personalizationPct}%</Text>
        <Text style={[styles.breakLine, { color: theme.text3, marginBottom: 10 }]}>
          {personalizationPct < 80
            ? 'Complete your profile to improve your scores'
            : 'Your profile is in great shape'}
        </Text>
        <Text style={[styles.breakLine, { color: theme.text2 }]}>
          Progress: {completeN} of 5 profile sections complete
        </Text>
      </View>
    );
  };

  const renderItem = ({ item }: ListRenderItemInfo<SlideKey>) => (
    <View style={[styles.card, { width: slideW, maxWidth: slideW, backgroundColor: theme.bg1, borderColor: theme.border }]}>
      {renderSlide(item)}
    </View>
  );

  if (scoreLoading) {
    return (
      <View style={[styles.card, { backgroundColor: theme.bg2, borderColor: theme.border, width: slideW, maxWidth: slideW, alignSelf: 'center' }]}>
        <View style={styles.skelInner}>
          <SkeletonLoader width={80} height={80} borderRadius={40} />
          <View style={{ flex: 1, gap: 8 }}>
            <SkeletonLoader width="100%" height={14} borderRadius={6} />
            <SkeletonLoader width="80%" height={14} borderRadius={6} />
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.carouselWrap}>
      <FlatList
        data={slides}
        horizontal
        nestedScrollEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(k) => k}
        renderItem={renderItem}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewConfig}
        snapToInterval={slideW}
        decelerationRate="fast"
        contentContainerStyle={{ paddingHorizontal: CARD_H_PADDING }}
        getItemLayout={(_, index) => ({
          length: slideW,
          offset: slideW * index,
          index,
        })}
      />
      <View style={styles.dots}>
        {slides.map((_, i) => {
          const active = i === focused;
          return (
            <View
              key={i}
              style={[
                styles.dot,
                active ? styles.dotActive : styles.dotInactive,
                { backgroundColor: active ? theme.teal : theme.border },
              ]}
            />
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  carouselWrap: {
    overflow: 'hidden',
    marginHorizontal: -16,
    alignSelf: 'center',
    width: Dimensions.get('window').width,
  },
  card: {
    minHeight: 212,
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
  },
  slideInner: {
    padding: 14,
    minHeight: 212,
    overflow: 'hidden',
  },
  slideTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 10,
  },
  slideTopLeft: { flex: 1, minWidth: 0, gap: 2 },
  smallRingPct: { fontSize: 15, fontWeight: '900' },
  bigGrade: { fontSize: 42, fontWeight: '900', letterSpacing: -2, lineHeight: 46 },
  slideTitle: { fontSize: 13, fontWeight: '800', letterSpacing: -0.2 },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
  },
  segBlock: { gap: 8, flex: 1 },
  ringRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  ringWrap: { overflow: 'hidden' },
  ringCenter: { alignItems: 'center', justifyContent: 'center' },
  ringPct: { fontSize: 18, fontWeight: '900' },
  breakdownCol: { flex: 1, gap: 4 },
  breakLine: { fontSize: 11, fontWeight: '600', lineHeight: 15 },
  catLine: { fontSize: 11, fontWeight: '600', marginTop: 10 },
  levelBadge: {
    alignSelf: 'flex-start',
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
  },
  levelTxt: { fontSize: 12, fontWeight: '800' },
  persPct: { fontSize: 36, fontWeight: '900', letterSpacing: -1 },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginTop: 10,
    marginBottom: 4,
  },
  dot: {},
  dotActive: {
    width: 18,
    height: 6,
    borderRadius: 3,
  },
  dotInactive: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  skelInner: {
    flexDirection: 'row',
    padding: 14,
    gap: 14,
    alignItems: 'center',
  },
});
