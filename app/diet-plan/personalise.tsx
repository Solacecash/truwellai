import { BackHeader } from '@/components/ui/BackHeader';
import { invokeDietPersonalization } from '@/lib/edge';
import { hapticSuccess } from '@/lib/haptics';
import { savePersonalizedMealPlanToSupabase } from '@/lib/savePersonalizedMealPlan';
import { setPersonalizedDietCache } from '@/lib/lastPersonalizedDietCache';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { useUserProfileStore } from '@/stores/userProfileStore';
import { useTheme } from '@/theme/ThemeContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const GOALS: { key: string; emoji: string; label: string }[] = [
  { key: 'lose_weight', emoji: '\uD83D\uDD25', label: 'Lose weight' },
  { key: 'build_muscle', emoji: '\uD83D\uDCAA', label: 'Build muscle' },
  { key: 'energy_focus', emoji: '\u26A1', label: 'Boost energy and focus' },
  { key: 'gut_health', emoji: '\uD83C\uDF3F', label: 'Improve gut health' },
  { key: 'health_condition', emoji: '\uD83E\uDE7A', label: 'Manage a health condition' },
  { key: 'sleep', emoji: '\uD83D\uDE34', label: 'Improve sleep quality' },
];

const TIMELINES = ['4 weeks', '8 weeks', '12 weeks', '6 months'] as const;
const FASTING_WINDOWS = ['12:12', '14:10', '16:8', '18:6', '20:4'] as const;
const EX_FREQ = ['None', '1-2x/week', '3-4x/week', '5+ times/week'] as const;
const EX_TYPES = ['Cardio', 'Weights', 'Yoga', 'Walking', 'Swimming', 'Cycling', 'None'] as const;
const COOKING = ['Under 15 min', '15-30 min', '30-60 min', 'No limit'] as const;
const CUISINES = [
  'Mediterranean',
  'Asian',
  'African',
  'Latin',
  'Western',
  'Middle Eastern',
  'Indian',
] as const;
const BUDGETS = ['Budget-friendly', 'Moderate', 'Flexible'] as const;

