import { BackHeader } from '@/components/ui/BackHeader';
import { exportDietPlanAsPDF } from '@/lib/dietPlanExport';
import { invokeDietPersonalization } from '@/lib/edge';
import {
  getPersonalizedDietCache,
  setPersonalizedDietCache,
} from '@/lib/lastPersonalizedDietCache';
import { hapticSuccess } from '@/lib/haptics';
import { savePersonalizedMealPlanToSupabase } from '@/lib/savePersonalizedMealPlan';
import { useAuthStore } from '@/stores/authStore';
import { useUserProfileStore } from '@/stores/userProfileStore';
import { useTheme } from '@/theme/ThemeContext';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function addDaysIso(iso: string, n: number): string {
  const d = new Date(iso + 'T12:00:00');
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

export default function DietPlanResultScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const userId = useAuthStore((s) => s.session?.user.id);
  const userProfile = useUserProfileStore((s) => s.profile);
  const queryClient = useQueryClient();

  const [cache, setCache] = useState(() => getPersonalizedDietCache());
  const [pdfLoading, setPdfLoading] = useState(false);
  const [regenLoading, setRegenLoading] = useState(false);

  const refreshCache = useCallback(() => {
    setCache(getPersonalizedDietCache());
  }, []);

  const mealPlan = cache?.mealPlan ?? [];
  const groceryList = cache?.groceryList ?? [];
  const weekStart = cache?.weekStartIso ?? '';
  const personalization = cache?.personalization;

  const exportPlans = useMemo(() => {
    if (!weekStart || mealPlan.length === 0) return [];
    return mealPlan.map((day, i) => {
      const date = addDaysIso(weekStart, i);
      return {
        date,
        dayName: DAYS[new Date(date + 'T12:00:00').getDay()],
        breakfast: { name: day.breakfast.name, calories: day.breakfast.calories },
        lunch: { name: day.lunch.name, calories: day.lunch.calories },
        dinner: { name: day.dinner.name, calories: day.dinner.calories },
      };
    });
  }, [mealPlan, weekStart]);

  const onDownloadPdf = useCallback(async () => {
    if (!userId) return;
    if (exportPlans.length === 0) {
      Alert.alert(
        'No plan to export',
        'Your meal plan has no days. Please generate a personalised plan first.',
        [{ text: 'OK' }]
      );
      return;
    }
    // Verify meals are not all empty placeholder entries
    const hasRealMeals = exportPlans.some(
      (d) =>
        (d.breakfast.name && d.breakfast.name !== 'Rest day') ||
        (d.lunch.name && d.lunch.name !== 'Rest day') ||
        (d.dinner.name && d.dinner.name !== 'Rest day')
    );
    if (!hasRealMeals) {
      Alert.alert(
        'Plan not ready',
        'Your plan contains no meal details. Please regenerate your plan before exporting.',
        [
          { text: 'Regenerate', onPress: () => void onRegenerate() },
          { text: 'Cancel', style: 'cancel' },
        ]
      );
      return;
    }
    setPdfLoading(true);
    try {
      const healthProfile = (userProfile?.health_profile as { dietary_restrictions?: string[] } | null);
      await exportDietPlanAsPDF({
        userProfile: {
          name: userProfile?.display_name ?? 'TruWell User',
          dietaryRestrictions: healthProfile?.dietary_restrictions ?? [],
        },
        plans: exportPlans,
        period: 'weekly',
      });
      hapticSuccess();
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Export failed';
      Alert.alert('Export failed', msg);
    } finally {
      setPdfLoading(false);
    }
  }, [userId, exportPlans, userProfile]);

  const onRegenerate = useCallback(async () => {
    if (!userId || !personalization || !weekStart) {
      Alert.alert('Regenerate', 'Open Personalise and create a plan again.');
      return;
    }
    setRegenLoading(true);
    try {
      const raw = await invokeDietPersonalization({
        ...personalization,
        display_name: userProfile?.display_name ?? undefined,
        variation_seed: Date.now(),
      });
      const days = raw.meal_plan;
      if (days.length === 0) {
        Alert.alert('Try again', 'We could not build a new variation.');
        return;
      }
      await savePersonalizedMealPlanToSupabase(userId, days, weekStart);
      setPersonalizedDietCache({
        mealPlan: days,
        groceryList: raw.grocery_list,
        weekStartIso: weekStart,
        personalization,
      });
      refreshCache();
      void queryClient.invalidateQueries({ queryKey: ['meal-plan', userId] });
      hapticSuccess();
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Regenerate failed';
      Alert.alert('Regenerate failed', msg);
    } finally {
      setRegenLoading(false);
    }
  }, [userId, personalization, weekStart, userProfile?.display_name, queryClient, refreshCache]);

  if (!cache || mealPlan.length === 0) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg0 }]} edges={['top']}>
        <BackHeader title="Your Plan" onBack={() => router.back()} />
        <View style={styles.empty}>
          <Text style={[styles.emptyText, { color: theme.text2 }]}>
            Generate a personalised plan first.
          </Text>
          <TouchableOpacity
            onPress={() => router.replace('/diet-plan/personalise' as never)}
            style={[styles.tealBtn, { backgroundColor: theme.teal }]}
          >
            <Text style={[styles.tealBtnText, { color: theme.bg0 }]}>Personalise My Diet Plan</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg0 }]} edges={['top']}>
      <BackHeader title="Your Personalised Plan" onBack={() => router.back()} />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {mealPlan.map((day, i) => {
          const date = weekStart ? addDaysIso(weekStart, i) : '';
          return (
            <View key={i} style={[styles.dayCard, { borderColor: theme.border, backgroundColor: theme.bg1 }]}>
              <Text style={[styles.dayTitle, { color: theme.gold }]}>
                {date ? `${DAYS[new Date(date + 'T12:00:00').getDay()]} · ${date}` : `Day ${i + 1}`}
              </Text>
              {(['breakfast', 'lunch', 'dinner'] as const).map((slot) => {
                const m = day[slot];
                return (
                  <View key={slot} style={styles.mealBlock}>
                    <Text style={[styles.slotLabel, { color: theme.text3 }]}>{slot}</Text>
                    <Text style={[styles.mealName, { color: theme.text1 }]}>{m.name}</Text>
                    <Text style={[styles.mealMeta, { color: theme.amber }]}>
                      {m.calories} kcal
                      {m.protein_g != null ? ` · P ${m.protein_g}g` : ''}
                      {m.carbs_g != null ? ` · C ${m.carbs_g}g` : ''}
                      {m.fat_g != null ? ` · F ${m.fat_g}g` : ''}
                    </Text>
                  </View>
                );
              })}
              {day.snack ? (
                <View style={styles.mealBlock}>
                  <Text style={[styles.slotLabel, { color: theme.text3 }]}>snack</Text>
                  <Text style={[styles.mealName, { color: theme.text1 }]}>{day.snack.name}</Text>
                  <Text style={[styles.mealMeta, { color: theme.amber }]}>{day.snack.calories} kcal</Text>
                </View>
              ) : null}
            </View>
          );
        })}

        {groceryList.length > 0 ? (
          <View style={[styles.groceryCard, { borderColor: theme.border, backgroundColor: theme.bg2 }]}>
            <Text style={[styles.groceryTitle, { color: theme.teal }]}>Grocery list</Text>
            {groceryList.map((line, i) => (
              <Text key={i} style={[styles.groceryLine, { color: theme.text2 }]}>
                • {line}
              </Text>
            ))}
          </View>
        ) : null}

        <Text style={[styles.disclaimerText, { color: theme.text3 }]}>
          This plan is personalised using the information in your profile to help suit your needs. It is not a substitute for advice from a registered dietitian or your doctor — please review ingredients yourself before following any plan, especially if you have specific health needs.
        </Text>

        <TouchableOpacity
          onPress={() => void onDownloadPdf()}
          disabled={pdfLoading}
          style={[styles.actionBtn, { borderColor: theme.teal }]}
        >
          {pdfLoading ? (
            <ActivityIndicator color={theme.teal} />
          ) : (
            <Text style={[styles.actionBtnText, { color: theme.teal }]}>Download PDF</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => void onRegenerate()}
          disabled={regenLoading}
          style={[styles.actionBtn, { borderColor: theme.gold, marginTop: 10 }]}
        >
          {regenLoading ? (
            <ActivityIndicator color={theme.gold} />
          ) : (
            <Text style={[styles.actionBtnText, { color: theme.gold }]}>Regenerate</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { padding: 16, paddingBottom: 40, gap: 12 },
  empty: { padding: 24, gap: 16, alignItems: 'center' },
  emptyText: { fontSize: 15, textAlign: 'center' },
  tealBtn: { paddingVertical: 14, paddingHorizontal: 20, borderRadius: 14 },
  tealBtnText: { fontWeight: '800', fontSize: 15 },
  dayCard: { borderRadius: 16, borderWidth: 1, padding: 14, marginBottom: 4 },
  dayTitle: { fontSize: 14, fontWeight: '800', marginBottom: 10 },
  mealBlock: { marginBottom: 10 },
  slotLabel: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6 },
  mealName: { fontSize: 14, fontWeight: '700', marginTop: 2 },
  mealMeta: { fontSize: 12, fontWeight: '600', marginTop: 2 },
  groceryCard: { borderRadius: 16, borderWidth: 1, padding: 14, marginTop: 8 },
  groceryTitle: { fontSize: 15, fontWeight: '800', marginBottom: 8 },
  groceryLine: { fontSize: 13, marginBottom: 4 },
  disclaimerText: {
    fontSize: 11,
    lineHeight: 16,
    marginTop: 16,
    marginBottom: 8,
    paddingHorizontal: 4,
    fontStyle: 'italic',
  },
  actionBtn: {
    marginTop: 8,
    height: 52,
    borderRadius: 14,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnText: { fontSize: 15, fontWeight: '800' },
});
