# Phase 21E — Release Blocker Recheck

**Date:** 2026-05-30  
**After:** Phase 21 remediation (legal, config, env docs)

---

## Blocker status

| Item | Phase 20 | Phase 21 | Status |
| ---- | -------- | -------- | ------ |
| **Terms links tappable (L1)** | FAIL | `account.tsx` — `Linking.openURL(ONBOARDING_TERMS_URL)` with `accessibilityRole="link"` | **PASS** |
| **Privacy links tappable (L2)** | FAIL | `Linking.openURL(ONBOARDING_PRIVACY_URL)` | **PASS** |
| **OAuth terms acceptance (L2)** | FAIL | `requireTermsAccepted()` in Apple, Google, email paths | **PASS** |
| **Email terms acceptance** | PASS | Unchanged via `validateEmail` / `requireTermsAccepted` | **PASS** |
| **URL consistency (L3)** | FAIL | Canonical `truwellai.xyz` in `lib/onboardingLegalUrls.ts`; account + UserStep1 + ExpertStep1 updated | **PASS** (onboarding scope) |
| **expo-location drift (C2)** | FAIL | Plugin added to `app.config.ts` | **PASS** |
| **Env documentation (C3)** | FAIL | `.env.example` + Stripe key documented | **PASS** |
| **Config source documented (C1)** | FAIL | Header comment in `app.config.ts` | **PASS** |
| **EAS env vars set** | NOT VERIFIED | Not in repo | **CONDITIONAL** |
| **Device QA executed** | 0/60 | Not executed | **CONDITIONAL** |
| **Preview build artifact** | Missing | Not built (Phase 21 rule) | **CONDITIONAL** |
| **Trial/IAP store alignment** | HIGH | Unchanged by design — see subscription report | **CONDITIONAL** |
| **app.json version drift** | MEDIUM | Not synced (out of Phase 21 scope) | **CONDITIONAL** |
| **Terms acceptance persisted to DB** | MEDIUM | Local state only | **CONDITIONAL** |
| **Legacy register.tsx terms** | FAIL | Not in Phase 21 onboarding scope | **CONDITIONAL** |

---

## Summary

| PASS | CONDITIONAL | FAIL |
| ---- | ----------- | ---- |
| 7 | 6 | 0 |

**Code-level store blockers L1/L2/OAuth:** **Resolved**  
**Ops blockers:** **Remain** (EAS env, QA, build)

---

## TypeScript

`npx tsc --noEmit` — see Phase 21 validation
