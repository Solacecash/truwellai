import type { UsdaProduct } from './usdaLookup.ts';

export type DataSource =
  | 'truwell_cache'
  | 'open_food_facts'
  | 'open_beauty_facts'
  | 'open_products_facts'
  | 'usda'
  | 'ai_inference';

export interface ResolvedProduct {
  barcode: string;
  productName: string;
  brandName: string | null;
  quantity: string | null;
  categories: string | null;
  productType:
    | 'food'
    | 'beverage'
    | 'cosmetic'
    | 'supplement'
    | 'household'
    | 'pet'
    | 'medicine'
    | 'other'
    | 'unknown';
  ingredients: string[];
  ingredientsRaw: string;
  allergens: string[];
  imageUrl: string | null;
  nutrition: {
    calories: number | null;
    protein: number | null;
    fat: number | null;
    carbs: number | null;
    fiber: number | null;
    sugar: number | null;
    sodium: number | null;
    servingSize: string | null;
  };
  sources: DataSource[];
  confidence: number;
}

// ── Open Food Facts ──────────────────────────────────────
async function lookupOpenFoodFacts(
  barcode: string
): Promise<ResolvedProduct | null> {
  try {
    const res = await fetch(
      `https://world.openfoodfacts.org/api/v2/product/${barcode}` +
      `?fields=product_name,brands,ingredients_text,` +
      `allergens_tags,nutriments,image_front_url,` +
      `quantity,categories,product_type`,
      {
        signal: AbortSignal.timeout(5000),
        headers: {
          'User-Agent':
            'TruWellAI/1.0 (contact@truwellai.xyz)',
        },
      }
    );
    if (!res.ok) return null;
    const json = await res.json() as {
      status: number;
      product?: Record<string, unknown>;
    };
    if (json.status !== 1 || !json.product) return null;
    const p = json.product;
    const nutriments =
      (p.nutriments as Record<string, number>) ?? {};

    return {
      barcode,
      productName: String(p.product_name ?? ''),
      brandName: String(p.brands ?? '') || null,
      quantity: String(p.quantity ?? '') || null,
      categories: String(p.categories ?? '') || null,
      productType: 'food',
      ingredients: parseIngredientString(
        String(p.ingredients_text ?? '')
      ),
      ingredientsRaw: String(p.ingredients_text ?? ''),
      allergens: parseAllergens(
        p.allergens_tags as string[] ?? []
      ),
      imageUrl: String(p.image_front_url ?? '') || null,
      nutrition: {
        calories: nutriments['energy-kcal_100g'] ?? null,
        protein: nutriments['proteins_100g'] ?? null,
        fat: nutriments['fat_100g'] ?? null,
        carbs: nutriments[
          'carbohydrates_100g'] ?? null,
        fiber: nutriments['fiber_100g'] ?? null,
        sugar: nutriments['sugars_100g'] ?? null,
        sodium: nutriments['sodium_100g']
          ? nutriments['sodium_100g'] * 1000
          : null,
        servingSize: String(
          p.serving_size ?? ''
        ) || null,
      },
      sources: ['open_food_facts'],
      confidence: 0.9,
    };
  } catch {
    return null;
  }
}

