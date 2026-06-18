# Phase 9 Execution Plan

**Authority:** `TruWell_AI_Onboarding_Cursor_Prompt.md`  
**Baseline:** `ONBOARDING_SPEC_COMPLIANCE_REPORT.md` (44%)  
**Scope:** Phase 9B implements **P0 only**. P1–P3 are planned, not implemented.

---

## Priority Definitions

| Priority | Scope |
| -------- | ----- |
| **P0 Critical** | Funnel architecture, screen order, missing mandatory screens, navigation sequence |
| **P1 High** | ProgressBar, theme tokens, subscription/account copy, store aliases |
| **P2 Medium** | Animation polish, adaptive assessment, role UX spec details |
| **P3 Low** | NativeWind migration, circuit texture, DM Sans, out-of-spec artifact removal |

---

## P0 — Critical

### GAP-P0-01 — Route group `app/(onboarding)/`

| Field | Detail |
| ----- | ------ |
| **Gap ID** | GAP-P0-01 |
| **Requirement** | All onboarding screens under `app/(onboarding)/` (spec lines 29, 35–67) |
| **Current (baseline)** | Routes under `app/onboarding/` only |
| **Required change** | Create `(onboarding)` stack with 11 spec screens; canonical hrefs via `ONBOARDING_ROUTES` |
| **Files affected** | `app/(onboarding)/_layout.tsx`, `app/(onboarding)/*.tsx`, `lib/onboardingRoutePaths.ts`, `lib/onboardingService.ts`, `app/_layout.tsx` |
| **Risk** | High — duplicate `/welcome` with `(auth)/welcome`; deep links |
| **Effort** | 2–3 days |

### GAP-P0-02 — `welcome.tsx` naming and entry

| Field | Detail |
| ----- | ------ |
| **Gap ID** | GAP-P0-02 |
| **Requirement** | Screen 1 at `welcome.tsx`, CTA → `/(onboarding)/role` (spec line 227) |
| **Current (baseline)** | `app/onboarding/index.tsx` as entry |
| **Required change** | Full welcome at `(onboarding)/welcome.tsx`; legacy `/onboarding` redirects |
| **Files affected** | `app/(onboarding)/welcome.tsx`, `app/onboarding/index.tsx`, `app/index.tsx`, `app/(auth)/psych/s1-intro.tsx` |
| **Risk** | Medium |
| **Effort** | 0.5 day |

### GAP-P0-03 — Missing `subscription.tsx` (screen 10)

| Field | Detail |
| ----- | ------ |
| **Gap ID** | GAP-P0-03 |
| **Requirement** | Screen 10 in onboarding group; trial → account; free → post-onboarding (spec lines 423–447) |
| **Current (baseline)** | `paywall-onboarding.tsx` at step 11 after register |
| **Required change** | `app/(onboarding)/subscription.tsx` at step 10; legacy paywall redirects |
| **Files affected** | `app/(onboarding)/subscription.tsx`, `app/onboarding/paywall-onboarding.tsx`, `app/settings/subscription.tsx` (reuse only) |
| **Risk** | High — Adapty auth timing |
| **Effort** | 1 day |

### GAP-P0-04 — Missing `account.tsx` (screen 11)

| Field | Detail |
| ----- | ------ |
| **Gap ID** | GAP-P0-04 |
| **Requirement** | Screen 11 after subscription; Google/Apple/Email; complete → main app (spec lines 449–459) |
| **Current (baseline)** | `/(auth)/register` at step 10 before paywall |
| **Required change** | `app/(onboarding)/account.tsx`; register used only for email path |
| **Files affected** | `app/(onboarding)/account.tsx`, `app/(auth)/register.tsx`, `lib/completeConversionOnboarding.ts` |
| **Risk** | Medium |
| **Effort** | 1 day |

### GAP-P0-05 — Funnel order: blueprint → subscription → account

