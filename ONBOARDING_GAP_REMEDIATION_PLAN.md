# Onboarding Gap Remediation Plan

**Derived from:** `ONBOARDING_SPEC_COMPLIANCE_REPORT.md`  
**Authority:** `TruWell_AI_Onboarding_Cursor_Prompt.md` only  
**Status:** Planning document — **no code changes in Phase 8**

---

## Remediation Strategy Overview

The current implementation is a **parallel architecture** (13-step conversion funnel, `app/onboarding/`, extended store, Adapty wrapper, extra post-paywall screens). The specification requires an **11-screen funnel** under `app/(onboarding)/` with subscription before account, NativeWind, and a minimal new store interface.

Two remediation paths exist:

| Path | Description | Spec compliance outcome |
| ---- | ----------- | ----------------------- |
| **A — Strict realignment** | Refactor to match spec file literally | 100% possible |
| **B — Spec amendment** | Formalize current funnel as approved deviation | Requires product owner to update spec file |

This plan assumes **Path A** unless the spec file is officially revised.

---

## Gap 1 — Route structure and file naming

**Missing / wrong:** `app/(onboarding)/` group; `welcome.tsx`, `subscription.tsx`, `account.tsx` naming; remove or relocate extra screens.

| Files to modify / create | Action |
| ------------------------ | ------ |
| `app/(onboarding)/_layout.tsx` | Create stack per spec |
| `app/(onboarding)/welcome.tsx` | Move/rename from `app/onboarding/index.tsx` |
| `app/(onboarding)/role.tsx` | Move from `app/onboarding/role.tsx` |
| `app/onboarding/guardian/*`, `professional/*` | Move under `(onboarding)` group |
| `app/(onboarding)/subscription.tsx` | Extract onboarding variant from paywall wrapper |
| `app/(onboarding)/account.tsx` | New screen or thin wrapper over register auth UI |
| `app/onboarding/notifications.tsx`, `celebration.tsx` | Remove from spec funnel OR document as out-of-spec |
| `app/onboarding/paywall-onboarding.tsx` | Replace with `subscription.tsx` |
| `app/index.tsx`, `lib/onboardingService.ts` | Update all route strings to `/(onboarding)/...` |
| `lib/useOnboardingNavigation.ts` | Update href map |

**Effort:** Large (2–3 days)  
**Risk:** High — breaks deep links, resume keys, and any hardcoded `/onboarding` paths  
**Dependencies:** Expo Router route group testing; cold-start resume migration

---

## Gap 2 — Funnel order (subscription before account)

**Missing:** Spec order steps 9 → 10 subscription → 11 account.

| Files to modify | Action |
| --------------- | ------ |
| `lib/onboardingService.ts` | Reorder steps 10/11: paywall then account |
| `app/onboarding/blueprint.tsx` | CTA → `/(onboarding)/subscription` |
| `app/(onboarding)/subscription.tsx` | Trial/free CTAs → `/(onboarding)/account` |
| `app/(auth)/register.tsx` | Remove conversion paywall redirect; account completes → main app |
| `app/onboarding/paywall-onboarding.tsx` | Delete after migration |

**Effort:** Medium (1 day)  
**Risk:** High — contradicts prior approved funnel; Adapty requires auth for purchase in current wrapper  
**Dependencies:** Product decision on guest checkout vs account-first; Adapty user ID timing

---

## Gap 3 — NativeWind v4 migration

**Missing:** All onboarding layout via NativeWind; StyleSheet only where Reanimated requires.

| Files to modify | Action |
| --------------- | ------ |
| All `app/onboarding/**/*.tsx` | Replace StyleSheet with className |
| All `components/onboarding/*.tsx` used by funnel | Same |
| `tailwind.config.js`, `global.css` | Confirm NativeWind v4 setup |

**Effort:** Very large (4–6 days)  
**Risk:** Medium — visual regressions across devices  
**Dependencies:** NativeWind configured in project (verify installed)

---

## Gap 4 — ProgressBar component

**Missing:** `components/onboarding/ProgressBar.tsx`; 25%/50% progress on screens 3–4; bar on screens 3–9.