// ── Open Beauty Facts ────────────────────────────────────
async function lookupOpenBeautyFacts(
  barcode: string
): Promise<ResolvedProduct | null> {
  try {
    const res = await fetch(
      `https://world.openbeautyfacts.org/api/v2/product/${barcode}` +
      `?fields=product_name,brands,ingredients_text,` +
      `image_front_url,quantity,categories`,
      {
        signal: AbortSignal.timeout(5000),
        headers: {
          'User-Agent':
            'TruWellAI/1.0 (contact@truwellai.xyz)',
        },
      }
    );
    if (!res.ok) return null;
    const json = await res.json() as {
      status: number;
      product?: Record<string, unknown>;
    };
    if (json.status !== 1 || !json.product) return null;
    const p = json.product;

    return {
      barcode,
      productName: String(p.product_name ?? ''),
      brandName: String(p.brands ?? '') || null,
      quantity: String(p.quantity ?? '') || null,
      categories: String(p.categories ?? '') || null,
      productType: 'cosmetic',
      ingredients: parseIngredientString(
        String(p.ingredients_text ?? '')
      ),
      ingredientsRaw: String(p.ingredients_text ?? ''),
      allergens: [],
      imageUrl: String(p.image_front_url ?? '') || null,
      nutrition: {
        calories: null, protein: null, fat: null,
        carbs: null, fiber: null, sugar: null,
        sodium: null, servingSize: null,
      },
      sources: ['open_beauty_facts'],
      confidence: 0.85,
    };
  } catch {
    return null;
  }
}

// ── Open Products Facts (household) ─────────────────────
async function lookupOpenProductsFacts(
  barcode: string
): Promise<ResolvedProduct | null> {
  try {
    const res = await fetch(
      `https://world.openproductsfacts.org/api/v2/product/${barcode}` +
      `?fields=product_name,brands,ingredients_text,` +
      `image_front_url,quantity,categories`,
      {
        signal: AbortSignal.timeout(5000),
        headers: {
          'User-Agent':
            'TruWellAI/1.0 (contact@truwellai.xyz)',
        },
      }
    );
    if (!res.ok) return null;
    const json = await res.json() as {
      status: number;
      product?: Record<string, unknown>;
    };
    if (json.status !== 1 || !json.product) return null;
    const p = json.product;

    return {
      barcode,
      productName: String(p.product_name ?? ''),
      brandName: String(p.brands ?? '') || null,
      quantity: String(p.quantity ?? '') || null,
      categories: String(p.categories ?? '') || null,
      productType: 'household',
      ingredients: parseIngredientString(
        String(p.ingredients_text ?? '')
      ),
      ingredientsRaw: String(p.ingredients_text ?? ''),
      allergens: [],
      imageUrl: String(p.image_front_url ?? '') || null,
      nutrition: {
        calories: null, protein: null, fat: null,
        carbs: null, fiber: null, sugar: null,
        sodium: null, servingSize: null,
      },
      sources: ['open_products_facts'],
      confidence: 0.80,
    };
  } catch {
    return null;
  }
}

// ── Helpers ──────────────────────────────────────────────
function parseIngredientString(raw: string): string[] {
  if (!raw) return [];
  return raw
    .replace(/<[^>]+>/g, '')
    .split(/[,;]/)
    .map((s) => s.replace(/\(.*?\)/g, '').trim())
    .filter((s) => s.length > 1 && s.length < 100);
}

function parseAllergens(tags: string[]): string[] {
  return tags.map((t) =>
    t.replace('en:', '').replace(/-/g, ' ')
  );
}

