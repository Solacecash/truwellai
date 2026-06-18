# Phase 20B — Legal and Compliance Review

**Date:** 2026-05-30  
**Scope:** `app/(onboarding)/account.tsx` and related legal surfaces  
**Code modified:** None

---

## Onboarding account flow inspection

### File: `app/(onboarding)/account.tsx`

| Element | Current behavior | Evidence |
| ------- | ---------------- | -------- |
| **Apple Sign-In** | No terms checkbox; direct `signInWithIdToken` → finish | L70–98 |
| **Google Sign-In** | No terms checkbox; direct flow | L101–119 |
| **Email signup** | Terms checkbox required via `validateEmail()` | L143–147, L250–259 |
| **Terms text** | Static string: "I agree to the Terms of Service and Privacy Policy" | L259 |
| **Tappable Terms URL** | **Absent** — entire row toggles checkbox | L250–251 `onPress={() => setAgreedToTerms}` |
| **Tappable Privacy URL** | **Absent** | Same |
| **Legal acceptance tracking** | Local state `agreedToTerms` only; **not persisted** to Supabase/profile | L50 — no `terms_accepted_at` in signUp metadata |
| **OAuth metadata** | `buildOnboardingAuthMetadata()` sets role fields only | `onboardingAuthMetadata.ts` |
| **Checkbox a11y** | `accessibilityRole="checkbox"` present | L253–254 |

### Comparison: working pattern elsewhere

`components/onboarding/wizard/user/UserStep1.tsx` L98–107 uses `Linking.openURL('https://truwell.ai/terms-and-conditions')` and `privacy-policy` — **tappable**.

`app/settings/privacy.tsx` L25–26 uses `https://truwellai.xyz/privacy` and `/terms` — **different domain**.

---

## Apple App Review risk

| Issue | Classification | Rationale |
| ----- | -------------- | --------- |
| Terms/Privacy not tappable at email signup | **BLOCKING** | Guideline 5.1.1 — users must access legal docs; styled-only text commonly rejected |
| OAuth signup without explicit terms acceptance | **HIGH** | Apple/Google allowed without checkbox in some apps, but health app + account creation typically requires disclosed agreement |
| Sign in with Apple present when Google offered | **LOW** | Compliant — Apple button on iOS |
| No EULA link in onboarding funnel | **HIGH** | Terms only in settings screens for existing users |
| Health app data collection at signup | **MEDIUM** | Permissions elsewhere; onboarding account does not surface health consent |
| Trial language on prior screen without IAP | **HIGH** | Screen 10 "7-day free trial" — see subscription compliance |

**Overall Apple review risk:** **HIGH** (blockers on legal links + trial copy alignment)

---

## Google Play review risk

| Issue | Classification | Rationale |
| ----- | -------------- | --------- |
| Terms/Privacy not tappable at email signup | **BLOCKING** | Play policy: privacy policy link required where data collected |
| OAuth without terms gate | **HIGH** | Account creation collects identifiers |
| Data safety vs pre-auth analytics | **MEDIUM** | `onboarding_started` before login |
| Subscription disclosure vs onboarding trial CTA | **HIGH** | Misleading if no Play Billing at tap |
| Account deletion available | **LOW** | `settings/privacy.tsx` — outside onboarding path |
| Restore purchases | **LOW** | Settings only — OK if subs sold in-app |

**Overall Google review risk:** **HIGH**

---

## Issue classification summary

| ID | Issue | Apple | Google | Class |
| -- | ----- | ----- | ------ | ----- |
| L1 | Terms text not tappable (onboarding account) | X | X | **BLOCKING** |
| L2 | OAuth paths skip terms acceptance | X | X | **HIGH** |
| L3 | No persisted terms acceptance timestamp | X | X | **MEDIUM** |
| L4 | Privacy/Terms URL domain split (truwell.ai vs truwellai.xyz) | X | X | **HIGH** |
| L5 | Trial CTA without native billing | X | X | **HIGH** |
| L6 | Pre-auth analytics events | X | X | **MEDIUM** |
| L7 | Continue Free without account — limited access disclosure | X | X | **LOW** |
| L8 | In-app policy screens exist (`settings/policy.tsx`, `terms.tsx`) | Mitigation | Mitigation | **LOW** |

---

## Recommended remediation (Phase 21 — not applied in Phase 20)

1. Add tappable Terms + Privacy links on `account.tsx` matching canonical URLs from Legal  
2. Require terms acceptance (or inline disclosure + continue) before **all** signup methods OR add footer links visible on OAuth layout  
3. Persist `terms_accepted_at` in signup metadata or profile  
4. Product/Legal align trial copy with billing behavior  
5. Legal pick single domain: recommend `truwellai.xyz` to match settings/privacy.tsx  

---

## Sign-off

| Role | Reviewed | Approve remediation plan | Name | Date |
| ---- | -------- | -------------------------- | ---- | ---- |
| Legal | ☐ | ☐ | | |
| Product | ☐ | ☐ | | |
| Engineering | ☐ | ☐ | | |
