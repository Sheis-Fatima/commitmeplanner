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

      // Update goal progress
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
