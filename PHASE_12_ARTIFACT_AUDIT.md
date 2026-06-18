# Phase 12 Artifact Audit (P3-05)

**Date:** 2026-05-30  
**Scope:** All onboarding-related files  
**Action:** Classification only — **no deletions in Phase 12**

Legend: **KEEP** = required for production | **REMOVE** = spec-pure removal candidate | **REVIEW** = product decision

---

## lib/ — Onboarding helpers

| Artifact | Purpose | Classification | Rationale |
| -------- | ------- | -------------- | --------- |
| `lib/onboardingRoutePaths.ts` | Canonical `ONBOARDING_ROUTES` + legacy redirect map | **KEEP** | Required for funnel navigation |
| `lib/onboardingService.ts` | Step persistence, resume, v6 migration | **KEEP** | Cold-start resume |
| `lib/useOnboardingNavigation.ts` | Back/skip handlers | **KEEP** | Spec funnel behavior |
| `lib/completeConversionOnboarding.ts` | Post-account exit routing | **KEEP** | Spec completion |
| `lib/conversionOnboardingTypes.ts` | Role/step types | **KEEP** | Type safety |
| `lib/onboardingProgress.ts` | ProgressBar percentages | **KEEP** | Spec progress UI |
| `lib/onboardingAnalytics.ts` | Funnel telemetry events | **REVIEW** | Not in spec FILE STRUCTURE; valuable for conversion metrics |
| `lib/saveTruwellOnboarding.ts` | Profile upsert after signup | **KEEP** | Production persistence (pairs with P3-07) |
| `lib/onboardingStoreSpec.ts` | Spec alias read helpers | **KEEP** | P2 compliance bridge |
| `lib/onboardingScores.ts` | Guardian/pro score bounds | **KEEP** | Spec score rules |
| `lib/guardianAdaptiveAssessment.ts` | Adaptive Q builder | **KEEP** | Spec screen 4G |
| `lib/onboardingShare.ts` | expo-sharing wrapper | **KEEP** | Spec viral loop |
| `lib/onboardingSubmit.ts` | Legacy submit path | **REVIEW** | May overlap saveTruwellOnboarding |
| `lib/onboardingFonts.ts` | Font readiness (Phase 12) | **KEEP** | P3-03 |
| `lib/psychFlow.ts` | Psych funnel routing | **REVIEW** | Legacy parallel funnel |
| `lib/professionalOnboardingGoals.ts` | Pro goal derivation for save | **KEEP** | saveTruwellOnboarding dependency |
| `lib/buildHealthPlan.ts` | Health plan builder | **REVIEW** | May predate conversion onboarding |

---

## stores/

| Artifact | Classification | Rationale |
| -------- | -------------- | --------- |
| `stores/onboardingStore.ts` | **KEEP** | Spec store (extended, not replaced) |

---

## constants/

| Artifact | Classification | Rationale |
| -------- | -------------- | --------- |
| `constants/onboardingTheme.ts` | **KEEP** | Spec OB tokens |

---

## components/onboarding/ — Spec components

| Artifact | Classification | Rationale |
| -------- | -------------- | --------- |
| `ShieldLogo.tsx` | **KEEP** | Spec |
| `ProgressBar.tsx` | **KEEP** | Spec |
| `GoalCard.tsx` | **KEEP** | Spec |
| `ChipSelector.tsx` | **KEEP** | Spec |
| `ScoreRing.tsx` | **KEEP** | Spec |
| `BlueprintRow.tsx` | **KEEP** | Spec |
| `ChatBubble.tsx` | **KEEP** | Spec |
| `OnboardingShell.tsx` | **KEEP** | Shared layout shell |
| `CircuitTexture.tsx` | **KEEP** | P3-02 spec |
| `PulseRings.tsx` | **KEEP** | P2 ai-processing |
| `ProcessingChecklistItem.tsx` | **KEEP** | P2 ai-processing |
| `PrimaryButton.tsx` | **REVIEW** | Possible duplicate of OnboardingPrimaryButton |
| `OnboardingShared.tsx` | **REVIEW** | Legacy shared helpers |
| `OnboardingHeader.tsx` | **REVIEW** | May be unused in spec funnel |
| `OnboardingSlides.tsx` | **REMOVE** | Pre-spec slide deck |
| `SplashScreen.tsx` | **REVIEW** | May duplicate welcome |
| `AhaScreen.tsx` | **REMOVE** | Pre-spec psych/slide artifact |
| `TruwellAtmosphere.tsx` | **REVIEW** | Superseded by OnboardingShell atmosphere |
| `TruWellShield.tsx` | **REVIEW** | Superseded by ShieldLogo |
| `AnimateUp.tsx` | **REVIEW** | Generic animation helper |
| `SelectionCard.tsx` | **REVIEW** | May duplicate GoalCard |
| `SlideCtaFooter.tsx` | **REMOVE** | Slide deck artifact |
| `OnboardingInput.tsx` | **REVIEW** | Used by account? |
| `tokens.ts` | **KEEP** | Re-exports spec theme |

