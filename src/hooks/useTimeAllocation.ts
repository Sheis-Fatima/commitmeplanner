import { useMemo } from "react";
import { useCommitments } from "./useCommitments";
import { useAllActiveGoalSteps } from "./useGoals";
import {
  computeFreeSlots,
  allocateTasks,
  summarize,
  getWeekStart,
  type AllocatableTask,
} from "@/lib/timeAllocation";

export const useTimeAllocation = () => {
  const { data: commitments } = useCommitments();
  const { data: steps } = useAllActiveGoalSteps();

  return useMemo(() => {
    const weekStart = getWeekStart();
    const cs = commitments ?? [];
    const freeSlots = computeFreeSlots(cs, weekStart);
    const tasks: AllocatableTask[] = (steps ?? []).map((s) => ({
      id: s.id,
      goal_id: s.goal_id,
      title: `${(s as any).goal_title ? (s as any).goal_title + ": " : ""}${s.title}`,
    }));
    const allocations = allocateTasks(tasks, freeSlots);
    const summary = summarize(cs, weekStart, allocations);
    return { weekStart, freeSlots, allocations, summary };
  }, [commitments, steps]);
};