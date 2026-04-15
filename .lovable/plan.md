

## Plan: Redesign "Emergency Commitment" as "Something Came Up" Quick Adjust

### Summary
Replace the current complex emergency commitment dialog with a simplified, friendly "Something Came Up" screen. Streamline inputs to 3 fields, add an "All day" toggle, and show an automatic impact summary (paused goals, extended deadlines) before confirming.

### Changes

**1. Redesign `EmergencyCommitmentDialog.tsx` → `QuickAdjustDialog.tsx`**
- Rename component and file
- New header: "Something Came Up" with a softer icon (Clock or CalendarX instead of AlertTriangle)
- Simplified form with only 3 inputs:
  - "What happened?" — single text input (required)
  - Time selector — toggle between "All day" and a specific time picker
  - Duration — 3 pill buttons: "1 day", "3 days", "1 week"
- Remove: description textarea, priority selector, frequency/custom days selectors
- Add an **impact preview section** below the form showing: "This will pause X active goals and extend deadlines by Y days"
- Friendly submit button: "Adjust My Plan" (primary color, not destructive red)
- After submission, show a brief summary toast: "Plan adjusted! X goals paused, deadlines extended by Y days"

**2. Update `useEmergencyCommitments.ts` hook**
- Simplify `useCreateEmergencyCommitment` mutation input — default priority to "high", frequency to "daily", remove custom_days
- After pausing goals, call the `generate-roadmap` edge function for each active goal to suggest updated steps (returned in success callback)
- Update success toast to use friendlier language ("Plan adjusted!" instead of "Emergency added!")

**3. Update `useResolveEmergency` hook**
- Change toast to "You're back on track! X goals resumed."

**4. Update all references across the app**
- `Dashboard.tsx`: Replace `EmergencyCommitmentDialog` import with `QuickAdjustDialog`, rename button label from emergency-related to "Something Came Up"
- `Planner.tsx`: Same import swap, update emergency banner text to "Something came up" with softer styling (amber instead of red)
- `Onboarding.tsx`: If emergency dialog is referenced, update import

**5. No database changes needed**
- The existing `emergency_commitments` table already supports all needed fields; we just default some values in code.

### Technical Details
- New file: `src/components/QuickAdjustDialog.tsx`
- Delete: `src/components/EmergencyCommitmentDialog.tsx`
- Edit: `src/hooks/useEmergencyCommitments.ts`, `src/pages/Dashboard.tsx`, `src/pages/Planner.tsx`
- The impact preview will query active goals count client-side from the existing `useGoals` hook passed as a prop

