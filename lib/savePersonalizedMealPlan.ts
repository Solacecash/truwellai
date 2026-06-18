import { supabase } from '@/lib/supabase';

export type AiMealSlot = {
  name: string;
  calories: number;
  protein_g?: number;
  carbs_g?: number;
  fat_g?: number;
  prep_time_mins?: number;
  cuisine_type?: string;
  key_ingredients?: string[];
};

export type AiDayPlan = {
  breakfast: AiMealSlot;
  lunch: AiMealSlot;
  dinner: AiMealSlot;
  snack?: AiMealSlot;
};

function asMealSlot(raw: unknown, fallbackName: string): AiMealSlot {
  const o = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  // Accept both full field names (calories, protein_g …) and compact names (cal, pro …)
  const calories = o.calories ?? o.cal;
  const protein  = o.protein_g ?? o.pro;
  const carbs    = o.carbs_g ?? o.carb;
  const fat      = o.fat_g ?? o.fat;
  const prepTime = o.prep_time_mins ?? o.mins;
  const ingredients = o.key_ingredients ?? o.ingredients;
  return {
    name: String(o.name ?? fallbackName),
    calories: Number(calories ?? 0),
    protein_g: protein != null ? Number(protein) : undefined,
    carbs_g: carbs != null ? Number(carbs) : undefined,
    fat_g: fat != null ? Number(fat) : undefined,
    prep_time_mins: prepTime != null ? Number(prepTime) : undefined,
    cuisine_type: o.cuisine_type != null ? String(o.cuisine_type) : undefined,
    key_ingredients: Array.isArray(ingredients)
      ? (ingredients as unknown[]).map((x) => String(x))
      : undefined,
  };
}

/** Normalizes AI JSON `meal_plan` array into rows we can persist. */
export function normalizeAiMealPlanDays(days: unknown[]): AiDayPlan[] {
  const arr = Array.isArray(days) ? days : [];
  return arr.slice(0, 7).map((day, i) => {
    const d = day && typeof day === 'object' ? (day as Record<string, unknown>) : {};
    return {
      breakfast: asMealSlot(d.breakfast, `Day ${i + 1} breakfast`),
      lunch: asMealSlot(d.lunch, `Day ${i + 1} lunch`),
      dinner: asMealSlot(d.dinner, `Day ${i + 1} dinner`),
      snack: d.snack ? asMealSlot(d.snack, `Day ${i + 1} snack`) : undefined,
    };
  });
}

function addDays(isoDate: string, days: number): string {
  const d = new Date(isoDate + 'T12:00:00');
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

async function insertMeal(slot: AiMealSlot, category: 'breakfast' | 'lunch' | 'dinner'): Promise<string> {
  const { data, error } = await supabase
    .from('meals')
    .insert({
      name: slot.name,
      category,
      calories: Math.max(0, Math.round(slot.calories ?? 0)),
      cuisine_type: slot.cuisine_type ?? null,
      prep_time_mins: slot.prep_time_mins != null ? Math.round(slot.prep_time_mins) : null,
    })
    .select('id')
    .single();
  if (error) throw error;
  return (data as { id: string }).id;
}

/**
 * Writes 7 days of meal_plans starting at weekStartIso (YYYY-MM-DD), creating meal rows per slot.
 */
export async function savePersonalizedMealPlanToSupabase(
  userId: string,
  days: AiDayPlan[],
  weekStartIso: string
): Promise<void> {
  const n = Math.min(7, days.length);
  for (let i = 0; i < n; i++) {
    const day = days[i];
    const planDate = addDays(weekStartIso, i);
    const bfId = await insertMeal(day.breakfast, 'breakfast');
    const luId = await insertMeal(day.lunch, 'lunch');
    const diId = await insertMeal(day.dinner, 'dinner');
    const { error } = await supabase.from('meal_plans').upsert(
      {
        user_id: userId,
        plan_date: planDate,
        breakfast_meal_id: bfId,
        lunch_meal_id: luId,
        dinner_meal_id: diId,
        logged_meals: [],
      },
      { onConflict: 'user_id,plan_date' }
    );
    if (error) throw error;
  }
}