| Field | Detail |
| ----- | ------ |
| **Gap ID** | GAP-P0-05 |
| **Requirement** | Steps 9 → 10 → 11 in spec order (spec FILE STRUCTURE, Screen 9–11 NAVIGATION) |
| **Current (baseline)** | blueprint → register → paywall → notifications → celebration |
| **Required change** | 11-step service; blueprint CTA → subscription; subscription → account; account → `/enter` or `/(expert)` |
| **Files affected** | `lib/onboardingService.ts`, `app/onboarding/blueprint.tsx`, `stores/onboardingStore.ts`, `lib/conversionOnboardingTypes.ts` |
| **Risk** | High |
| **Effort** | 1 day |

### GAP-P0-06 — Remove extra funnel screens (notifications, celebration)

| Field | Detail |
| ----- | ------ |
| **Gap ID** | GAP-P0-06 |
| **Requirement** | 11 screens only; no steps 12–13 in primary funnel |
| **Current (baseline)** | 13-step funnel with notifications + celebration |
| **Required change** | Redirect legacy routes; exclude from `CONVERSION_MAX_STEP` and resume logic |
| **Files affected** | `app/onboarding/notifications.tsx`, `app/onboarding/celebration.tsx`, `lib/onboardingService.ts`, `app/index.tsx` |
| **Risk** | Low |
| **Effort** | 0.5 day |

### GAP-P0-07 — Navigation href migration to `/(onboarding)/`

| Field | Detail |
| ----- | ------ |
| **Gap ID** | GAP-P0-07 |
| **Requirement** | All funnel navigation uses spec route group (spec lines 227, 249, 267, 445) |
| **Current (baseline)** | Hardcoded `/onboarding/*` paths |
| **Required change** | `ONBOARDING_ROUTES` used in all funnel screens and services |
| **Files affected** | All `app/onboarding/**/*.tsx` funnel screens, `lib/useOnboardingNavigation.ts`, `lib/onboardingRoutePaths.ts` |
| **Risk** | Medium |
| **Effort** | 1 day |

### GAP-P0-08 — Auth guards and resume logic for 11-step funnel

| Field | Detail |
| ----- | ------ |
| **Gap ID** | GAP-P0-08 |
| **Requirement** | Signed-in users may resume conversion funnel; cold start resumes correct step (spec post-onboarding preservation, lines 598–600) |
| **Current (baseline)** | 13-step resume; step 10 skipped for signed-in users; guards only knew `/onboarding/` |
| **Required change** | Update `app/index.tsx`, `app/_layout.tsx`, segment math for 10 segments |
| **Files affected** | `app/index.tsx`, `app/_layout.tsx`, `lib/onboardingProgress.ts`, `stores/onboardingStore.ts` |
| **Risk** | Medium |
| **Effort** | 0.5 day |

### GAP-P0-09 — Skip navigation target

| Field | Detail |
| ----- | ------ |
| **Gap ID** | GAP-P0-09 |
| **Requirement** | Skip must not bypass subscription in spec funnel (value before paywall) |
| **Current (baseline)** | Skip jumped to `/(auth)/register` |
| **Required change** | Skip → step 10 subscription |
| **Files affected** | `lib/useOnboardingNavigation.ts` |
| **Risk** | Low |
| **Effort** | 1 hour |

### GAP-P0-10 — Register conversion completion path

| Field | Detail |
| ----- | ------ |
| **Gap ID** | GAP-P0-10 |
| **Requirement** | After account creation, mark complete and enter main app (spec Screen 11) |
| **Current (baseline)** | Conversion signup redirected to paywall |
| **Required change** | `completeConversionOnboarding()` on conversion signup success |
| **Files affected** | `app/(auth)/register.tsx`, `lib/completeConversionOnboarding.ts` |
| **Risk** | Medium |
| **Effort** | 0.5 day |

---

## P1 — High

### GAP-P1-01 — `ProgressBar.tsx` on screens 3–9

