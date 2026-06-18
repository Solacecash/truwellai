# Phase 13 Cleanup Execution Plan

**Date:** 2026-05-30  
**Sources:** `PHASE_12_ARTIFACT_AUDIT.md`, `PHASE_12_LEGACY_ROUTE_AUDIT.md`  
**Action:** Planning only — **no deletions, no route removals**

Legend:

- **SAFE NOW** — low risk; no device QA dependency (documentation-only or zero importers confirmed)
- **SAFE AFTER DEVICE QA** — cleanup after QA pass confirms funnel + deep links
- **DO NOT REMOVE** — required for production or unresolved product decision

---

## Routes

| Candidate | Classification | Notes |
| --------- | -------------- | ----- |
| `/(onboarding)/*` spec stack (13 routes) | **DO NOT REMOVE** | Canonical funnel |
| `app/onboarding/index.tsx` redirect | **DO NOT REMOVE** | Legacy `/onboarding` entry |
| `app/onboarding/role.tsx` … `blueprint.tsx` (impl) | **SAFE AFTER DEVICE QA** | Replace with redirect stubs after colocating impl in `(onboarding)/` |
| `app/onboarding/paywall-onboarding.tsx` | **SAFE AFTER DEVICE QA** | Redirect → subscription |
| `app/onboarding/notifications.tsx` | **SAFE AFTER DEVICE QA** | Redirect or remove after link audit |
| `app/onboarding/celebration.tsx` | **SAFE AFTER DEVICE QA** | Redirect → `/enter` |
| `app/onboarding/_layout.tsx` legacy stack | **SAFE AFTER DEVICE QA** | After all children redirect-only |
| `/(auth)/welcome.tsx` | **SAFE AFTER DEVICE QA** | Only after index.tsx points to spec welcome + register audited |
| `/(auth)/psych/*` (13 routes) | **DO NOT REMOVE** | Product decision pending |
| `/(auth)/onboarding/*` | **DO NOT REMOVE** | Register flow still uses health-profile |
| `/(auth)/sign-in.tsx` | **DO NOT REMOVE** | Spec alias |

---

## Components — slides / dead deck

| Candidate | Classification |
| --------- | -------------- |
| `components/onboarding/slides/Slide1–5` | **SAFE AFTER DEVICE QA** |
| `components/onboarding/OnboardingSlides.tsx` | **SAFE AFTER DEVICE QA** |
| `components/onboarding/SlideCtaFooter.tsx` | **SAFE NOW** (if grep confirms zero importers outside slides) |
| `components/onboarding/AhaScreen.tsx` | **SAFE AFTER DEVICE QA** |
| `components/onboarding/SplashScreen.tsx` | **SAFE AFTER DEVICE QA** |

---

## Components — spec funnel (keep)

| Candidate | Classification |
| --------- | -------------- |
| OnboardingShell, CircuitTexture, ProgressBar, ShieldLogo, GoalCard, ChipSelector, ScoreRing, BlueprintRow, ChatBubble, PulseRings, ProcessingChecklistItem | **DO NOT REMOVE** |
| `constants/onboardingTheme.ts`, `tokens.ts` | **DO NOT REMOVE** |

---

## Components — legacy / review

| Candidate | Classification |
| --------- | -------------- |
| `RegistrationWizard.tsx` + wizard/* | **DO NOT REMOVE** until `(auth)/welcome` deprecated |
| `psych/*` components | **DO NOT REMOVE** |
| `TruWellShield.tsx` | **SAFE AFTER DEVICE QA** — verify login.tsx still needs it |
| `TruwellAtmosphere.tsx` | **SAFE AFTER DEVICE QA** |
| `PrimaryButton.tsx` vs OnboardingPrimaryButton | **SAFE AFTER DEVICE QA** — dedupe after import grep |
| `ui/*` atoms | **DO NOT REMOVE** — may be used outside funnel |

---

## lib/ helpers

| Candidate | Classification |
| --------- | -------------- |
| `onboardingRoutePaths.ts`, `onboardingService.ts`, `useOnboardingNavigation.ts` | **DO NOT REMOVE** |
| `completeConversionOnboarding.ts`, `saveTruwellOnboarding.ts` | **DO NOT REMOVE** |
| `onboardingAnalytics.ts` | **DO NOT REMOVE** — product telemetry |
| `onboardingStoreSpec.ts`, `onboardingScores.ts`, `guardianAdaptiveAssessment.ts`, `onboardingShare.ts`, `onboardingFonts.ts` | **DO NOT REMOVE** |
| `psychFlow.ts` | **DO NOT REMOVE** until psych deprecated |
| `onboardingSubmit.ts` | **SAFE AFTER DEVICE QA** — verify no callers |
| `buildHealthPlan.ts` | **SAFE AFTER DEVICE QA** — verify scope |

---

## stores/

| Candidate | Classification |
| --------- | -------------- |
| `onboardingStore.ts` | **DO NOT REMOVE** |

---

## Documentation

| Candidate | Classification |
| --------- | -------------- |
| `PHASE_*_*.md`, `ONBOARDING_*.md` | **DO NOT REMOVE** |

---

## Recommended execution sequence

### Phase 14a (after device QA pass)

1. Fix `app/index.tsx` cold start → `ONBOARDING_ROUTES.welcome`
2. Fix Google/Apple professional `user_type` on account screen
3. Grep-import graph for slide deck files
4. Remove slide deck components if zero production imports

### Phase 14b (after 14a stable)

1. Colocate screen impls into `app/(onboarding)/`
2. Convert `app/onboarding/*.tsx` to redirect-only stubs
3. Redirect paywall-onboarding, notifications, celebration

### Phase 14c (product decision)

1. Deprecate `(auth)/welcome` or redirect to spec welcome
2. Psych funnel → redirect to conversion welcome OR keep
3. NativeWind migration (spec funnel hybrid scope)

---

## Summary counts

| Classification | Approx. count |
| -------------- | ------------- |
| **DO NOT REMOVE** | 45+ |
| **SAFE AFTER DEVICE QA** | 25+ |
| **SAFE NOW** | 1–3 (pending import grep) |

**No cleanup executed in Phase 13.**
