# Phase 12 Typography Report (P3-03)

**Date:** 2026-05-30  
**Gap:** GAP-P3-03 — DM Sans font loading  
**Status:** **Implemented (onboarding-scoped)**

---

## Pre-audit typography state

| Token | Spec value | Pre-Phase 12 |
| ----- | ---------- | ------------ |
| `OB.fontHead` | `Montserrat` | Referenced in onboarding styles; Montserrat loaded in root `_layout.tsx` as `Montserrat_700Bold` / `Montserrat_600SemiBold` but **not** registered under alias `'Montserrat'` |
| `OB.fontBody` | `DM-Sans` | Referenced but **never loaded** — silent system fallback |

**Screens with `fontFamily: OB.fontBody`:** OnboardingShell titles/subtitles, role, assessment, ai-demo, and others.  
**Welcome screen:** Pre-Phase 12 lacked explicit `fontFamily` on headline/stat copy.

---

## Implementation

### Package

- Added `@expo-google-fonts/dm-sans` to `package.json`

### Font loading (onboarding only)

`app/(onboarding)/_layout.tsx`:

```typescript
useFonts({
  'DM-Sans': DMSans_400Regular,
  'DM-Sans-Medium': DMSans_500Medium,
  Montserrat: Montserrat_700Bold,
  'Montserrat-SemiBold': Montserrat_600SemiBold,
});
```

- Stack gated until fonts load (blank navy view during load)
- On load failure: stack renders with system fallback; warning logged
- **Root `app/_layout.tsx` untouched** — main app typography unchanged

### Fallback helper

`lib/onboardingFonts.ts`:

- `setOnboardingFontsReady()` / `areOnboardingFontsReady()`
- `onboardingFontHead()`, `onboardingFontBody()`, `onboardingFontBodyMedium()` with Platform system fallback

### Typography wiring

| File | Change |
| ---- | ------ |
| `app/(onboarding)/welcome.tsx` | Added `OB.fontHead` / `OB.fontBody` to h1, sub, stat, fomo, sign-in text |
| `components/onboarding/OnboardingShell.tsx` | Existing `OB.fontHead` / `OB.fontBody` on title block + CTA (unchanged keys, now resolvable) |
| Screen files using `OB.fontHead` / `OB.fontBody` | No change required — aliases now registered at funnel entry |

---

## Scope boundary

| Area | Touched? |
| ---- | -------- |
| `app/(onboarding)/*` layout | Yes — font load |
| Onboarding components/screens | Yes — welcome explicit fonts |
| `app/_layout.tsx` (root) | **No** |
| `app/(tabs)/*` | **No** |
| `app/(auth)/login`, `register` | **No** |
| Theme `/src/theme` or global Text defaults | **No** |

---

## Spec deviation note

Spec line 551 says load fonts in **root** `app/_layout.tsx`. Phase 12 constraint requires onboarding-only scope. **Pragmatic deviation:** fonts load when entering `(onboarding)` stack; first paint inside funnel waits for fonts; main app never loads DM Sans unless user enters onboarding.

---

## Remaining typography gaps

| Item | Status |
| ---- | ------ |
| Montserrat 400/800/900 weights per spec import list | Not loaded — onboarding uses 700Bold as `Montserrat` alias |
| Subscription/account screen inline styles | Partial — inherit shell; some local styles may omit `fontFamily` |
| NativeWind `font-*` utilities | Blocked on P3-01 |

---

## Validation

- `npx tsc --noEmit` — see Phase 12 compliance recheck
- Device QA: verify Montserrat headlines + DM Sans body on welcome and role screens