| Field | Detail |
| ----- | ------ |
| **Gap ID** | GAP-P1-01 |
| **Requirement** | Spec ProgressBar with 25%/50% on screens 3–4 (spec lines 257–291, 505–539) |
| **Current** | `SegmentedIndicator` in `OnboardingShell` |
| **Required change** | Create `components/onboarding/ProgressBar.tsx`; replace segments |
| **Files affected** | `components/onboarding/ProgressBar.tsx`, `OnboardingShell.tsx`, screens 3–9 |
| **Risk** | Low |
| **Effort** | 0.5 day |

### GAP-P1-02 — `constants/onboardingTheme.ts` exact tokens

| Field | Detail |
| ----- | ------ |
| **Gap ID** | GAP-P1-02 |
| **Requirement** | Spec OB hex values override brand (spec lines 161–209) |
| **Current** | `components/onboarding/tokens.ts` → `truwellBrand` (different hex) |
| **Required change** | Create spec theme file; migrate onboarding imports |
| **Files affected** | `constants/onboardingTheme.ts`, `components/onboarding/tokens.ts`, all onboarding components |
| **Risk** | Medium — CLAUDE.md vs spec conflict |
| **Effort** | 0.5 day |

### GAP-P1-03 — Subscription screen spec copy

| Field | Detail |
| ----- | ------ |
| **Gap ID** | GAP-P1-03 |
| **Requirement** | “Care With Confidence” / “Practice Smarter”, $9.99, trial copy, guarantee (spec lines 427–441) |
| **Current** | Adapty generic onboarding variant |
| **Required change** | Spec headlines and pricing copy in onboarding subscription UI |
| **Files affected** | `app/(onboarding)/subscription.tsx`, `app/settings/subscription.tsx` |
| **Risk** | Low |
| **Effort** | 1 day |

### GAP-P1-04 — Account screen full spec compliance

| Field | Detail |
| ----- | ------ |
| **Gap ID** | GAP-P1-04 |
| **Requirement** | All auth on account screen; sub-copy present (spec line 457) |
| **Current** | Email delegates to register |
| **Required change** | Inline email form or register as modal with return to complete |
| **Files affected** | `app/(onboarding)/account.tsx` |
| **Risk** | Medium |
| **Effort** | 1 day |

### GAP-P1-05 — `ShieldLogo.tsx` with orbit rings

| Field | Detail |
| ----- | ------ |
| **Gap ID** | GAP-P1-05 |
| **Requirement** | Animated shield + orbit rings (spec line 73) |
| **Current** | `TruWellShield` float only |
| **Required change** | Create or extend ShieldLogo per spec |
| **Files affected** | `components/onboarding/ShieldLogo.tsx`, welcome screen |
| **Risk** | Low |
| **Effort** | 0.5 day |

### GAP-P1-06 — Role CTA disabled state

| Field | Detail |
| ----- | ------ |
| **Gap ID** | GAP-P1-06 |
| **Requirement** | opacity 0.4 + pointerEvents none until role selected (spec line 247) |
| **Current** | `disabled` prop only |
| **Required change** | Spec disabled styling on role screen |
| **Files affected** | `app/onboarding/role.tsx`, `OnboardingPrimaryButton` |
| **Risk** | Low |
| **Effort** | 2 hours |

### GAP-P1-07 — Secondary sign-in route

| Field | Detail |
| ----- | ------ |
| **Gap ID** | GAP-P1-07 |
| **Requirement** | Sign in → `/(auth)/sign-in` or `/auth/sign-in` (spec line 229) |
| **Current** | `/login` |
| **Required change** | Align route or alias |
| **Files affected** | `app/(onboarding)/welcome.tsx` |
| **Risk** | Low |
| **Effort** | 1 hour |

---

## P2 — Medium

### GAP-P2-01 — Store interface aliases

