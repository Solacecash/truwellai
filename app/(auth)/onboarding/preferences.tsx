import { hapticError, hapticSelection, hapticSuccess } from '@/lib/haptics';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { SegmentedIndicator } from '@/components/ui/SegmentedIndicator';
import { useTheme } from '@/theme/ThemeContext';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// ─── Constants ────────────────────────────────────────────────────────────────

const ACTIVITY_LEVELS = ['Sedentary', 'Light', 'Moderate', 'Active', 'Athlete'] as const;

const DIETARY = [
  'Vegan',
  'Vegetarian',
  'Halal',
  'Kosher',
  'Gluten-free',
  'Dairy-free',
  'None',
] as const;

const CUISINES = [
  'Mediterranean',
  'Asian',
  'African',
  'Latin',
  'Western',
  'Middle Eastern',
] as const;

const MIN_MEALS = 2;
const MAX_MEALS = 6;

type Theme = ReturnType<typeof useTheme>['theme'];

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionLabel({ label, theme }: { label: string; theme: Theme }) {
  return <Text style={[pr.sectionLabel, { color: theme.text3 }]}>{label}</Text>;
}

function PillSelect({
  options,
  selected,
  onToggle,
  single,
  activeColor,
  theme,
}: {
  options: readonly string[];
  selected: string[];
  onToggle: (v: string) => void;
  single?: boolean;
  activeColor?: string;
  theme: Theme;
}) {
  const color = activeColor ?? theme.teal;
  return (
    <View style={pr.pillWrap}>
      {options.map((opt) => {
        const active = selected.includes(opt);
        return (
          <Pressable
            key={opt}
            onPress={() => {
              hapticSelection();
              if (single) {
                onToggle(opt);
              } else {
                onToggle(opt);
              }
            }}
            style={[
              pr.pill,
              { backgroundColor: active ? color : theme.bg2, borderColor: active ? color : theme.border },
            ]}
          >
            <Text style={[pr.pillText, { color: active ? theme.bg0 : theme.text2 }]}>{opt}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function MealStepper({ value, onChange, theme }: { value: number; onChange: (v: number) => void; theme: Theme }) {
  return (
    <View style={[pr.stepper, { backgroundColor: theme.bg2, borderColor: theme.border }]}>
      <Pressable
        style={[pr.stepBtn, { borderColor: theme.border }, value <= MIN_MEALS && pr.stepBtnDisabled]}
        onPress={() => { if (value > MIN_MEALS) { hapticSelection(); onChange(value - 1); } }}
        disabled={value <= MIN_MEALS}
      >
        <Text style={[pr.stepBtnText, { color: value <= MIN_MEALS ? theme.text4 : theme.text1 }]}>−</Text>
      </Pressable>
      <Text style={[pr.stepValue, { color: theme.text1 }]}>{value}</Text>
      <Pressable
        style={[pr.stepBtn, { borderColor: theme.border }, value >= MAX_MEALS && pr.stepBtnDisabled]}
        onPress={() => { if (value < MAX_MEALS) { hapticSelection(); onChange(value + 1); } }}
        disabled={value >= MAX_MEALS}
      >
        <Text style={[pr.stepBtnText, { color: value >= MAX_MEALS ? theme.text4 : theme.text1 }]}>+</Text>
      </Pressable>
    </View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function PreferencesScreen() {
  const { theme } = useTheme();
  const router    = useRouter();
  const session   = useAuthStore((s) => s.session);

  const [loading, setLoading]           = useState(false);
  const [activityLevel, setActivityLevel] = useState<string[]>([]);
  const [dietary, setDietary]           = useState<string[]>([]);
  const [cuisines, setCuisines]         = useState<string[]>([]);
  const [mealsPerDay, setMealsPerDay]   = useState(3);

  const toggleSingle = (setter: React.Dispatch<React.SetStateAction<string[]>>, value: string) => {
    setter([value]);
  };

  const toggleMulti = (
    setter: React.Dispatch<React.SetStateAction<string[]>>,
    value: string,
    noneLabel = 'None'
  ) => {
    setter((prev) => {
      if (value === noneLabel) return prev.includes(noneLabel) ? [] : [noneLabel];
      const withoutNone = prev.filter((v) => v !== noneLabel);
      return withoutNone.includes(value)
        ? withoutNone.filter((v) => v !== value)
        : [...withoutNone, value];
    });
  };

  const handleNext = async () => {
    if (!session?.user?.id) {
      router.push('/(auth)/onboarding/notifications');
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase
        .from('user_health_profiles')
        .upsert(
          {
            user_id:              session.user.id,
            activity_level:       activityLevel[0] ?? null,
            dietary_restrictions: dietary,
            cuisine_preferences:  cuisines,
            meals_per_day:        mealsPerDay,
            updated_at:           new Date().toISOString(),
          },
          { onConflict: 'user_id' }
        );
      if (error) throw error;
      hapticSuccess();
      router.push('/(auth)/onboarding/notifications');
    } catch {
      hapticError();
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[pr.safe, { backgroundColor: theme.bg0 }]} edges={['top']}>
      <KeyboardAvoidingView
        style={pr.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={pr.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <SegmentedIndicator value={67} count={3} color={theme.teal} height={6} style={pr.segIndicator} />

          <Text style={[pr.stepLabel, { color: theme.teal }]}>Step 2 of 3</Text>
          <Text style={[pr.title, { color: theme.text1 }]}>Customize your experience</Text>

          {/* Activity level */}
          <SectionLabel label="Activity Level" theme={theme} />
          <PillSelect
            options={ACTIVITY_LEVELS}
            selected={activityLevel}
            onToggle={(v) => toggleSingle(setActivityLevel, v)}
            single
            theme={theme}
          />

          {/* Dietary restrictions */}
          <SectionLabel label="Dietary Restrictions (select all that apply)" theme={theme} />
          <PillSelect
            options={DIETARY}
            selected={dietary}
            onToggle={(v) => toggleMulti(setDietary, v)}
            theme={theme}
          />

          {/* Cuisine preferences */}
          <SectionLabel label="Cuisine Preferences" theme={theme} />
          <PillSelect
            options={CUISINES}
            selected={cuisines}
            onToggle={(v) =>
              setCuisines((prev) =>
                prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v]
              )
            }
            theme={theme}
          />

          {/* Meals per day stepper */}
          <SectionLabel label="Preferred Meals per Day" theme={theme} />
          <View style={pr.stepperWrap}>
            <MealStepper value={mealsPerDay} onChange={setMealsPerDay} theme={theme} />
            <Text style={[pr.stepperNote, { color: theme.text3 }]}>
              {mealsPerDay} meal{mealsPerDay !== 1 ? 's' : ''} per day
            </Text>
          </View>

          {/* Next */}
          <Pressable
            style={[pr.nextBtn, { backgroundColor: theme.teal }, loading && { opacity: 0.6 }]}
            onPress={() => void handleNext()}
            disabled={loading}
          >
            <Text style={[pr.nextText, { color: theme.bg0 }]}>
              {loading ? 'Saving…' : 'Next →'}
            </Text>
          </Pressable>

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const pr = StyleSheet.create({
  safe:  { flex: 1 },
  flex:  { flex: 1 },
  scroll: { paddingHorizontal: 24, paddingTop: 16 },

  segIndicator: { marginBottom: 20 },

  stepLabel: { fontSize: 12, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 },
  title:     { fontSize: 24, fontWeight: '900', letterSpacing: -0.5, marginBottom: 28 },

  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 10,
    marginTop: 20,
  },

  pillWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill:     { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 50, borderWidth: 1 },
  pillText: { fontSize: 13, fontWeight: '600' },

  stepperWrap: { alignItems: 'flex-start', gap: 10 },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
  },
  stepBtn: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRightWidth: 1,
  },
  stepBtnDisabled: { opacity: 0.35 },
  stepBtnText:     { fontSize: 22, fontWeight: '300', lineHeight: 26 },
  stepValue:       { fontSize: 20, fontWeight: '700', paddingHorizontal: 24 },
  stepperNote:     { fontSize: 13 },

  nextBtn: {
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 32,
  },
  nextText: { fontSize: 16, fontWeight: '800' },
});
