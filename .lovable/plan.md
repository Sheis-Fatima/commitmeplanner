

## Plan: Add Start/End Time to Onboarding Commitments + Fix Password Reset Redirect

### Problem 1: Onboarding commitments use single "Time of Day" instead of start/end time range
### Problem 2: Password reset link redirects to dashboard instead of the reset password page (because `ProtectedRoute` and `AuthContext` see a valid session from the recovery token and redirect away)

---

### Changes

**1. Update Onboarding commitment form with start/end times**
- File: `src/pages/Onboarding.tsx`
- Replace `timeOfDay: string` in `OnboardingCommitment` interface with `startTime: string` and `endTime: string`
- Update `defaultCommitment` accordingly
- Replace the single "Time of Day" input with two time inputs: "Start Time" and "End Time"
- Update the commitment display to show time range (e.g., `9:00 – 17:00`)
- Update the `handleFinish` submission to pass `start_time` and `end_time` instead of `time_of_day`

**2. Fix password reset flow — prevent ProtectedRoute from hijacking recovery sessions**
- File: `src/contexts/AuthContext.tsx`
  - In `onAuthStateChange`, detect `PASSWORD_RECOVERY` event and set a flag (e.g., `isRecoverySession`) in context or redirect to `/reset-password`
- File: `src/pages/ResetPassword.tsx`
  - Simplify session validation — listen for `PASSWORD_RECOVERY` event from auth state change instead of fragile URL hash checking
  - Remove the redirect-to-auth logic that fires when hash doesn't contain recovery params (the hash gets consumed by Supabase client before the component mounts)
- File: `src/components/ProtectedRoute.tsx`
  - Check if the current URL is `/reset-password` or if there's a recovery event, and skip the auth redirect in that case

  Alternative (simpler): In `AuthContext`, when `onAuthStateChange` fires with event `PASSWORD_RECOVERY`, use `window.location` to navigate to `/reset-password` before the app renders the dashboard. This way the recovery session is intercepted at the auth layer.

### Technical Details

- The `PASSWORD_RECOVERY` event fires in `onAuthStateChange` when a user clicks the reset link. We intercept this event in `AuthContext` and navigate to `/reset-password`.
- Since `ResetPassword` is NOT wrapped in `ProtectedRoute`, once we navigate there, the user stays on that page.
- The `ResetPassword` page already calls `supabase.auth.updateUser({ password })` which is correct — it just needs to reliably reach this page.
- For onboarding times: the `commitments` table already has `start_time` and `end_time` columns from the previous migration.

