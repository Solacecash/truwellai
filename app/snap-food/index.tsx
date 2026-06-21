import { FloatingIngredientChips } from '@/components/scan/FloatingIngredientChips';
import { BackHeader } from '@/components/ui/BackHeader';
import { invokeFoodImageAnalysis, logFoodScan } from '@/lib/edge';
import { hapticLight, hapticSuccess } from '@/lib/haptics';
import { supabase } from '@/lib/supabase';
import { triggerXpGained } from '@/stores/rewardAnimStore';
import { useAuthStore } from '@/stores/authStore';
import { useRewardStore } from '@/stores/rewardStore';
import { useTheme } from '@/theme/ThemeContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Dimensions,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Path } from 'react-native-svg';

const ANALYSIS_STEPS = [
  { id: 'identify', label: 'Identifying food...', duration: 500 },
  { id: 'ingredients', label: 'Reading ingredients...', duration: 800 },
  { id: 'nutrition', label: 'Calculating nutrition...', duration: 600 },
  { id: 'impact', label: 'Assessing health impact...', duration: 700 },
];

const FRAME = 200;
const CORNER = 22;
const { height: WIN_H } = Dimensions.get('window');
const CAMERA_MIN_H = WIN_H * 0.55;

type FoodResult = Awaited<ReturnType<typeof invokeFoodImageAnalysis>>;

