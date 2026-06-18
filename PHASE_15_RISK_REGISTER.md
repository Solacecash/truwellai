# Phase 15 Risk Register

**Date:** 2026-05-30  
**Release:** TruWell AI onboarding RC1  
**Sorted:** Highest risk first

| Risk ID | Description | Impact | Likelihood | Mitigation | Launch Blocker |
| ------- | ----------- | ------ | ---------- | ---------- | -------------- |
| **R01** | Physical device QA not executed on 4 device classes | Undetected crashes, layout breaks, OAuth failures on real hardware | **High** | Execute `PHASE_15_PRODUCTION_GO_LIVE_CHECKLIST.md` critical tests | **Y** |
| **R02** | Google/Apple OAuth misconfigured in production EAS build | Account screen failures at funnel end; conversion drop | **High** | Verify `EXPO_PUBLIC_GOOGLE_*` + Apple entitlements in prod; test C4/C5 | **Y** |
| **R03** | Subscription screen does not invoke Adapty/native IAP; trial is UX-only until account | User expectation mismatch; revenue/compliance risk | **Medium** | Product sign-off; wire Adapty or document trial starts post-account | **Y** (if IAP required at screen 10) |
| **R04** | Supabase email confirmation enabled blocks instant post-signup session | User stuck after account screen | **Medium** | Confirm project auth settings; test email path on staging | **Conditional Y** |
| **R05** | Parallel onboarding funnels (`(auth)/welcome`, psych, register health-profile) | Wrong journey, split analytics, support confusion | **Medium** | Phase 14+ cleanup plan; monitor onboarding_started vs legacy | **N** |
| **R06** | Logged-out guard redirects app paths to `(auth)/welcome` not spec welcome | Deep link to `/scan` shows legacy slides | **Low** | Post-launch: guard → `ONBOARDING_ROUTES.welcome` or login | **N** |
| **R07** | Back from onboarding step 1 → legacy `(auth)/welcome` | User leaves spec funnel | **Low** | Change back handler to spec welcome post-launch | **N** |
| **R08** | Legacy `/onboarding/*` duplicate routes serve full implementations | Stale deep links bypass canonical paths | **Low** | Redirect-only stubs (planned Phase 14c) | **N** |
| **R09** | NativeWind spec gap | Strict audit failure; no user functional impact | **Low** (launch) | Post-launch migration per Phase 13 feasibility | **N** |
| **R10** | `onboarding_analytics_events` table missing | Silent analytics loss | **Low** | Migration or accept dev-log-only until table exists | **N** |
| **R11** | Re-export pattern: edits only in `app/onboarding/` miss `(onboarding)/` stubs | Drift between paths | **Low** | Colocate implementations; code review discipline | **N** |
| **R12** | Professional user with missing metadata falls through to `/enter` | Wrong dashboard | **Low** | Phase 14 `buildOnboardingAuthMetadata`; DB role fallback in index | **N** |
| **R13** | Accessibility gaps (VoiceOver labels, dynamic type) | App Store review / a11y complaints | **Low** | Optional tests O5/O6 in go-live checklist | **N** |
| **R14** | OneDrive / Windows path duplicate file entries | Merge confusion in dev | **Very low** | Normalize in git; no runtime impact | **N** |

---

## Risk heat summary

| Launch blockers (Y) | Count |
| ------------------- | ----- |
| Unconditional | **2** (R01, R02) |
| Conditional | **2** (R03, R04) |

---

## Residual risk after conditions met

If R01–R04 are cleared:

- **Medium residual:** R05 dual funnels
- **Low residual:** R06–R14

**Acceptable for v1 launch** with post-launch cleanup backlog.

---

## Evidence index

| Risk | Primary files |
| ---- | ------------- |
| R01 | PHASE_14_DEVICE_QA_REPORT.md |
| R02 | `lib/googleAuth.ts`, `app/(onboarding)/account.tsx` |
| R03 | `app/(onboarding)/subscription.tsx`, `lib/adapty.ts` |
| R04 | Supabase dashboard auth settings |
| R05 | `app/(auth)/welcome.tsx`, `app/(auth)/psych/*`, `register.tsx` |
| R06 | `app/_layout.tsx` L429–436 |
| R07 | `lib/useOnboardingNavigation.ts` L20–22 |
| R12 | `lib/onboardingAuthMetadata.ts`, `completeConversionOnboarding.ts` |
