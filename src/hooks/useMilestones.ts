import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, useAuthReady } from "@/contexts/AuthContext";
import { toast } from "sonner";
import type { Goal } from "./useGoals";

export interface Milestone {
  id: string;
  goal_id: string;
  user_id: string;
  period_index: number;
  title: string;
  deliverable: string;
  due_date: string | null;
  completed: boolean;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export const useMilestones = (goalId: string | undefined) => {
  const { user, isReady } = useAuthReady();
  return useQuery({
    queryKey: ["milestones", goalId, user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("goal_milestones")
        .select("*")
        .eq("goal_id", goalId!)
        .order("period_index", { ascending: true });
      if (error) throw error;
      return data as Milestone[];
    },
    enabled: isReady && !!user && !!goalId,
  });
};

function periodsForFrequency(freq: string): number {
  switch ((freq || "weekly").toLowerCase()) {
    case "daily": return 7;
    case "weekly": return 6;
    case "biweekly": return 6;
    case "monthly": return 6;
    default: return 6;
  }
}

// Spread milestone due dates across the time actually available, never past the goal deadline.
function dueDateFor(
  index: number,
  freq: string,
  periods: number,
  targetDate?: string | null,
  start = new Date(),
): string {
  const base = new Date(start);
  base.setHours(0, 0, 0, 0);

  if (targetDate) {
    const end = new Date(targetDate + "T00:00:00");
    const totalDays = Math.max(1, Math.round((end.getTime() - base.getTime()) / 86400000));
    const share = totalDays / periods;
    const offset = Math.max(1, Math.round(share * (index + 1)));
    const d = new Date(base);
    d.setDate(d.getDate() + Math.min(offset, totalDays));
    return d.toISOString().slice(0, 10);
  }

  const f = (freq || "weekly").toLowerCase();
  const step = f === "daily" ? 1 : f === "weekly" ? 7 : f === "biweekly" ? 14 : 30;
  const d = new Date(base);
  d.setDate(d.getDate() + step * (index + 1));
  return d.toISOString().slice(0, 10);
}

export const useGenerateMilestones = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (goal: Goal) => {
      const periods = periodsForFrequency(goal.checkin_frequency);
      const { data, error } = await supabase.functions.invoke("generate-milestones", {
        body: {
          goalTitle: goal.title,
          goalDescription: goal.description,
          goalCategory: goal.category,
          checkinFrequency: goal.checkin_frequency,
          periods,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      const milestones = (data.milestones || []) as Array<{ title: string; deliverable: string }>;
      // Return suggestions only (do not insert yet — user edits/approves first)
      return milestones.map((m, i) => ({
        ...m,
        period_index: i,
        due_date: dueDateFor(i, goal.checkin_frequency),
      }));
    },
    onError: (err: Error) => toast.error(err.message),
  });
};

export const useSaveMilestones = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async ({
      goalId,
      milestones,
      replace = true,
    }: {
      goalId: string;
      milestones: Array<{ title: string; deliverable: string; period_index: number; due_date: string | null }>;
      replace?: boolean;
    }) => {
      if (replace) {
        await supabase.from("goal_milestones").delete().eq("goal_id", goalId);
      }
      const inserts = milestones.map((m) => ({
        goal_id: goalId,
        user_id: user!.id,
        period_index: m.period_index,
        title: m.title,
        deliverable: m.deliverable,
        due_date: m.due_date,
      }));
      if (inserts.length) {
        const { error } = await supabase.from("goal_milestones").insert(inserts);
        if (error) throw error;
      }
      return { goalId };
    },
    onSuccess: ({ goalId }) => {
      queryClient.invalidateQueries({ queryKey: ["milestones", goalId] });
      toast.success("Milestones saved");
    },
    onError: (err: Error) => toast.error(err.message),
  });
};

export const useToggleMilestone = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, completed, goal_id }: { id: string; completed: boolean; goal_id: string }) => {
      const { error } = await supabase
        .from("goal_milestones")
        .update({ completed, completed_at: completed ? new Date().toISOString() : null })
        .eq("id", id);
      if (error) throw error;
      return { goal_id };
    },
    onSuccess: ({ goal_id }) => {
      queryClient.invalidateQueries({ queryKey: ["milestones", goal_id] });
    },
    onError: (err: Error) => toast.error(err.message),
  });
};

export const useNextMilestone = (goalId: string | undefined) => {
  const { data } = useMilestones(goalId);
  return (data || []).find((m) => !m.completed) || null;
};

export const useValidateCheckInPdf = () => {
  return useMutation({
    mutationFn: async (args: {
      pdfPath: string;
      deliverable: string;
      goalTitle?: string;
      milestoneTitle?: string;
    }) => {
      const { data, error } = await supabase.functions.invoke("validate-checkin-pdf", { body: args });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data as { score: number; feedback: string; meets_expectations: boolean };
    },
    onError: (err: Error) => toast.error(err.message),
  });
};