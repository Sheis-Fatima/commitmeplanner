import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, useAuthReady } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface Commitment {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  priority: string;
  time_of_day: string | null;
  start_time: string | null;
  end_time: string | null;
  frequency: string;
  custom_days: string[] | null;
  resolved: boolean;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
}

export const useCommitments = () => {
  const { user, isReady } = useAuthReady();

  return useQuery({
    queryKey: ["commitments", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("commitments")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Commitment[];
    },
    enabled: isReady && !!user,
  });
};

export const useCreateCommitment = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (commitment: {
      title: string;
      description?: string;
      priority?: string;
      time_of_day?: string;
      start_time?: string;
      end_time?: string;
      frequency?: string;
      custom_days?: string[];
    }) => {
      const { data, error } = await supabase
        .from("commitments")
        .insert({ ...commitment, user_id: user!.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["commitments"] });
      queryClient.invalidateQueries({ queryKey: ["all_active_goal_steps"] });
      toast.success("Commitment added!");
    },
    onError: (err: Error) => toast.error(err.message),
  });
};

export const useUpdateCommitment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: {
      id: string;
      title?: string;
      description?: string;
      priority?: string;
      time_of_day?: string;
      start_time?: string;
      end_time?: string;
      frequency?: string;
      custom_days?: string[];
    }) => {
      const { error } = await supabase
        .from("commitments")
        .update(updates)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["commitments"] });
      queryClient.invalidateQueries({ queryKey: ["all_active_goal_steps"] });
      toast.success("Commitment updated!");
    },
    onError: (err: Error) => toast.error(err.message),
  });
};

export const useResolveCommitment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("commitments")
        .update({ resolved: true, resolved_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["commitments"] });
      queryClient.invalidateQueries({ queryKey: ["all_active_goal_steps"] });
      toast.success("Commitment resolved!");
    },
    onError: (err: Error) => toast.error(err.message),
  });
};

export const useDeleteCommitment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("commitments")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["commitments"] });
      queryClient.invalidateQueries({ queryKey: ["all_active_goal_steps"] });
      toast.success("Commitment deleted!");
    },
    onError: (err: Error) => toast.error(err.message),
  });
};
