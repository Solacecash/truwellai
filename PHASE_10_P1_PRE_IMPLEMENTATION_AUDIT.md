# Phase 10 P1 Pre-Implementation Audit

**Date:** 2026-05-30  
**Authority:** `TruWell_AI_Onboarding_Cursor_Prompt.md`  
**Baseline compliance:** 65% (`PHASE_9_COMPLIANCE_RECHECK.md`)

Each gap was re-validated against the current codebase before Phase 10B implementation.

---

## GAP-P1-01 — ProgressBar.tsx

| Field | Detail |
| ----- | ------ |
| **Spec reference** | Lines 505–539 (ProgressBar component); lines 257, 271, 281, 291 (25%/50% milestones); line 612 (screens 3–9) |
| **Current implementation** | `OnboardingShell.tsx` uses `SegmentedIndicator` from `@/components/ui/SegmentedIndicator` with 10 segment math from `lib/onboardingProgress.ts` |
| **Required implementation** | Create `components/onboarding/ProgressBar.tsx` per spec interface `{ percent, variant, eta? }`; show on conversion steps 3–9; 25% step 3, 50% step 4; remove SegmentedIndicator from onboarding shell |
| **Files impacted** | `components/onboarding/ProgressBar.tsx` (new), `OnboardingShell.tsx`, `lib/onboardingProgress.ts` |
| **Gap confirmed?** | **Yes** — SegmentedIndicator still present; no ProgressBar file |
| **Risk** | Low |

---

## GAP-P1-02 — constants/onboardingTheme.ts

| Field | Detail |
| ----- | ------ |
| **Spec reference** | Lines 161–209 (OB tokens + gradients); lines 553–567 (layout spacing) |
| **Current implementation** | `components/onboarding/tokens.ts` aliases `theme/truwellBrand.ts` (navy `#0A1630`, gold `#D4AF37`, teal `#35D6FF`, etc.) |
| **Required implementation** | Create `constants/onboardingTheme.ts` with exact spec hex values, gradients, font token names, spacing constants; re-export through `tokens.ts` for onboarding consumers |
| **Files impacted** | `constants/onboardingTheme.ts` (new), `components/onboarding/tokens.ts`, onboarding components using OB |
| **Gap confirmed?** | **Yes** — no `constants/onboardingTheme.ts`; hex values differ from spec |
| **Risk** | Medium — visual shift across all onboarding screens |

---

## GAP-P1-03 — Subscription screen spec copy

| Field | Detail |
| ----- | ------ |
| **Spec reference** | Lines 423–441 (headlines, pricing, trial, guarantee, CTAs) |
| **Current implementation** | `(onboarding)/subscription.tsx` wraps `SubscriptionScreenContent variant="onboarding"` with generic copy: "Choose how fast you get your results" |
| **Required implementation** | Role-specific headlines ("Care With Confidence" / "Practice Smarter"); $9.99/month; green "7-day free trial · No charge now"; "Continue Free — Limited access only"; primary CTA "Start My Free 7-Day Trial"; guarantee row with shield-check |
| **Files impacted** | `app/(onboarding)/subscription.tsx` (dedicated spec UI) |
| **Gap confirmed?** | **Yes** — no spec strings in onboarding subscription path |
| **Risk** | Low |

---

## GAP-P1-04 — Inline account screen

| Field | Detail |
| ----- | ------ |
| **Spec reference** | Lines 449–459 (3 auth methods on account.tsx; sub-copy; complete → main app) |
| **Current implementation** | `(onboarding)/account.tsx` has Apple/Google; email calls `router.push('/(auth)/register', …)` |
| **Required implementation** | Self-contained email signup form on account screen using existing Supabase `signUp` / auth helpers; no register delegation |
| **Files impacted** | `app/(onboarding)/account.tsx` |
| **Gap confirmed?** | **Yes** — `handleEmail` still navigates to register |
| **Risk** | Medium |

---

## GAP-P1-05 — ShieldLogo.tsx with orbit rings

| Field | Detail |
| ----- | ------ |
| **Spec reference** | Lines 73, 219 (ShieldLogo with orbit rings); line 219 AnimatedShieldLogo + withRepeat |
| **Current implementation** | `TruWellShield.tsx` — float animation only, no orbit rings |
| **Required implementation** | Create `components/onboarding/ShieldLogo.tsx` with Reanimated orbit rings; use on welcome screen |
| **Files impacted** | `components/onboarding/ShieldLogo.tsx` (new), `app/(onboarding)/welcome.tsx` |
| **Gap confirmed?** | **Yes** — no ShieldLogo file; welcome uses TruWellShield |
| **Risk** | Low |

---

## GAP-P1-06 — Role CTA disabled state

| Field | Detail |
| ----- | ------ |
| **Spec reference** | Line 247 (opacity 0.4, pointerEvents none until role selected) |
| **Current implementation** | `OnboardingPrimaryButton` uses `disabled` prop with `opacity: 0.45` (`ctaDim`); no pointerEvents none on wrapper |
| **Required implementation** | Footer wrapper opacity 0.4 + pointerEvents none when unselected; card scale 1.02 + check badge per line 245 |
| **Files impacted** | `app/onboarding/role.tsx`, `OnboardingShell.tsx` (`OnboardingPrimaryButton`) |
| **Gap confirmed?** | **Yes** |
| **Risk** | Low |

---

## GAP-P1-07 — Sign-in route alignment

| Field | Detail |
| ----- | ------ |
| **Spec reference** | Line 229 — Secondary: "Already a member? Sign in" → `router.push("/auth/sign-in")` |
| **Current implementation** | Welcome uses `router.replace('/login')`; no `sign-in` route file |
| **Required implementation** | Add `(auth)/sign-in.tsx` alias preserving login functionality; update welcome to `/sign-in` |
| **Files impacted** | `app/(auth)/sign-in.tsx` (new), `app/(auth)/_layout.tsx`, `app/(onboarding)/welcome.tsx` |
| **Gap confirmed?** | **Yes** |
| **Risk** | Low |

---

## Validation Summary

| Gap ID | Still open before Phase 10B |
| ------ | --------------------------- |
| GAP-P1-01 | Yes |
| GAP-P1-02 | Yes |
| GAP-P1-03 | Yes |
| GAP-P1-04 | Yes |
| GAP-P1-05 | Yes |
| GAP-P1-06 | Yes |
| GAP-P1-07 | Yes |

All seven P1 gaps confirmed. Proceeding to Phase 10B implementation.
