# Productivity MVP — Fixes & Refinement Plan

A focused pass across Dashboard, Planner, Roadmap, and the Check-in flow to address the issues you listed. No core architecture changes — everything reuses the existing time-allocation engine, milestone, and check-in tables.

---

## 1. Responsiveness & "Create Goal" visibility

- Wrap all page content in a responsive container (`max-w-3xl` mobile, `max-w-6xl` desktop) inside `AppShell` so layouts breathe on tablet/desktop.
- Make the floating **Create Goal** FAB visible on every primary route (Dashboard, Planner, Roadmap, Insights), not just Dashboard/Planner.
- Add a secondary inline **+ New Goal** button in the Dashboard header so the CTA is reachable without scrolling.
- Audit grids: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3` for goal cards, milestone lists, and stats row.

## 2. Dashboard time bar — instant, accurate, real-time

- `WeeklyCapacityCard` already reads from `useTimeAllocation`, which depends on the `commitments` query. The issue is the cache is invalidated only on mutation success. Fix:
  - In `useCreateCommitment` / `useUpdateCommitment` / `useDeleteCommitment` / `useResolveCommitment`: add **optimistic updates** so the bar moves the moment the user saves.
  - Also invalidate `["all_active_goal_steps"]` so reallocation re-runs.
- Re-label the bar segments clearly: **Total · Engaged · Free**, with hours and % shown inline.

## 3. Planner — calendar-style schedule view

Replace the current "list of goals" Planner page with a true week calendar:

```text
        Mon   Tue   Wed   Thu   Fri   Sat   Sun
 08:00 ┌─────┬─────┬─────┬─────┬─────┬─────┬─────┐
 09:00 │Work │Work │Work │     │Work │     │     │
 ...   │     │     │     │     │     │     │     │
 18:00 │Goal │     │Goal │Goal │     │Goal │     │
 22:00 └─────┴─────┴─────┴─────┴─────┴─────┴─────┘
```

- New component `WeekCalendar.tsx`: 7 columns × hourly rows, current week, with a "today" highlight and Prev/Next week toggle.
- Render two layers: **commitments** (amber) and **confirmed goal blocks** (mint).
- Goal-management list stays accessible but moves to the Roadmap page (where steps already live), eliminating duplication.

## 4. Scheduling conflict fix

The current allocator already uses `computeFreeSlots` to remove commitment time, but two bugs cause overlaps:
1. Commitments without `start_time`/`end_time` (only `time_of_day`) silently fallback to a 60-min block but day-of-week filtering can miss `weekly` items not on Mondays.
2. `step_order: 9999` (used by skip) creates ties that re-place skipped items in the same slot.

Fixes in `src/lib/timeAllocation.ts`:
- Treat any commitment lacking both `start_time` and `end_time` as a full-day block-out for that day (or skip it entirely — opt for "skip and warn"), never as a default 08:00 slot.
- Add a final pass `assertNoConflicts(allocations, expandedCommitments)` that throws/strips any overlapping allocation (defensive guard).
- Honor `weekly` and `custom` frequencies properly and clamp to user window (default 08:00–22:00, configurable later).

## 5. Check-in system

### 5a. Remove progress bar from check-in dialog
- Drop the `Slider` and `progress` state from `CheckInDialog.tsx`.
- Derive the goal's `progress` from milestone completion ratio (completed milestones / total) inside `useCreateCheckIn`. Simpler, no manual slider.

### 5b. Dashboard-level attachments (PDF + image)
- Extend the `checkin-pdfs` storage bucket to accept images too (rename usage to `checkin-attachments`, allowed MIME: `application/pdf`, `image/png`, `image/jpeg`).
- Add an "Attachments" section on each Dashboard goal card showing recent uploads (thumbnail for images, file icon for PDFs) with a quick **+ Attach** button that links the upload to the goal's *next milestone*.

## 6. Dashboard shows confirmed plan, not suggestions

- Rename `SuggestedSchedule` → `TodaysPlan`. Show only **today + tomorrow** of the *committed* allocation (the engine's output is treated as confirmed once commitments are stable).
- Remove the wording "Suggested" from the UI; the bar and list now reflect the actual plan.
- Move the live re-allocation preview (multi-day) into the Planner calendar.

## 7. Weekly check-in moves into the Roadmap

- Delete `WeeklyCheckInCard` from Dashboard.
- Inside `MilestonesSection` (Roadmap), each milestone gets a **Check In** button that opens the existing `CheckInDialog` pre-bound to that milestone.
- If user **skips** or AI score < threshold and they don't override:
  - Mark milestone as "needs rework" (new column `status` on `goal_milestones`: `pending | done | skipped`)
  - Trigger reallocation: invalidate `all_active_goal_steps` + push the related goal step to end of queue (re-uses `useSkipStep` logic).

## 8. Roadmap milestone enhancements

- Add per-milestone **deliverable attachment** (PDF/image upload) directly in the Roadmap card — not only inside the check-in flow.
- Add a **Check In** button per milestone (links to dialog with milestone + attachment pre-filled).
- Status pill on each milestone: Pending · Submitted · Verified · Skipped.

## 9. System consistency

- Single source of truth: `useTimeAllocation` powers Dashboard's `TodaysPlan`, the Planner calendar, and the Insights "time spent" chart — no duplicated allocation logic.
- All mutations (commitments, steps, milestones, check-ins) invalidate the same set of queries: `["commitments"]`, `["all_active_goal_steps"]`, `["goals"]`, `["milestones", goalId]`.
- Insights page reads from the same hooks; verify counts match Dashboard.

---

## Technical Summary

**Files to edit**
- `src/lib/timeAllocation.ts` — strict conflict guard, frequency fixes
- `src/hooks/useCommitments.ts` — optimistic updates + cross-invalidation
- `src/hooks/useGoals.ts` — derive `progress` from milestones in `useCreateCheckIn`
- `src/hooks/useMilestones.ts` — add `status` field handling
- `src/components/CheckInDialog.tsx` — remove slider, accept image attachments, accept milestoneId prop
- `src/components/WeeklyCapacityCard.tsx` — relabel segments
- `src/components/MilestonesSection.tsx` — per-milestone attach + Check In buttons + status pill
- `src/pages/Dashboard.tsx` — remove `WeeklyCheckInCard` and `SuggestedSchedule`, add `TodaysPlan`, attachments section, header CTA
- `src/pages/Planner.tsx` — replace list with `WeekCalendar`
- `src/pages/Roadmap.tsx` — surface milestone check-in flow

**Files to create**
- `src/components/TodaysPlan.tsx`
- `src/components/WeekCalendar.tsx`
- `src/components/GoalAttachments.tsx`
- `src/hooks/useAttachments.ts`

**DB migrations**
- `goal_milestones`: add `status text default 'pending'` and `attachment_url text`
- Storage: rename/extend `checkin-pdfs` policy to allow image MIME types (or keep bucket name, broaden allowed types in client)

**Files to delete**
- `src/components/WeeklyCheckInCard.tsx`
- `src/components/SuggestedSchedule.tsx` (replaced by `TodaysPlan`)

No edge function changes required; `validate-checkin-pdf` continues to be used for PDF uploads, and image uploads skip AI validation (manual mark-complete).
