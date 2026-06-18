# Phase 13 Route Collision Report

**Date:** 2026-05-30  
**Routes audited:** `/(auth)/welcome`, `/(onboarding)/welcome`, `/onboarding`  
**Action:** Investigation only — **no fix implemented**

---

## Route Definitions

| Route | File | UI content |
| ----- | ---- | ---------- |
| `/(auth)/welcome` | `app/(auth)/welcome.tsx` | Legacy: SplashScreen → OnboardingSlides → RegistrationWizard → optional AhaScreen |
| `/(onboarding)/welcome` | `app/(onboarding)/welcome.tsx` | Spec Screen 1: ShieldLogo, stat pills, FOMO badge, conversion CTA |
| `/onboarding` | `app/onboarding/index.tsx` | `<Redirect href={ONBOARDING_ROUTES.welcome} />` → `/(onboarding)/welcome` |

Expo Router resolves these as **distinct routes** in different groups. They do **not** share the same file.

---

## Normalized Path Handling (`app/_layout.tsx`)

```typescript
// isAuthPath includes:
p === '/welcome'  // → treats bare /welcome as auth

// isConversionOnboardingPath includes:
p.includes('(onboarding)')
p === '/onboarding' || p.startsWith('/onboarding/')
```

**Finding:** Bare `/welcome` is classified as **auth**, not conversion onboarding. Fully qualified `/(onboarding)/welcome` is classified as **conversion onboarding**.

---

## Actual Collision Risk

| Scenario | Collision? | Explanation |
| -------- | ---------- | ----------- |
| Same URL resolves to two screens simultaneously | **No** | Different route groups; Expo Router matches explicit href |
| Developer confusion (two "welcome" screens) | **Yes** | **MEDIUM** documentation/maintainability risk |
| Runtime wrong-screen flash | **Low** | Only if href uses ambiguous path |
| Guard misroutes logged-in user | **Low** | `(onboarding)/*` exempt from auth→dashboard redirect |

**Overall collision risk:** **MEDIUM (product entry)** / **LOW (URL parser)**

The real issue is **not** a router filename collision — it is **competing entry funnels**.

---

## Cold Start Behavior

**Source:** `app/index.tsx`

| Condition | Destination |
| --------- | ----------- |
| Session exists + conversion step 2–11 incomplete | `routeForOnboardingStep()` → `/(onboarding)/…` |
| Guest + `guestConversionResumeHref()` non-null | `/(onboarding)/…` |
| Guest + no resume | **`/(auth)/welcome`** ← legacy slides |
| Session exists + conversion complete | `/enter` or `/(expert)` |
| Error fallback | `/(auth)/welcome` |

**Critical finding:** Fresh install / cleared data **does not** land on spec `/(onboarding)/welcome`. Users see legacy `(auth)/welcome` unless they deep-link into conversion funnel.

`(auth)/welcome` itself checks `guestConversionResumeHref()` and may redirect to `/(onboarding)/…` if partial progress exists — but **new users with no progress stay on legacy slides**.

---

## Deep-Link Behavior

| Link | Expected resolution |
| ---- | ------------------- |
| `…/onboarding` | Redirect → `/(onboarding)/welcome` ✓ |
| `…/(onboarding)/welcome` | Spec welcome ✓ |
| `…/(auth)/welcome` | Legacy welcome |
| Bare `…/welcome` | Likely `(auth)/welcome` per guard `isAuthPath` |

**Psych entry:** `app/(auth)/psych/s1-intro.tsx` calls `router.replace('/(onboarding)/welcome')` — correctly targets spec funnel.

---

## Runtime Behavior Summary

```
Cold start (new user)
  app/index.tsx
    └─► /(auth)/welcome  [LEGACY — NOT SPEC]

Cold start (resume step ≥2)
  app/index.tsx
    └─► /(onboarding)/{step}  [SPEC]

Deep link /onboarding
  app/onboarding/index.tsx
    └─► /(onboarding)/welcome  [SPEC]

Spec welcome "Sign in"
  └─► /sign-in → /login  [OK]

Guard: logged-out on /scan
  └─► /(auth)/welcome  [LEGACY]
```

---

## Recommended Fix (not implemented)

### Primary fix — **HIGH priority before launch**

**Change `app/index.tsx`** default guest route from:

```typescript
router.replace('/(auth)/welcome' as never);
```

to:

```typescript
router.replace(ONBOARDING_ROUTES.welcome as never);
```

Apply same change to error fallback paths (lines 92, 171).

### Secondary fix — **MEDIUM priority**

**Redirect `(auth)/welcome` → `/(onboarding)/welcome`** for logged-out users with no legacy onboarding completion flag, OR deprecate auth welcome entirely after verifying register/login flows.

### Tertiary fix — **LOW priority**

Rename or remove `(auth)/welcome` file to eliminate developer confusion (e.g. `(auth)/legacy-welcome` with redirect).

### Guard alignment

Update `isAuthPath` comment/docs to clarify `/welcome` vs `/(onboarding)/welcome` — optional `isAuthPath` exclusion for conversion paths already handled via `isConversionOnboardingPath`.

---

## Device QA Tests (collision-specific)

| Test | Pass criteria |
| ---- | ------------- |
| Fresh install cold start | Lands on spec welcome (after primary fix) OR document legacy as intentional |
| Open `/(onboarding)/welcome` directly | Spec UI, not slides |
| Open `/(auth)/welcome` directly | Legacy slides (until deprecated) |
| Partial progress cold start | Resumes `/(onboarding)/{step}`, not auth welcome |
| Logged-in mid-funnel | Stays on conversion screen, not redirected to dashboard |

---

## Conclusion

**URL collision:** Low — routes are distinct.  
**Product/funnel collision:** **High** — cold start sends new users to legacy welcome, bypassing spec conversion funnel.  
**Recommended fix:** Point `app/index.tsx` guest default to `ONBOARDING_ROUTES.welcome` (Phase 14 implementation).
