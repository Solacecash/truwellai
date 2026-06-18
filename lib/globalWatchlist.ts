import { supabase } from './supabase';

export type WatchlistStatus = 'banned' | 'recalled' | 'restricted' | 'warning';
export type WatchlistJurisdiction = 'EU' | 'USA' | 'UK' | 'NAFDAC' | 'WHO' | 'Global' | string;

export interface WatchlistEntry {
  id?: string;
  productName?: string | null;
  ingredient?: string | null;
  status: WatchlistStatus;
  jurisdiction: WatchlistJurisdiction;
  reason: string;
  date?: string | null;
  source?: string | null;
}

export interface WatchlistResult {
  hasAlerts: boolean;
  alerts: WatchlistEntry[];
  bannedIngredients: string[];
  recalledBatches: string[];
  riskLevel: 'critical' | 'high' | 'medium' | 'none';
}

type RawRow = {
  id?: string;
  product_name?: string | null;
  ingredient?: string | null;
  status?: string | null;
  jurisdiction?: string | null;
  reason?: string | null;
  date_added?: string | null;
  source?: string | null;
};

function rowToEntry(row: RawRow): WatchlistEntry | null {
  if (!row.status || !row.jurisdiction || !row.reason) return null;
  const status = row.status as WatchlistStatus;
  if (!['banned', 'recalled', 'restricted', 'warning'].includes(status)) return null;
  return {
    id: row.id,
    productName: row.product_name ?? null,
    ingredient: row.ingredient ?? null,
    status,
    jurisdiction: row.jurisdiction,
    reason: row.reason,
    date: row.date_added ?? null,
    source: row.source ?? null,
  };
}

/**
 * Cross-reference a list of ingredients against the global_watchlist table.
 * Returns hydrated alerts ready to render. Gracefully returns empty results
 * if the table doesn't exist yet or the query fails.
 */
export async function checkGlobalWatchlist(
  ingredients: string[],
  productName?: string | null
): Promise<WatchlistResult> {
  const empty: WatchlistResult = {
    hasAlerts: false,
    alerts: [],
    bannedIngredients: [],
    recalledBatches: [],
    riskLevel: 'none',
  };

  const trimmed = Array.from(
    new Set(
      ingredients
        .filter(Boolean)
        .map((i) => i.toLowerCase().trim())
        .filter((i) => i.length >= 3)
    )
  ).slice(0, 12);

  if (trimmed.length === 0 && !productName) return empty;

  try {
    const filters: string[] = [];
    for (const ing of trimmed) {
      filters.push(`ingredient.ilike.%${ing.replace(/[%,()]/g, '')}%`);
    }
    if (productName) {
      filters.push(`product_name.ilike.%${productName.replace(/[%,()]/g, '')}%`);
    }
    const { data, error } = await supabase
      .from('global_watchlist')
      .select('id, product_name, ingredient, status, jurisdiction, reason, date_added, source')
      .or(filters.join(','))
      .limit(50);
    if (error || !data) return empty;

    const alerts = (data as RawRow[])
      .map(rowToEntry)
      .filter((e): e is WatchlistEntry => e !== null);

    if (alerts.length === 0) return empty;

    const bannedIngredients = Array.from(
      new Set(
        alerts
          .filter((a) => a.status === 'banned' && a.ingredient)
          .map((a) => a.ingredient as string)
      )
    );

    const recalledBatches = Array.from(
      new Set(
        alerts
          .filter((a) => a.status === 'recalled' && a.productName)
          .map((a) => a.productName as string)
      )
    );

    const hasCritical = alerts.some((a) => a.status === 'banned' || a.status === 'recalled');
    const hasRestricted = alerts.some((a) => a.status === 'restricted');
    const riskLevel: WatchlistResult['riskLevel'] = hasCritical
      ? 'critical'
      : hasRestricted
        ? 'high'
        : 'medium';

    return {
      hasAlerts: true,
      alerts,
      bannedIngredients,
      recalledBatches,
      riskLevel,
    };
  } catch {
    return empty;
  }
}

export const JURISDICTION_LABELS: Record<string, { flag: string; label: string }> = {
  All: { flag: '🌐', label: 'All regions' },
  EU: { flag: '🇪🇺', label: 'EU' },
  USA: { flag: '🇺🇸', label: 'USA' },
  UK: { flag: '🇬🇧', label: 'UK' },
  NAFDAC: { flag: '🇳🇬', label: 'NAFDAC' },
  WHO: { flag: '🌍', label: 'WHO' },
  Global: { flag: '🌍', label: 'Global' },
};

export function jurisdictionForCountry(countryCode?: string | null): WatchlistJurisdiction {
  if (!countryCode) return 'All';
  const c = countryCode.toUpperCase();
  if (c === 'US' || c === 'USA') return 'USA';
  if (c === 'GB' || c === 'UK') return 'UK';
  if (c === 'NG' || c === 'NGA') return 'NAFDAC';
  const eu = new Set([
    'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR', 'HU',
    'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL', 'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE',
  ]);
  if (eu.has(c)) return 'EU';
  return 'All';
}
