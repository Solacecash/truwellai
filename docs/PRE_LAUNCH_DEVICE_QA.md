# Pre-Launch Device QA Checklist

Run on **iPhone SE**, **iPhone Pro Max**, and one **Android 5–6"** device.

## Guardian path

- [ ] `/onboarding` → welcome CTA visible, no clipping
- [ ] Role → guardian → care-discovery → assessment
- [ ] AI processing auto-advances to score reveal
- [ ] future-vision → ai-demo → blueprint
- [ ] Register (email) → paywall → notifications → celebration → `/enter`
- [ ] Back button on steps 2–9, 12 (not on processing/celebration)
- [ ] Skip (steps 2–9) → register

## Professional path

- [ ] Role → professional → practice-profile → workflow
- [ ] Same shared steps 5–13 as guardian
- [ ] `professional_goals` populated in profile after signup (Supabase dashboard)

## Resume flow

- [ ] Start onboarding, exit at step 4, relaunch → resumes step 4 with role + answers
- [ ] Repeat for professional path at step 4

## Auth (conversion register)

- [ ] Email signup
- [ ] Google signup (conversion flow)
- [ ] Apple signup iOS (conversion flow)

## Paywall

- [ ] Continue free → notifications
- [ ] Purchase sandbox → notifications (Adapty)

## Analytics (dev console)

With migration applied, confirm `[onboarding-analytics]` logs or rows in `onboarding_analytics_events`:

- [ ] onboarding_started
- [ ] role_selected
- [ ] blueprint_viewed
- [ ] registration_completed
- [ ] paywall_viewed
- [ ] onboarding_completed

## Screenshots

Save 15 captures per `docs/PRE_LAUNCH_ONBOARDING_VISUAL.md` to `docs/screenshots/onboarding-rebuild/`.
