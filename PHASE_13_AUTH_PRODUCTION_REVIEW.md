# Phase 13 Authentication Production Review

**Date:** 2026-05-30  
**Scope:** Email, Google, Apple, existing login, sign-in alias, onboarding account completion  
**Action:** Review only — no code changes

---

## Auth Surfaces Map

| Surface | Path / file | Purpose |
| ------- | ----------- | ------- |
| Spec account signup | `app/(onboarding)/account.tsx` | Post-subscription account creation |
| Spec welcome sign-in link | `/(onboarding)/welcome` → `/sign-in` | Returning members |
| Sign-in alias | `app/(auth)/sign-in.tsx` | Redirect → `/login` |
| Existing login | `app/(auth)/login.tsx` | Full-featured login (email, phone, social, biometric) |
| Register | `app/(auth)/register.tsx` | Standalone registration → health-profile or psych |
| Legacy welcome wizard | `app/(auth)/welcome.tsx` | RegistrationWizard modal flow |
| Google helper | `lib/googleAuth.ts` | Shared by login + onboarding account |
| Apple | `expo-apple-authentication` | login + onboarding account |

---

## Onboarding Account Flow (Screen 11)

### Email

| Step | Implementation |
| ---- | -------------- |
| Validation | Name, email regex, password ≥8, confirm match, terms checkbox |
| Signup | `supabase.auth.signUp` with `user_type: expert` if professional else `user` |
| Post-signup | `saveTruwellOnboarding(uid)` → `trackOnboardingEvent('registration_completed')` → `completeConversionOnboarding` |

**Risks:**

| Risk | Severity |
| ---- | -------- |
| Email confirmation required by Supabase project settings may block immediate session | **HIGH** if confirm email enabled |
| Duplicate signup if user already exists | **MEDIUM** — error surfaced via Alert |

### Google

| Step | Implementation |
| ---- | -------------- |
| Config | `configureGoogleSignIn()` in root `_layout.tsx`; requires `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` |
| Sign-in | `signInWithGoogle()` → Supabase id token exchange |
| Post-signup | `updateUser({ data: { role: 'user' } })` — **does not set user_type from selectedRole** |
| Exit | `completeConversionOnboarding` |

**Risks:**

| Risk | Severity |
| ---- | -------- |
| Missing env vars → user-facing config error | **HIGH** on production builds without secrets |
| Professional path selects Google → may route to `/enter` not `/(expert)` | **HIGH** |
| Play Services unavailable (Android) | **MEDIUM** |

### Apple

| Step | Implementation |
| ---- | -------------- |
| Sign-in | `AppleAuthentication.signInAsync` → `signInWithIdToken` |
| Post-signup | `updateUser({ data: { provider: 'apple', role: 'user' } })` — **no user_type from selectedRole** |
| Platform | iOS only (button hidden on Android per typical pattern) |

**Risks:**

| Risk | Severity |
| ---- | -------- |
| Professional + Apple → wrong dashboard | **HIGH** |
| Simulator vs device behavior | **MEDIUM** |
| User cancel (`ERR_REQUEST_CANCELED`) | **LOW** — handled silently |

---

## Existing Login (`/login`) — Untouched

| Feature | Status |
| ------- | ------ |
| Email / phone auth | Independent of onboarding account |
| Google native | Uses same `lib/googleAuth.ts` |
| Apple | Present on login screen |
| Post-login routing | `resolveUserRole` → `/enter` or `/(expert)` |
| Onboarding account | **Separate code path** — no merge |

**Verification:** Onboarding account does not modify `login.tsx`. **No regression** to existing login from Phase 12 work.

---

## Sign-In Alias (`/sign-in`)

- `Redirect href="/login"` — spec line 229 compliant
- Spec welcome uses `router.replace('/sign-in')` — resolves correctly

**Circular navigation check:**

```
/(onboarding)/welcome → /sign-in → /login → (success) → /enter or /(expert)
/(onboarding)/welcome → /sign-in → /login → back → no forced loop to onboarding
```

**Result:** No circular loop detected.

---

## Onboarding Completion Behavior

`lib/completeConversionOnboarding.ts`:

1. `setConversionFlowComplete(true)`
2. `setOnboardingComplete(true)`
3. Read `user_metadata.user_type`
4. Route: `expert` → `/(expert)`, else → `/enter`

**Dependency:** Correct `user_type` in metadata after signup. Email path sets it; Google/Apple paths may not for professional role.

---

## Risk Summary

| ID | Risk | Severity |
| -- | ---- | -------- |
| A1 | Google/Apple professional signup missing `user_type: expert` | **HIGH** |
| A2 | Supabase email confirmation blocking instant completion | **HIGH** (config-dependent) |
| A3 | Google OAuth env not set in production EAS secrets | **HIGH** |
| A4 | Register flow bypasses spec funnel → health-profile | **MEDIUM** |
| A5 | Two registration UX paths (wizard vs account screen) | **MEDIUM** |
| A6 | `saveTruwellOnboarding` fails silently? — throws to caller | **LOW** — verify error UX |
| A7 | Logged-in user hitting account screen mid-funnel | **LOW** — guard allows conversion paths |

---

## Production Checklist (pre-launch)

- [ ] `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` in EAS production env
- [ ] `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` for iOS native
- [ ] Apple Sign-In capability enabled in App Store Connect / entitlements
- [ ] Supabase: confirm whether email verification required for onboarding signup
- [ ] Test professional path with all three providers on device
- [ ] Verify `saveTruwellOnboarding` writes expected profile columns
- [ ] Confirm login screen still works for returning users (regression smoke test)

---

## Conclusion

Onboarding account flow is **self-contained** and does **not** modify existing login. Primary production risks are **OAuth configuration** and **professional role metadata inconsistency** on Google/Apple paths. Recommend fixing A1 before RC1 store submission.
