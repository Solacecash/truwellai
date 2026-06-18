# Phase 14 Release Blocker Audit

**Date:** 2026-05-30  
**Authority:** `PHASE_13_RELEASE_READINESS_REPORT.md`, `TruWell_AI_Onboarding_Cursor_Prompt.md`  
**Action:** Pre-implementation audit — fixes follow in Phase 14B

---

## Executive Summary

Three **low-risk, high-impact** code fixes are approved for Phase 14B:

1. Cold-start guest routing → `ONBOARDING_ROUTES.welcome`
2. OAuth metadata alignment for Google/Apple (and email consistency) via shared helper
3. Defensive completion logging in `completeConversionOnboarding`

No schema changes, deletions, or NativeWind work in Phase 14.

---

## Cold Start Routing

### Current behavior (`app/index.tsx`)

| Condition | Route reached |
| --------- | ------------- |
| Guest, no resume data | **`/(auth)/welcome`** (legacy slides) |
| Guest, `guestConversionResumeHref()` set | `/(onboarding)/{step}` |
| Session + conversion step 2–11 incomplete | `/(onboarding)/{step}` |
| Session + conversion complete | `/enter` or `/(expert)` |
| `run()` catch (error) | **`/(auth)/welcome`** |
| `routeSession()` catch (logged-in error) | **`/(auth)/welcome`** |

### Spec expectation

Screen 1 is `app/(onboarding)/welcome.tsx`. New guests with no persisted progress should enter the **11-screen conversion funnel** at `ONBOARDING_ROUTES.welcome` (`/(onboarding)/welcome`).

### Guard interaction (`app/_layout.tsx`)

| Function | Relevant behavior |
| -------- | ----------------- |
| `isBootstrapIndexPath('/')` | Guard skips redirect while index bootstraps |
| `isConversionOnboardingPath` | `(onboarding)/*`, `/onboarding/*`, spec prefixes → allowed for guests |
| `isAuthPath` | Includes `/welcome`, login, register, psych, **and** conversion paths |
| Logged-out on app path | Redirect → **`/(auth)/welcome`** (unchanged in Phase 14) |

**After Fix 1:** Index sends guests to `/(onboarding)/welcome`, which passes `isConversionOnboardingPath` — guard will **not** redirect away.

### Exact code change (Fix 1)

**File:** `app/index.tsx`

1. Import `ONBOARDING_ROUTES` from `@/lib/onboardingRoutePaths`
2. Line ~165: `router.replace(ONBOARDING_ROUTES.welcome as never)` instead of `'/(auth)/welcome'`
3. Line ~171: same for `run()` error fallback
4. Line ~92: `routeSession` error — user has session; use `ONBOARDING_ROUTES.welcome` per Phase 13, **or** `/enter` — **Decision:** use `/enter` for authenticated routeSession failures (guard would bounce auth welcome anyway)

### Risk assessment

| Risk | Level | Mitigation |
| ---- | ----- | ---------- |
| Break legacy slide-deck entry | **Low** | `(auth)/welcome` still reachable directly / from guard on non-onboarding paths |
| Register flow expecting auth welcome | **Low** | Register uses `/register`, not index |
| Psych s1-intro | **None** | Already replaces to `/(onboarding)/welcome` |
| Double navigation flash | **Low** | Same pattern as current replace |

**Overall Fix 1 risk:** **LOW**

---

## OAuth Production Review

### Email signup (`account.tsx` — current)

```typescript
user_type: selectedRole === 'professional' ? 'expert' : 'user'
role: 'user'  // always — inconsistent with profiles.role
```

- **Guardian:** `user_type: user` ✓ → `/enter` after completion
- **Professional:** `user_type: expert` ✓ → `/(expert)` after completion
- **profiles** via `saveTruwellOnboarding`: `role`, `onboarding_role_path` from store ✓

### Google signup (current — **BUG**)

```typescript
updateUser({ data: { role: 'user' } })
```

- **Professional:** `user_type` missing → defaults empty → **`/enter` (wrong)**
- **Guardian:** works accidentally via `/enter`
- **profiles:** correct if `saveTruwellOnboarding` runs (uses store, not auth metadata)

### Apple signup (current — **BUG**)

```typescript
updateUser({ data: { provider: 'apple', role: 'user' } })
```

