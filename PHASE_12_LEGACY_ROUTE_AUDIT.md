# Phase 12 Legacy Route Audit (P3-06)

**Date:** 2026-05-30  
**Action:** Classification only — **no route removal in Phase 12**

Legend: **KEEP** | **REDIRECT** | **DELETE** (future candidate)

---

## Active routes — Spec funnel (`app/(onboarding)/`)

| Route | File | Role | Classification |
| ----- | ---- | ---- | -------------- |
| `/(onboarding)/welcome` | `(onboarding)/welcome.tsx` | Screen 1 | **KEEP** |
| `/(onboarding)/role` | re-export → `app/onboarding/role.tsx` | Screen 2 | **KEEP** |
| `/(onboarding)/guardian/care-discovery` | re-export | Screen 3G | **KEEP** |
| `/(onboarding)/guardian/assessment` | re-export | Screen 4G | **KEEP** |
| `/(onboarding)/professional/practice-profile` | re-export | Screen 3P | **KEEP** |
| `/(onboarding)/professional/workflow` | re-export | Screen 4P | **KEEP** |
| `/(onboarding)/ai-processing` | re-export | Screen 5 | **KEEP** |
| `/(onboarding)/score-reveal` | re-export | Screen 6 | **KEEP** |
| `/(onboarding)/future-vision` | re-export | Screen 7 | **KEEP** |
| `/(onboarding)/ai-demo` | re-export | Screen 8 | **KEEP** |
| `/(onboarding)/blueprint` | re-export | Screen 9 | **KEEP** |
| `/(onboarding)/subscription` | `(onboarding)/subscription.tsx` | Screen 10 | **KEEP** |
| `/(onboarding)/account` | `(onboarding)/account.tsx` | Screen 11 | **KEEP** |

---

## Redirect routes — Legacy `/onboarding/*`

| Route | File | Target | Classification |
| ----- | ---- | ------ | -------------- |
| `/onboarding` | `app/onboarding/index.tsx` | `/(onboarding)/welcome` | **REDIRECT** (keep stub) |
| `/onboarding/role` | `app/onboarding/role.tsx` | Serves impl + reachable via legacy path | **REDIRECT** → canonical only (Phase 13) |
| `/onboarding/guardian/care-discovery` | impl file | Legacy path | **REDIRECT** |
| `/onboarding/guardian/assessment` | impl file | Legacy path | **REDIRECT** |
| `/onboarding/professional/practice-profile` | impl file | Legacy path | **REDIRECT** |
| `/onboarding/professional/workflow` | impl file | Legacy path | **REDIRECT** |
| `/onboarding/ai-processing` | impl file | Legacy path | **REDIRECT** |
| `/onboarding/score-reveal` | impl file | Legacy path | **REDIRECT** |
| `/onboarding/future-vision` | impl file | Legacy path | **REDIRECT** |
| `/onboarding/ai-demo` | impl file | Legacy path | **REDIRECT** |
| `/onboarding/blueprint` | impl file | Legacy path | **REDIRECT** |
| `/onboarding/paywall-onboarding` | `paywall-onboarding.tsx` | Should → subscription | **REDIRECT** |

Mapped in `lib/onboardingRoutePaths.ts` → `LEGACY_ONBOARDING_REDIRECTS`.

---

## Dead routes — Not in spec 11-screen funnel

| Route | File | Notes | Classification |
| ----- | ---- | ----- | -------------- |
| `/onboarding/notifications` | `app/onboarding/notifications.tsx` | Pre-spec step | **REVIEW** → **REDIRECT** to account or remove |
| `/onboarding/celebration` | `app/onboarding/celebration.tsx` | Pre-spec completion | **REVIEW** → **REDIRECT** to `/enter` |
| `/onboarding/index` | redirect only | Active redirect | **KEEP** stub |

---

## Legacy auth onboarding routes (`app/(auth)/onboarding/`)

| Route | File | Classification |
| ----- | ---- | -------------- |
| `/(auth)/onboarding/health-profile` | `health-profile.tsx` | **REVIEW** — may link from register |
| `/(auth)/onboarding/preferences` | `preferences.tsx` | **REVIEW** |
| `/(auth)/onboarding/notifications` | `notifications.tsx` | **REVIEW** |

Registered in `app/(auth)/_layout.tsx`. Parallel to conversion funnel — not spec 11-screen path.

---

## Psych routes (`app/(auth)/psych/`)

| Route | Screen | Classification |
| ----- | ------ | -------------- |
| `/(auth)/psych/s1-intro` | Intro | **REVIEW** |
| `/(auth)/psych/s2-platform` | Platform | **REVIEW** |
| `/(auth)/psych/s3-goal` | Goal | **REVIEW** |
| `/(auth)/psych/s4-weight` | Weight | **REVIEW** |
| `/(auth)/psych/s5-pain` | Pain | **REVIEW** |
| `/(auth)/psych/s6-lifestyle` | Lifestyle | **REVIEW** |
| `/(auth)/psych/s7-commitment` | Commitment | **REVIEW** |
| `/(auth)/psych/s8-plan` | Plan | **REVIEW** |
| `/(auth)/psych/s9-account` | Account | **REVIEW** |
| `/(auth)/psych/s11-scan` | Scan | **REVIEW** |
| `/(auth)/psych/s12-notifications` | Notifications | **REVIEW** |
| `/(auth)/psych/s13-celebration` | Celebration | **REVIEW** |

**13 screens** — full parallel onboarding. `app/_layout.tsx` exempts `/psych/` from auth guards.  
**Recommendation:** **KEEP** until register flow audited; then **REDIRECT** psych entry to `/(onboarding)/welcome` or **DELETE** stack if deprecated.

---

## Legacy auth onboarding routes (sign-in collision)

| Route | File | Classification |
| ----- | ---- | -------------- |
| `/(auth)/welcome` | `(auth)/welcome.tsx` | **REVIEW** — path collision risk with onboarding welcome |
| `/(auth)/sign-in` | `sign-in.tsx` | **KEEP** — redirects to `/login` |
| `/login` | `(auth)/login.tsx` | **KEEP** |
| `/register` | `(auth)/register.tsx` | **KEEP** — may branch to psych or conversion |

---

## Root navigation registration

| Stack screen | Classification |
| ------------ | -------------- |
| `(onboarding)` | **KEEP** |
| `onboarding` (legacy group) | **KEEP** until all legacy paths redirect-only |
| `(auth)/psych/*` | **REVIEW** |

---

## Phase 13 cleanup sequence (recommended)

1. Replace each `app/onboarding/*.tsx` implementation file with thin `<Redirect href={ONBOARDING_ROUTES.*} />` except shared impl move to `(onboarding)/`  
2. Convert `paywall-onboarding`, `notifications`, `celebration` to redirects  
3. Audit register → psych vs conversion branch  
4. Device-test deep links and AsyncStorage resume for both path prefixes  
5. Only **DELETE** psych stack if product confirms deprecation  

---

## Summary

| Category | KEEP | REDIRECT | DELETE | REVIEW |
| -------- | ---- | -------- | ------ | ------ |
| Spec funnel | 13 | 0 | 0 | 0 |
| Legacy `/onboarding/*` | 1 (index stub) | 11+ | 0 | 2 |
| Auth onboarding | 0 | 0 | 0 | 3 |
| Psych | 0 | 0 | 0 | 13 |

**No routes removed in Phase 12.**
