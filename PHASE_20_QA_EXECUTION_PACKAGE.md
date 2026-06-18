# Phase 20F — QA Execution Package

**Date:** 2026-05-30  
**Consolidates:** `PHASE_19_DEVICE_QA_MASTER_PLAN.md`, `PHASE_17_DEVICE_VALIDATION_MATRIX.md`, `PHASE_18_QA_EXECUTION_PLAN.md`

---

## 1. Build recipient list

| Role | Name | Email | Device(s) | Build channel |
| ---- | ---- | ----- | --------- | ------------- |
| QA Lead | __________ | __________ | All (coordination) | EAS link |
| iOS Tester A | __________ | __________ | iPhone SE | TestFlight / internal |
| iOS Tester B | __________ | __________ | iPhone 15 Pro | TestFlight / internal |
| Android Tester C | __________ | __________ | Pixel | APK sideload |
| Android Tester D | __________ | __________ | Samsung Galaxy | APK sideload |
| DevOps | __________ | __________ | — | Build publisher |
| Engineering | __________ | __________ | — | Defect triage |

**Build metadata (fill on receipt):**

| Field | Value |
| ----- | ----- |
| Profile | preview |
| Version | 3.0.0 |
| iOS build ID | __________ |
| Android build ID | __________ |
| EAS build URL | __________ |
| Date distributed | __________ |

---

## 2. Test sequence

### Day 0 — Smoke gate (all devices, ~30 min each)

1. Install build  
2. **C1** — delete app, reinstall, cold start → spec welcome  
3. **C11** — sign-in from welcome  
4. **C15** — returning user login  

**Stop rule:** Any C1 FAIL → notify DevOps + Engineering before continuing.

### Day 1 — Authentication

5. **C6** — email guardian (each device)  
6. **C4** — Google professional (all; screen record)  
7. **C5** — Apple professional (iOS only; N/A Android → document)

### Day 2 — Full paths + subscription

8. **C2** — guardian 1→11 (screen record)  
9. **C3** — professional 1→11 (screen record)  
10. **C9** — continue free  
11. **C10** — trial → account → complete (screen record)

### Day 3 — Resume + regression

12. **C7** — kill at score-reveal  
13. **C8** — kill at subscription  
14. **C12** — ai-processing  
15. **C13** — scanner  
16. **C14** — telehealth  

### Optional extended

- Logout → cold start → welcome  
- Deep link `/onboarding`

---

## 3. Pass criteria

| Level | Criteria |
| ----- | -------- |
| **Per test** | Expected result in matrix met; no crash; correct route |
| **Per device** | All C1–C15 Pass or C5 documented N/A (Android) |
| **Program** | All 4 device classes Pass |
| **Release gate** | Zero S0/S1 open defects |
| **Minimum for production build auth** | 100% matrix Pass + DevOps sign-off |

---

## 4. Failure escalation path

```
Tester finds FAIL
  → Screenshot + recording per naming standard
  → Log defect with: Device, Test ID, Build ID, steps, expected, actual
  → Severity:
       S0 Blocker (crash, auth totally broken, cannot complete C2/C3)
         → Slack/email DevOps + Engineering within 1 hour
         → Pause matrix on affected platform
       S1 Critical (wrong route, resume broken, OAuth fail)
         → Daily standup; fix before production build
       S2 Major (C9 crash, profile not saved)
         → Fix before store submit
       S3 Minor (copy, animation)
         → Product decision for ship
  → Retest on new preview build after fix
  → Update matrix Pass/Fail
```

**Contacts:**

| Severity | Primary | Backup |
| -------- | ------- | ------ |
| S0 | Engineering Lead | DevOps |
| S1 | Engineering | QA Lead |
| S2/S3 | Product | QA Lead |

---

## 5. Screenshot naming standard

```
qa/{buildId}/{device}/{testId}_{status}_{YYYYMMDD_HHMM}.png
```

**Examples:**

```
qa/abc123-iphone-se/C1_PASS_20260530_1430.png
qa/abc123-pixel/C4_FAIL_20260530_1512.png
```

| Field | Values |
| ----- | ------ |
| buildId | EAS build ID short form |
| device | `iphone-se`, `iphone-15-pro`, `pixel`, `samsung` |
| testId | C1–C15 |
| status | PASS, FAIL, BLOCKED |

**Required screenshots:** Every FAIL; first PASS of C1, C2, C3, C10 per device.

---

## 6. Video capture requirements

| Test ID | Recording | Minimum length |
| ------- | --------- | ---------------- |
| C2, C3 | **Required** | Full path to completion |
| C4, C5, C6 | **Required** | Signup through dashboard |
| C7, C8 | **Required** | Kill + reopen |
| C10 | **Required** | Trial tap through completion |
| C1, C9–C15 | Optional | On FAIL, required |

**Format:** MP4, device native screen record  
**Naming:** `qa/{buildId}/{device}/{testId}_{status}_{YYYYMMDD}.mp4`  
**Storage:** Shared drive / ticket attachment — link in matrix notes column (add if needed)

---

## 7. Sign-off procedure

| Step | Action | Owner |
| ---- | ------ | ----- |
| 1 | All matrix cells filled | Each tester |
| 2 | Summaries per device (Pass X/15) | QA Lead |
| 3 | Defect list reviewed; S0/S1 closed or waived in writing | Engineering + Product |
| 4 | OAuth tests C4/C5 confirmed on **preview build** (not Expo Go) | QA Lead |
| 5 | QA Lead signature on `PHASE_17_DEVICE_VALIDATION_MATRIX.md` | QA Lead |
| 6 | Engineering acknowledges results | Engineering Lead |
| 7 | Production build authorization request | DevOps |

**QA Lead sign-off:** __________________ **Date:** __________  
**Engineering acknowledgment:** __________________ **Date:** __________

---

## Quick reference — matrix location

Record all results in: **`PHASE_17_DEVICE_VALIDATION_MATRIX.md`**

Detailed expectations: **`PHASE_19_DEVICE_QA_MASTER_PLAN.md`**
