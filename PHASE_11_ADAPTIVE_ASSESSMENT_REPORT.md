# Phase 11 Adaptive Assessment Report — GAP-P2-04

**Status:** Fixed  
**Spec ref:** Lines 281–287

## Question flow tree

```
Always (base 4):
  ageRange → primaryRole → challenge → sleepQuality

If goal selected (max +4, total cap 8):
  "Lose weight and keep it off"        → weightFocus
  "Have real energy again"             → energyPattern
  "Finally sleep properly"             → sleepRoutine
  "Reduce stress and anxiety"          → stressSource
  "Build strength and fitness"         → fitnessLevel
  "Improve heart and metabolic health" → metabolicFocus
```

## Dependencies

- Adaptive questions depend on **care-discovery goals** (`guardianGoals`), not prior answers
- All visible questions remain answerable — no conditional hiding (no dead ends)
- CTA always enabled — completion always possible

## Final answer payload

Stored in `assessmentAnswers` via `setAnswer(key, value)`:

- Base keys: `ageRange`, `primaryRole`, `challenge`, `sleepQuality`
- Optional keys: `weightFocus`, `energyPattern`, `sleepRoutine`, `stressSource`, `fitnessLevel`, `metabolicFocus`

Persisted unchanged through existing conversion snapshot.

## Files changed

- `lib/guardianAdaptiveAssessment.ts` (new)
- `app/onboarding/guardian/assessment.tsx`

## Validation

- 4 questions minimum; up to 8 with goals selected
- ETA text scales with question count
- `npx tsc --noEmit` — PASS
