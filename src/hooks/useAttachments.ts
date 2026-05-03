import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, useAuthReady } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface GoalAttachment {
  id: string;
  user_id: string;
  goal_id: string;
  milestone_id: string | null;
  file_path: string;
  file_name: string;
  mime_type: string;
  created_at: string;
}

export const useGoalAttachments = (goalId: string | undefined) => {
  const { user, isReady } = useAuthReady();
  return useQuery({
    queryKey: ["goal_attachments", goalId, user?.id],
    queryFn: async () => {
      const { data, error } = await (supabase.from as any)("goal_attachments")
        .select("*")
        .eq("goal_id", goalId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as GoalAttachment[];
    },
    enabled: isReady && !!user && !!goalId,
  });
};

export const useUploadAttachment = () => {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async ({
      file,
      goalId,
      milestoneId,
    }: {
      file: File;
      goalId: string;
      milestoneId?: string | null;
    }) => {
      const allowed = ["application/pdf", "image/png", "image/jpeg", "image/webp"];
      if (!allowed.includes(file.type)) throw new Error("Only PDF or image files");
      if (file.size > 10 * 1024 * 1024) throw new Error("Max 10MB");
      const path = `${user!.id}/${goalId}/${Date.now()}-${file.name}`;
      const { error: upErr } = await supabase.storage
        .from("checkin-pdfs")
        .upload(path, file, { contentType: file.type, upsert: false });
      if (upErr) throw upErr;
      const { data, error } = await (supabase.from as any)("goal_attachments")
        .insert({
          user_id: user!.id,
          goal_id: goalId,
          milestone_id: milestoneId ?? null,
          file_path: path,
          file_name: file.name,
          mime_type: file.type,
        })
        .select()
        .single();
      if (error) throw error;
      return data as GoalAttachment;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["goal_attachments", data.goal_id] });
      toast.success("Attachment uploaded");
    },
    onError: (err: Error) => toast.error(err.message),
  });
};

export const useAttachmentUrl = () => {
  return async (path: string) => {
    const { data } = await supabase.storage
      .from("checkin-pdfs")
      .createSignedUrl(path, 3600);
    return data?.signedUrl ?? null;
  };
};