- Same as Google for professional path

### Professional cannot become guardian (verification)

| Path | Auth `user_type` after fix | `completeConversionOnboarding` | Profile `role` |
| ---- | -------------------------- | ------------------------------ | -------------- |
| Pro + email | `expert` | `/(expert)` | `professional` |
| Pro + Google | `expert` | `/(expert)` | `professional` |
| Pro + Apple | `expert` | `/(expert)` | `professional` |
| Guardian + any | `user` | `/enter` | `guardian` |

**Fix 2:** Add `lib/onboardingAuthMetadata.ts` → `buildOnboardingAuthMetadata(selectedRole, provider?)` used by all three signup paths in `account.tsx`.

Fields set:

- `user_type`: `expert` | `user`
- `role`: `professional` | `guardian` | `user`
- `onboarding_role_path`: store `selectedRole` or null
- `provider`: apple only when applicable

### Risk assessment Fix 2

| Risk | Level |
| ---- | ----- |
| Overwrite existing user metadata on returning OAuth user | **Low** — account screen is post-funnel signup |
| Break Google/Apple login on `/login` | **None** — login untouched |
| Supabase reject unknown metadata keys | **Low** — user_metadata is flexible |

**Overall Fix 2 risk:** **LOW**

---

## Resume Flow

### Guest resume

**Source:** `guestConversionResumeHref()` in `lib/onboardingService.ts`

| Stored state | Result |
| ------------ | ------ |
| `conversionFlowComplete` | null (no resume) |
| step ≥ 4, no `selectedRole` | Reset step 1 → welcome |
| step ≥ 10, no `conversionBlueprintReady` | Clamp to step 9 blueprint |
| step 1–11 otherwise | `routeForOnboardingStep(step, role)` |

**Index path:** Guest with resume → `guestHref` before default welcome (unchanged).

### Authenticated resume

**Source:** `app/index.tsx` lines 128–137

| Condition | Route |
| --------- | ----- |
| Session + `!conversionFlowComplete` + step 2–11 | `routeForOnboardingStep` |
| Session + complete or step 1 | `routeSession` → dashboard |

### Per-step resume map

| Step | Screen | Href |
| ---- | ------ | ---- |
| 1 | welcome | `/(onboarding)/welcome` |
| 2 | role | `/(onboarding)/role` |
| 3 | care-discovery / practice-profile | role-dependent |
| 4 | assessment / workflow | role-dependent |
| 5 | ai-processing | `/(onboarding)/ai-processing` |
| 6 | score-reveal | `/(onboarding)/score-reveal` |
| 7 | future-vision | `/(onboarding)/future-vision` |
| 8 | ai-demo | `/(onboarding)/ai-demo` |
| 9 | blueprint | `/(onboarding)/blueprint` |
| 10 | subscription | `/(onboarding)/subscription` |
| 11 | account | `/(onboarding)/account` |

### Blueprint / subscription / account / completion

| Stage | Persistence trigger | Exit |
| ----- | ------------------- | ---- |
| Blueprint | `conversionBlueprintReady`, step 9 | → subscription |
| Subscription | step 10; continue free calls `completeConversionOnboarding` | `/enter` or expert |
| Account | step 11; signup + `saveTruwellOnboarding` + completion | `/enter` or expert |
| Completion | `conversionFlowComplete`, `onboardingComplete` flags | AsyncStorage via store |

**Resume flow risk:** **LOW** — no changes planned except cold-start default.

---

## Phase 14B Implementation Plan

| Fix | File(s) | Priority |
| --- | ------- | -------- |
| Cold-start routing | `app/index.tsx` | P0 |
| OAuth metadata | `lib/onboardingAuthMetadata.ts` (new), `app/(onboarding)/account.tsx` | P0 |
| Completion logging | `lib/completeConversionOnboarding.ts` | P1 |

**Out of scope:** `_layout.tsx` guard redirect to auth welcome for logged-out app paths; Adapty IAP; device QA execution on hardware; email confirmation Supabase setting.

---

## Validation

After Phase 14B:

```bash
cd mobile && npx tsc --noEmit
```

Manual smoke: fresh guest → spec welcome; pro Google signup metadata → expert route (device QA Phase 14C).
