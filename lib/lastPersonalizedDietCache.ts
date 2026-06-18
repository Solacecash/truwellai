import type { AiDayPlan } from '@/lib/savePersonalizedMealPlan';

export type PersonalizedDietCache = {
  mealPlan: AiDayPlan[];
  groceryList: string[];
  weekStartIso: string;
  personalization: Record<string, unknown>;
};

let cache: PersonalizedDietCache | null = null;

export function setPersonalizedDietCache(next: PersonalizedDietCache) {
  cache = next;
}

export function getPersonalizedDietCache(): PersonalizedDietCache | null {
  return cache;
}

export function clearPersonalizedDietCache() {
  cache = null;
}
