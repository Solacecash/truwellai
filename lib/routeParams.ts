/**
 * Expo Router search params may be repeated in the URL; normalize to one string or undefined.
 */
export function singleSearchParam(raw: string | string[] | undefined): string | undefined {
  if (raw == null) return undefined;
  const val = Array.isArray(raw) ? raw[0] : raw;
  if (typeof val !== 'string') return undefined;
  const trimmed = val.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}
