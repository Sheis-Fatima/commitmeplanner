import type { Commitment } from "@/hooks/useCommitments";

export interface FreeSlot {
  date: string;
  dayIndex: number;
  start: string;
  end: string;
  minutes: number;
}

export interface TaskAllocation {
  stepId: string;
  goalId: string;
  title: string;
  date: string;
  start: string;
  end: string;
  minutes: number;
}

export interface SleepBlock {
  date: string;       // the date this block falls on (may be split across two)
  start: number;      // minutes 0..1440
  end: number;        // minutes (>start, ≤1440)
  source: "logged" | "projected";
}

export interface EmergencyCommitmentLike {
  id: string;
  title: string;
  start_date: string;
  end_date: string;
  time_of_day: string | null;
  resolved: boolean;
}

export interface PlanningBlock {
  date: string;
  start: number;
  end: number;
  title: string;
  kind: "emergency";
}

export interface AllocationSummary {
  totalHours: number;
  sleepHours: number;
  committedHours: number;
  allocatedHours: number;
  freeHours: number;
  sleepTargetHours: number;
  sleepRemainingHours: number;
}

const DAY_NAMES = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
const DEFAULT_WINDOW_START = "00:00";
const DEFAULT_WINDOW_END_MIN = 1440;
const DEFAULT_BLOCK_MIN = 60;
const DEFAULT_MAX_DAILY_GOAL_MIN = 240;

