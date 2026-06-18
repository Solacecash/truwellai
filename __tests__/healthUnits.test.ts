import { clampScore, flOzToMl, mlToFlOz } from '@/lib/healthUnits';

describe('healthUnits', () => {
  test('flOzToMl', () => {
    expect(flOzToMl(8)).toBeCloseTo(237, 0);
  });
  test('mlToFlOz', () => {
    expect(mlToFlOz(237)).toBeCloseTo(8, 0);
  });
  test('clampScore', () => {
    expect(clampScore(150)).toBe(100);
    expect(clampScore(-5)).toBe(0);
    expect(clampScore(42)).toBe(42);
  });
});