| Files to modify | Action |
| --------------- | ------ |
| `components/onboarding/ProgressBar.tsx` | Create per spec |
| `components/onboarding/OnboardingShell.tsx` | Replace SegmentedIndicator with ProgressBar + percent props |
| Screen 3–9 route files | Pass `percent` and `variant` |

**Effort:** Small (0.5 day)  
**Risk:** Low  
**Dependencies:** Gap 3 if NativeWind required for ProgressBar container

---

## Gap 5 — Theme constants

**Missing:** `constants/onboardingTheme.ts` with exact spec hex values and gradients.

| Files to modify | Action |
| --------------- | ------ |
| `constants/onboardingTheme.ts` | Create with spec OB + gradients |
| `components/onboarding/tokens.ts` | Re-export from spec file OR delete and migrate imports |
| `theme/truwellBrand.ts` | Decouple onboarding from app-wide brand OR reconcile with product |

**Effort:** Small (0.5 day)  
**Risk:** Medium — conflicts with workspace rule “colors from theme” vs spec override statement  
**Dependencies:** Product call: spec theme overrides `truwellBrand` for onboarding only

---

## Gap 6 — Store interface alignment

**Missing:** Spec store shape; forbidden extra fields unless preserved additively.

| Files to modify | Action |
| --------------- | ------ |
| `stores/onboardingStore.ts` | Add aliases: `role` ↔ `selectedRole`, `selectedGoals` ↔ `guardianGoals`, `setAnswer` ↔ `setAssessmentAnswer` |
| All onboarding screens | Use spec names OR document mapping layer |

**Effort:** Medium (1 day)  
**Risk:** Medium — conversion persist migration  
**Dependencies:** Preserve spec rule “add to state, never replace”

---

## Gap 7 — ShieldLogo and AI processing polish

**Missing:** Orbit rings; pulse rings; checklist Reanimated spring per item.

| Files to modify | Action |
| --------------- | ------ |
| `components/onboarding/ShieldLogo.tsx` | Create per spec (or extend TruWellShield) |
| `app/onboarding/index.tsx`, `ai-processing.tsx` | Use ShieldLogo + pulse rings |
| `app/onboarding/ai-processing.tsx` | Replace ◌ with animated check sequence |

**Effort:** Small (1 day)  
**Risk:** Low  

---

## Gap 8 — Score reveal animations

**Missing:** `useDerivedValue` count-up; reward scale spring; guardian score cap 85.

| Files to modify | Action |
| --------------- | ------ |
| `components/onboarding/ScoreRing.tsx` | Add derived score text + completion spring |
| `app/onboarding/score-reveal.tsx` | Clamp guardian score; expo-sharing if literal |

**Effort:** Small (0.5 day)  
**Risk:** Low  

---

## Gap 9 — Role screen interaction spec

**Missing:** Disabled CTA styling; card selection badge pattern.

| Files to modify | Action |
| --------------- | ------ |
| `app/onboarding/role.tsx` | pointerEvents + opacity 0.4; scale 1.02 spring |

**Effort:** Small (2 hours)  
**Risk:** Low  

---

## Gap 10 — Guardian adaptive assessment

**Missing:** Questions adapt to `selectedGoals`; up to 8 questions.

| Files to modify | Action |
| --------------- | ------ |
| `app/onboarding/guardian/assessment.tsx` | Dynamic section generator from goals |
| `stores/onboardingStore.ts` | Ensure goals readable for adaptation |

**Effort:** Medium (1 day)  
**Risk:** Medium — content design for goal→question mapping  

---

## Gap 11 — Subscription screen copy and UX

**Missing:** Spec headlines, pricing copy, guarantee row, role-themed plan cards.

| Files to modify | Action |
| --------------- | ------ |
| `app/settings/subscription.tsx` | Add onboarding variant copy blocks OR |
| `app/(onboarding)/subscription.tsx` | Dedicated spec layout calling Adapty handlers only |

**Effort:** Medium (1 day)  
**Risk:** Low — UI only if Adapty logic reused  

---

## Gap 12 — Account screen

**Missing:** Dedicated `account.tsx`; spec sub-copy; placement after subscription.

| Files to modify | Action |
| --------------- | ------ |
| `app/(onboarding)/account.tsx` | New screen: auth buttons + copy |
| `app/(auth)/register.tsx` | Extract shared auth handlers; no funnel routing in register |

