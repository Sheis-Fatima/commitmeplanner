import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuthReady } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface DailyMoodLog {
  id: string;
  user_id: string;
  check_in_date: string;
  mood: number;
  note: string | null;
  created_at: string;
  updated_at: string;
}

const today = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const useTodayMood = () => {
  const { user, isReady } = useAuthReady();

  return useQuery({
    queryKey: ["daily_mood", user?.id, "today"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("daily_mood_logs")
        .select("*")
        .eq("user_id", user!.id)
        .eq("check_in_date", today())
        .maybeSingle();
      if (error) throw error;
      return (data as DailyMoodLog | null) ?? null;
    },
    enabled: isReady && !!user,
  });
};

export const useDailyMoodLogs = (days = 35) => {
  const { user, isReady } = useAuthReady();

  return useQuery({
    queryKey: ["daily_mood_logs", user?.id, days],
    queryFn: async () => {
      const from = new Date();
      from.setDate(from.getDate() - (days - 1));
      const { data, error } = await supabase
        .from("daily_mood_logs")
        .select("*")
        .eq("user_id", user!.id)
        .gte("check_in_date", from.toISOString().slice(0, 10))
        .order("check_in_date", { ascending: true });
      if (error) throw error;
      return (data ?? []) as DailyMoodLog[];
    },
    enabled: isReady && !!user,
  });
};

export const useSetDailyMood = () => {
  const queryClient = useQueryClient();
  const { user } = useAuthReady();

  return useMutation({
    mutationFn: async ({ mood, note = null }: { mood: number; note?: string | null }) => {
      const { data, error } = await supabase
        .from("daily_mood_logs")
        .upsert(
          { user_id: user!.id, check_in_date: today(), mood, note },
          { onConflict: "user_id,check_in_date" },
        )
        .select()
        .single();
      if (error) throw error;
      return data as DailyMoodLog;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["daily_mood", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["daily_mood_logs", user?.id] });
      toast.success("Mood check-in saved");
    },
    onError: (error: Error) => toast.error(error.message),
  });
};
