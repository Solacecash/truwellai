# Phase 16 OAuth Validation Report

**Date:** 2026-05-30  
**Scope:** Google OAuth, Apple OAuth, Email signup — onboarding account screen  
**Code changes:** None

---

## Configuration audit

| Item | Source | Repo evidence | Production verified |
| ---- | ------ | ------------- | ------------------- |
| Google Web Client ID | `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` | `.env.example` L9; `app.config.ts` L111 | **REQUIRES DEVICE VALIDATION** |
| Google iOS Client ID | `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` | Optional in `.env.example`; `app.config.ts` L112 | **REQUIRES DEVICE VALIDATION** |
| Google Sign-In plugin | `@react-native-google-signin/google-signin` | `app.config.ts` L55 | **PASS** (declared) |
| Apple Sign-In | `usesAppleSignIn: true` | `app.config.ts` L28 | **REQUIRES DEVICE VALIDATION** (entitlements) |
| Supabase URL/anon key | `EXPO_PUBLIC_SUPABASE_*` | `.env.example` | **REQUIRES DEVICE VALIDATION** |
| EAS production profile | `eas.json` | No env vars embedded (secrets external) | **REQUIRES DEVICE VALIDATION** |

**Note:** Local `.env` exists but was **not read** (secrets). Validation is configuration-pattern only.

---

## Google OAuth

### Flow

1. `configureGoogleSignIn()` — `app/_layout.tsx` at startup
2. `signInWithGoogle()` — `lib/googleAuth.ts`
3. `supabase.auth.signInWithIdToken({ provider: 'google', token })`
4. Profile fields `updateUser` (name, avatar) — `googleAuth.ts` L123–131
5. Onboarding account: `updateUser({ data: buildOnboardingAuthMetadata(...) })` — `account.tsx`

### Metadata persistence (post Phase 14)

| Field | Guardian | Professional | Evidence |
| ----- | -------- | -------------- | -------- |
| `user_type` | `user` | `expert` | `onboardingAuthMetadata.ts` L15 |
| `role` | `guardian` | `professional` | L16 |
| `onboarding_role_path` | `guardian` | `professional` | L17 |

### Routing after completion

| Role | `completeConversionOnboarding` destination |
| ---- | ------------------------------------------ |
| Guardian | `/enter` |
| Professional | `/(expert)` |

### Missing config behavior

- No web client ID → user-facing error string — `googleAuth.ts` L67–72
- **Production readiness:** **CONDITIONAL** — code **PASS**; live OAuth **REQUIRES DEVICE VALIDATION**

---

## Apple OAuth

### Flow

1. `AppleAuthentication.signInAsync` — `account.tsx`
2. `supabase.auth.signInWithIdToken({ provider: 'apple', token })`
3. `updateUser({ data: buildOnboardingAuthMetadata(selectedRole, 'apple') })`

### Platform

| Platform | Apple button | Status |
| -------- | ------------ | ------ |
| iOS | Shown | Code **PASS** |
| Android | Hidden | Expected |

### Metadata

Same table as Google — **PASS** (code).

**Production readiness:** **REQUIRES DEVICE VALIDATION** (Apple capability + TestFlight/App Store build).

---

## Email signup

### Flow

1. Validation (name, email, password, terms) — `account.tsx`
2. `supabase.auth.signUp` with `options.data: { full_name, ...buildOnboardingAuthMetadata(selectedRole, 'email') }`
3. `finishSignup` → `saveTruwellOnboarding` → `completeConversionOnboarding`

### Metadata

| Field | Guardian | Professional |
| ----- | -------- | -------------- |
| `user_type` | `user` | `expert` |
| `role` | `guardian` | `professional` |
| `onboarding_role_path` | `guardian` | `professional` |

### Profile persistence (`saveTruwellOnboarding.ts`)

| Profile column | Source |
| -------------- | ------ |
| `user_type` | `mapUserType(role)` → user/expert |
| `role` | `selectedRole` |
| `onboarding_role_path` | `role \|\| null` L85 |

**Code readiness:** **PASS**

**Risk R04:** If Supabase project requires email confirmation, session may be null after signUp — **REQUIRES DEVICE VALIDATION** on staging/production project.

---

## Professional vs guardian routing integrity

| Scenario | Misroute risk | Code verdict |
| -------- | ------------- | ------------ |
| Pro + Google | Was HIGH pre-Phase 14 | **PASS** — metadata sets expert |
| Pro + Apple | Was HIGH pre-Phase 14 | **PASS** |
| Pro + Email | Always OK | **PASS** |
| Guardian + any provider | N/A | **PASS** — user_type user |

**Professional OAuth users cannot accidentally become guardians** in routing logic when `selectedRole === 'professional'` at account screen — **PASS (code)**.

---

## Existing login (`/login`) — untouched

Onboarding account uses separate code path. Login screen OAuth does not use `buildOnboardingAuthMetadata` — **correct** for returning users.

**Regression risk:** **Low** — no Phase 16 edits.

---

## OAuth validation summary

| Provider | Code ready | Config in repo | Device proof |
| -------- | ---------- | -------------- | ------------ |
| Google | **PASS** | Documented in `.env.example` | **BLOCKED** |
| Apple | **PASS** | `usesAppleSignIn` | **BLOCKED** |
| Email | **PASS** | Supabase standard | **BLOCKED** |

**Overall OAuth status:** **CONDITIONAL PASS** — ship only after device validation on release build with production secrets.

---

## Validation

```bash
npx tsc --noEmit
```

**Result:** **PASS**