| Field | Detail |
| ----- | ------ |
| **Gap ID** | GAP-P2-01 |
| **Requirement** | `role`, `selectedGoals`, `setAnswer` per spec (lines 89–159) |
| **Current** | `selectedRole`, `guardianGoals`, `setAssessmentAnswer` |
| **Required change** | Additive aliases on existing store |
| **Files affected** | `stores/onboardingStore.ts`, onboarding screens |
| **Risk** | Medium |
| **Effort** | 1 day |

### GAP-P2-02 — AI processing pulse rings + checklist spring

| Field | Detail |
| ----- | ------ |
| **Gap ID** | GAP-P2-02 |
| **Requirement** | Pulse rings; Reanimated check per item (spec line 305) |
| **Current** | ◌ character spinner |
| **Required change** | ShieldLogo pulse + animated checklist |
| **Files affected** | `app/onboarding/ai-processing.tsx`, `ShieldLogo.tsx` |
| **Risk** | Low |
| **Effort** | 1 day |

### GAP-P2-03 — Score reveal reward animation + clamp

| Field | Detail |
| ----- | ------ |
| **Gap ID** | GAP-P2-03 |
| **Requirement** | Scale 1.0→1.05→1.0; guardian 45–85 cap (spec lines 349, guardian score rules) |
| **Current** | Interval count-up; no clamp |
| **Required change** | `useDerivedValue` count-up; reward spring; clamp |
| **Files affected** | `ScoreRing.tsx`, `score-reveal.tsx` |
| **Risk** | Low |
| **Effort** | 0.5 day |

### GAP-P2-04 — Guardian adaptive assessment

| Field | Detail |
| ----- | ------ |
| **Gap ID** | GAP-P2-04 |
| **Requirement** | Up to 8 questions adaptive to `selectedGoals` (spec lines 281–282) |
| **Current** | Fixed 4 sections |
| **Required change** | Dynamic question generator |
| **Files affected** | `app/onboarding/guardian/assessment.tsx` |
| **Risk** | Medium |
| **Effort** | 1 day |

### GAP-P2-05 — Blueprint blur overlay

| Field | Detail |
| ----- | ------ |
| **Gap ID** | GAP-P2-05 |
| **Requirement** | MaskedView blur on locked rows (spec line 395) |
| **Current** | Opacity only |
| **Required change** | Blur overlay on locked BlueprintRow |
| **Files affected** | `BlueprintRow.tsx`, `blueprint.tsx` |
| **Risk** | Low |
| **Effort** | 0.5 day |

### GAP-P2-06 — AI demo exact upsell copy

| Field | Detail |
| ----- | ------ |
| **Gap ID** | GAP-P2-06 |
| **Requirement** | Exact upsell strings (spec lines 377–378) |
| **Current** | Paraphrased |
| **Required change** | Match spec copy |
| **Files affected** | `app/onboarding/ai-demo.tsx` |
| **Risk** | Low |
| **Effort** | 1 hour |

### GAP-P2-07 — Role card selection animation

| Field | Detail |
| ----- | ------ |
| **Gap ID** | GAP-P2-07 |
| **Requirement** | Scale 1.02 + check badge (spec line 245) |
| **Current** | Border highlight only |
| **Required change** | Spring scale + badge pattern |
| **Files affected** | `app/onboarding/role.tsx` |
| **Risk** | Low |
| **Effort** | 2 hours |

### GAP-P2-08 — expo-sharing on score reveal

| Field | Detail |
| ----- | ------ |
| **Gap ID** | GAP-P2-08 |
| **Requirement** | Share via expo-sharing (spec share requirement) |
| **Current** | React Native Share API |
| **Required change** | Swap to expo-sharing if literal compliance required |
| **Files affected** | `score-reveal.tsx` |
| **Risk** | Low |
| **Effort** | 1 hour |

---

## P3 — Low

### GAP-P3-01 — NativeWind v4 migration