export default function SnapFoodScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const qc = useQueryClient();
  const uid = useAuthStore((s) => s.session?.user?.id);
  const addXp = useRewardStore((s) => s.addXp);
  const [perm, requestPerm] = useCameraPermissions();
  const camRef = useRef<InstanceType<typeof CameraView>>(null);

  const [busy, setBusy] = useState(false);
  const [stepIdx, setStepIdx] = useState(0);
  const [result, setResult] = useState<FoodResult | null>(null);
  const [manualFood, setManualFood] = useState('');
  const [manualCal, setManualCal] = useState('');
  const [showManual, setShowManual] = useState(false);
  const [capturedUri, setCapturedUri] = useState<string | null>(null);
  const [showFullReport, setShowFullReport] = useState(false);

  const goalQ = useQuery({
    queryKey: ['user-weight-goal', uid],
    enabled: !!uid,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data } = await supabase
        .from('user_health_profiles')
        .select('main_goal, current_weight, target_weight, weight_unit')
        .eq('user_id', uid!)
        .maybeSingle();
      return data as {
        main_goal: string | null;
        current_weight: number | null;
        target_weight: number | null;
        weight_unit: string | null;
      } | null;
    },
  });

  const [scanningChips, setScanningChips] = useState(false);

  // Camera scanning chips ? start the moment permissions are granted
  useEffect(() => {
    if (perm?.granted && !busy && !result) setScanningChips(true);
    else setScanningChips(false);
  }, [perm?.granted, busy, result]);

  const analyzeBase64 = useCallback(async (b64: string) => {
    setBusy(true);
    setResult(null);
    setShowManual(false);
    setShowFullReport(false);
    setStepIdx(0);

    const stepTimers: ReturnType<typeof setTimeout>[] = [];
    let cumulative = 0;
    ANALYSIS_STEPS.forEach((step, idx) => {
      if (idx === 0) return;
      cumulative += ANALYSIS_STEPS[idx - 1].duration;
      stepTimers.push(
        setTimeout(() => setStepIdx((curr) => (curr < idx ? idx : curr)), cumulative)
      );
    });

    try {
      const raw = b64.includes(',') ? b64.split(',')[1] ?? b64 : b64;
      const data = await invokeFoodImageAnalysis(raw);
      setResult(data);
      if (uid && data) {
        void logFoodScan(uid, {
          scan_type: 'visual_ai',
          food_name: data.foodName ?? data.food_name ?? null,
          brand_name: null,
          cuisine_region: data.cuisineRegion ?? null,
          calories_kcal: data.caloriesKcal ?? data.calories ?? null,
          protein_g: data.proteinG ?? data.protein_g ?? null,
          carbs_g: data.carbsG ?? data.carbs_g ?? null,
          fat_g: data.fatG ?? data.fat_g ?? null,
          fiber_g: data.fiberG ?? data.fiber_g ?? null,
          safety_grade: data.grade ?? null,
          safety_score: data.score ?? null,
          portion_description: data.portionDescription ?? null,
          cooking_method: data.cookingMethod ?? null,
          meal_type: null,
          image_url: null,
          confidence_score: data.confidenceScore ?? null,
          ai_estimated: data.aiEstimated ?? true,
        });
      }
      setManualFood(data.food_name);
      setManualCal(String(Math.round(data.calories_per_serving ?? data.calories)));
      if (data.confidence === 'low') setShowManual(true);
    } catch (e) {
      setResult({
        food_name: 'Unknown meal',
        calories: 0,
        protein_g: 0,
        carbs_g: 0,
        fat_g: 0,
        fiber_g: 0,
        confidence: 'low',
        notes: e instanceof Error ? e.message : 'Analysis failed',
      });
      setShowManual(true);
    } finally {
      stepTimers.forEach(clearTimeout);
      setBusy(false);
    }
  }, [uid]);

  const capture = useCallback(async () => {
    if (!camRef.current || busy) return;
    hapticLight();
    try {
      const photo = await camRef.current.takePictureAsync({
        base64: true,
        quality: 0.5,
        skipProcessing: false,
      });
      if (photo?.uri) setCapturedUri(photo.uri);
      if (photo?.base64) await analyzeBase64(photo.base64);
    } catch {
      setShowManual(true);
    }
  }, [analyzeBase64, busy]);

  const pickGallery = useCallback(async () => {
    const r = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      base64: true,
      quality: 0.5,
    });
    if (!r.canceled && r.assets[0]?.uri) setCapturedUri(r.assets[0].uri);
    if (!r.canceled && r.assets[0]?.base64) await analyzeBase64(r.assets[0].base64);
  }, [analyzeBase64]);

  const effectiveResult = result
    ? {
        ...result,
        food_name: manualFood.trim() || result.food_name,
        calories: showManual && manualCal.trim()
          ? Math.max(0, Math.round(Number(manualCal) || 0))
          : result.calories,
      }
    : null;

  const addToLog = useCallback(async () => {
    if (!uid || !effectiveResult) return;
    const cal = Math.max(0, Math.round(effectiveResult.calories));
    hapticSuccess();
    const { data: row } = await supabase
      .from('user_wellness')
      .select('calories_consumed, xp_total')
      .eq('user_id', uid)
      .maybeSingle();
    const prevCal = (row as { calories_consumed?: number } | null)?.calories_consumed ?? 0;
    const prevXp = (row as { xp_total?: number } | null)?.xp_total ?? 0;
    await supabase
      .from('user_wellness')
      .update({
        calories_consumed: prevCal + cal,
        xp_total: prevXp + 5,
      })
      .eq('user_id', uid);
    addXp(5);
    triggerXpGained(5);
    void qc.invalidateQueries({ queryKey: ['user-wellness', uid] });
    void qc.invalidateQueries({ queryKey: ['rewards', uid] });
    void qc.invalidateQueries({ queryKey: ['user-wellness-carousel', uid] });
    router.back();
  }, [uid, effectiveResult, addXp, qc, router]);

  const tryAgain = useCallback(() => {
    setResult(null);
    setShowManual(false);
    setManualFood('');
    setManualCal('');
  }, []);

  if (!perm?.granted) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg0 }]} edges={['top']}>
        <BackHeader title="Snap Food" onBack={() => router.back()} />
        <View style={styles.permBox}>
          <Text style={[styles.permTxt, { color: theme.text2 }]}>Camera access is needed to snap your meal.</Text>
          <TouchableOpacity
            style={[styles.permBtn, { backgroundColor: theme.teal }]}
            onPress={() => void requestPerm()}
          >
            <Text style={[styles.permBtnTxt, { color: theme.bg0 }]}>Grant camera</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (!busy && effectiveResult) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg0 }]} edges={['top']}>
        {capturedUri && (
          <Image
            source={{ uri: capturedUri }}
            style={StyleSheet.absoluteFill}
            resizeMode="cover"
          />
        )}
        <View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFill,
            {
              backgroundColor: 'transparent',
            },
          ]}
        />
        <LinearGradient
          pointerEvents="none"
          colors={[
            'rgba(2,10,20,0.15)',
            'rgba(2,10,20,0.65)',
            theme.bg0,
            theme.bg0,
          ]}
          locations={[0, 0.32, 0.5, 1]}
          style={StyleSheet.absoluteFill}
        />
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 16,
            paddingTop: 8,
          }}
        >
          <TouchableOpacity
            onPress={() => router.back()}
            hitSlop={10}
            style={{ padding: 6 }}
            accessibilityLabel="Back"
          >
            <Text style={{ color: '#fff', fontSize: 22, fontWeight: '700' }}>{'\u2039'}</Text>
          </TouchableOpacity>
        </View>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: 18,
            paddingTop: 130,
            paddingBottom: 16,
            gap: 10,
          }}
        >
          <View
            style={{
              alignSelf: 'flex-start',
              backgroundColor: `${theme.teal}26`,
              borderColor: theme.teal,
              borderWidth: 0.5,
              borderRadius: 20,
              paddingHorizontal: 10,
              paddingVertical: 4,
              marginBottom: 4,
            }}
          >
            <Text style={{ color: theme.teal, fontSize: 11, fontWeight: '700' }}>
              {effectiveResult.confidence === 'high'
                ? '95% confident'
                : effectiveResult.confidence === 'medium'
                  ? 'Medium confidence'
                  : 'Low confidence'}
            </Text>
          </View>
          <Text style={[styles.foodName, { color: theme.text1 }]}>
            {effectiveResult.food_name}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6, marginTop: 4 }}>
            <Text style={[styles.calBig, { color: theme.gold }]}>
              {Math.round(
                effectiveResult.calories_per_serving ?? effectiveResult.calories
              )}
            </Text>
            <Text style={[styles.calUnit, { color: theme.text3 }]}>
              kcal per serving
            </Text>
          </View>
          {(effectiveResult.calories_per_serving ?? effectiveResult.calories) ? (
            <Text style={{ color: theme.text3, fontSize: 12 }}>
              {'\u2248'} {(((effectiveResult.calories_per_serving ?? effectiveResult.calories) / 60)).toFixed(1)}km of walking to burn
            </Text>
          ) : null}
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
            <MacroCell
              label="Protein"
              value={effectiveResult.protein_g}
              color={theme.teal}
              theme={theme}
            />
            <MacroCell
              label="Carbs"
              value={effectiveResult.carbs_g}
              color={theme.gold}
              theme={theme}
            />
            <MacroCell
              label="Fat"
              value={effectiveResult.fat_g}
              color={theme.red}
              theme={theme}
            />
            <MacroCell
              label="Fiber"
              value={effectiveResult.fiber_g}
              color={theme.green}
              theme={theme}
            />
          </View>
          {(() => {
            const cals = Math.round(
              effectiveResult.calories_per_serving ?? effectiveResult.calories
            );
            const protein = effectiveResult.protein_g ?? 0;
            const goalRow = goalQ.data;
            const goal = goalRow?.main_goal ?? null;

            let heading = 'Portion intelligence';
            let body = 'Set a goal in your diet plan to get portion guidance tailored to what you are working towards.';

            if (goal === 'lose_weight') {
              heading = 'Portion intelligence \u00b7 weight loss';
              body = cals > 700
                ? `This is a larger portion at ${cals} kcal. Consider splitting it across two sittings or pairing it with a lighter meal later today to stay within a typical daily target.`
                : `At ${cals} kcal this fits comfortably within most weight loss plans as a single meal.`;
            } else if (goal === 'build_muscle') {
              heading = 'Portion intelligence \u00b7 muscle building';
              body = protein >= 25
                ? `Strong protein content at ${Math.round(protein)}g. This supports muscle recovery well alongside your training.`
                : `This meal has ${Math.round(protein)}g of protein. Consider adding a protein source to better support muscle building on a training day.`;
            } else if (goal === 'energy_focus' || goal === 'gut_health' || goal === 'health_condition' || goal === 'sleep') {
              heading = 'Portion intelligence';
              body = `This meal is ${cals} kcal with ${Math.round(protein)}g protein. Your current goal is set to something other than weight or muscle focus, so we are not flagging portion size here, just sharing the numbers.`;
            }

            return (
              <View
                style={{
                  borderWidth: 0.5,
                  borderColor: `${theme.gold}40`,
                  backgroundColor: `${theme.gold}12`,
                  borderRadius: 14,
                  padding: 12,
                  marginTop: 8,
                }}
              >
                <Text style={{ color: theme.gold, fontSize: 12, fontWeight: '700' }}>
                  {heading}
                </Text>
                <Text
                  style={{
                    color: theme.text2,
                    fontSize: 13,
                    lineHeight: 19,
                    marginTop: 6,
                  }}
                >
                  {body}
                </Text>
              </View>
            );
          })()}
          {effectiveResult.detected_ingredients &&
            effectiveResult.detected_ingredients.length > 0 && (
              <View style={{ marginTop: 8 }}>
                <Text style={[styles.ingTitle, { color: theme.text3 }]}>
                  DETECTED INGREDIENTS
                </Text>
                <View
                  style={{
                    flexDirection: 'row',
                    flexWrap: 'wrap',
                    gap: 6,
                    marginTop: 8,
                  }}
                >
                  {effectiveResult.detected_ingredients.map((ing) => (
                    <View
                      key={ing}
                      style={{
                        backgroundColor: theme.bg2,
                        borderRadius: 8,
                        paddingHorizontal: 10,
                        paddingVertical: 6,
                      }}
                    >
                      <Text style={{ color: theme.text2, fontSize: 12 }}>
                        {ing}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          <Text
            style={{
              color: theme.text4,
              fontSize: 11,
              lineHeight: 16,
              marginTop: 20,
            }}
          >
            AI estimate, not professional nutrition advice.
          </Text>
        </ScrollView>
        <View
          style={{
            paddingHorizontal: 16,
            paddingBottom: 14,
            paddingTop: 10,
            backgroundColor: theme.bg0,
            gap: 8,
          }}
        >
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => {
              if (!effectiveResult) return;
              router.push({
                pathname: '/assistant',
                params: { dietMealName: effectiveResult.food_name },
              } as never);
            }}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 7,
              backgroundColor: `${theme.purple}1F`,
              borderColor: `${theme.purple}59`,
              borderWidth: 0.5,
              borderRadius: 14,
              paddingVertical: 13,
            }}
          >
            <Text style={{ color: theme.purple, fontSize: 13, fontWeight: '700' }}>
              Ask Sofia for full expert review
            </Text>
          </TouchableOpacity>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity
              onPress={() => void addToLog()}
              activeOpacity={0.85}
              style={{
                flex: 1,
                backgroundColor: `${theme.teal}1F`,
                borderColor: theme.teal,
                borderWidth: 0.5,
                borderRadius: 14,
                paddingVertical: 12,
                alignItems: 'center',
              }}
            >
              <Text style={{ color: theme.teal, fontSize: 12.5, fontWeight: '700' }}>
                Log this meal
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                setResult(null);
                setCapturedUri(null);
                setManualFood('');
                setManualCal('');
              }}
              activeOpacity={0.85}
              style={{
                flex: 1,
                backgroundColor: `${theme.bg1}`,
                borderColor: theme.border,
                borderWidth: 0.5,
                borderRadius: 14,
                paddingVertical: 12,
                alignItems: 'center',
              }}
            >
              <Text style={{ color: theme.text1, fontSize: 12.5, fontWeight: '700' }}>
                Scan another
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg0 }]} edges={['top']}>
      <BackHeader title="Snap Food" onBack={() => router.back()} />

      <View style={[styles.cameraBlock, { minHeight: CAMERA_MIN_H }]}>
        {busy && capturedUri ? (
          <Image
            source={{ uri: capturedUri }}
            style={StyleSheet.absoluteFill}
            resizeMode="cover"
          />
        ) : (
          <CameraView ref={camRef} style={StyleSheet.absoluteFill} facing="back" />
        )}
        <FloatingIngredientChips active={scanningChips} />
        <View style={styles.overlay} pointerEvents="box-none">
          <View style={styles.frameWrap}>
            <View style={[styles.frame, { borderColor: `${theme.teal}55` }]}>
              <View style={[styles.corner, styles.cornerTL, { borderColor: theme.teal }]} />
              <View style={[styles.corner, styles.cornerTR, { borderColor: theme.teal }]} />
              <View style={[styles.corner, styles.cornerBL, { borderColor: theme.teal }]} />
              <View style={[styles.corner, styles.cornerBR, { borderColor: theme.teal }]} />
            </View>
            <Text style={[styles.hint, { color: theme.text1 }]}>Point at your meal</Text>
          </View>

          <TouchableOpacity
            style={[styles.galleryBtn, { backgroundColor: `${theme.bg1}CC`, borderColor: theme.border }]}
            onPress={() => void pickGallery()}
            disabled={busy}
          >
            <Text style={{ color: theme.text2, fontSize: 11, fontWeight: '800' }}>Gallery</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.shutter, { borderColor: theme.gold, backgroundColor: theme.bg0 }]}
            onPress={() => void capture()}
            disabled={busy}
            activeOpacity={0.85}
          >
            <Svg width={32} height={32} viewBox="0 0 24 24" fill="none">
              <Path
                d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"
                stroke={theme.teal}
                strokeWidth={1.8}
                strokeLinejoin="round"
              />
              <Circle cx={12} cy={13} r={3.5} stroke={theme.teal} strokeWidth={1.8} />
            </Svg>
          </TouchableOpacity>
        </View>
      </View>

      <View style={[styles.resultPanel, { backgroundColor: theme.bg1, borderColor: theme.border }]}>
        {busy && (
          <View style={styles.loadingBox}>
            {ANALYSIS_STEPS.map((step, i) => (
              <AnalysisStepRow
                key={step.id}
                label={step.label}
                state={i < stepIdx ? 'done' : i === stepIdx ? 'active' : 'pending'}
              />
            ))}
          </View>
        )}

        {!busy && !result && (
          <Text style={[styles.placeholder, { color: theme.text3 }]}>
            Capture or choose a photo to see nutrition estimates.
          </Text>
        )}
      </View>

    </SafeAreaView>
  );
}

