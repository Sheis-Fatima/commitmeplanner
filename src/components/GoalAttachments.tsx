import { useRef } from "react";
import { Paperclip, FileText, Image as ImageIcon, Upload, Loader2 } from "lucide-react";
import { useGoalAttachments, useUploadAttachment, useAttachmentUrl } from "@/hooks/useAttachments";

interface Props {
  goalId: string;
  milestoneId?: string | null;
  compact?: boolean;
}

const GoalAttachments = ({ goalId, milestoneId, compact }: Props) => {
  const { data: attachments } = useGoalAttachments(goalId);
  const upload = useUploadAttachment();
  const getUrl = useAttachmentUrl();
  const inputRef = useRef<HTMLInputElement>(null);

  const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    upload.mutate({ file: f, goalId, milestoneId });
    e.target.value = "";
  };

  const open = async (path: string) => {
    const url = await getUrl(path);
    if (url) window.open(url, "_blank");
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Paperclip size={12} />
          <span>Attachments {attachments?.length ? `(${attachments.length})` : ""}</span>
        </div>
        <button
          onClick={() => inputRef.current?.click()}
          disabled={upload.isPending}
          className="text-xs text-primary font-semibold flex items-center gap-1 hover:underline disabled:opacity-50"
        >
          {upload.isPending ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}
          Attach
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf,image/png,image/jpeg,image/webp"
          className="hidden"
          onChange={onPick}
        />
      </div>
      {!compact && attachments && attachments.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {attachments.slice(0, 6).map((a) => {
            const isImg = a.mime_type.startsWith("image/");
            return (
              <button
                key={a.id}
                onClick={() => open(a.file_path)}
                className="flex items-center gap-1 text-[10px] px-2 py-1 rounded-md border border-border bg-background hover:bg-muted truncate max-w-[160px]"
                title={a.file_name}
              >
                {isImg ? <ImageIcon size={10} /> : <FileText size={10} />}
                <span className="truncate">{a.file_name}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default GoalAttachments;