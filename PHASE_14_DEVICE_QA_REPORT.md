# Phase 14 Device QA Report

**Date:** 2026-05-30  
**Build:** RC1 post Phase 14B fixes  
**Reference:** `PHASE_13_DEVICE_QA_EXECUTION_GUIDE.md`  
**Execution status:** **Code-validated + checklist ready** — physical device sign-off **PENDING**

---

## Phase 14B pre-QA validation (code review)

| Check | Method | Result |
| ----- | ------ | ------ |
| Cold-start guest → spec welcome | `app/index.tsx` uses `ONBOARDING_ROUTES.welcome` | **PASS (code)** |
| Guest resume unchanged | `guestConversionResumeHref` before default | **PASS (code)** |
| OAuth metadata helper | `buildOnboardingAuthMetadata` on email/Google/Apple | **PASS (code)** |
| Professional `user_type: expert` | Helper sets expert when `selectedRole === 'professional'` | **PASS (code)** |
| Completion logging | `completeConversionOnboarding` logs destination | **PASS (code)** |
| TypeScript | `npx tsc --noEmit` | **PASS** |

---

## Test matrix summary

| Device | Guardian 1→11 | Pro 1→11 | Resume | Auth | Visual | Overall |
| ------ | ------------- | -------- | ------ | ---- | ------ | ------- |
| iPhone SE | ☐ Pending | ☐ Pending | ☐ Pending | ☐ Pending | ☐ Pending | ☐ Pending |
| iPhone 15 Pro | ☐ Pending | ☐ Pending | ☐ Pending | ☐ Pending | ☐ Pending | ☐ Pending |
| Pixel | ☐ Pending | ☐ Pending | ☐ Pending | ☐ Pending | ☐ Pending | ☐ Pending |
| Samsung Galaxy | ☐ Pending | ☐ Pending | ☐ Pending | ☐ Pending | ☐ Pending | ☐ Pending |

---

## iPhone SE

### Guardian path (screens 1–11)

| Step | Screen | Expected UI | Animation | Navigation | Persistence | Analytics | Pass/Fail | Notes |
| ---- | ------ | ----------- | --------- | ---------- | ----------- | --------- | --------- | ----- |
| 1 | welcome | Spec UI, circuit texture, CTA | Stagger FadeInDown | → role | step=1 | onboarding_started | ☐ | Cold start should land here post-14B |
| 2 | role | Guardian/Pro cards | Spring select | → care-discovery | selectedRole | role_selected | ☐ | |
| 3 | care-discovery | Teal, ProgressBar 25% | GoalCard spring | → ai-processing or assessment | goals | — | ☐ | |
| 4 | assessment | ProgressBar 50%, adaptive Q | Chip select | → ai-processing | answers | — | ☐ | |
| 5 | ai-processing | Checklist, pulse rings | 900ms items | auto → score-reveal | step 5 | — | ☐ | |
| 6 | score-reveal | Score 45–85 | Ring + reward spring | → future-vision | healthScore | — | ☐ | |
| 7 | future-vision | Without then With panels | Slide up 0.4s | → ai-demo | step 7 | — | ☐ | |
| 8 | ai-demo | Chat + lock card | Typing 2.5s | → blueprint | step 8 | — | ☐ | |
| 9 | blueprint | Locked blur rows | Stagger | → subscription | blueprint ready | blueprint_viewed | ☐ | |
| 10 | subscription | Trial copy | FadeIn | → account / continue free | step 10 | paywall_viewed | ☐ | |
| 11 | account | Apple/Google/email | — | → /enter | complete | registration_completed | ☐ | |

### Professional path (screens 1–11)

| Step | Screen | Pass/Fail | Notes |
| ---- | ------ | --------- | ----- |
| 1–2 | welcome → role (Pro) | ☐ | |
| 3–4 | practice-profile → workflow | ☐ | Progress 25% / 50% |
| 5–9 | ai-processing → blueprint | ☐ | Pro checklist + score 78 |
| 10–11 | subscription → account | ☐ | Verify OAuth → `/(expert)` post-14B |

### Cross-cutting (iPhone SE)

| Test | Pass/Fail | Notes |
| ---- | --------- | ----- |
| Kill app at score-reveal, reopen | ☐ | |
| Kill app at subscription, reopen | ☐ | |
| Progress bars steps 3–9 only | ☐ | |
| Circuit texture visible | ☐ | |
| Sign in from welcome | ☐ | → /sign-in → /login |

---

## iPhone 15 Pro

Same checklist as iPhone SE. Additional checks:

| Test | Pass/Fail | Notes |
| ---- | --------- | ----- |
| Dynamic Island / safe area | ☐ | |
| Apple Sign-In on account screen | ☐ | Verify `user_type` for pro path |
| Share sheet on score-reveal | ☐ | |

---

## Pixel

Same funnel checklist as iPhone SE. Additional checks:

| Test | Pass/Fail | Notes |
| ---- | --------- | ----- |
| Google Sign-In account screen | ☐ | Verify pro → expert metadata |
| Back gesture disabled on ai-processing | ☐ | |
| DM Sans / Montserrat loaded | ☐ | |

---

## Samsung Galaxy

Same funnel checklist as Pixel. Additional checks:

| Test | Pass/Fail | Notes |
| ---- | --------- | ----- |
| One UI gesture nav + footer CTA | ☐ | |
| Google Sign-In (Samsung device) | ☐ | |
| Font rendering | ☐ | |

---

## Authentication matrix (all devices)

| Provider | Role | Expected route | Pass/Fail | Notes |
| -------- | ---- | -------------- | --------- | ----- |
| Email | Guardian | `/enter` | ☐ | |
| Email | Professional | `/(expert)` | ☐ | |
| Google | Guardian | `/enter` | ☐ | |
| Google | Professional | `/(expert)` | ☐ | **14B fix target** |
| Apple | Guardian | `/enter` | ☐ | iOS only |
| Apple | Professional | `/(expert)` | ☐ | **14B fix target** |

---

## Subscription & completion

| Test | Expected | Pass/Fail |
| ---- | -------- | --------- |
| Trial CTA → account | step 11 | ☐ |
| Continue free → main app | completeConversionOnboarding | ☐ |
| Profile upsert after signup | saveTruwellOnboarding | ☐ |
| Completion log in console | `[TruWell onboarding] completeConversionOnboarding` | ☐ |

---

## Regression (all devices)

| Area | Pass/Fail |
| ---- | --------- |
| `/login` returning user | ☐ |
| Main tabs post-onboarding | ☐ |
| Scanner reachable | ☐ |
| Telehealth reachable | ☐ |
| Legacy `/onboarding` redirect | ☐ |

---

## Sign-off

| Role | Name | Date | Result |
| ---- | ---- | ---- | ------ |
| Engineering | | | Code review PASS; device PENDING |
| QA | | | |
| Product | | | |

**Gate:** All four device rows must pass guardian + pro happy paths before **GO** without conditions.
