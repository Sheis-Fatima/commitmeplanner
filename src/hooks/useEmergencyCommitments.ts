import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface EmergencyCommitment {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  priority: string;
  duration_days: number;
  start_date: string;
  end_date: string;
  resolved: boolean;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
}

export const useEmergencyCommitments = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["emergency_commitments", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("emergency_commitments")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as EmergencyCommitment[];
    },
    enabled: !!user,
  });
};

export const useCreateEmergencyCommitment = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (commitment: {
      title: string;
      description?: string;
      priority: string;
      duration_days: number;
      start_date: string;
      end_date: string;
    }) => {
      // 1. Create the emergency commitment
      const { data, error } = await supabase
        .from("emergency_commitments")
        .insert({ ...commitment, user_id: user!.id })
        .select()
        .single();
      if (error) throw error;

      // 2. Auto-reschedule: pause active goals and extend their target dates
      const { data: activeGoals } = await supabase
        .from("goals")
        .select("id, target_date, status")
        .eq("status", "active");

      if (activeGoals && activeGoals.length > 0) {
        const pausePromises = activeGoals.map((goal) => {
          if (goal.target_date) {
            const targetDate = new Date(goal.target_date);
            targetDate.setDate(targetDate.getDate() + commitment.duration_days);
            return supabase.from("goals").update({ status: "paused" as const, target_date: targetDate.toISOString().split("T")[0] }).eq("id", goal.id);
          }
          return supabase.from("goals").update({ status: "paused" as const }).eq("id", goal.id);
        });
        await Promise.all(pausePromises);
      }

      return { commitment: data, pausedCount: activeGoals?.length ?? 0 };
    },
    onSuccess: ({ pausedCount }) => {
      queryClient.invalidateQueries({ queryKey: ["emergency_commitments"] });
      queryClient.invalidateQueries({ queryKey: ["goals"] });
      if (pausedCount > 0) {
        toast.success(`Emergency added! ${pausedCount} goal${pausedCount !== 1 ? "s" : ""} paused & rescheduled.`);
      } else {
        toast.success("Emergency commitment added!");
      }
    },
    onError: (err: Error) => toast.error(err.message),
  });
};

export const useResolveEmergency = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      // 1. Mark as resolved
      const { error } = await supabase
        .from("emergency_commitments")
        .update({ resolved: true, resolved_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;

      // 2. Resume paused goals
      const { data: pausedGoals } = await supabase
        .from("goals")
        .select("id")
        .eq("status", "paused");

      if (pausedGoals && pausedGoals.length > 0) {
        await Promise.all(
          pausedGoals.map((g) =>
            supabase.from("goals").update({ status: "active" as const }).eq("id", g.id)
          )
        );
      }

      return { resumedCount: pausedGoals?.length ?? 0 };
    },
    onSuccess: ({ resumedCount }) => {
      queryClient.invalidateQueries({ queryKey: ["emergency_commitments"] });
      queryClient.invalidateQueries({ queryKey: ["goals"] });
      if (resumedCount > 0) {
        toast.success(`Emergency resolved! ${resumedCount} goal${resumedCount !== 1 ? "s" : ""} resumed.`);
      } else {
        toast.success("Emergency resolved!");
      }
    },
    onError: (err: Error) => toast.error(err.message),
  });
};
