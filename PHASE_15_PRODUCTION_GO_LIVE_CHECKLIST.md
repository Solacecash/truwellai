# Phase 15 Production Go-Live Checklist

**Date:** 2026-05-30  
**Release:** TruWell AI onboarding RC1  
**Sources:** PHASE_12/13/14 device QA documents

---

## Pre-release gates (all platforms)

| # | Gate | Owner | Done |
| - | ---- | ----- | ---- |
| G1 | `npx tsc --noEmit` PASS | Eng | ☑ |
| G2 | Cold-start → `/(onboarding)/welcome` verified on device | QA | ☐ |
| G3 | OAuth client IDs in EAS production profile | DevOps | ☐ |
| G4 | Supabase email confirmation policy documented | Backend | ☐ |
| G5 | Adapty products aligned with subscription copy | Product | ☐ |
| G6 | Privacy/terms links valid on account screen | Legal | ☐ |
| G7 | Analytics table `onboarding_analytics_events` exists (or graceful fail OK) | Backend | ☐ |

---

## Critical tests (must pass all devices)

Execute on **iPhone SE**, **iPhone 15 Pro**, **Pixel**, **Samsung Galaxy**.

| ID | Test | Expected |
| -- | ---- | -------- |
| C1 | Fresh install cold start | Spec welcome (ShieldLogo, CTA, circuit texture) |
| C2 | Guardian full path 1→11 | Completes to `/enter` with account created |
| C3 | Professional full path 1→11 | Completes to `/(expert)` with pro OAuth/email |
| C4 | Google signup (pro) | `user_type: expert` → expert dashboard |
| C5 | Apple signup (pro, iOS) | Same as C4 |
| C6 | Email signup (guardian) | `/enter` + profile saved |
| C7 | Kill app at score-reveal; reopen | Resumes funnel, not welcome |
| C8 | Kill app at subscription; reopen | Resumes subscription or account |
| C9 | Continue free on subscription | Main app without crash |
| C10 | Trial CTA → account → complete | No navigation loop |
| C11 | Sign in from welcome | `/sign-in` → `/login` works |
| C12 | ai-processing | No back button; auto-advance ~3–4s |
| C13 | Post-onboarding scanner tab | Opens (regression) |
| C14 | Post-onboarding telehealth | Opens (regression) |
| C15 | Existing `/login` user | Dashboard, not forced onboarding |

---

## High-priority tests

| ID | Test | Expected |
| -- | ---- | -------- |
| H1 | Progress bar visible steps 3–9 only | Correct % per role |
| H2 | Score reveal guardian | Score ≤ 85; share sheet opens |
| H3 | Score reveal pro | 78 + hrs/week subtitle |
| H4 | Blueprint locked rows | Blur/frost + premium tag |
| H5 | AI demo typing + lock card | ~2.5s then premium card |
| H6 | Future vision | Without panel then With slides up |
| H7 | Subscription copy | $9.99, 7-day trial, role headlines |
| H8 | Skip from step 3–9 | → subscription |
| H9 | Deep link `/onboarding` | → spec welcome |
| H10 | Legacy `/onboarding/role` | Resolves without crash |
| H11 | DM Sans / Montserrat on onboarding | Legible on SE + Samsung |
| H12 | Safe area / notch | CTA not clipped on 15 Pro |
| H13 | Android back on ai-processing | No crash (gesture disabled) |
| H14 | `paywall_viewed` analytics | Fires on subscription (dev log or DB) |
| H15 | `registration_completed` analytics | Fires on account success |

---

## Optional tests

| ID | Test | Expected |
| -- | ---- | -------- |
| O1 | Adaptive assessment >4 goals | ≤ 8 questions |
| O2 | Circuit texture visibility | Faint pattern on OLED/LCD |
| O3 | Restore purchases (if UI added later) | Adapty restore OK |
| O4 | Offline mid-funnel | Graceful error, no corrupt state |
| O5 | Large font accessibility | No critical truncation |
| O6 | VoiceOver / TalkBack on welcome + account | Labels present |
| O7 | Psych funnel entry (if still linked) | Does not hijack conversion cold start |
| O8 | Register flow from login | Still reaches health-profile if intended |

---

## Per-device sign-off matrix

| Device | Critical (C1–C15) | High (H1–H15) | Optional | Tester | Date |
| ------ | ------------------- | ------------- | -------- | ------ | ---- |
| iPhone SE | ☐ /15 | ☐ /15 | ☐ | | |
| iPhone 15 Pro | ☐ /15 | ☐ /15 | ☐ | | |
| Pixel | ☐ /15 | ☐ /15 | ☐ | | |
| Samsung Galaxy | ☐ /15 | ☐ /15 | ☐ | | |

**Go-live minimum:** All **Critical** tests pass on all four device classes.

---

## Post-release monitoring (first 72 hours)

- [ ] Onboarding start rate (`onboarding_started`)
- [ ] Paywall view → registration completion funnel
- [ ] Crash-free sessions on `(onboarding)/*`
- [ ] OAuth error rate (Google/Apple)
- [ ] Support tickets mentioning "wrong dashboard" (pro vs guardian)

---

## References

- `PHASE_12_DEVICE_QA_CHECKLIST.md`
- `PHASE_13_DEVICE_QA_EXECUTION_GUIDE.md`
- `PHASE_14_DEVICE_QA_REPORT.md`
