# Phase 11 Blueprint Report — GAP-P2-05

**Status:** Fixed  
**Spec ref:** Lines 389–421

## Implementation

| Requirement | Status |
| ----------- | ------ |
| Unlocked score row | Unchanged — teal check |
| Locked rows (80%) | Frost overlay at 40% opacity per spec line 395 |
| Lock icon | 🔒 badge retained |
| Premium indicator | "Premium" tag on locked rows |
| Row titles | **Spec copy retained** (Care Plan, AI Companion, etc.) — not Phase 11 brief alternate names |

## Files changed

- `components/onboarding/BlueprintRow.tsx`
- `app/onboarding/blueprint.tsx` (unchanged row data; inherits component update)

## Validation

- Navigation and unlock CTA unchanged
- `npx tsc --noEmit` — PASS