function mondayStartIsoLocal(): string {
  const d = new Date();
  const jsDay = d.getDay();
  const diff = jsDay === 0 ? -6 : 1 - jsDay;
  d.setDate(d.getDate() + diff);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export default function PersonaliseDietPlanScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const userId = useAuthStore((s) => s.session?.user.id);
  const queryClient = useQueryClient();
  const userProfile = useUserProfileStore((s) => s.profile);

  const [goal, setGoal] = useState<string>('lose_weight');
  const [weightUnit, setWeightUnit] = useState<'kg' | 'lbs'>('kg');
  const [currentWeight, setCurrentWeight] = useState('');
  const [targetWeight, setTargetWeight] = useState('');
  const [timeline, setTimeline] = useState<string>('8 weeks');
  const [mealsPerDay, setMealsPerDay] = useState(3);
  const [fasting, setFasting] = useState(false);
  const [fastingWindow, setFastingWindow] = useState<string>('16:8');
  const [exerciseFreq, setExerciseFreq] = useState<string>('3-4x/week');
  const [exerciseTypes, setExerciseTypes] = useState<string[]>([]);
  const [cookingTime, setCookingTime] = useState<string>('15-30 min');
  const [foodsLove, setFoodsLove] = useState('');
  const [foodsAvoid, setFoodsAvoid] = useState('');
  const [cuisines, setCuisines] = useState<string[]>([]);
  const [budget, setBudget] = useState<string>('Moderate');
  const [generating, setGenerating] = useState(false);

  const avoidPrefilled = useRef(false);

  const hpAllergensQ = useQuery({
    queryKey: ['hp-allergens-diet', userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data } = await supabase
        .from('user_health_profiles')
        .select('conditions, allergens, excluded_ingredients, dietary_restrictions, is_pregnant_or_breastfeeding')
        .eq('user_id', userId!)
        .maybeSingle();
      return data;
    },
  });

  useEffect(() => {
    if (avoidPrefilled.current || hpAllergensQ.data == null) return;
    const a = hpAllergensQ.data.allergens;
    if (Array.isArray(a) && a.length) {
      setFoodsAvoid(a.join(', '));
      avoidPrefilled.current = true;
    } else if (typeof a === 'string' && a.trim()) {
      setFoodsAvoid(a);
      avoidPrefilled.current = true;
    }
  }, [hpAllergensQ.data]);

  const personalizationPayload = useMemo(
    () => ({
      main_goal: goal,
      current_weight: currentWeight,
      target_weight: targetWeight,
      weight_unit: weightUnit,
      timeline,
      meals_per_day: mealsPerDay,
      intermittent_fasting: fasting,
      fasting_window: fasting ? fastingWindow : null,
      exercise_frequency: exerciseFreq,
      exercise_types: exerciseTypes,
      cooking_time_available: cookingTime,
      foods_love: foodsLove,
      foods_avoid: foodsAvoid,
      cuisine_styles: cuisines,
      budget,
      // Health profile data — required so the AI hard-excludes
      // anything unsafe or incompatible with the user's real
      // medical conditions and dietary restrictions.
      health_conditions: hpAllergensQ.data?.conditions ?? [],
      allergens: hpAllergensQ.data?.allergens ?? [],
      excluded_ingredients: hpAllergensQ.data?.excluded_ingredients ?? [],
      dietary_restrictions: hpAllergensQ.data?.dietary_restrictions ?? [],
      is_pregnant_or_breastfeeding: hpAllergensQ.data?.is_pregnant_or_breastfeeding ?? false,
    }),
    [
      goal,
      currentWeight,
      targetWeight,
      weightUnit,
      timeline,
      mealsPerDay,
      fasting,
      fastingWindow,
      exerciseFreq,
      exerciseTypes,
      cookingTime,
      foodsLove,
      foodsAvoid,
      cuisines,
      budget,
      hpAllergensQ.data,
    ]
  );

  const toggleExerciseType = (t: string) => {
    setExerciseTypes((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));
  };

  const toggleCuisine = (c: string) => {
    setCuisines((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]));
  };

  const runGeneration = useCallback(async () => {
    if (!userId) return;
    setGenerating(true);
    try {
      // Persist the user's goal and weight fields so other
      // screens (e.g. the calorie scanner) can read them
      // later without re-asking. Non-blocking: a failure
      // here should never prevent plan generation.
      void supabase
        .from('user_health_profiles')
        .update({
          main_goal: goal,
          current_weight: currentWeight ? Number(currentWeight) : null,
          target_weight: targetWeight ? Number(targetWeight) : null,
          weight_unit: weightUnit,
        })
        .eq('user_id', userId)
        .then(() => {}, () => {});

      const raw = await invokeDietPersonalization({
        ...personalizationPayload,
        display_name: userProfile?.display_name ?? undefined,
        user_id: userId,
      });
      const days = raw.meal_plan;
      if (days.length === 0) {
        Alert.alert('Plan incomplete', 'We could not build a full week. Please try again.');
        return;
      }
      const weekStart = mondayStartIsoLocal();
      await savePersonalizedMealPlanToSupabase(userId, days, weekStart);
      setPersonalizedDietCache({
        mealPlan: days,
        groceryList: raw.grocery_list,
        weekStartIso: weekStart,
        personalization: personalizationPayload,
      });
      void queryClient.invalidateQueries({ queryKey: ['meal-plan', userId] });
      hapticSuccess();
      router.replace('/diet-plan/result' as never);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Something went wrong';
      Alert.alert('Could not create plan', msg);
    } finally {
      setGenerating(false);
    }
  }, [userId, goal, currentWeight, targetWeight, weightUnit, personalizationPayload, userProfile?.display_name, queryClient, router]);

  const onGenerate = useCallback(async () => {
    // Soft nudge only — never blocks generation. A user
    // with no health profile can still create a plan;
    // this just explains the benefit of completing one
    // and lets them proceed either way.
    if (hpAllergensQ.data === null || hpAllergensQ.data === undefined) {
      Alert.alert(
        'Get a more personalised plan',
        'Completing your health profile helps us tailor your meal plan around your allergies, dietary needs, and any health conditions you have, so every meal fits you specifically. This step is optional, you can still generate a plan right now without it.',
        [
          {
            text: 'Complete Profile First',
            onPress: () => router.push('/(auth)/onboarding/health-profile' as never),
          },
          {
            text: 'Generate Without It',
            onPress: () => void runGeneration(),
          },
        ]
      );
      return;
    }
    void runGeneration();
  }, [hpAllergensQ.data, router, runGeneration]);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg0 }]} edges={['top']}>
      <BackHeader title="Personalise My Diet Plan" onBack={() => router.back()} />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={[styles.sectionLabel, { color: theme.text3 }]}>Step 1: Your Goal</Text>
        <Text style={[styles.question, { color: theme.text2 }]}>What is your main goal?</Text>
        <View style={styles.goalGrid}>
          {GOALS.map((g) => {
            const on = g.key === goal;
            return (
              <TouchableOpacity
                key={g.key}
                onPress={() => setGoal(g.key)}
                activeOpacity={0.85}
                style={[
                  styles.goalCard,
                  {
                    borderColor: on ? theme.teal : theme.border,
                    backgroundColor: on ? `${theme.teal}12` : theme.bg2,
                  },
                ]}
              >
                <Text style={styles.goalEmoji}>{g.emoji}</Text>
                <Text style={[styles.goalLabel, { color: theme.text1 }]}>{g.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={[styles.fieldLabel, { color: theme.text3 }]}>Current weight</Text>
        <View style={styles.row}>
          <TextInput
            style={[styles.input, { color: theme.text1, borderColor: theme.border, backgroundColor: theme.bg2 }]}
            keyboardType="decimal-pad"
            placeholder="e.g. 72"
            placeholderTextColor={theme.text3}
            value={currentWeight}
            onChangeText={setCurrentWeight}
          />
          <View style={styles.unitRow}>
            {(['kg', 'lbs'] as const).map((u) => (
              <TouchableOpacity
                key={u}
                onPress={() => setWeightUnit(u)}
                style={[
                  styles.unitPill,
                  {
                    borderColor: weightUnit === u ? theme.teal : theme.border,
                    backgroundColor: weightUnit === u ? `${theme.teal}18` : theme.bg1,
                  },
                ]}
              >
                <Text style={{ color: weightUnit === u ? theme.teal : theme.text3, fontWeight: '700' }}>{u}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <Text style={[styles.fieldLabel, { color: theme.text3 }]}>Target weight</Text>
        <TextInput
          style={[styles.input, { color: theme.text1, borderColor: theme.border, backgroundColor: theme.bg2 }]}
          keyboardType="decimal-pad"
          placeholder="e.g. 68"
          placeholderTextColor={theme.text3}
          value={targetWeight}
          onChangeText={setTargetWeight}
        />

        <Text style={[styles.fieldLabel, { color: theme.text3 }]}>Timeline</Text>
        <View style={styles.pillWrap}>
          {TIMELINES.map((t) => (
            <TouchableOpacity
              key={t}
              onPress={() => setTimeline(t)}
              style={[
                styles.pill,
                {
                  borderColor: timeline === t ? theme.teal : theme.border,
                  backgroundColor: timeline === t ? `${theme.teal}14` : theme.bg2,
                },
              ]}
            >
              <Text style={{ color: timeline === t ? theme.teal : theme.text3, fontWeight: '700', fontSize: 12 }}>{t}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[styles.sectionLabel, { color: theme.text3, marginTop: 22 }]}>Step 2: Your Lifestyle</Text>

        <View style={[styles.stepperRow, { borderColor: theme.border }]}>
          <Text style={[styles.fieldLabel, { color: theme.text2, marginBottom: 0 }]}>Meals per day</Text>
          <View style={styles.stepperBtns}>
            <TouchableOpacity
              onPress={() => setMealsPerDay((n) => Math.max(2, n - 1))}
              style={[styles.stepBtn, { borderColor: theme.border }]}
            >
              <Text style={{ color: theme.teal, fontSize: 18, fontWeight: '800' }}>−</Text>
            </TouchableOpacity>
            <Text style={[styles.stepVal, { color: theme.text1 }]}>{mealsPerDay}</Text>
            <TouchableOpacity
              onPress={() => setMealsPerDay((n) => Math.min(6, n + 1))}
              style={[styles.stepBtn, { borderColor: theme.border }]}
            >
              <Text style={{ color: theme.teal, fontSize: 18, fontWeight: '800' }}>+</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.switchRow}>
          <Text style={[styles.fieldLabel, { color: theme.text2, marginBottom: 0 }]}>Do you fast?</Text>
          <Switch
            value={fasting}
            onValueChange={setFasting}
            trackColor={{ false: theme.bg3, true: `${theme.teal}80` }}
            thumbColor={fasting ? theme.teal : theme.text3}
          />
        </View>
        {fasting ? (
          <>
            <Text style={[styles.fieldLabel, { color: theme.text3 }]}>Fasting window</Text>
            <View style={styles.pillWrap}>
              {FASTING_WINDOWS.map((w) => (
                <TouchableOpacity
                  key={w}
                  onPress={() => setFastingWindow(w)}
                  style={[
                    styles.pill,
                    {
                      borderColor: fastingWindow === w ? theme.teal : theme.border,
                      backgroundColor: fastingWindow === w ? `${theme.teal}14` : theme.bg2,
                    },
                  ]}
                >
                  <Text style={{ color: fastingWindow === w ? theme.teal : theme.text3, fontWeight: '700', fontSize: 12 }}>
                    {w}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        ) : null}

        <Text style={[styles.fieldLabel, { color: theme.text3 }]}>Exercise frequency</Text>
        <View style={styles.pillWrap}>
          {EX_FREQ.map((f) => (
            <TouchableOpacity
              key={f}
              onPress={() => setExerciseFreq(f)}
              style={[
                styles.pill,
                {
                  borderColor: exerciseFreq === f ? theme.teal : theme.border,
                  backgroundColor: exerciseFreq === f ? `${theme.teal}14` : theme.bg2,
                },
              ]}
            >
              <Text style={{ color: exerciseFreq === f ? theme.teal : theme.text3, fontWeight: '700', fontSize: 11 }}>{f}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[styles.fieldLabel, { color: theme.text3 }]}>Exercise type (multi-select)</Text>
        <View style={styles.pillWrap}>
          {EX_TYPES.map((t) => {
            const on = exerciseTypes.includes(t);
            return (
              <TouchableOpacity
                key={t}
                onPress={() => toggleExerciseType(t)}
                style={[
                  styles.pill,
                  {
                    borderColor: on ? theme.teal : theme.border,
                    backgroundColor: on ? `${theme.teal}14` : theme.bg2,
                  },
                ]}
              >
                <Text style={{ color: on ? theme.teal : theme.text3, fontWeight: '700', fontSize: 11 }}>{t}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={[styles.fieldLabel, { color: theme.text3 }]}>Cooking time available</Text>
        <View style={styles.pillWrap}>
          {COOKING.map((c) => (
            <TouchableOpacity
              key={c}
              onPress={() => setCookingTime(c)}
              style={[
                styles.pill,
                {
                  borderColor: cookingTime === c ? theme.teal : theme.border,
                  backgroundColor: cookingTime === c ? `${theme.teal}14` : theme.bg2,
                },
              ]}
            >
              <Text style={{ color: cookingTime === c ? theme.teal : theme.text3, fontWeight: '700', fontSize: 11 }}>{c}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[styles.sectionLabel, { color: theme.text3, marginTop: 22 }]}>Step 3: Food Preferences</Text>

        <Text style={[styles.fieldLabel, { color: theme.text3 }]}>Foods you love (comma separated)</Text>
        <TextInput
          style={[styles.textArea, { color: theme.text1, borderColor: theme.border, backgroundColor: theme.bg2 }]}
          multiline
          placeholder="e.g. salmon, oats, berries"
          placeholderTextColor={theme.text3}
          value={foodsLove}
          onChangeText={setFoodsLove}
        />

        <Text style={[styles.fieldLabel, { color: theme.text3 }]}>Foods to avoid (comma separated)</Text>
        <TextInput
          style={[styles.textArea, { color: theme.text1, borderColor: theme.border, backgroundColor: theme.bg2 }]}
          multiline
          placeholder="Allergens or dislikes"
          placeholderTextColor={theme.text3}
          value={foodsAvoid}
          onChangeText={setFoodsAvoid}
        />

        <Text style={[styles.fieldLabel, { color: theme.text3 }]}>Cuisine style</Text>
        <View style={styles.pillWrap}>
          {CUISINES.map((c) => {
            const on = cuisines.includes(c);
            return (
              <TouchableOpacity
                key={c}
                onPress={() => toggleCuisine(c)}
                style={[
                  styles.pill,
                  {
                    borderColor: on ? theme.teal : theme.border,
                    backgroundColor: on ? `${theme.teal}14` : theme.bg2,
                  },
                ]}
              >
                <Text style={{ color: on ? theme.teal : theme.text3, fontWeight: '700', fontSize: 11 }}>{c}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={[styles.fieldLabel, { color: theme.text3 }]}>Budget</Text>
        <View style={styles.pillWrap}>
          {BUDGETS.map((b) => (
            <TouchableOpacity
              key={b}
              onPress={() => setBudget(b)}
              style={[
                styles.pill,
                {
                  borderColor: budget === b ? theme.teal : theme.border,
                  backgroundColor: budget === b ? `${theme.teal}14` : theme.bg2,
                },
              ]}
            >
              <Text style={{ color: budget === b ? theme.teal : theme.text3, fontWeight: '700', fontSize: 12 }}>{b}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          onPress={() => void onGenerate()}
          disabled={generating || hpAllergensQ.isLoading}
          activeOpacity={0.9}
          style={[
            styles.generateBtn,
            {
              backgroundColor: theme.teal,
              opacity: generating || hpAllergensQ.isLoading ? 0.7 : 1,
            },
          ]}
        >
          {generating ? (
            <ActivityIndicator color={theme.bg0} />
          ) : (
            <Text style={[styles.generateBtnText, { color: theme.bg0 }]}>Generate My Plan</Text>
          )}
        </TouchableOpacity>
        {generating ? (
          <Text style={[styles.genNote, { color: theme.text3 }]}>Creating your personalised plan…</Text>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { padding: 16, paddingBottom: 48 },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  question: { fontSize: 14, fontWeight: '700', marginBottom: 10 },
  goalGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  goalCard: {
    width: '47%',
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 14,
    borderWidth: 1,
    gap: 6,
  },
  goalEmoji: { fontSize: 20 },
  goalLabel: { fontSize: 12, fontWeight: '700', lineHeight: 16 },
  fieldLabel: { fontSize: 12, fontWeight: '600', marginTop: 14, marginBottom: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  input: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    fontWeight: '600',
  },
  unitRow: { flexDirection: 'row', gap: 8 },
  unitPill: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  pillWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  stepperBtns: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  stepBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepVal: { fontSize: 18, fontWeight: '800', minWidth: 28, textAlign: 'center' },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    minHeight: 72,
    textAlignVertical: 'top',
    fontSize: 14,
  },
  generateBtn: {
    marginTop: 28,
    height: 56,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  generateBtnText: { fontSize: 16, fontWeight: '800' },
  genNote: { textAlign: 'center', marginTop: 10, fontSize: 13, fontStyle: 'italic' },
});
