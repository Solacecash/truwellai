# Phase 11 Store Alias Report — GAP-P2-01

**Status:** Fixed  
**Spec ref:** Lines 89–159 (`role`, `selectedGoals`, `setAnswer`)

## Implementation

| Spec API | Maps to | Type |
| -------- | ------- | ---- |
| `role` | `selectedRole` | Read via `getSpecRole()` / `useSpecOnboardingStore().role` |
| `selectedGoals` | `guardianGoals` (guardian) or `proGoals` (professional) | `getSelectedGoals()` store method + `getSpecSelectedGoals()` |
| `setAnswer(id, value)` | `setAssessmentAnswer` | Identical persistence path; both methods on store |

## Files changed

- `stores/onboardingStore.ts` — added `setAnswer`, `getSelectedGoals`; `setRole` sets clamped health score
- `lib/onboardingStoreSpec.ts` — `getSpecRole`, `getSpecSelectedGoals`, `useSpecOnboardingStore` hook
- `lib/saveTruwellOnboarding.ts` — uses `getSpecSelectedGoals` for `care_goals`

## Backward compatibility

- All existing fields (`selectedRole`, `guardianGoals`, `setAssessmentAnswer`) unchanged
- No AsyncStorage schema or version bump
- No breaking changes to persistence payload

## Validation

- Existing screens continue using legacy names
- Guardian assessment uses `setAnswer` alias
- `npx tsc --noEmit` — PASS
