import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuthReady } from "@/contexts/AuthContext";
import type { CheckIn } from "@/hooks/useGoals";

export const useAllCheckIns = () => {
  const { user, isReady } = useAuthReady();

  return useQuery({
    queryKey: ["all_check_ins", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("check_ins")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as CheckIn[];
    },
    enabled: isReady && !!user,
  });
};
