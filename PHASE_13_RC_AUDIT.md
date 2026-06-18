# Phase 13 Release Candidate Audit (RC1)

**Date:** 2026-05-30  
**Release candidate:** RC1 (documentation + validation package; no code changes)  
**Authority:** `TruWell_AI_Onboarding_Cursor_Prompt.md`  
**Baseline:** 94% compliance, 89/100 production readiness (`PHASE_12_COMPLIANCE_RECHECK.md`)

---

## Executive Summary

The spec conversion funnel (11 screens under `app/(onboarding)/`) is **functionally complete**, typed, and compile-clean. RC1 is blocked from a **GO** by: (1) cold-start entry routing to legacy `(auth)/welcome` instead of spec welcome, (2) unexecuted device QA, (3) parallel legacy funnels (auth slides, psych, register health-profile). NativeWind remains a spec gap but is not a runtime blocker.

**RC1 recommendation:** See `PHASE_13_RELEASE_READINESS_REPORT.md` — **GO WITH CONDITIONS**.

---

## Architecture Audit

### Onboarding route structure

| Layer | Path | Role |
| ----- | ---- | ---- |
| **Canonical spec stack** | `app/(onboarding)/_layout.tsx` + 11 screens | Primary spec funnel |
| **Implementation tree** | `app/onboarding/*` | Screen implementations; re-exported by `(onboarding)/` stubs |
| **Legacy entry** | `app/onboarding/index.tsx` | Redirect → `/(onboarding)/welcome` |
| **Legacy stack** | `app/onboarding/_layout.tsx` | Registers paywall-onboarding, notifications, celebration |
| **Auth-era welcome** | `app/(auth)/welcome.tsx` | Slide deck + RegistrationWizard (pre-spec) |
| **Psych funnel** | `app/(auth)/psych/*` (13 screens) | Parallel onboarding |
| **Auth onboarding** | `app/(auth)/onboarding/*` | Post-register health profile path |

**Route map:** `lib/onboardingRoutePaths.ts` → `ONBOARDING_ROUTES` + `LEGACY_ONBOARDING_REDIRECTS`.

**Risk:** Dual implementation paths (`/(onboarding)/role` vs `/onboarding/role`) can diverge if only one tree is edited.

---

### Resume flow

| Step | Mechanism |
| ---- | --------- |
| Persistence | `useOnboardingStore` + AsyncStorage via `hydrateConversionFromStorage()` |
| Step mapping | `lib/onboardingService.ts` — `migrateConversionFlowStep`, `routeForOnboardingStep` |
| Guest resume | `guestConversionResumeHref()` — returns canonical `(onboarding)` href if step 2–11 and incomplete |
| Signed-in resume | `app/index.tsx` — if session + step 2–11 incomplete → `routeForOnboardingStep` |
| Guard | `app/_layout.tsx` — `isConversionOnboardingPath()` allows signed-in users on funnel paths |

**Strengths:** v5→v6 step migration; blueprint gate before subscription (step 10).

**Risks:**

| Issue | Severity |
| ----- | -------- |
| Cold start without resume sends users to `(auth)/welcome`, not spec welcome | **HIGH** |
| Legacy `/onboarding/*` serves same impl without redirect-only stubs | **MEDIUM** |
| Psych hydration (`hydratePsychFromStorage`) runs alongside conversion on index | **LOW** |

---

### Auth flow

| Surface | Behavior |
| ------- | -------- |
| Spec welcome secondary CTA | `/(onboarding)/welcome` → `/sign-in` → `/login` |
| Spec account (screen 11) | Apple / Google / inline email → `saveTruwellOnboarding` → `completeConversionOnboarding` |
| Existing login | `app/(auth)/login.tsx` — full auth (email, phone, social); **unchanged** |
| Register | `app/(auth)/register.tsx` → psych or `/(auth)/onboarding/health-profile` — **parallel to spec funnel** |
| Root guard | Logged-out on non-auth paths → `/(auth)/welcome` |

**Circular navigation:** No loop detected between `/login`, `/sign-in`, and spec funnel. Logged-in users on `(auth)/welcome` are redirected to dashboard by guard.

---

### Paywall flow (Screen 10)

| Item | Implementation |
| ---- | -------------- |
| File | `app/(onboarding)/subscription.tsx` |
| Primary CTA | "Start My Free 7-Day Trial" → `/(onboarding)/account` |
| Continue free | `completeConversionOnboarding()` → `/enter` or `/(expert)` |
| Skip | Disabled (`showSkip={false}`) |
| Analytics | `paywall_viewed` via `trackOnboardingEvent` |
| Adapty | Not wired on this screen — trial CTA advances to account without native IAP sheet on screen 10 |

**Risk:** Spec implies subscription conversion; actual store purchase may occur elsewhere (settings/subscription). Device QA must confirm trial/IAP expectations.

