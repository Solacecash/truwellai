/** Convert fl oz (US) to milliliters */
export function flOzToMl(flOz: number): number {
  return Math.round(flOz * 29.5735);
}

export function mlToFlOz(ml: number): number {
  return ml / 29.5735;
}

export function clampScore(n: number, min = 0, max = 100): number {
  return Math.min(max, Math.max(min, n));
}