function getGs1CountryInfo(barcode: string): {
  country: string;
  region: 'western' | 'asian' | 'global';
} {
  const prefix = parseInt(barcode.slice(0, 3), 10);
  if (prefix >= 690 && prefix <= 699) return { country: 'China', region: 'asian' };
  if (prefix >= 450 && prefix <= 459) return { country: 'Japan', region: 'asian' };
  if (prefix >= 489 && prefix <= 489) return { country: 'Hong Kong', region: 'asian' };
  if (prefix >= 880 && prefix <= 880) return { country: 'South Korea', region: 'asian' };
  if (prefix >= 885 && prefix <= 885) return { country: 'Thailand', region: 'asian' };
  if (prefix >= 893 && prefix <= 893) return { country: 'Vietnam', region: 'asian' };
  if (prefix >= 899 && prefix <= 899) return { country: 'Indonesia', region: 'asian' };
  if (prefix >= 888 && prefix <= 888) return { country: 'Singapore', region: 'asian' };
  if (prefix >= 608 && prefix <= 608) return { country: 'Ghana', region: 'global' };
  if (prefix >= 615 && prefix <= 615) return { country: 'Nigeria', region: 'global' };
  if (prefix >= 619 && prefix <= 619) return { country: 'Tunisia', region: 'global' };
  if (prefix >= 621 && prefix <= 621) return { country: 'Morocco', region: 'global' };
  if (prefix >= 622 && prefix <= 622) return { country: 'Egypt', region: 'global' };
  if (prefix >= 625 && prefix <= 625) return { country: 'Saudi Arabia', region: 'global' };
  if (prefix >= 626 && prefix <= 626) return { country: 'UAE', region: 'global' };
  if (prefix >= 628 && prefix <= 628) return { country: 'Lebanon', region: 'global' };
  if (prefix >= 800 && prefix <= 839) return { country: 'Italy', region: 'western' };
  if (prefix >= 300 && prefix <= 379) return { country: 'France', region: 'western' };
  if (prefix >= 400 && prefix <= 440) return { country: 'Germany', region: 'western' };
  if (prefix >= 50 && prefix <= 59) return { country: 'UK', region: 'western' };
  if (prefix >= 0 && prefix <= 19) return { country: 'USA', region: 'western' };
  return { country: 'Unknown', region: 'global' };
}

async function lookupOpenFoodFactsGlobal(
  barcode: string,
  countryCode?: string
): Promise<ResolvedProduct | null> {
  const subdomains = ['world'];
  if (countryCode) subdomains.unshift(countryCode);
  for (const sub of subdomains) {
    try {
      const res = await fetch(
        `https://${sub}.openfoodfacts.org/api/v2/product/${barcode}` +
        `?fields=product_name,brands,ingredients_text,` +
        `allergens_tags,nutriments,image_front_url,quantity,categories`,
        {
        signal: AbortSignal.timeout(5000),
        headers: {
          'User-Agent':
            'TruWellAI/1.0 (contact@truwellai.xyz)',
        },
      }
      );
      if (!res.ok) continue;
      const json = await res.json() as {
        status: number;
        product?: Record<string, unknown>;
      };
      if (json.status !== 1 || !json.product) continue;
      const p = json.product;
      const nutriments =
        (p.nutriments as Record<string, number>) ?? {};
      return {
        barcode,
        productName: String(p.product_name ?? ''),
        brandName: String(p.brands ?? '') || null,
        quantity: String(p.quantity ?? '') || null,
        categories: String(p.categories ?? '') || null,
        productType: 'food',
        ingredients: parseIngredientString(
          String(p.ingredients_text ?? '')
        ),
        ingredientsRaw: String(p.ingredients_text ?? ''),
        allergens: parseAllergens(
          p.allergens_tags as string[] ?? []
        ),
        imageUrl: String(p.image_front_url ?? '') || null,
        nutrition: {
          calories: nutriments['energy-kcal_100g'] ?? null,
          protein: nutriments['proteins_100g'] ?? null,
          fat: nutriments['fat_100g'] ?? null,
          carbs: nutriments['carbohydrates_100g'] ?? null,
          fiber: nutriments['fiber_100g'] ?? null,
          sugar: nutriments['sugars_100g'] ?? null,
          sodium: nutriments['sodium_100g']
            ? nutriments['sodium_100g'] * 1000 : null,
          servingSize: String(p.serving_size ?? '') || null,
        },
        sources: ['open_food_facts'],
        confidence: 0.85,
      };
    } catch { continue; }
  }
  return null;
}

