# Phase 19F — Launch Blocker Reassessment

**Date:** 2026-05-30  
**Baseline:** Phase 17–18 blockers + Phase 19 audit findings  
**Classification:** BLOCKING | CONDITIONAL | INFORMATIONAL

---

## Summary

| Classification | Count |
| -------------- | ----- |
| **BLOCKING** | 4 |
| **CONDITIONAL** | 9 |
| **INFORMATIONAL** | 5 |

---

## Blocker register

| ID | Blocker | Phase 17/18 | Phase 19 status | Class | Rationale |
| -- | ------- | ----------- | --------------- | ----- | --------- |
| **R01** | Device QA 0/60 executed | OPEN | **OPEN** | **BLOCKING** | No runtime validation; cannot confirm onboarding on hardware |
| **R02** | Production OAuth unverified on release build | OPEN | **OPEN** | **BLOCKING** | Env vars not confirmed in EAS; Google SHA-1 / Apple portal unverified |
| **R03** | Trial UX vs native IAP at screen 10 | OPEN | **OPEN** | **CONDITIONAL** | Code matches spec navigation; store compliance risk if metadata overclaims — Product sign-off can accept |
| **R04** | Supabase email confirmation policy unknown | OPEN | **OPEN** | **CONDITIONAL** | Blocks C6/C10 only if confirm-email enabled; document or disable |
| **R05** | Terms/Privacy not tappable on onboarding account | OPEN | **CONFIRMED FAIL** | **BLOCKING** | `account.tsx` L259 — static text only; Apple/Google review risk |
| **R06** | Legacy parallel funnels | OPEN | Unchanged | **INFORMATIONAL** | `(auth)/welcome`, psych funnel — monitor via analytics |
| **R07** | `onboarding_analytics_events` table in prod | OPEN | Unchanged | **CONDITIONAL** | Silent fail in code catch block; verify migration |
| **R08** | Cold-start routing | CLOSED (Phase 14) | Revalidated | **INFORMATIONAL** | Code PASS; needs C1 runtime confirm |
| **R09** | Pro OAuth metadata routing | CLOSED (Phase 14) | Revalidated | **INFORMATIONAL** | Code PASS; needs C4/C5 runtime confirm |
| **R10** | EAS env vars not in repo | OPEN | Reconfirmed | **BLOCKING** | Must be set before meaningful QA build |
| **R11** | app.json vs app.config.ts version drift | Phase 18 | **CONFIRMED** | **CONDITIONAL** | EAS uses 3.0.0; drift causes ops confusion not build failure |
| **R12** | Privacy URL domain inconsistency | New Phase 19 | **NEW** | **CONDITIONAL** | truwell.ai vs truwellai.xyz — legal must pick canonical |
| **R13** | expo-dev-client in production plugin list | Phase 18 | Reconfirmed | **CONDITIONAL** | Common Expo pattern; verify prod binary acceptable |
| **R14** | expo-location in app.json only | New Phase 19 | **NEW** | **INFORMATIONAL** | May not affect EAS build; verify if location feature ships |
| **R15** | register.tsx terms not linked | New Phase 19 | **NEW** | **CONDITIONAL** | Legacy path; not primary onboarding funnel |
| **R16** | TypeScript / compile | CLOSED | Revalidated PASS | **INFORMATIONAL** | tsc exit 0 Phase 19 |
| **R17** | NativeWind not implemented | Phase 15 | Accepted deviation | **INFORMATIONAL** | Post-launch migration |
| **R18** | No EAS builds executed | Phase 18 | **OPEN** | **BLOCKING** | Phase 19 does not execute builds by rule |

---

## BLOCKING (must resolve before store submission)

| ID | Resolution owner | Action |
| -- | ---------------- | ------ |
| R01 | QA | Execute `PHASE_19_DEVICE_QA_MASTER_PLAN.md` |
| R02 | DevOps | EAS env + Google SHA-1 + Apple provider + device OAuth tests |
| R05 | Legal + Engineering | Tappable Terms/Privacy on onboarding account (future phase) |
| R10 | DevOps | `eas env:create` for production + preview |
| R18 | DevOps | Produce preview/production artifacts (Phase 20 ops) |

---

## CONDITIONAL (proceed with documented sign-off)

| ID | Sign-off owner | Condition |
| -- | -------------- | --------- |
| R03 | Product | Accept trial UX → account without store IAP at screen 10 |
| R04 | Backend | Document email confirm on/off; test C6 |
| R07 | Backend | Confirm analytics table in prod |
| R11 | Engineering | Sync app.json version post-launch |
| R12 | Legal | Single canonical privacy/terms URL |
| R13 | DevOps | Confirm production build type |
| R15 | Product/Legal | Legacy register path disclosure or fix later |

---

## INFORMATIONAL (no action required for release gate)

| ID | Note |
| -- | ---- |
| R06 | Legacy routes — post-launch cleanup |
| R08 | Cold-start — code OK |
| R09 | Metadata — code OK |
| R14 | Location plugin drift |
| R16 | tsc PASS |
| R17 | NativeWind deferred |

---

## Blocker trend

| Metric | Phase 17 | Phase 19 |
| ------ | -------- | -------- |
| BLOCKING open | 4 (implicit) | **4 explicit** (+ R05 elevated, R10 explicit) |
| New findings | — | R12, R14, R15 |
| Code regressions | 0 | 0 |

---

## Gate decision input

Store submission **blocked** until: **R01, R02, R05, R10, R18** closed or R05/R03 waived in writing by Legal/Product with store copy adjusted.
