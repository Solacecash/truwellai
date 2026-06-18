# Phase 21F — Preview Build Authorization

**Date:** 2026-05-30  
**After:** Phase 21 remediation complete

---

## Ready for Preview Build?

# YES

**With DevOps precondition:** EAS preview environment must have Supabase + Google web client ID set (unchanged from Phase 20).

---

## Ready for QA Distribution?

# YES

**After** DevOps produces preview artifacts and records build IDs in `PHASE_17_DEVICE_VALIDATION_MATRIX.md`.

QA package: `PHASE_20_QA_EXECUTION_PACKAGE.md`

---

## Remaining blockers (preview QA only)

| Blocker | Prevents preview build? | Prevents QA? | Owner |
| ------- | ----------------------- | ------------ | ----- |
| EAS preview env vars not set | **Yes** | **Yes** | DevOps |
| Google Cloud Android SHA-1 not registered | No (build succeeds) | **Yes** for C4 | DevOps |
| Supabase Apple provider not configured | No | **Yes** for C5 iOS | Backend |
| No physical devices | No | **Yes** | QA |
| Trial/IAP product sign-off | No | No (C9/C10 still testable) | Product |
| app.json version 1.0.0 drift | No | No | Engineering (post-QA) |

**No engineering code blockers remain for preview build authorization.**

---

## Authorized commands (DevOps)

```powershell
cd mobile
eas env:list --environment preview
eas build --profile preview --platform android
eas build --profile preview --platform ios
```

**Not authorized:** production build, store submit

---

## Sign-off

| Role | Preview YES | Name | Date |
| ---- | ----------- | ---- | ---- |
| Engineering | ☐ | | |
| DevOps | ☐ | | |
| QA Lead | ☐ | | |
