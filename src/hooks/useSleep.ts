import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, useAuthReady } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface SleepLog {
  id: string;
  user_id: string;
  sleep_date: string;
  start_time: string;
  end_time: string;
  duration_min: number;
  quality: number | null;
  source: string;
  created_at: string;
}

export interface SleepPreferences {
  user_id: string;
  target_hours: number;
  typical_bedtime: string | null;
  typical_waketime: string | null;
  updated_at: string;
}

export const DEFAULT_SLEEP_PREFS: Omit<SleepPreferences, "user_id" | "updated_at"> = {
  target_hours: 7.5,
  typical_bedtime: "23:00",
  typical_waketime: "07:00",
};

export const useSleepLogs = (fromDate?: string, toDate?: string) => {
  const { user, isReady } = useAuthReady();
  return useQuery({
    queryKey: ["sleep_logs", user?.id, fromDate, toDate],
    queryFn: async () => {
      let q = supabase.from("sleep_logs").select("*").order("sleep_date", { ascending: false });
      if (fromDate) q = q.gte("sleep_date", fromDate);
      if (toDate) q = q.lte("sleep_date", toDate);
      const { data, error } = await q;
      if (error) throw error;
      return data as SleepLog[];
    },
    enabled: isReady && !!user,
  });
};

export const useUpsertSleepLog = () => {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (log: { sleep_date: string; start_time: string; end_time: string; quality?: number | null; source?: string; id?: string }) => {
      const payload = { ...log, user_id: user!.id, duration_min: 0 };
      if (log.id) {
        const { error } = await supabase.from("sleep_logs").update(payload).eq("id", log.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("sleep_logs").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sleep_logs"] });
      toast.success("Sleep logged");
    },
    onError: (e: Error) => toast.error(e.message),
  });
};

export const useDeleteSleepLog = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("sleep_logs").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["sleep_logs"] }),
    onError: (e: Error) => toast.error(e.message),
  });
};

export const useSleepPreferences = () => {
  const { user, isReady } = useAuthReady();
  return useQuery({
    queryKey: ["sleep_prefs", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("sleep_preferences").select("*").eq("user_id", user!.id).maybeSingle();
      if (error) throw error;
      return (data as SleepPreferences | null) ?? { user_id: user!.id, ...DEFAULT_SLEEP_PREFS, updated_at: new Date().toISOString() };
    },
    enabled: isReady && !!user,
  });
};

export const useUpsertSleepPreferences = () => {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (prefs: { target_hours: number; typical_bedtime?: string | null; typical_waketime?: string | null }) => {
      const { error } = await supabase
        .from("sleep_preferences")
        .upsert({ ...prefs, user_id: user!.id }, { onConflict: "user_id" });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sleep_prefs"] });
      toast.success("Sleep preferences saved");
    },
    onError: (e: Error) => toast.error(e.message),
  });
};
