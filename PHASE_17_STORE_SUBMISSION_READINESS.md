# Phase 17 Store Submission Readiness

**Date:** 2026-05-30  
**App:** TruWell AI v3.0.0 (build 1)  
**Bundle IDs:** iOS `com.truwell.ai` | Android `com.truwell.ai`  
**Assessment:** Static audit + Phases 14–16. **No store console access in this phase.**

**Rating scale**

| Rating | Meaning |
| ------ | ------- |
| **READY** | Meets store requirements; no known submission blockers |
| **READY WITH CONDITIONS** | Submittable after listed conditions closed |
| **NOT READY** | Known rejection or compliance risk without remediation |

---

## Cross-platform review areas

### Onboarding flow

| Criterion | Assessment | Notes |
| --------- | ---------- | ----- |
| 11-screen spec funnel implemented | **Pass (code)** | `(onboarding)/` re-exports; logic in `app/onboarding/*` |
| Cold start → spec welcome | **Pass (code)** | Phase 14 fix in `app/index.tsx` |
| Role fork guardian / professional | **Pass (code)** | |
| Resume after kill | **Unverified (runtime)** | C7, C8 on device matrix |
| Visual polish (fonts, circuit texture) | **Pass (code)** | Phase 12 |
| Legacy parallel funnels exist | **Risk** | `(auth)/welcome`, psych funnel — monitor for confusion |

### Auth flow

| Criterion | Assessment | Notes |
| --------- | ---------- | ----- |
| Apple Sign-In on iOS | **Pass (code)** | Required if other social login offered |
| Google Sign-In | **Pass (code)** | Production config unverified |
| Email signup | **Pass (code)** | Email confirm policy unknown |
| Professional → expert routing | **Pass (code)** | Phase 14 metadata |
| Terms acceptance on account | **Partial** | Checkbox text present; **not tappable links** — `account.tsx` L259 |

### Subscription flow

| Criterion | Assessment | Notes |
| --------- | ---------- | ----- |
| Screen 10 copy ($9.99, 7-day trial) | **Pass (code)** | Matches spec |
| Native IAP at trial CTA | **No** | Navigates to account, not store sheet |
| Adapty in settings | **Pass (code)** | Full purchase/restore elsewhere |
| Restore purchases | **Pass (code)** | Settings subscription screen |
| Store guideline 3.1.1 (paid digital content) | **Conditional** | If app sells subscriptions, IAP must be available where paywall implies purchase |

**Product decision required:** Screen 10 "Start My Free 7-Day Trial" does not invoke App Store / Play billing. Acceptable if positioned as **intent** before account creation; **risk** if users expect immediate store trial.

### Privacy implications

| Criterion | Assessment | Notes |
| --------- | ---------- | ----- |
| Privacy policy URL in app | **Needs verification** | Settings may link; account screen text not linked |
| Health data collection disclosure | **Pass (code)** | Permission strings in `app.config.ts` |
| Analytics opt-out | **Pass (code)** | `usage_analytics` preference respected |
| Onboarding analytics to Supabase | **Disclosed?** | Confirm privacy policy covers funnel events |
| Account deletion | **Pass (code)** | `lib/accountDeletion.ts` exists |
| HIPAA / medical disclaimer | **Pass (code)** | Spec disclaimers with doctor links (verify on live screens) |

### Analytics

| Criterion | Assessment | Notes |
| --------- | ---------- | ----- |
| First-party onboarding events | **Pass (code)** | `onboardingAnalytics.ts` |
| ATT (iOS tracking) | **N/A or unverified** | No third-party ad SDK found in onboarding |
| Google Play Data safety form | **Needs human input** | Map Supabase + Adapty + camera/mic permissions |

### Account creation

| Criterion | Assessment | Notes |
| --------- | ---------- | ----- |
| Account required for full app | **Partial** | "Continue Free" bypasses account |
| Profile saved post-onboarding | **Pass (code)** | `saveTruwellOnboarding.ts` |
| Duplicate account handling | **Unverified** | Runtime QA |

### Onboarding completion

| Criterion | Assessment | Notes |
| --------- | ---------- | ----- |
| Guardian → `/enter` | **Pass (code)** | `completeConversionOnboarding.ts` |
| Professional → `/(expert)` | **Pass (code)** | |
| Completion analytics event | **Pass (code)** | `onboarding_completed` |
| State persistence | **Pass (code)** | Zustand + AsyncStorage |

---

## Apple App Store

| Area | Rating | Rationale |
| ---- | ------ | --------- |
| **Overall submission readiness** | **READY WITH CONDITIONS** | |

### Conditions before submit

1. Complete device QA matrix C1–C15 on **iPhone SE** and **iPhone 15 Pro** (minimum).
2. Verify Sign in with Apple on TestFlight build (Guideline 4.8 if Google offered).
3. Confirm subscription messaging vs IAP behavior (Guideline 3.1.1) — product sign-off on trial UX.
4. Add tappable Terms of Service and Privacy Policy links on account screen (Guideline 5.1.1).
5. Confirm App Privacy nutrition labels match data collected (health, analytics, identifiers).
6. EAS production build with OAuth secrets on device.

### Apple-specific strengths

- `usesAppleSignIn: true` declared
- Permission usage strings present for camera, mic, photos, notifications, Face ID
- No tablet requirement (`supportsTablet: false`)

### Apple-specific risks

| Risk | Severity |
| ---- | -------- |
| Trial CTA without StoreKit purchase | Medium |
| Terms checkbox without links | Medium |
| Zero TestFlight QA sign-off | High |
| Email confirmation blocking signup | Low–Medium |

---

## Google Play Store

| Area | Rating | Rationale |
| ---- | ------ | --------- |
| **Overall submission readiness** | **READY WITH CONDITIONS** | |

### Conditions before submit

1. Complete device QA matrix C1–C15 on **Pixel** and **Samsung Galaxy** (minimum).
2. Google OAuth client configured for release SHA-1 / package name.
3. Subscription / trial copy aligned with Play Billing policy if monetization claimed at onboarding.
4. Data safety section completed (health, personal info, app activity).
5. Privacy policy URL in Play Console and in-app.
6. Production AAB built via EAS `production` profile.

### Google-specific strengths

- Google Sign-In plugin configured
- Adapty + Play Billing integration path in settings
- Edge-to-edge and adaptive icon configured

### Google-specific risks

| Risk | Severity |
| ---- | -------- |
| OAuth SHA-1 mismatch on release keystore | High |
| Misleading subscription UX (trial without billing) | Medium |
| Device QA not executed | High |
| Account deletion policy visibility | Low–Medium |

---

## Store metadata checklist (human completion)

| Item | Apple | Google |
| ---- | ----- | ------ |
| App description reflects onboarding | ☐ | ☐ |
| Screenshots include spec funnel | ☐ | ☐ |
| Privacy policy URL | ☐ | ☐ |
| Support URL | ☐ | ☐ |
| Subscription disclosure in description | ☐ | ☐ |
| Content rating questionnaire | ☐ | ☐ |
| Export compliance | ☐ | N/A |

---

## Summary

| Store | Readiness |
| ----- | --------- |
| **Apple App Store** | **READY WITH CONDITIONS** |
| **Google Play Store** | **READY WITH CONDITIONS** |

**Onboarding is not approved for immediate store submission** until device QA and configuration conditions are signed off. Codebase is submission-candidate quality; gates are operational and compliance verification.

**Store release approver:** _________________________ Date: __________
