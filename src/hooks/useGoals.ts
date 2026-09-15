import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, useAuthReady } from "@/contexts/AuthContext";
import { Tables, TablesInsert } from "@/integrations/supabase/types";
import { toast } from "sonner";

export type Goal = Tables<"goals">;
export type GoalStep = Tables<"goal_steps">;
export type CheckIn = Tables<"check_ins">;

export const useGoals = () => {
  const { user, isReady } = useAuthReady();

  return useQuery({
    queryKey: ["goals", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("goals")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: isReady && !!user,
  });
};

export const useAllActiveGoalSteps = () => {
  const { user, isReady } = useAuthReady();

  return useQuery({
    queryKey: ["all_active_goal_steps", user?.id],
    queryFn: async () => {
      const { data: goals, error: gErr } = await supabase
        .from("goals")
        .select("id, title, status, target_date")
        .eq("status", "active");
      if (gErr) throw gErr;
      const goalIds = (goals ?? []).map((g) => g.id);
      if (goalIds.length === 0)
        return [] as Array<GoalStep & { goal_title: string; goal_target_date: string | null }>;
      const { data: steps, error: sErr } = await supabase
        .from("goal_steps")
        .select("*")
        .in("goal_id", goalIds)
        .eq("completed", false)
        .order("step_order", { ascending: true });
      if (sErr) throw sErr;
      const goalMap = new Map((goals ?? []).map((g) => [g.id, g]));
      return (steps ?? []).map((s) => ({
        ...s,
        goal_title: goalMap.get(s.goal_id)?.title ?? "",
        goal_target_date: goalMap.get(s.goal_id)?.target_date ?? null,
      }));
    },
    enabled: isReady && !!user,
  });
};

export const useGoalSteps = (goalId: string | undefined) => {
  const { user, isReady } = useAuthReady();

  return useQuery({
    queryKey: ["goal_steps", goalId, user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("goal_steps")
        .select("*")
        .eq("goal_id", goalId!)
        .order("step_order", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: isReady && !!user && !!goalId,
  });
};

export const useCheckIns = (goalId: string | undefined) => {
  const { user, isReady } = useAuthReady();

  return useQuery({
    queryKey: ["check_ins", goalId, user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("check_ins")
        .select("*")
        .eq("goal_id", goalId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: isReady && !!user && !!goalId,
  });
};

export const useCreateGoal = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (goal: Omit<TablesInsert<"goals">, "user_id">) => {
      const { data, error } = await supabase
        .from("goals")
        .insert({ ...goal, user_id: user!.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals"] });
      toast.success("Goal created!");
    },
    onError: (err: Error) => toast.error(err.message),
  });
};

export const useUpdateGoal = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Partial<TablesInsert<"goals">>) => {
      const { data, error } = await supabase
        .from("goals")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals"] });
      queryClient.invalidateQueries({ queryKey: ["all_active_goal_steps"] });
      toast.success("Goal updated");
    },
    onError: (err: Error) => toast.error(err.message),
  });
};

export const useDeleteGoal = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      // Delete related steps and check-ins first
      await supabase.from("goal_steps").delete().eq("goal_id", id);
      await supabase.from("check_ins").delete().eq("goal_id", id);
      const { error } = await supabase.from("goals").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals"] });
      toast.success("Goal deleted");
    },
    onError: (err: Error) => toast.error(err.message),
  });
};

export const useCompleteGoal = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("goals")
        .update({ status: "completed" as const, progress: 100 })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals"] });
      toast.success("Goal completed! 🎉");
    },
    onError: (err: Error) => toast.error(err.message),
  });
};

export const useCreateGoalStep = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (step: Omit<TablesInsert<"goal_steps">, "user_id">) => {
      const { data, error } = await supabase
        .from("goal_steps")
        .insert({ ...step, user_id: user!.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["goal_steps", data.goal_id] });
    },
    onError: (err: Error) => toast.error(err.message),
  });
};

export const useToggleStep = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, completed, goal_id }: { id: string; completed: boolean; goal_id: string }) => {
      const { error } = await supabase
        .from("goal_steps")
        .update({ completed, completed_at: completed ? new Date().toISOString() : null })
        .eq("id", id);
      if (error) throw error;
      return { goal_id };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["goal_steps", data.goal_id] });
      queryClient.invalidateQueries({ queryKey: ["all_active_goal_steps"] });
      queryClient.invalidateQueries({ queryKey: ["goals"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });
};

export const useSkipStep = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id }: { id: string }) => {
      // Push step to end of queue so the allocator picks other steps first
      const { error } = await supabase
        .from("goal_steps")
        .update({ step_order: 9999 })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all_active_goal_steps"] });
      queryClient.invalidateQueries({ queryKey: ["goal_steps"] });
      toast.success("Skipped — re-allocating");
    },
    onError: (err: Error) => toast.error(err.message),
  });
};

export const useCreateCheckIn = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (checkIn: Omit<TablesInsert<"check_ins">, "user_id">) => {
      const { data, error } = await supabase
        .from("check_ins")
        .insert({ ...checkIn, user_id: user!.id })
        .select()
        .single();
      if (error) throw error;

      await supabase
        .from("goals")
        .update({ progress: checkIn.progress_value })
        .eq("id", checkIn.goal_id);

      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["check_ins", data.goal_id] });
      queryClient.invalidateQueries({ queryKey: ["goals"] });
      toast.success("Check-in recorded!");
    },
    onError: (err: Error) => toast.error(err.message),
  });
};

export const useGenerateRoadmap = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (goal: Goal) => {
      const { data, error } = await supabase.functions.invoke("generate-roadmap", {
        body: {
          goalTitle: goal.title,
          goalDescription: goal.description,
          goalCategory: goal.category,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      const steps = data.steps as Array<{ title: string; description: string }>;

      // Insert all steps
      const inserts = steps.map((s, i) => ({
        goal_id: goal.id,
        user_id: user!.id,
        title: s.title,
        description: s.description,
        step_order: i,
      }));

      const { error: insertError } = await supabase.from("goal_steps").insert(inserts);
      if (insertError) throw insertError;

      return steps;
    },
    onSuccess: (_data, goal) => {
      queryClient.invalidateQueries({ queryKey: ["goal_steps", goal.id] });
      toast.success("AI roadmap generated!");
    },
    onError: (err: Error) => toast.error(err.message),
  });
};