function AnalysisStepRow({
  label,
  state,
}: {
  label: string;
  state: 'done' | 'active' | 'pending';
}) {
  const { theme } = useTheme();
  const slide = useSharedValue(state === 'pending' ? 10 : 0);
  const opacity = useSharedValue(state === 'pending' ? 0.3 : 1);

  useEffect(() => {
    slide.value = withDelay(60, withTiming(state === 'pending' ? 10 : 0, { duration: 260, easing: Easing.out(Easing.cubic) }));
    opacity.value = withDelay(60, withTiming(state === 'pending' ? 0.3 : 1, { duration: 260 }));
  }, [state, slide, opacity]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: slide.value }],
    opacity: opacity.value,
  }));

  const color =
    state === 'done' ? theme.green : state === 'active' ? theme.teal : theme.text3;

  return (
    <Animated.View style={[styles.stepRow, animStyle]}>
      <Text style={{ color, fontWeight: '800', fontSize: 13, width: 16 }}>
        {state === 'done' ? '?' : state === 'active' ? '?' : '?-?'}
      </Text>
      <Text
        style={{
          color: state === 'pending' ? theme.text3 : theme.text1,
          fontWeight: state === 'active' ? '800' : '600',
          fontSize: 14,
        }}
      >
        {label}
      </Text>
    </Animated.View>
  );
}

