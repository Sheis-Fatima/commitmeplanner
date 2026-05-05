## Goal

Replace the hardcoded 8a–10p (98h) window with a true **24h/day model** where **sleep is a first-class, user-logged time block**. Sleep is flexible in *timing* but tracked toward a 7–8h/day duration target. Tasks are never scheduled during logged or planned sleep.

## Data model

### New table: `sleep_logs` (migration)
```
id           uuid pk default gen_random_uuid()
user_id      uuid not null
sleep_date   date not null         -- the "night of" date (date the sleep STARTED)
start_time   timestamptz not null  -- actual bedtime
end_time     timestamptz not null  -- actual wake time
duration_min int generated         -- (end - start) in minutes
quality      int null              -- optional 1–5 (future check-in field)
source       text not null default 'manual'  -- 'manual' | 'checkin'
created_at   timestamptz default now()
```
- RLS: standard `auth.uid() = user_id` for select/insert/update/delete.
- Validation trigger (NOT a CHECK): `end_time > start_time` and duration ≤ 16h.
- Index on `(user_id, sleep_date)`.

### New table: `sleep_preferences`
```
user_id          uuid pk
target_hours     numeric not null default 7.5   -- 7–8 typical
typical_bedtime  text null    -- "23:30" (hint only, never enforced)
typical_waketime text null    -- "07:00"
updated_at       timestamptz default now()
```
RLS: owner only. Used as a **planning hint** for future nights when no log exists yet.

## Scheduling logic (`src/lib/timeAllocation.ts`)

- Switch the window constants to a full day:
  ```ts
  DEFAULT_WINDOW_START = "00:00"
  DEFAULT_WINDOW_END   = "24:00"  // = 1440 min
  ```
  Update `toTime()` to wrap (`Math.floor(m/60) % 24`).
- New input: `sleepBlocks: { date, start, end }[]` derived from `sleep_logs` for the current week + `sleep_preferences` projected onto nights without a log.
- `expandCommitmentsToWeek()` is reused to produce per-day blocks; `computeFreeSlots()` and `stripConflicts()` now treat **commitments + sleep blocks** as protected. Tasks already allocated that overlap a newly logged sleep block are dropped (rescheduled on next allocation pass).
- `summarize()` returns four buckets against a 168h week:
  ```
  totalHours      = 168
  sleepHours      = sum of logged + projected sleep within week
  committedHours  = commitments (existing)
  allocatedHours  = goal work (existing)
  freeHours       = 168 - sleep - committed - allocated
  sleepTargetHours = preferences.target_hours * 7   // ~49–56
  sleepRemainingHours = max(0, sleepTargetHours - sleepHours)
  ```

## Hooks

- `useSleepLogs(weekStart?)` — fetch logs for the week, plus mutations `useCreateSleepLog`, `useUpdateSleepLog`, `useDeleteSleepLog`.
- `useSleepPreferences()` — read/update; defaults applied client-side if row missing.
- `useTimeAllocation` — pull sleep logs + prefs, project future nights using `typical_bedtime/waketime` (or 23:00–07:00 fallback), pass to `computeFreeSlots`/`stripConflicts`/`summarize`.

## UI

### `WeeklyCapacityCard.tsx`
- Header label: `168h week · target {target}h sleep`.
- Bar segments (left → right): **Sleep** (indigo), **Engaged** (amber), **Goal Work** (mint), **Free** (muted).
- Stat grid becomes 4 columns on `sm+`, 2×2 on mobile: Sleep / Engaged / Goal / Free.
- Sub-row under bar: `Sleep this week: {logged}h / {target}h · {remaining}h to go` with a thin secondary progress bar.

### New: `SleepLogDialog.tsx`
- Inputs: date picker (defaults to last night), bedtime (`<input type="time">`), wake time, optional quality 1–5.
- Renders a small **horizontal time-bar visualization** (00:00 → 24:00 ruler with the selected range highlighted; if range crosses midnight, draw two segments).
- Saves to `sleep_logs`. Shows duration and a soft hint if outside 7–8h ("recommended 7–8h, no penalty").

### New: `SleepCard.tsx` (Dashboard)
- Compact card above `TodaysPlan`: last night's sleep range as a bar, weekly totals, "+ Log sleep" button (opens `SleepLogDialog`).
- Empty state: "No sleep logged yet — tap to add."

### `CheckInDialog.tsx`
- Add an optional **Sleep** section between Mood and Notes:
  - "Log last night's sleep" toggle → reveals start/end time inputs (prefilled from preferences).
  - On submit, if filled, also writes a `sleep_logs` row with `source='checkin'` (no duplicate if one already exists for that date — update instead).

### Settings entry (lightweight)
- Reuse the FAB chooser pattern or add a small gear in `WeeklyCapacityCard` opening a mini-dialog to edit `sleep_preferences` (target hours slider 6–10, typical bedtime/wake time). Out of scope: full settings page.

## Scheduling guarantees
- Allocator never produces a task overlapping a sleep block (logged or projected).
- `stripConflicts` defensively removes any allocation that intersects a sleep block — so newly logged sleep instantly evicts conflicting goal work on the next render.
- Commitments that overlap sleep are still shown as commitments (we don't auto-edit user data); only auto-generated goal-work allocations move.

## Out of scope
- Wearable / HealthKit / Google Fit imports.
- Sleep quality analytics in Insights (can be a follow-up).
- Multi-segment naps in a single day (logs are one block per `sleep_date`; users can add more rows manually).
- Per-day variable target hours.

## Result
- Day = 24h, week = 168h, with sleep visibly carved out.
- Users log real sleep ranges; the planner respects them and never schedules over them.
- Weekly bar shows Sleep / Engaged / Goal Work / Free, plus a "X / target h sleep, Y to go" readout.
- Check-ins can capture sleep in one tap; preferences let users set their own target and typical schedule without locking them in.
