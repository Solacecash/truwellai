# Phase 19D — Store Compliance Audit

**Date:** 2026-05-30  
**Scope:** Onboarding path + app-wide compliance signals  
**Method:** Static code audit. **No fixes applied.**

**Status key:** PASS | CONDITIONAL | FAIL | N/A

---

## Master compliance table

| Requirement | Apple | Google | Status | Finding |
| ----------- | ----- | ------ | ------ | ------- |
| **Account creation offered** | Required if app has accounts | Required | **PASS** | Email, Google, Apple on `(onboarding)/account.tsx` |
| **Sign in with Apple (iOS)** | Required when other social login | N/A | **PASS** | Apple button on iOS account screen |
| **Google Sign-In (Android)** | N/A | Expected | **PASS** | Google button on account screen |
| **Optional account / guest path** | Allowed if disclosed | Allowed if disclosed | **CONDITIONAL** | "Continue Free" on subscription — limited access; disclose in store listing |
| **Terms acceptance at signup** | Required | Required | **CONDITIONAL** | Checkbox on onboarding account — text only, **not tappable links** (`account.tsx` L259) |
| **Terms links (tappable)** | Required | Required | **FAIL** | Onboarding account: no `Linking.openURL`. Legacy `UserStep1.tsx` has `https://truwell.ai/...` links |
| **Privacy policy links in-app** | Required | Required | **CONDITIONAL** | `settings/privacy.tsx` → `https://truwellai.xyz/privacy`; in-app `settings/policy.tsx`; **URL domain inconsistency** (`truwell.ai` vs `truwellai.xyz`) |
| **Privacy policy URL consistency** | — | — | **CONDITIONAL** | Multiple domains: `truwellai.xyz`, `truwell.ai` across codebase |
| **Account deletion in-app** | Required (Guideline 5.1.1) | Required (Data safety) | **PASS** | `settings/privacy.tsx` → `delete-account` edge function; `lib/accountDeletion.ts` for profile flow |
| **Deletion disclosure** | Required | Required | **PASS** | Alert copy describes data removed |
| **Subscription offered** | If digital goods sold | Same | **CONDITIONAL** | Adapty in `settings/subscription.tsx`; onboarding screen 10 is UX-only |
| **Native IAP for subscriptions** | Required for digital subs | Required | **CONDITIONAL** | IAP in settings, **not** at onboarding trial CTA |
| **Trial disclosure accuracy** | Must match StoreKit behavior | Must match Play Billing | **CONDITIONAL** | Screen 10 says "7-day free trial" but does not invoke store billing |
| **Restore purchases** | Required | Required | **PASS** | `restorePurchases()` in `settings/subscription.tsx` L816+ |
| **Pricing displayed** | Required before purchase | Required | **PASS** | $9.99/month on onboarding subscription screen |
| **User consent (health data)** | Required | Required | **CONDITIONAL** | Permissions in InfoPlist; health consent flows in legacy register — verify post-onboarding |
| **Analytics collection disclosed** | App Privacy labels | Data safety form | **CONDITIONAL** | `onboarding_analytics_events` + `usage_analytics` toggle in privacy settings |
| **Analytics opt-out** | Best practice / GDPR | Required disclosure | **PASS** | `settings/privacy.tsx` toggles `usage_analytics` |
| **Onboarding analytics pre-auth** | Disclose collection | Disclose | **CONDITIONAL** | Events fire before login; opt-out applies after auth only |
| **Permission purpose strings** | Required | Required | **PASS** | Camera, photos, mic, notifications, Face ID in `app.config.ts` |
| **Location permission** | If used | If used | **CONDITIONAL** | `expo-location` in `app.json` only — verify if shipped |
| **Medical / health disclaimer** | Required for health apps | Required | **CONDITIONAL** | Spec requires doctor-linked disclaimers — audit runtime screens separately |
| **Children's privacy** | Required | Required | **PASS** | Section in `settings/policy.tsx` |
| **Support contact** | Required | Required | **PASS** | support@truwellai.xyz in policy/assistant |
| **Register flow terms** | — | — | **FAIL** | `(auth)/register.tsx` L765–767 — styled text, **no onPress URLs** (same class as onboarding account) |

---

## Onboarding-specific compliance

| Screen / flow | Apple | Google | Status |
| ------------- | ----- | ------ | ------ |
| Welcome → funnel entry | OK | OK | **PASS** |
| Role selection | OK | OK | **PASS** |
| Subscription screen copy | OK | OK | **PASS** |
| Trial CTA → account (no IAP) | Review risk | Review risk | **CONDITIONAL** |
| Account email + OAuth | OK | OK | **PASS** |
| Terms checkbox (account) | Gap | Gap | **FAIL** (links) |
| Post-complete routing | OK | OK | **PASS** |

---

## Domain / URL inventory (compliance risk)

| URL | Referenced in |
| --- | ------------- |
| `https://truwellai.xyz/privacy` | `settings/privacy.tsx` |
| `https://truwellai.xyz/terms` | `settings/privacy.tsx` |
| `https://truwell.ai/terms-and-conditions` | `UserStep1.tsx`, `ExpertStep1.tsx` |
| `https://truwell.ai/privacy-policy` | `UserStep1.tsx`, `ExpertStep1.tsx` |

**Risk:** Store review may reject if policy links 404 or domains conflict.

---

## Subscription compliance detail

| Check | Status |
| ----- | ------ |
| Product IDs defined in code | **PASS** |
| Adapty public key present | **PASS** |
| Restore button visible | **PASS** |
| Onboarding paywall triggers analytics only | **PASS** |
| Store transaction at onboarding trial tap | **FAIL** (by design — product decision) |

**Interpretation:** Not a code defect if Product Option A accepted; **store metadata must not promise immediate store trial** unless IAP wired.

---

## Account deletion paths (two implementations)

| Path | File | Mechanism |
| ---- | ---- | --------- |
| Settings UI | `settings/privacy.tsx` | Supabase function `delete-account` |
| Library helper | `lib/accountDeletion.ts` | Direct table purge + signOut |

**Status:** **CONDITIONAL** — two paths exist; verify both work in production and match store disclosure.

---

## Gaps flagged (audit only)

1. **Onboarding account terms** — no tappable Terms/Privacy URLs  
2. **URL domain inconsistency** — truwell.ai vs truwellai.xyz  
3. **Trial UX vs billing** — onboarding screen 10  
4. **Register.tsx terms** — styled but not linked  
5. **Pre-auth analytics** — disclosure in privacy policy needed  

---

## Store submission compliance score

| Store | PASS items | CONDITIONAL | FAIL | Readiness |
| ----- | ---------- | ----------- | ---- | --------- |
| Apple | 12 | 10 | 2 | **CONDITIONAL** |
| Google | 11 | 11 | 2 | **CONDITIONAL** |

**Legal review required before submit.**