| Field | Detail |
| ----- | ------ |
| **Gap ID** | GAP-P3-01 |
| **Requirement** | NativeWind for all layout (spec lines 27, 553–567) |
| **Current** | StyleSheet everywhere |
| **Required change** | Full NativeWind migration of onboarding UI |
| **Files affected** | All onboarding screens and components |
| **Risk** | Medium |
| **Effort** | 4–6 days |

### GAP-P3-02 — Circuit texture SVG (7% opacity)

| Field | Detail |
| ----- | ------ |
| **Gap ID** | GAP-P3-02 |
| **Requirement** | Circuit texture on all screens (spec line 565) |
| **Current** | Missing |
| **Required change** | Shared background layer |
| **Files affected** | Onboarding shell / background component |
| **Risk** | Low |
| **Effort** | 1 day |

### GAP-P3-03 — DM Sans font loading

| Field | Detail |
| ----- | ------ |
| **Gap ID** | GAP-P3-03 |
| **Requirement** | Montserrat + DM Sans (spec lines 541–551) |
| **Current** | Montserrat + Clash/Cabinet fallbacks |
| **Required change** | Load DM Sans in root layout |
| **Files affected** | `app/_layout.tsx`, onboarding typography |
| **Risk** | Low |
| **Effort** | 0.5 day |

### GAP-P3-04 — Strict file modification rule

| Field | Detail |
| ----- | ------ |
| **Gap ID** | GAP-P3-04 |
| **Requirement** | Only modify `app/(onboarding)/` and `store/onboardingStore.ts` (spec line 622) |
| **Current** | Modified lib, auth, theme, index, docs, migrations |
| **Required change** | Roll back or amend spec; consolidate helpers into allowed paths |
| **Files affected** | Many outside onboarding |
| **Risk** | High |
| **Effort** | 1–2 days |

### GAP-P3-05 — Remove / isolate out-of-spec artifacts

| Field | Detail |
| ----- | ------ |
| **Gap ID** | GAP-P3-05 |
| **Requirement** | No analytics migrations, saveTruwellOnboarding schema coupling per strict spec |
| **Current** | `lib/onboardingAnalytics.ts`, `saveTruwellOnboarding.ts`, Supabase migrations |
| **Required change** | Product decision: keep for production vs remove for 100% spec |
| **Files affected** | lib/*, supabase/migrations |
| **Risk** | High |
| **Effort** | 1 day |

### GAP-P3-06 — Legacy route surface cleanup

| Field | Detail |
| ----- | ------ |
| **Gap ID** | GAP-P3-06 |
| **Requirement** | Single canonical route tree under `(onboarding)` |
| **Current** | Implementations live in `app/onboarding/` with re-exports |
| **Required change** | Move implementations into `(onboarding)`; legacy stubs redirect only |
| **Files affected** | All `app/onboarding/*` funnel files |
| **Risk** | Medium |
| **Effort** | 1 day |

### GAP-P3-07 — Supabase schema (forbidden by spec)

| Field | Detail |
| ----- | ------ |
| **Gap ID** | GAP-P3-07 |
| **Requirement** | DO NOT modify Supabase schema (spec line 17) |
| **Current** | Onboarding profile migrations exist |
| **Required change** | Revert migrations or amend spec |
| **Files affected** | `supabase/migrations/*` |
| **Risk** | High |
| **Effort** | N/A (blocked by user rules: no migrations in Phase 9) |

---

## Phase 9B Implementation Order (P0)

1. GAP-P0-01 + GAP-P0-02 — Route group and welcome  
2. GAP-P0-05 — Funnel order in service + store v6 migration  
3. GAP-P0-03 + GAP-P0-04 — subscription + account screens  
4. GAP-P0-07 — href migration across funnel screens  
5. GAP-P0-08 + GAP-P0-09 + GAP-P0-10 — guards, resume, skip, register  
6. GAP-P0-06 — Legacy notifications/celebration/paywall redirects  

**Estimated P0 effort:** 5–7 engineering days  
**P1–P3 deferred:** 10–14 additional days for 100% spec compliance
