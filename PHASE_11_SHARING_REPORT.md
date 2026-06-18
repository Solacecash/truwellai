# Phase 11 Sharing Report — GAP-P2-08

**Status:** Fixed  
**Spec ref:** Line 361 (expo-sharing)

## Implementation

`lib/onboardingShare.ts`:

1. Try `Sharing.isAvailableAsync()` + write temp `.txt` via `expo-file-system/legacy`
2. Share via `Sharing.shareAsync` with plain-text MIME
3. Fallback to React Native `Share.share` if unavailable or on error

## Score reveal integration

- Guardian invite: score + "Invite 3 friends → Unlock Premium Care Report"
- Professional invite: score + 8.4 hrs + colleague invite copy

## Platform support

| Platform | Primary | Fallback |
| -------- | ------- | -------- |
| iOS | expo-sharing file share | RN Share |
| Android | expo-sharing file share | RN Share |

Errors swallowed — no crash if user cancels or sharing unavailable.

## Files changed

- `lib/onboardingShare.ts` (new)
- `app/onboarding/score-reveal.tsx`

## Validation

- `npx tsc --noEmit` — PASS