const toMin = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + (m || 0);
};
const toTime = (m: number) => {
  const clamped = ((m % 1440) + 1440) % 1440;
  const h = Math.floor(clamped / 60);
  const min = clamped % 60;
  return `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
};

const isoDate = (d: Date) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x.toISOString().slice(0, 10);
};

function commitmentRunsOnDay(c: Commitment, dayIndex: number): boolean {
  const f = (c.frequency || "daily").toLowerCase();
  if (f === "daily") return true;
  if (f === "weekdays") return dayIndex >= 1 && dayIndex <= 5;
  if (f === "weekends") return dayIndex === 0 || dayIndex === 6;
  if (f === "weekly") return dayIndex === 1;
  if (f === "custom") {
    const days = (c.custom_days || []).map((d) => d.toLowerCase().slice(0, 3));
    return days.includes(DAY_NAMES[dayIndex].slice(0, 3));
  }
  return false;
}

export function expandCommitmentsToWeek(
  commitments: Commitment[],
  weekStart: Date,
): Array<{ date: string; dayIndex: number; start: number; end: number; title: string }> {
  const out: Array<{ date: string; dayIndex: number; start: number; end: number; title: string }> = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    const dayIndex = d.getDay();
    const dateStr = isoDate(d);
    for (const c of commitments) {
      if (c.resolved) continue;
      if (!commitmentRunsOnDay(c, dayIndex)) continue;
      const s = c.start_time || c.time_of_day;
      const e = c.end_time || (s ? toTime(toMin(s) + 60) : null);
      if (!s || !e) continue;
      out.push({ date: dateStr, dayIndex, start: toMin(s), end: toMin(e), title: c.title });
    }
  }
  return out;
}


// Expand active emergency commitments into protected calendar blocks.
// An all-day interruption reserves the whole day. A timed interruption reserves one hour.
export function expandEmergencyCommitmentsToWeek(
  emergencies: EmergencyCommitmentLike[],
  weekStart: Date,
): PlanningBlock[] {
  const out: PlanningBlock[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    const date = isoDate(d);
    for (const e of emergencies) {
      if (e.resolved) continue;
      if (date < e.start_date || date > e.end_date) continue;
      if (!e.time_of_day) {
        out.push({ date, start: 0, end: 1440, title: e.title, kind: "emergency" });
        continue;
      }
      const start = toMin(e.time_of_day);
      out.push({ date, start, end: Math.min(1440, start + 60), title: e.title, kind: "emergency" });
    }
  }
  return out;
}

// Convert a logged sleep range (with absolute timestamps) into per-day minute blocks.
// Splits at midnight if needed.
export function sleepLogToBlocks(start: Date, end: Date, source: "logged" | "projected" = "logged"): SleepBlock[] {
  const blocks: SleepBlock[] = [];
  let cur = new Date(start);
  while (cur < end) {
    const dayEnd = new Date(cur);
    dayEnd.setHours(24, 0, 0, 0);
    const segEnd = end < dayEnd ? end : dayEnd;
    const startMin = cur.getHours() * 60 + cur.getMinutes();
    const endMin = segEnd.getTime() === dayEnd.getTime()
      ? 1440
      : segEnd.getHours() * 60 + segEnd.getMinutes();
    if (endMin > startMin) {
      blocks.push({ date: isoDate(cur), start: startMin, end: endMin, source });
    }
    cur = dayEnd;
  }
  return blocks;
}

// Project recurring sleep onto a week using bedtime/wake hints. Skips dates already covered by logged blocks.
export function projectSleepForWeek(
  weekStart: Date,
  bedtime: string | null,
  waketime: string | null,
  loggedDates: Set<string>,
): SleepBlock[] {
  if (!bedtime || !waketime) return [];
  const out: SleepBlock[] = [];
  const bedMin = toMin(bedtime);
  const wakeMin = toMin(waketime);
  for (let i = 0; i < 7; i++) {
    const night = new Date(weekStart);
    night.setDate(night.getDate() + i);
    const nightDate = isoDate(night);
    if (loggedDates.has(nightDate)) continue;
    if (bedMin >= wakeMin) {
      // crosses midnight: bed→24:00 on nightDate, 0:00→wake on next day
      out.push({ date: nightDate, start: bedMin, end: 1440, source: "projected" });
      const next = new Date(night);
      next.setDate(next.getDate() + 1);
      out.push({ date: isoDate(next), start: 0, end: wakeMin, source: "projected" });
    } else {
      out.push({ date: nightDate, start: bedMin, end: wakeMin, source: "projected" });
    }
  }
  return out;
}

function blocksForDay(
  date: string,
  commitments: ReturnType<typeof expandCommitmentsToWeek>,
  sleep: SleepBlock[],
  extraBlocks: PlanningBlock[] = [],
) {
  const winS = 0;
  const winE = DEFAULT_WINDOW_END_MIN;
  const all = [
    ...commitments.filter((b) => b.date === date).map((b) => ({ start: b.start, end: b.end })),
    ...sleep.filter((b) => b.date === date).map((b) => ({ start: b.start, end: b.end })),
    ...extraBlocks.filter((b) => b.date === date).map((b) => ({ start: b.start, end: b.end })),
  ]
    .map((b) => ({ start: Math.max(b.start, winS), end: Math.min(b.end, winE) }))
    .filter((b) => b.end > b.start)
    .sort((a, b) => a.start - b.start);
  const merged: Array<{ start: number; end: number }> = [];
  for (const b of all) {
    const last = merged[merged.length - 1];
    if (last && b.start <= last.end) last.end = Math.max(last.end, b.end);
    else merged.push({ ...b });
  }
  return merged;
}

export function computeFreeSlots(
  commitments: Commitment[],
  weekStart: Date,
  sleepBlocks: SleepBlock[] = [],
  extraBlocks: PlanningBlock[] = [],
): FreeSlot[] {
  const winS = 0;
  const winE = DEFAULT_WINDOW_END_MIN;
  const expanded = expandCommitmentsToWeek(commitments, weekStart);
  const slots: FreeSlot[] = [];

  for (let i = 0; i < 7; i++) {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    const dayIndex = d.getDay();
    const date = isoDate(d);
    const merged = blocksForDay(date, expanded, sleepBlocks, extraBlocks);

    let cursor = winS;
    for (const b of merged) {
      if (b.start > cursor) {
        slots.push({ date, dayIndex, start: toTime(cursor), end: toTime(b.start), minutes: b.start - cursor });
      }
      cursor = Math.max(cursor, b.end);
    }
    if (cursor < winE) {
      slots.push({ date, dayIndex, start: toTime(cursor), end: toTime(winE), minutes: winE - cursor });
    }
  }
  return slots;
}

export interface AllocatableTask {
  id: string;
  goal_id: string;
  title: string;
  estimatedMinutes?: number;
  /** ISO date (yyyy-mm-dd) the task must not be scheduled after (goal deadline). */
  notAfter?: string | null;
}

export interface AllocateOptions {
  blockMinutes?: number;
  maxDailyGoalMinutes?: number;
  /** Max number of goal blocks placed on a single day (all goals combined). */
  maxBlocksPerDay?: number;
  /** Max number of blocks a single goal may take on a single day. */
  maxPerGoalPerDay?: number;
  /** Breathing room kept before the commitment / sleep block that follows. */
  bufferMinutes?: number;
  preferredStart?: number;
  preferredEnd?: number;
}

export interface AllocationResult {
  allocations: TaskAllocation[];
  unscheduled: AllocatableTask[];
}

export function allocateTasksDetailed(
  tasks: AllocatableTask[],
  freeSlots: FreeSlot[],
  opts: AllocateOptions = {},
): AllocationResult {
  const block = opts.blockMinutes ?? DEFAULT_BLOCK_MIN;
  const maxDaily = opts.maxDailyGoalMinutes ?? DEFAULT_MAX_DAILY_GOAL_MIN;
  const maxBlocksPerDay = opts.maxBlocksPerDay ?? 2;
  const maxPerGoalPerDay = opts.maxPerGoalPerDay ?? 1;
  const buffer = opts.bufferMinutes ?? 15;
  const preferStart = opts.preferredStart ?? toMin("08:00");
  const preferEnd = opts.preferredEnd ?? toMin("22:00");

  // Prefer slots inside the awake window; fall back to anything else
  const score = (sStart: number) => (sStart >= preferStart && sStart < preferEnd ? 0 : 1);

  const workingSlots = freeSlots
    .map((s) => ({ ...s, startMin: toMin(s.start), endMin: toMin(s.end) }))
    .sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      const sa = score(a.startMin);
      const sb = score(b.startMin);
      if (sa !== sb) return sa - sb;
      return a.startMin - b.startMin;
    });

  const dates = Array.from(new Set(workingSlots.map((s) => s.date))).sort();

  // Queue of pending tasks per goal, preserving incoming order
  const queues = new Map<string, AllocatableTask[]>();
  const goalOrder: string[] = [];
  for (const t of tasks) {
    if (!queues.has(t.goal_id)) {
      queues.set(t.goal_id, []);
      goalOrder.push(t.goal_id);
    }
    queues.get(t.goal_id)!.push(t);
  }

  const allocations: TaskAllocation[] = [];
  let rotation = 0;

  const place = (task: AllocatableTask, date: string, dailyMin: number): number | null => {
    const need = task.estimatedMinutes ?? block;
    if (dailyMin + need > maxDaily) return null;
    for (const slot of workingSlots) {
      if (slot.date !== date) continue;
      const endsAtMidnight = slot.endMin >= DEFAULT_WINDOW_END_MIN;
      const usable = slot.endMin - slot.startMin - (endsAtMidnight ? 0 : buffer);
      if (usable < need) continue;
      const startMin = slot.startMin;
      const endMin = startMin + need;
      allocations.push({
        stepId: task.id,
        goalId: task.goal_id,
        title: task.title,
        date,
        start: toTime(startMin),
        end: toTime(endMin),
        minutes: need,
      });
      slot.startMin = endMin + buffer;
      return need;
    }
    return null;
  };

  for (const date of dates) {
    let blocksToday = 0;
    let minutesToday = 0;
    const perGoalToday: Record<string, number> = {};

    // Round-robin across goals so one goal never eats the whole day
    let guard = 0;
    while (blocksToday < maxBlocksPerDay && guard < goalOrder.length * maxBlocksPerDay + goalOrder.length) {
      guard++;
      let placedThisPass = false;
      for (let i = 0; i < goalOrder.length && blocksToday < maxBlocksPerDay; i++) {
        const goalId = goalOrder[(rotation + i) % goalOrder.length];
        if ((perGoalToday[goalId] || 0) >= maxPerGoalPerDay) continue;
        const q = queues.get(goalId)!;
        const idx = q.findIndex((t) => !t.notAfter || date <= t.notAfter);
        if (idx === -1) continue;
        const task = q[idx];
        const used = place(task, date, minutesToday);
        if (used === null) continue;
        q.splice(idx, 1);
        minutesToday += used;
        blocksToday++;
        perGoalToday[goalId] = (perGoalToday[goalId] || 0) + 1;
        placedThisPass = true;
      }
      if (!placedThisPass) break;
    }
    rotation++;
  }

  const unscheduled: AllocatableTask[] = [];
  for (const q of queues.values()) unscheduled.push(...q);

  return { allocations, unscheduled };
}

export function allocateTasks(
  tasks: AllocatableTask[],
  freeSlots: FreeSlot[],
  opts: AllocateOptions = {},
): TaskAllocation[] {
  return allocateTasksDetailed(tasks, freeSlots, opts).allocations;
}

export function stripConflicts(
  allocations: TaskAllocation[],
  commitments: Commitment[],
  weekStart: Date,
  sleepBlocks: SleepBlock[] = [],
): TaskAllocation[] {
  const expanded = expandCommitmentsToWeek(commitments, weekStart);
  return allocations.filter((a) => {
    const aS = toMin(a.start);
    const aE = toMin(a.end);
    const conflictCommit = expanded.some((b) => b.date === a.date && aS < b.end && aE > b.start);
    if (conflictCommit) return false;
    const conflictSleep = sleepBlocks.some((b) => b.date === a.date && aS < b.end && aE > b.start);
    return !conflictSleep;
  });
}

export function summarize(
  commitments: Commitment[],
  weekStart: Date,
  allocations: TaskAllocation[],
  sleepBlocks: SleepBlock[] = [],
  loggedSleepMinutes = 0,
  targetHoursPerDay = 7.5,
): AllocationSummary {
  const totalHours = (DEFAULT_WINDOW_END_MIN * 7) / 60; // 168
  const expanded = expandCommitmentsToWeek(commitments, weekStart);

  // Sum committed minutes per day (merged), excluding any overlap with sleep
  let committedMin = 0;
  let sleepMin = 0;
  for (let i = 0; i < 7; i++) {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    const date = isoDate(d);

    // Merge sleep for the day
    const sleepDay = sleepBlocks
      .filter((b) => b.date === date)
      .map((b) => ({ start: b.start, end: b.end }))
      .sort((a, b) => a.start - b.start);
    const sleepMerged: Array<{ start: number; end: number }> = [];
    for (const b of sleepDay) {
      const last = sleepMerged[sleepMerged.length - 1];
      if (last && b.start <= last.end) last.end = Math.max(last.end, b.end);
      else sleepMerged.push({ ...b });
    }
    sleepMin += sleepMerged.reduce((s, b) => s + (b.end - b.start), 0);

    // Commitments minus sleep overlap
    const dayBlocks = expanded
      .filter((b) => b.date === date)
      .map((b) => ({ start: b.start, end: b.end }))
      .sort((a, b) => a.start - b.start);
    const merged: Array<{ start: number; end: number }> = [];
    for (const b of dayBlocks) {
      const last = merged[merged.length - 1];
      if (last && b.start <= last.end) last.end = Math.max(last.end, b.end);
      else merged.push({ ...b });
    }
    for (const b of merged) {
      let segMin = b.end - b.start;
      for (const s of sleepMerged) {
        const ovStart = Math.max(b.start, s.start);
        const ovEnd = Math.min(b.end, s.end);
        if (ovEnd > ovStart) segMin -= ovEnd - ovStart;
      }
      committedMin += Math.max(0, segMin);
    }
  }

  const allocatedMin = allocations.reduce((s, a) => s + a.minutes, 0);
  const sleepHours = sleepMin / 60;
  const committedHours = committedMin / 60;
  const allocatedHours = allocatedMin / 60;
  const freeHours = Math.max(0, totalHours - sleepHours - committedHours - allocatedHours);
  const sleepTargetHours = targetHoursPerDay * 7;
  const loggedHours = loggedSleepMinutes / 60;
  const sleepRemainingHours = Math.max(0, sleepTargetHours - loggedHours);

  return {
    totalHours,
    sleepHours,
    committedHours,
    allocatedHours,
    freeHours,
    sleepTargetHours,
    sleepRemainingHours,
  };
}

export function getWeekStart(date = new Date()): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay();
  d.setDate(d.getDate() - day);
  return d;
}
