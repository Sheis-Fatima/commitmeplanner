import type { Commitment } from "@/hooks/useCommitments";

export interface FreeSlot {
  date: string; // YYYY-MM-DD
  dayIndex: number; // 0=Sun..6=Sat
  start: string; // HH:MM
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

export interface AllocationSummary {
  totalHours: number;
  committedHours: number;
  allocatedHours: number;
  freeHours: number;
}

const DAY_NAMES = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
const DEFAULT_WINDOW_START = "08:00";
const DEFAULT_WINDOW_END = "22:00";
const DEFAULT_BLOCK_MIN = 60;
const DEFAULT_MAX_DAILY_GOAL_MIN = 240;

const toMin = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + (m || 0);
};
const toTime = (m: number) => {
  const h = Math.floor(m / 60);
  const min = m % 60;
  return `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
};

function commitmentRunsOnDay(c: Commitment, dayIndex: number): boolean {
  const f = (c.frequency || "daily").toLowerCase();
  if (f === "daily") return true;
  if (f === "weekdays") return dayIndex >= 1 && dayIndex <= 5;
  if (f === "weekends") return dayIndex === 0 || dayIndex === 6;
  if (f === "weekly") return dayIndex === 1; // default to Monday
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
    const dateStr = d.toISOString().slice(0, 10);
    for (const c of commitments) {
      if (c.resolved) continue;
      if (!commitmentRunsOnDay(c, dayIndex)) continue;
      const s = c.start_time || c.time_of_day;
      const e = c.end_time || (s ? toTime(toMin(s) + 60) : null);
      // Skip commitments without any time info — they don't block specific slots.
      if (!s || !e) continue;
      out.push({ date: dateStr, dayIndex, start: toMin(s), end: toMin(e), title: c.title });
    }
  }
  return out;
}

export function computeFreeSlots(
  commitments: Commitment[],
  weekStart: Date,
  windowStart = DEFAULT_WINDOW_START,
  windowEnd = DEFAULT_WINDOW_END,
): FreeSlot[] {
  const winS = toMin(windowStart);
  const winE = toMin(windowEnd);
  const expanded = expandCommitmentsToWeek(commitments, weekStart);
  const slots: FreeSlot[] = [];

  for (let i = 0; i < 7; i++) {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    const dayIndex = d.getDay();
    const date = d.toISOString().slice(0, 10);
    const dayBlocks = expanded
      .filter((b) => b.date === date)
      .map((b) => ({ start: Math.max(b.start, winS), end: Math.min(b.end, winE) }))
      .filter((b) => b.end > b.start)
      .sort((a, b) => a.start - b.start);

    // Merge overlapping
    const merged: Array<{ start: number; end: number }> = [];
    for (const b of dayBlocks) {
      const last = merged[merged.length - 1];
      if (last && b.start <= last.end) last.end = Math.max(last.end, b.end);
      else merged.push({ ...b });
    }

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
  opts: { blockMinutes?: number; maxDailyGoalMinutes?: number } = {},
): TaskAllocation[] {
  const block = opts.blockMinutes ?? DEFAULT_BLOCK_MIN;
  const maxDaily = opts.maxDailyGoalMinutes ?? DEFAULT_MAX_DAILY_GOAL_MIN;

  // Mutable working copy, sorted chronologically
  const workingSlots = freeSlots
    .map((s) => ({ ...s, startMin: toMin(s.start), endMin: toMin(s.end) }))
    .sort((a, b) => (a.date === b.date ? a.startMin - b.startMin : a.date.localeCompare(b.date)));

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

// Defensive guard: drop any allocation that overlaps a commitment block.
export function stripConflicts(
  allocations: TaskAllocation[],
  commitments: Commitment[],
  weekStart: Date,
): TaskAllocation[] {
  const expanded = expandCommitmentsToWeek(commitments, weekStart);
  return allocations.filter((a) => {
    const aS = toMin(a.start);
    const aE = toMin(a.end);
    return !expanded.some(
      (b) => b.date === a.date && aS < b.end && aE > b.start,
    );
  });
}

export function summarize(
  commitments: Commitment[],
  weekStart: Date,
  allocations: TaskAllocation[],
  windowStart = DEFAULT_WINDOW_START,
  windowEnd = DEFAULT_WINDOW_END,
): AllocationSummary {
  const totalHours = ((toMin(windowEnd) - toMin(windowStart)) * 7) / 60;
  const expanded = expandCommitmentsToWeek(commitments, weekStart);
  const winS = toMin(windowStart);
  const winE = toMin(windowEnd);
  // Sum committed minutes within window, merged per day to avoid double count
  let committedMin = 0;
  for (let i = 0; i < 7; i++) {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    const date = d.toISOString().slice(0, 10);
    const dayBlocks = expanded
      .filter((b) => b.date === date)
      .map((b) => ({ start: Math.max(b.start, winS), end: Math.min(b.end, winE) }))
      .filter((b) => b.end > b.start)
      .sort((a, b) => a.start - b.start);
    const merged: Array<{ start: number; end: number }> = [];
    for (const b of dayBlocks) {
      const last = merged[merged.length - 1];
      if (last && b.start <= last.end) last.end = Math.max(last.end, b.end);
      else merged.push({ ...b });
    }
    committedMin += merged.reduce((s, b) => s + (b.end - b.start), 0);
  }
  const allocatedMin = allocations.reduce((s, a) => s + a.minutes, 0);
  const committedHours = committedMin / 60;
  const allocatedHours = allocatedMin / 60;
  const freeHours = Math.max(0, totalHours - committedHours - allocatedHours);
  return { totalHours, committedHours, allocatedHours, freeHours };
}

export function getWeekStart(date = new Date()): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay();
  d.setDate(d.getDate() - day); // start on Sunday
  return d;
}