---

## components/onboarding/slides/ — Legacy slide deck

| Artifact | Classification |
| -------- | -------------- |
| `Slide1Revelation.tsx` | **REMOVE** |
| `Slide2Proof.tsx` | **REMOVE** |
| `Slide3Personalise.tsx` | **REMOVE** |
| `Slide4Community.tsx` | **REMOVE** |
| `Slide5TypeSelect.tsx` | **REMOVE** |

---

## components/onboarding/wizard/ — Registration wizard

| Artifact | Classification |
| -------- | -------------- |
| `RegistrationWizard.tsx` | **REVIEW** — may still link from register |
| `WizardHeader.tsx` | **REVIEW** |
| `LegalDocModal.tsx` | **KEEP** — legal modals reused |
| `ConvoPrompt.tsx` | **REVIEW** |
| `user/UserStep1–5.tsx` | **REVIEW** |
| `expert/ExpertStep1–5.tsx` | **REVIEW** |

---

## components/onboarding/psych/ — Psych funnel UI

| Artifact | Classification |
| -------- | -------------- |
| `PsychScreenShell.tsx` | **REVIEW** |
| `PsychAmbientBg.tsx` | **REVIEW** |
| `PsychChoiceCard.tsx` | **REVIEW** |
| `PsychDynamicCard.tsx` | **REVIEW** |
| `PsychGradientButton.tsx` | **REVIEW** |

---

## components/onboarding/ui/ — Shared UI atoms

| Artifact | Classification |
| -------- | -------------- |
| `SegmentedIndicator.tsx` | **KEEP** — workspace rule (no progress bars) |
| `CheckboxItem.tsx`, `ChoiceCard.tsx`, etc. | **REVIEW** — grep imports before removal |

---

## app/(onboarding)/ — Spec route group

| Artifact | Classification |
| -------- | -------------- |
| All 11 screen files + `_layout.tsx` | **KEEP** |
| Re-export stubs pointing to `app/onboarding/*` | **REVIEW** — colocation debt (P0 partial) |

---

## app/onboarding/ — Legacy implementation tree

| Artifact | Classification |
| -------- | -------------- |
| Screen implementations (role, blueprint, etc.) | **KEEP** until colocated |
| `index.tsx` | **KEEP** — redirect stub |
| `paywall-onboarding.tsx` | **REDIRECT** candidate → subscription |
| `notifications.tsx` | **REVIEW** — not in 11-screen spec |
| `celebration.tsx` | **REVIEW** — replaced by account completion |
| `_layout.tsx` | **REVIEW** — legacy stack |

---

## app/(auth)/onboarding/ — Auth-era onboarding

| Artifact | Classification |
| -------- | -------------- |
| `health-profile.tsx` | **REVIEW** |
| `preferences.tsx` | **REVIEW** |
| `notifications.tsx` | **REVIEW** |

---

## Documentation artifacts (Phase reports)

| Artifact | Classification |
| -------- | -------------- |
| `PHASE_*_*.md`, `ONBOARDING_*.md` | **KEEP** — audit trail |

---

## Summary counts

| Classification | Count (approx.) |
| -------------- | --------------- |
| KEEP | 35+ |
| REVIEW | 30+ |
| REMOVE | 8 (slide deck + AhaScreen + SlideCtaFooter) |

---

## Recommendation

Do **not** bulk-delete in Phase 13 without import graph analysis. Priority removal candidates: `components/onboarding/slides/*`, `AhaScreen.tsx`, `SlideCtaFooter.tsx`. Defer analytics (`onboardingAnalytics.ts`) and save helpers until product approves.
