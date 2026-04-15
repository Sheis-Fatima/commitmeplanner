import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, useAuthReady } from "@/contexts/AuthContext";
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
  time_of_day: string | null;
  frequency: string;
  custom_days: string[] | null;
  created_at: string;
  updated_at: string;
}

export const useEmergencyCommitments = () => {
  const { user, isReady } = useAuthReady();

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
    enabled: isReady && !!user,
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
      time_of_day?: string;
      frequency?: string;
      custom_days?: string[];
    }) => {
      const { data, error } = await supabase
        .from("emergency_commitments")
        .insert({ ...commitment, user_id: user!.id })
        .select()
        .single();
      if (error) throw error;

      // Auto-reschedule: pause active goals and extend their target dates
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
        toast.success(`Plan adjusted! ${pausedCount} goal${pausedCount !== 1 ? "s" : ""} paused, deadlines extended.`);
      } else {
        toast.success("Plan adjusted!");
      }
    },
    onError: (err: Error) => toast.error(err.message),
  });
};

export const useResolveEmergency = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("emergency_commitments")
        .update({ resolved: true, resolved_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;

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
        toast.success(`You're back on track! ${resumedCount} goal${resumedCount !== 1 ? "s" : ""} resumed.`);
      } else {
        toast.success("You're back on track!");
      }
    },
    onError: (err: Error) => toast.error(err.message),
  });
};
