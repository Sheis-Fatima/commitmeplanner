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

function blocksForDay(date: string, commitments: ReturnType<typeof expandCommitmentsToWeek>, sleep: SleepBlock[]) {
  const winS = 0;
  const winE = DEFAULT_WINDOW_END_MIN;
  const all = [
    ...commitments.filter((b) => b.date === date).map((b) => ({ start: b.start, end: b.end })),
    ...sleep.filter((b) => b.date === date).map((b) => ({ start: b.start, end: b.end })),
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
    const merged = blocksForDay(date, expanded, sleepBlocks);

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
}

export function allocateTasks(
  tasks: AllocatableTask[],
  freeSlots: FreeSlot[],
  opts: { blockMinutes?: number; maxDailyGoalMinutes?: number; preferredStart?: number; preferredEnd?: number } = {},
): TaskAllocation[] {
  const block = opts.blockMinutes ?? DEFAULT_BLOCK_MIN;
  const maxDaily = opts.maxDailyGoalMinutes ?? DEFAULT_MAX_DAILY_GOAL_MIN;
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

  const dailyUsed: Record<string, number> = {};
  const allocations: TaskAllocation[] = [];

  for (const task of tasks) {
    const need = task.estimatedMinutes ?? block;
    for (const slot of workingSlots) {
      const used = dailyUsed[slot.date] || 0;
      if (used >= maxDaily) continue;
      const available = slot.endMin - slot.startMin;
      const cap = Math.min(available, maxDaily - used);
      if (cap < need) continue;
      const startMin = slot.startMin;
      const endMin = startMin + need;
      allocations.push({
        stepId: task.id,
        goalId: task.goal_id,
        title: task.title,
        date: slot.date,
        start: toTime(startMin),
        end: toTime(endMin),
        minutes: need,
      });
      slot.startMin = endMin;
      dailyUsed[slot.date] = used + need;
      break;
    }
  }
  return allocations;
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
