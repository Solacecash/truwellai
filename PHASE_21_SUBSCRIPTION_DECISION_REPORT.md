# Phase 21D — Subscription Decision Report

**Date:** 2026-05-30  
**File:** `app/(onboarding)/subscription.tsx`  
**Code changed:** None (audit only)

---

## Decision summary

**Current implementation intentionally follows the onboarding spec.** Trial CTA navigates to account (screen 11), not a native IAP sheet. This is **spec-compliant** but **creates a production/store disclosure requirement** if marketing copy implies immediate App Store / Play billing.

---

## Requirement matrix

| Requirement | Current | Spec | Production Impact |
| ----------- | ------- | ---- | ----------------- |
| Guardian headline "Care With Confidence" | Implemented L30 | Required | **PASS** — store copy OK |
| Professional headline "Practice Smarter" | Implemented | Required | **PASS** |
| $9.99/month pricing | Implemented L71 | Required | **PASS** — must match live IAP in settings |
| "7-day free trial · No charge now" copy | Implemented | Required | **CONDITIONAL** — true for UX intent; not true for store billing at tap |
| "Most Popular" badge | Implemented | Required | **PASS** |
| Role-colored plan border | teal/cyan | Required | **PASS** |
| Primary CTA "Start My Free 7-Day Trial" | Implemented | Required | **CONDITIONAL** — navigates to account, no Adapty |
| Secondary "Continue Free" | Implemented | Required | **PASS** — limited access path |
| Guarantee row | Implemented | Required | **PASS** |
| Trial CTA → account | `advanceToAccount()` L44–47 | `router.push account` | **PASS** spec alignment |
| Free CTA → post-onboarding | `completeConversionOnboarding` | Required | **PASS** |
| Skip disabled | `showSkip={false}` | Required | **PASS** |
| Adapty purchase on screen 10 | **Not present** | Not required by spec nav | IAP lives in `settings/subscription.tsx` |
| Analytics `paywall_viewed` | Fired on mount | Best practice | **PASS** |
| Native IAP at trial tap | **No** | Spec says trial → account | **HIGH** store risk if listing promises instant trial |
| Restore purchases on screen 10 | **No** | Not in spec for screen 10 | Restore in settings — **PASS** for app-wide |

---

## Spec vs production monetization

| Question | Answer |
| -------- | ------ |
| Does implementation follow spec? | **Yes** — spec L445: Trial CTA → account |
| Does it violate production IAP requirements? | **Conditional** — not a code defect; **product/legal** must align store metadata |
| Is Adapty required on screen 10? | **No** per spec; Adapty on settings is sufficient for IAP capability |
| Recommended product decision | **Option A (accepted):** Trial commitment = intent; billing after account or in settings |

---

## Recommendation

**Do not change monetization code in Phase 21.** Document in store listing that trial activation may occur after account creation or via Settings → Subscription. Product sign-off required before submit.

**Product owner sign-off:** ☐ Option A accepted  Date: __________
