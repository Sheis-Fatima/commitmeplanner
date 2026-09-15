import { useMemo } from "react";
import { useCommitments } from "./useCommitments";
import { useAllActiveGoalSteps } from "./useGoals";
import { useSleepLogs, useSleepPreferences } from "./useSleep";
import {
  computeFreeSlots,
  allocateTasksDetailed,
  summarize,
  getWeekStart,
  stripConflicts,
  sleepLogToBlocks,
  projectSleepForWeek,
  type AllocatableTask,
  type SleepBlock,
} from "@/lib/timeAllocation";

export const useTimeAllocation = () => {
  const { data: commitments } = useCommitments();
  const { data: steps } = useAllActiveGoalSteps();
  const weekStart = useMemo(() => getWeekStart(), []);
  const weekEnd = useMemo(() => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + 7);
    return d;
  }, [weekStart]);
  const fromStr = weekStart.toISOString().slice(0, 10);
  const toStr = weekEnd.toISOString().slice(0, 10);
  const { data: sleepLogs } = useSleepLogs(fromStr, toStr);
  const { data: prefs } = useSleepPreferences();

  return useMemo(() => {
    const cs = commitments ?? [];
    const logs = sleepLogs ?? [];
    const target = prefs?.target_hours ?? 7.5;

    // Build sleep blocks from logs
    const loggedBlocks: SleepBlock[] = [];
    const loggedDates = new Set<string>();
    let loggedSleepMin = 0;
    for (const l of logs) {
      const start = new Date(l.start_time);
      const end = new Date(l.end_time);
      if (end <= start) continue;
      // Only count logs that touch this week
      if (end < weekStart || start >= weekEnd) continue;
      loggedSleepMin += l.duration_min;
      loggedDates.add(l.sleep_date);
      loggedBlocks.push(...sleepLogToBlocks(start, end, "logged"));
    }

    const projected = projectSleepForWeek(weekStart, prefs?.typical_bedtime ?? "23:00", prefs?.typical_waketime ?? "07:00", loggedDates);
    const allSleep = [...loggedBlocks, ...projected];

    const freeSlots = computeFreeSlots(cs, weekStart, allSleep);
    const tasks: AllocatableTask[] = (steps ?? []).map((s) => ({
      id: s.id,
      goal_id: s.goal_id,
      title: `${(s as any).goal_title ? (s as any).goal_title + ": " : ""}${s.title}`,
      notAfter: (s as any).goal_target_date ?? null,
    }));

    // Comfortable pace first; escalate the daily goal load only when deadlines demand it.
    const passes = [
      { maxBlocksPerDay: 2, maxPerGoalPerDay: 1, maxDailyGoalMinutes: 120, bufferMinutes: 15 },
      { maxBlocksPerDay: 3, maxPerGoalPerDay: 2, maxDailyGoalMinutes: 180, bufferMinutes: 10 },
      { maxBlocksPerDay: 4, maxPerGoalPerDay: 3, maxDailyGoalMinutes: 240, bufferMinutes: 10 },
      { maxBlocksPerDay: 6, maxPerGoalPerDay: 4, maxDailyGoalMinutes: 360, bufferMinutes: 5 },
      { maxBlocksPerDay: 8, maxPerGoalPerDay: 6, maxDailyGoalMinutes: 480, bufferMinutes: 0 },
    ];

    let result = allocateTasksDetailed(tasks, freeSlots, passes[0]);
    for (let i = 1; i < passes.length; i++) {
      // Only keep escalating while deadline-bound steps are still unplaced.
      const blocked = result.unscheduled.some((t) => !!t.notAfter);
      if (!blocked) break;
      result = allocateTasksDetailed(tasks, computeFreeSlots(cs, weekStart, allSleep), passes[i]);
    }

    const allocations = stripConflicts(result.allocations, cs, weekStart, allSleep);
    const unscheduled = result.unscheduled;
    const summary = summarize(cs, weekStart, allocations, allSleep, loggedSleepMin, target);
    return { weekStart, freeSlots, allocations, unscheduled, summary, sleepBlocks: allSleep, loggedSleepMin, targetHours: target };
  }, [commitments, steps, sleepLogs, prefs, weekStart, weekEnd]);
};
