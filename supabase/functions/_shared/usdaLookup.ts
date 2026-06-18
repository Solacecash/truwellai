/**
 * USDA FoodData Central lookup
 * Searches by barcode (GTIN/UPC) then by name.
 * Returns product name + ingredient list or null.
 */

export interface UsdaProduct {
  productName: string;
  brandName: string | null;
  ingredients: string[];
  ingredientsRaw: string;
  calories: number | null;
  protein: number | null;
  fat: number | null;
  carbs: number | null;
  fiber: number | null;
  sugar: number | null;
  sodium: number | null;
  servingSize: string | null;
  dataSource: 'usda';
}

interface UsdaFoodItem {
  description?: string;
  brandOwner?: string;
  brandName?: string;
  ingredients?: string;
  gtinUpc?: string;
  foodNutrients?: Array<{
    nutrientName?: string;
    nutrientNumber?: string;
    value?: number;
    unitName?: string;
  }>;
  servingSize?: number;
  servingSizeUnit?: string;
}

function parseIngredients(raw: string): string[] {
  if (!raw) return [];
  return raw
    .split(/[,;]/)
    .map((s) => s.replace(/\(.*?\)/g, '').trim())
    .filter((s) => s.length > 1 && s.length < 80);
}

function getNutrient(
  nutrients: UsdaFoodItem['foodNutrients'],
  name: string
): number | null {
  if (!nutrients) return null;
  const match = nutrients.find(
    (n) =>
      n.nutrientName?.toLowerCase().includes(name.toLowerCase()) ||
      n.nutrientNumber === name
  );
  return match?.value ?? null;
}

export async function lookupByBarcode(
  barcode: string,
  apiKey: string
): Promise<UsdaProduct | null> {
  try {
    const url =
      `https://api.nal.usda.gov/fdc/v1/foods/search` +
      `?query=${encodeURIComponent(barcode)}` +
      `&dataType=Branded` +
      `&pageSize=1` +
      `&api_key=${apiKey}`;

    const res = await fetch(url, {
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(5000),
    });

    if (!res.ok) return null;

    const json = await res.json() as {
      foods?: UsdaFoodItem[];
      totalHits?: number;
    };

    const food = json.foods?.[0];
    if (!food) return null;

    // Verify the barcode matches (USDA search is fuzzy)
    if (food.gtinUpc && !food.gtinUpc.includes(barcode) &&
        !barcode.includes(food.gtinUpc)) {
      return null;
    }

    return buildProduct(food);
  } catch {
    return null;
  }
}

export async function lookupByName(
  name: string,
  apiKey: string
): Promise<UsdaProduct | null> {
  try {
    const url =
      `https://api.nal.usda.gov/fdc/v1/foods/search` +
      `?query=${encodeURIComponent(name)}` +
      `&dataType=Branded,SR Legacy,Foundation` +
      `&pageSize=1` +
      `&api_key=${apiKey}`;

    const res = await fetch(url, {
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(5000),
    });

    if (!res.ok) return null;

    const json = await res.json() as {
      foods?: UsdaFoodItem[];
    };

    const food = json.foods?.[0];
    if (!food) return null;

    return buildProduct(food);
  } catch {
    return null;
  }
}

function buildProduct(food: UsdaFoodItem): UsdaProduct {
  const nutrients = food.foodNutrients ?? [];
  const ingredientsRaw = food.ingredients ?? '';

  return {
    productName: food.description ?? 'Unknown Product',
    brandName: food.brandOwner ?? food.brandName ?? null,
    ingredients: parseIngredients(ingredientsRaw),
    ingredientsRaw,
    calories: getNutrient(nutrients, 'Energy') ??
              getNutrient(nutrients, '208'),
    protein: getNutrient(nutrients, 'Protein') ??
             getNutrient(nutrients, '203'),
    fat: getNutrient(nutrients, 'Total lipid') ??
         getNutrient(nutrients, '204'),
    carbs: getNutrient(nutrients, 'Carbohydrate') ??
           getNutrient(nutrients, '205'),
    fiber: getNutrient(nutrients, 'Fiber') ??
           getNutrient(nutrients, '291'),
    sugar: getNutrient(nutrients, 'Sugars') ??
           getNutrient(nutrients, '269'),
    sodium: getNutrient(nutrients, 'Sodium') ??
            getNutrient(nutrients, '307'),
    servingSize: food.servingSize
      ? `${food.servingSize}${food.servingSizeUnit ?? 'g'}`
      : null,
    dataSource: 'usda',
  };
}