type ThemeTokens = ReturnType<typeof useTheme>['theme'];

function MacroCell({
  label,
  value,
  color,
  theme,
}: {
  label: string;
  value: number;
  color: string;
  theme: ThemeTokens;
}) {
  return (
    <View style={[styles.macroCell, { borderColor: theme.border, backgroundColor: theme.bg2 }]}>
      <Text style={[styles.macroVal, { color }]}>{Math.round(value)}g</Text>
      <Text style={[styles.macroLabel, { color: theme.text3 }]}>{label.toUpperCase()}</Text>
    </View>
  );
}

function ImpactRow({
  left,
  right,
  theme,
}: {
  left: string;
  right: string;
  theme: ThemeTokens;
}) {
  return (
    <View style={styles.impactRow}>
      <Text style={[styles.impactLbl, { color: theme.text3 }]}>{left}</Text>
      <Text style={[styles.impactVal, { color: theme.text1 }]} numberOfLines={2}>
        {right}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  permBox: { padding: 24, gap: 16 },
  permTxt: { fontSize: 14, lineHeight: 20 },
  permBtn: { paddingVertical: 14, borderRadius: 14, alignItems: 'center' },
  permBtnTxt: { fontSize: 15, fontWeight: '800' },
  cameraBlock: { width: '100%', position: 'relative' },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 28,
  },
  frameWrap: { position: 'absolute', top: '12%', alignItems: 'center', gap: 14 },
  frame: {
    width: FRAME,
    height: FRAME,
    borderRadius: 20,
    borderWidth: 1.5,
    position: 'relative',
  },
  corner: { position: 'absolute', width: CORNER, height: CORNER, borderWidth: 3 },
  cornerTL: { top: -2, left: -2, borderRightWidth: 0, borderBottomWidth: 0, borderTopLeftRadius: 16 },
  cornerTR: { top: -2, right: -2, borderLeftWidth: 0, borderBottomWidth: 0, borderTopRightRadius: 16 },
  cornerBL: { bottom: -2, left: -2, borderRightWidth: 0, borderTopWidth: 0, borderBottomLeftRadius: 16 },
  cornerBR: { bottom: -2, right: -2, borderLeftWidth: 0, borderTopWidth: 0, borderBottomRightRadius: 16 },
  hint: { fontSize: 13, fontWeight: '700' },
  galleryBtn: {
    position: 'absolute',
    left: 20,
    bottom: 24,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  shutter: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultPanel: {
    flex: 1,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    borderTopWidth: 1,
    paddingTop: 16,
    paddingHorizontal: 16,
    minHeight: WIN_H * 0.38,
  },
  loadingBox: { paddingVertical: 24, paddingHorizontal: 4, gap: 10 },
  stepRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  resultScroll: { paddingBottom: 32, gap: 10 },
  foodName: { fontSize: 22, fontWeight: '900', letterSpacing: -0.5 },
  heroCals: { alignItems: 'flex-start', gap: 2, marginTop: 6 },
  calBig: { fontSize: 48, fontWeight: '900', letterSpacing: -1 },
  calUnit: { fontSize: 12, fontWeight: '700', marginTop: -6 },
  calContext: { fontSize: 11, fontWeight: '500', marginTop: 2 },

  confRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    gap: 10,
  },
  confBadge: { fontSize: 12, fontWeight: '800' },
  servingTxt: { fontSize: 11, fontWeight: '700' },

  macroGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  macroCell: {
    width: '48%',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'flex-start',
    gap: 2,
  },
  macroVal: { fontSize: 18, fontWeight: '900', letterSpacing: -0.3 },
  macroLabel: { fontSize: 9, fontWeight: '800', letterSpacing: 0.6 },

  impactBox: { padding: 12, borderRadius: 14, borderWidth: 1, gap: 6, marginTop: 4 },
  impactTitle: { fontSize: 10, fontWeight: '900', letterSpacing: 0.7 },
  impactSub: { fontSize: 11, fontWeight: '700' },
  impactRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  impactLbl: { width: 70, fontSize: 11, fontWeight: '800' },
  impactVal: { flex: 1, fontSize: 12, fontWeight: '700' },
  warnBox: { padding: 8, borderRadius: 10, borderWidth: 1, marginTop: 4, gap: 2 },
  warnTxt: { fontSize: 12, fontWeight: '800' },
  warnSub: { fontSize: 11 },

  ingBlock: { padding: 10, borderRadius: 12, borderWidth: 1, gap: 6 },
  ingTitle: { fontSize: 9, fontWeight: '900', letterSpacing: 0.7 },
  ingChipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  ingChip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, borderWidth: 1, maxWidth: 170 },
  ingChipTxt: { fontSize: 10, fontWeight: '700' },
  manualBox: { gap: 6, marginTop: 8 },
  manualLbl: { fontSize: 11, fontWeight: '700' },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  addBtn: { marginTop: 12, paddingVertical: 14, borderRadius: 14, alignItems: 'center' },
  addBtnTxt: { fontSize: 15, fontWeight: '900' },
  outlineBtn: {
    marginTop: 10,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
  },
  outlineTxt: { fontSize: 14, fontWeight: '800' },
  historyBtn: {
    marginTop: 10,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
  },
  historyBtnText: { fontSize: 13, fontWeight: '800' },
  placeholder: { textAlign: 'center', marginTop: 24, fontSize: 13, paddingHorizontal: 20 },
});
