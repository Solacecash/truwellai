/** Flag emoji + display name for specialist cards (extend as needed). */
export const countryFlags: Record<string, string> = {
  US: '🇺🇸',
  GB: '🇬🇧',
  NG: '🇳🇬',
  GH: '🇬🇭',
  KE: '🇰🇪',
  ZA: '🇿🇦',
  IN: '🇮🇳',
  CA: '🇨🇦',
  AU: '🇦🇺',
  DE: '🇩🇪',
  FR: '🇫🇷',
  BR: '🇧🇷',
  MX: '🇲🇽',
  JP: '🇯🇵',
  CN: '🇨🇳',
  AE: '🇦🇪',
  SA: '🇸🇦',
  EG: '🇪🇬',
  SG: '🇸🇬',
  PK: '🇵🇰',
};

const countryNames: Record<string, string> = {
  US: 'United States',
  GB: 'United Kingdom',
  NG: 'Nigeria',
  GH: 'Ghana',
  KE: 'Kenya',
  ZA: 'South Africa',
  IN: 'India',
  CA: 'Canada',
  AU: 'Australia',
  DE: 'Germany',
  FR: 'France',
  BR: 'Brazil',
  MX: 'Mexico',
  JP: 'Japan',
  CN: 'China',
  AE: 'UAE',
  SA: 'Saudi Arabia',
  EG: 'Egypt',
  SG: 'Singapore',
  PK: 'Pakistan',
};

export function flagForCountryCode(code: string | null | undefined): string {
  if (!code) return '';
  const k = code.trim().toUpperCase();
  return countryFlags[k] ?? '🌍';
}

export function displayCountryName(code: string | null | undefined): string {
  if (!code) return '';
  const k = code.trim().toUpperCase();
  return countryNames[k] ?? k;
}
