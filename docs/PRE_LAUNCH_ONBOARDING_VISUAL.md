# Pre-Launch Onboarding Visual Consistency Report

Dark-first conversion funnel. All screens use `OnboardingShell` + `OB` tokens from `theme/truwellBrand.ts`.

## Brand token compliance

| Token | Spec | Implementation | Status |
| ----- | ---- | -------------- | ------ |
| Electric Intelligence Blue | `#00B7FF` | `TRUWELL_COLORS.primary`, professional accent | Pass |
| Deep Tech Blue | `#0B3D91` | `TRUWELL_COLORS.primaryDark` | Pass |
| Premium Gold | `#D4AF37` | `TRUWELL_COLORS.gold`, blueprint FOMO, invites | Pass |
| Midnight Navy | `#0A1630` | `TRUWELL_COLORS.bgPrimary`, shell gradient | Pass |
| Energy Cyan | `#35D6FF` | `TRUWELL_COLORS.guardian`, guardian chips | Pass |
| Graphite Black | `#1A1A1A` | `TRUWELL_COLORS.graphite` | Pass |
| Neutrals | `#FFFFFF`, `#E8EEF5`, `#A0A8B8` | `OB.t100`, `OB.t70`, `OB.t45` | Pass |
| Glassmorphism | rgba white overlays | `OB.glass1`, `OB.glass2`, `GlassCard` | Pass |
| Progress | SegmentedIndicator only | `OnboardingShell` header | Pass |

## Screen-by-screen consistency

| Screen | Shell | Segments | Role accent | CTA footer | Scroll |
| ------ | ----- | -------- | ----------- | ---------- | ------ |
| Welcome (`index`) | Yes | Step 1 | Guardian default | Fixed | No (centered) |
| Role | Yes | Step 2 | Selected path | Fixed | Yes |
| Care discovery | Yes | Step 3 | Guardian cyan | Fixed | Yes |
| Guardian assessment | Yes | Step 4 | Guardian cyan | Fixed | Yes |
| Practice profile | Yes | Step 3 | Pro blue | Fixed | Yes |
| Workflow | Yes | Step 4 | Pro blue | Fixed | Yes |
| AI processing | Yes | Step 5 | Role-based | None (auto) | No |
| Score reveal | Yes | Step 6 | Role-based | Fixed | Yes |
| Future vision | Yes | Step 7 | Role-based | Fixed | Yes |
| AI demo | Yes | Step 8 | Role-based | Fixed | Yes |
| Blueprint | Yes | Step 9 | Gold FOMO card | Fixed | Yes |
| Register | No (auth layout) | N/A | Theme context | Form | Yes |
| Paywall | No (subscription) | N/A | Adapty UI | Plan CTAs | Yes |
| Notifications | Yes | Step 12 | Role-based | Dual CTA | No |
| Celebration | Yes | Step 13 | Role-based | Fixed | Yes |

## Known visual gaps (static review)

1. **Register / paywall** break out of `OnboardingShell` — expected; different layout systems.
2. **Light mode** — conversion funnel is dark-first; no light variant for onboarding shell.
3. **Small devices** — `GoalCard` grid and chip rows rely on wrap; device QA required for SE clipping.
4. **Fonts** — Clash Display / Cabinet Grotesk referenced in tokens but may fall back to system if OTFs missing.

## Screenshot inventory (device capture pending)

Capture on iPhone SE, iPhone Pro Max, and one Android device:

| # | Screen | Path | Captured |
| - | ------ | ---- | -------- |
| 1 | Welcome | `/onboarding` | Pending |
| 2 | Role | `/onboarding/role` | Pending |
| 3 | Care discovery | `/onboarding/guardian/care-discovery` | Pending |
| 4 | Assessment | `/onboarding/guardian/assessment` | Pending |
| 5 | Practice profile | `/onboarding/professional/practice-profile` | Pending |
| 6 | Workflow | `/onboarding/professional/workflow` | Pending |
| 7 | AI processing | `/onboarding/ai-processing` | Pending |
| 8 | Score reveal | `/onboarding/score-reveal` | Pending |
| 9 | Future vision | `/onboarding/future-vision` | Pending |
| 10 | AI demo | `/onboarding/ai-demo` | Pending |
| 11 | Blueprint | `/onboarding/blueprint` | Pending |
| 12 | Register | `/(auth)/register` | Pending |
| 13 | Paywall | `/onboarding/paywall-onboarding` | Pending |
| 14 | Notifications | `/onboarding/notifications` | Pending |
| 15 | Celebration | `/onboarding/celebration` | Pending |

Save to: `mobile/docs/screenshots/onboarding-rebuild/` (create when capturing).
