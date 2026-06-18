import { create } from 'zustand';

export type MealSlot = {
  id: string;
  label: string;
  kcal: number;
  name: string;
  /** Grocery hints for this meal option */
  staples?: string[];
};

export type DayPlan = {
  date: string;
  meals: MealSlot[];
};

const mealId = (date: string, label: string) => `${date}-${label}`;

/** Rotating alternatives per slot (swap cycles through). */
const ALT_POOL: Record<string, Omit<MealSlot, 'id'>[]> = {
  Breakfast: [
    {
      label: 'Breakfast',
      name: 'Greek yogurt + berries ✧',
      kcal: 320,
      staples: ['Greek yogurt', 'Mixed berries', 'Honey'],
    },
    {
      label: 'Breakfast',
      name: 'Oatmeal + banana + chia ✧',
      kcal: 340,
      staples: ['Rolled oats', 'Banana', 'Chia seeds'],
    },
    {
      label: 'Breakfast',
      name: 'Egg whites + avocado toast ✧',
      kcal: 310,
      staples: ['Eggs', 'Avocado', 'Whole grain bread'],
    },
  ],
  Lunch: [
    {
      label: 'Lunch',
      name: 'Mediterranean bowl ✧',
      kcal: 540,
      staples: ['Chickpeas', 'Cucumber', 'Feta', 'Olive oil'],
    },
    {
      label: 'Lunch',
      name: 'Grilled chicken salad ✧',
      kcal: 520,
      staples: ['Chicken breast', 'Greens', 'Cherry tomatoes'],
    },
    {
      label: 'Lunch',
      name: 'Tuna poke bowl ✧',
      kcal: 560,
      staples: ['Tuna', 'Brown rice', 'Edamame', 'Seaweed'],
    },
  ],
  Dinner: [
    {
      label: 'Dinner',
      name: 'Herb salmon + greens ✧',
      kcal: 610,
      staples: ['Salmon fillet', 'Asparagus', 'Lemon', 'Spinach'],
    },
    {
      label: 'Dinner',
      name: 'Turkey meatballs + zucchini ✧',
      kcal: 590,
      staples: ['Ground turkey', 'Zucchini', 'Marinara'],
    },
    {
      label: 'Dinner',
      name: 'Tofu stir-fry ✧',
      kcal: 580,
      staples: ['Firm tofu', 'Broccoli', 'Ginger', 'Sesame oil'],
    },
  ],
};

function dayTemplate(date: string): DayPlan {
  const labels = ['Breakfast', 'Lunch', 'Dinner'] as const;
  const meals: MealSlot[] = labels.map((label) => {
    const pool = ALT_POOL[label];
    const first = pool[0];
    return {
      id: mealId(date, label),
      label: first.label,
      name: first.name,
      kcal: first.kcal,
      staples: first.staples,
    };
  });
  return { date, meals };
}

export function buildWeekPlansFromToday(): DayPlan[] {
  const out: DayPlan[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const date = d.toISOString().slice(0, 10);
    out.push(dayTemplate(date));
  }
  return out;
}

export function aggregateGroceryList(weekPlans: DayPlan[]): string[] {
  const set = new Set<string>();
  for (const day of weekPlans) {
    for (const m of day.meals) {
      for (const s of m.staples ?? []) set.add(s);
    }
  }
  return Array.from(set).sort((a, b) => a.localeCompare(b));
}

interface DietState {
  weekPlans: DayPlan[];
  setWeekPlans: (plans: DayPlan[]) => void;
  swapMeal: (date: string, mealId: string) => void;
}

export const useDietStore = create<DietState>((set) => ({
  weekPlans: [],
  setWeekPlans: (weekPlans) => set({ weekPlans }),
  swapMeal: (date, mealId) =>
    set((s) => ({
      weekPlans: s.weekPlans.map((day) => {
        if (day.date !== date) return day;
        return {
          ...day,
          meals: day.meals.map((m) => {
            if (m.id !== mealId) return m;
            const pool = ALT_POOL[m.label] ?? [
              { label: m.label, name: m.name, kcal: m.kcal, staples: m.staples },
            ];
            const curIdx = pool.findIndex((p) => p.name === m.name);
            const idx = curIdx >= 0 ? (curIdx + 1) % pool.length : 0;
            const next = pool[idx];
            return {
              ...m,
              name: next.name,
              kcal: next.kcal,
              staples: next.staples,
            };
          }),
        };
      }),
    })),
}));
