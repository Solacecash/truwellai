# Phase 16 Subscription Sign-Off Report

**Date:** 2026-05-30  
**Scope:** Onboarding subscription screen (10), Adapty integration, trial/restore flows  
**Code changes:** None

---

## Onboarding subscription screen (`app/(onboarding)/subscription.tsx`)

### Spec alignment (lines 423–447)

| Requirement | Implemented | Evidence |
| ----------- | ----------- | -------- |
| Guardian headline "Care With Confidence" | **Yes** | L30 |
| Professional "Practice Smarter" | **Yes** | L30 |
| $9.99/month | **Yes** | L71 |
| 7-day free trial copy | **Yes** | L72 |
| "Most Popular" badge | **Yes** | L67–68 |
| Role-colored plan border | **Yes** | teal/cyan L31 |
| Primary CTA "Start My Free 7-Day Trial" | **Yes** | L87–89 |
| Continue Free option | **Yes** | L92–94 |
| Guarantee row | **Yes** | L95–98 |
| Trial CTA → account (not IAP sheet) | **Yes** | L44–47 → `ONBOARDING_ROUTES.account` |
| Free CTA → post-onboarding | **Yes** | `completeConversionOnboarding` L49–51 |
| Skip disabled | **Yes** | `showSkip={false}` L54 |
| Analytics `paywall_viewed` | **Yes** | L38–41 |

**Screen 10 UX/copy:** **Production ready (code)**

---

## Adapty integration

### App-wide (`lib/adapty.ts`)

| Item | Status | Evidence |
| ---- | ------ | -------- |
| SDK | `react-native-adapty` | `app.config.ts` L100 |
| Activation | Public SDK key at module load | L81–104 |
| Products | `truwell_pro_monthly`, yearly, family, lifetime | L33–37 |
| Placement | `truwell_upgrade_guardian` | L28–29 |
| Purchase | `purchaseMobileSubscription` | adapty.ts (exported) |
| Restore | `restorePurchases` / `restorePurchasesState` | L373+ |
| Init on auth | `initRevenueCat` alias in `_layout.tsx` | session bootstrap |

### Onboarding subscription screen

| Adapty call | Present? |
| ----------- | -------- |
| `getPaywall` | **No** |
| `makePurchase` / `purchaseMobileSubscription` | **No** |
| `restorePurchases` | **No** |

**Finding:** Onboarding screen 10 is a **conversion UX gate**, not a native IAP surface. Trial commitment is **intent-only**; user proceeds to account (screen 11) without store transaction.

---

## Trial flow analysis

```
User taps "Start My Free 7-Day Trial"
  → setConversionFlowStep(11)
  → router.replace(ONBOARDING_ROUTES.account)
  → (no Adapty purchase)

User taps "Continue Free — Limited access only"
  → completeConversionOnboarding()
  → /enter or /(expert) without account creation
```

| Interpretation | Assessment |
| -------------- | ------------ |
| Matches spec navigation (trial → account) | **Yes** — spec L445 |
| Starts App Store / Play 7-day trial at tap | **No** — store billing not invoked |
| Trial starts elsewhere | **Likely** — `app/settings/subscription.tsx` has full Adapty purchase + restore |

---

## Restore purchases

| Surface | Restore UI | Status |
| ------- | ---------- | ------ |
| Onboarding subscription | **None** | By design (spec has no restore on screen 10) |
| Settings subscription | **Yes** | L815–829, L1076+ |

**Onboarding restore:** N/A — users without account may not have purchases to restore at screen 10.

---

## Continue-free flow

| Check | Status |
| ----- | ------ |
| Calls `completeConversionOnboarding` | **PASS** |
| Sets `conversionFlowComplete` | **PASS** |
| Routes guardian → `/enter` | **PASS** |
| Routes pro (if metadata expert) → `/(expert)` | **PASS** |
| Works without auth session | **PASS** — intentional limited access path |

**Code defect:** **None identified**

---

## Determination matrix

| Question | Answer |
| -------- | ------ |
| Is onboarding subscription UI production ready? | **Yes (code)** |
| Is Adapty integrated app-wide? | **Yes** |
| Is Adapty required on onboarding screen 10 for launch? | **Product decision** |
| Is missing IAP on screen 10 a code defect? | **No** — matches spec navigation; differs from store-trial-at-tap product expectation |
| Is restore required on screen 10? | **No** — available in settings |

---

## Product sign-off required

**Decision needed from Product:**

| Option | Description | Launch impact |
| ------ | ----------- | ------------- |
| **A** | Accept UX trial → account → IAP later in settings | **Can launch** with documented user expectation |
| **B** | Require native trial purchase on screen 10 before account | **Code change required** — wire `purchaseMobileSubscription` (not in Phase 16 scope) |
| **C** | Trial starts automatically on account creation via Adapty identify | **Integration work** — post-account hook |

**Phase 16 recommendation:** **Option A** for RC1 unless legal/compliance mandates store disclosure at screen 10.

**Status:** **PRODUCT DECISION REQUIRED** — not a release code blocker if Option A accepted.

---

## Evidence files

- `app/(onboarding)/subscription.tsx`
- `lib/completeConversionOnboarding.ts`
- `lib/adapty.ts`
- `app/settings/subscription.tsx` (production IAP surface)
- Spec lines 423–447

---

## Validation

```bash
npx tsc --noEmit
```

**Result:** **PASS**