**Effort:** Medium (1 day)  
**Risk:** Medium  

---

## Gap 13 — Layout rules (circuit texture, fonts)

**Missing:** Circuit SVG 7%; DM Sans; strict padding/footer geometry.

| Files to modify | Action |
| --------------- | ------ |
| `app/_layout.tsx` | Load DM Sans weights |
| Shared onboarding background component | Circuit texture layer |
| `OnboardingShell` or per-screen layout | 22px / 28px / 110px bottom padding |

**Effort:** Medium (1 day)  
**Risk:** Low  

---

## Gap 14 — Critical rules rollback (out-of-spec additions)

**Not in spec — decide keep or remove:**

| Item | Recommendation if strict spec |
| ---- | ------------------------------ |
| `lib/onboardingAnalytics.ts` + migration | Remove OR amend spec |
| `lib/saveTruwellOnboarding.ts` + profile migration | Remove (spec forbids schema change) |
| `notifications.tsx`, `celebration.tsx` | Remove from funnel |
| `lib/professionalOnboardingGoals.ts` | Fold into store or remove |
| Docs/scripts for pre-launch QA | Keep as engineering docs (not product spec) |

**Effort:** Medium (1 day) to remove; **Risk:** High if production depends on profile persistence  

---

## Prioritized remediation sequence

| Priority | Gap | Effort | Risk |
| -------- | --- | ------ | ---- |
| P0 | Gap 2 — Funnel order | M | High |
| P0 | Gap 1 — Route structure | L | High |
| P1 | Gap 4 — ProgressBar | S | Low |
| P1 | Gap 5 — Theme tokens | S | Med |
| P1 | Gap 11 — Subscription copy | M | Low |
| P1 | Gap 12 — Account screen | M | Med |
| P2 | Gap 6 — Store aliases | M | Med |
| P2 | Gap 7–9 — Animation polish | S | Low |
| P2 | Gap 10 — Adaptive assessment | M | Med |
| P3 | Gap 3 — NativeWind full migration | XL | Med |
| P3 | Gap 13 — Circuit texture + DM Sans | M | Low |
| P3 | Gap 14 — Remove out-of-spec additions | M | High |

**Estimated total (Path A strict):** 12–18 engineering days  
**Estimated to 100% compliance:** All P0–P3 complete + device QA per spec deliverable checklist

---

## Phase 8C — Blocker verification (spec authority)

| Blocker | Required by spec? | Required for production? | Can release proceed without it? |
| ------- | ------------------- | ------------------------ | ------------------------------- |
| **1. Supabase onboarding profile migrations** | **No** — spec line 17: “DO NOT modify Supabase schema” | Yes for persisting onboarding answers to profiles | **Yes** for spec-compliant release; **No** if product needs server-side profile fields |
| **2. Analytics events (`onboarding_started`, etc.)** | **No** | Optional for funnel metrics | **Yes** |
| **3. Analytics table migration** | **No** | Only if analytics required | **Yes** |
| **4. Professional goals persistence** | **No** — spec store uses `selectedGoals` only | Optional for expert profiles | **Yes** |
| **5. Legacy onboarding cleanup** | **No** — spec says do not delete files outside onboarding dir; legacy already partially removed | Hygiene only | **Yes** |
| **6. Device screenshots** | **No** | Recommended for QA sign-off | **Yes** |
| **7. Additional onboarding profile fields** | **No** — explicitly forbidden in spec | Depends on backend product needs | **Yes** for strict spec compliance |

**Conclusion:** Items 1–7 from pre-launch validation are **engineering/production blockers**, not **spec blockers**. The spec actually prohibits several of them (schema changes, broad file modifications).

---

## Approval required before implementation

Before any remediation code:

1. Confirm **Path A (strict spec)** vs **Path B (amend spec to match shipped funnel)**  
2. Resolve conflict: workspace CLAUDE.md theme rules vs spec “override brand guide”  
3. Resolve conflict: prior funnel order approval vs spec subscription→account order  
4. Sign off on removal of notifications/celebration/analytics if pursuing 100% spec match  

**Commit gate remains closed until specification compliance = 100% and deviations documented + approved.**