// ── Main resolver — queries sources in series ──────────
export async function resolveProduct(
  barcode: string,
  usdaApiKey?: string
): Promise<ResolvedProduct | null> {

  // Series lookup — stop on first hit to save API calls.
  // OFF covers food (3M+ products), OBF covers cosmetics,
  // OPF covers household. Most products are in OFF.
  let best: ResolvedProduct | null = null;

  // 1. Try Open Food Facts first (largest database)
  best = await lookupOpenFoodFacts(barcode);
  if (best && !best.productName.length) best = null;

  // 2. If not food, try Open Beauty Facts
  if (!best) {
    best = await lookupOpenBeautyFacts(barcode);
    if (best && !best.productName.length) best = null;
  }

  // 3. If not cosmetic, try Open Products Facts
  if (!best) {
    best = await lookupOpenProductsFacts(barcode);
    if (best && !best.productName.length) best = null;
  }

  // If food result found but no nutrition — try USDA
  if (best && usdaApiKey &&
      best.productType === 'food' &&
      best.nutrition.calories === null) {
    try {
      const { lookupByBarcode } =
        await import('./usdaLookup.ts');
      const usda = await lookupByBarcode(
        barcode, usdaApiKey
      );
      if (usda) {
        best.nutrition.calories = usda.calories;
        best.nutrition.protein = usda.protein;
        best.nutrition.fat = usda.fat;
        best.nutrition.carbs = usda.carbs;
        best.nutrition.fiber = usda.fiber;
        best.nutrition.sugar = usda.sugar;
        best.nutrition.sodium = usda.sodium;
        best.nutrition.servingSize = usda.servingSize;
        best.sources.push('usda');
        best.confidence = Math.min(
          best.confidence + 0.05, 1.0
        );
      }
    } catch { /* non-fatal */ }
  }

  // If no food DB result — try USDA directly
  if (!best && usdaApiKey) {
    try {
      const { lookupByBarcode } =
        await import('./usdaLookup.ts');
      const usda = await lookupByBarcode(
        barcode, usdaApiKey
      );
      if (usda && usda.productName !== 'Unknown Product') {
        best = {
          barcode,
          productName: usda.productName,
          brandName: usda.brandName,
          quantity: usda.servingSize,
          categories: null,
          productType: 'food',
          ingredients: usda.ingredients,
          ingredientsRaw: usda.ingredientsRaw,
          allergens: [],
          imageUrl: null,
          nutrition: {
            calories: usda.calories,
            protein: usda.protein,
            fat: usda.fat,
            carbs: usda.carbs,
            fiber: usda.fiber,
            sugar: usda.sugar,
            sodium: usda.sodium,
            servingSize: usda.servingSize,
          },
          sources: ['usda'],
          confidence: 0.80,
        };
      }
    } catch { /* non-fatal */ }
  }

    // If still no result, try global OFF lookup with
    // country-specific subdomain based on GS1 prefix
    if (!best) {
      const gs1Info = getGs1CountryInfo(barcode);
      const countrySubMap: Record<string, string> = {
        'China': 'cn',
        'Japan': 'jp',
        'South Korea': 'kr',
        'France': 'fr',
        'Germany': 'de',
        'Italy': 'it',
        'Spain': 'es',
      };
      const sub = countrySubMap[gs1Info.country];
      if (sub) {
        best = await lookupOpenFoodFactsGlobal(barcode, sub);
      }
    }

    // Attach GS1 metadata to result or create minimal result
    if (!best) {
      const gs1Info = getGs1CountryInfo(barcode);
      if (gs1Info.country !== 'Unknown') {
        return {
          barcode,
          productName: '',
          brandName: null,
          quantity: null,
          categories: null,
          productType: 'unknown',
          ingredients: [],
          ingredientsRaw: '',
          allergens: [],
          imageUrl: null,
          nutrition: {
            calories: null, protein: null, fat: null,
            carbs: null, fiber: null, sugar: null,
            sodium: null, servingSize: null,
          },
          sources: ['ai_inference'],
          confidence: 0,
          gs1Country: gs1Info.country,
          gs1Region: gs1Info.region,
        } as ResolvedProduct & {
          gs1Country: string;
          gs1Region: string;
        };
      }
    }

    return best;
  }
