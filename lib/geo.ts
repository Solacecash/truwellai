/** Approximate continent code for ISO 3166-1 alpha-2 country codes. */
export function continentForCountryCode(code: string | null | undefined): string | null {
  if (!code) return null;
  const c = code.trim().toUpperCase();

  const na = new Set(['US', 'CA', 'MX', 'GT', 'BZ', 'CR', 'PA', 'JM', 'CU', 'HT', 'DO', 'PR']);
  const sa = new Set(['BR', 'AR', 'CL', 'CO', 'PE', 'VE', 'EC', 'BO', 'PY', 'UY']);
  const eu = new Set([
    'GB', 'DE', 'FR', 'IT', 'ES', 'PT', 'NL', 'BE', 'AT', 'CH', 'SE', 'NO', 'FI', 'PL', 'IE',
    'DK', 'GR', 'CZ', 'HU', 'RO', 'BG', 'HR', 'SK', 'SI', 'LT', 'LV', 'EE', 'LU', 'MT', 'CY',
    'IS', 'AL', 'RS', 'UA', 'BY', 'MD',
  ]);
  const af = new Set([
    'NG', 'GH', 'KE', 'ZA', 'EG', 'ET', 'TZ', 'UG', 'RW', 'SN', 'CI', 'CM', 'MA', 'DZ', 'TN',
    'LY', 'SD', 'ZW', 'BW', 'NA', 'MZ', 'AO', 'CD', 'CG', 'GA', 'BJ', 'BF', 'ML', 'NE', 'TD',
  ]);
  const as = new Set([
    'IN', 'CN', 'JP', 'KR', 'PK', 'BD', 'ID', 'TH', 'VN', 'PH', 'MY', 'SG', 'MM', 'KH', 'LA',
    'NP', 'LK', 'TW', 'HK', 'MN', 'KZ', 'UZ', 'AE', 'SA', 'IQ', 'IR', 'IL', 'JO', 'LB', 'SY',
    'YE', 'OM', 'QA', 'KW', 'BH',
  ]);
  const oc = new Set(['AU', 'NZ', 'FJ', 'PG', 'NC']);
  const an = new Set(['AQ']);

  if (na.has(c)) return 'NA';
  if (sa.has(c)) return 'SA';
  if (eu.has(c)) return 'EU';
  if (af.has(c)) return 'AF';
  if (as.has(c)) return 'AS';
  if (oc.has(c)) return 'OC';
  if (an.has(c)) return 'AN';
  return null;
}

export function haversineKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