---

### Account flow (Screen 11)

| Item | Implementation |
| ---- | -------------- |
| File | `app/(onboarding)/account.tsx` |
| Providers | Apple (`expo-apple-authentication`), Google (`lib/googleAuth.ts`), email (`supabase.auth.signUp`) |
| Post-signup | `saveTruwellOnboarding(uid)` → `completeConversionOnboarding` |
| Professional role | Email signup sets `user_type: expert`; Google/Apple set `role: user` only on updateUser — **potential inconsistency** |
| Exit | `/enter` (guardian/user) or `/(expert)` (expert metadata) |

---

## Compliance Audit

### Spec alignment (94%)

| Category | Score | Notes |
| -------- | ----- | ----- |
| Funnel order | 95% | 11-screen sequence correct |
| Screen behavior | 96% | P2 animations, adaptive assessment, sharing |
| Visual system | 90% | Circuit texture + fonts; no NativeWind |
| File structure | 65% | Re-exports, extra lib files, out-of-onboarding edits |
| Store | 93% | Extended store with spec aliases |

### Remaining deviations

- StyleSheet vs NativeWind v4 (spec line 27)
- Cold-start entry not spec welcome
- Fonts in `(onboarding)/_layout` not root `_layout`
- Analytics table + extended profile save not in spec FILE STRUCTURE
- Legacy `/onboarding/*` duplicate routes

### Accepted deviations (production-safe)

| Deviation | Rationale |
| --------- | --------- |
| `saveTruwellOnboarding` + extended `profiles` columns | Required for app personalization post-signup |
| `onboardingAnalytics.ts` | Conversion telemetry; fails soft if table missing |
| Navigation guard edits in `app/_layout.tsx` | Required for signed-in funnel resume |
| Extended `onboardingStore` fields | Spec says preserve/add, never replace |
| Re-export pattern | Pragmatic colocation without mass file moves |

### Production-safe vs spec-pure

| Item | Production-safe | Spec-pure |
| ---- | --------------- | --------- |
| Extended store/schema | Yes | No |
| Analytics | Yes | No |
| NativeWind absence | Yes (visual only) | No |
| Legacy auth welcome as cold start | **No** — wrong funnel for new users | No |

---

## Release Risk Register

| ID | Issue | Severity | RC1 impact |
| -- | ----- | -------- | ---------- |
| R1 | Cold start → `(auth)/welcome` not spec conversion welcome | **CRITICAL** | New installs may never see 11-screen funnel |
| R2 | Device QA not executed | **HIGH** | Unknown device/regression issues |
| R3 | Google/Apple OAuth env not verified on device | **HIGH** | Account screen failures in production |
| R4 | Professional Google/Apple signup may not set `user_type: expert` | **HIGH** | Wrong dashboard routing |
| R5 | Legacy `/onboarding/*` duplicate paths | **MEDIUM** | Deep link / resume inconsistency |
| R6 | Parallel psych + register health-profile funnels | **MEDIUM** | User confusion, split analytics |
| R7 | Subscription screen does not invoke Adapty paywall | **MEDIUM** | Trial/IAP flow mismatch vs product expectation |
| R8 | NativeWind not implemented | **LOW** (launch) / **MEDIUM** (strict spec) | Visual spec gap only |
| R9 | `onboarding_analytics_events` table may not exist | **LOW** | Silent fail; dev logging only |
| R10 | Path `/welcome` in guard is auth-scoped | **LOW** | No runtime collision if fully qualified hrefs used |

---

## RC1 Readiness Matrix

| Gate | Status |
| ---- | ------ |
| TypeScript compile | **PASS** |
| 11-screen funnel implemented | **PASS** |
| P2 behavior compliance | **PASS** |
| P3 circuit + fonts | **PASS** |
| Device QA | **PENDING** |
| Cold-start spec entry | **FAIL** |
| Auth OAuth production config | **UNVERIFIED** |
| Legacy cleanup | **PLANNED** (Phase 13 cleanup plan) |
| NativeWind | **DEFERRED** (feasibility analysis) |

---

## RC1 Artifact Index

| Document | Purpose |
| -------- | ------- |
| `PHASE_13_NATIVEWIND_FEASIBILITY.md` | Migrate or defer decision |
| `PHASE_13_DEVICE_QA_EXECUTION_GUIDE.md` | QA execution |
| `PHASE_13_ROUTE_COLLISION_REPORT.md` | Welcome path analysis |
| `PHASE_13_AUTH_PRODUCTION_REVIEW.md` | Auth risks |
| `PHASE_13_CLEANUP_EXECUTION_PLAN.md` | Post-QA cleanup |
| `PHASE_13_RELEASE_READINESS_REPORT.md` | Go/No-Go |
