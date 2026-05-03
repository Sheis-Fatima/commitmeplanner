import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, MessageSquare, Smile, Meh, Frown, Heart, Star, FileUp, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useCreateCheckIn } from "@/hooks/useGoals";
import type { Goal } from "@/hooks/useGoals";
import { useMilestones, useToggleMilestone, useValidateCheckInPdf } from "@/hooks/useMilestones";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface CheckInDialogProps {
  open: boolean;
  onClose: () => void;
  goal: Goal;
  milestoneId?: string | null;
}

const moods = [
  { value: 1, icon: Frown, label: "Struggling" },
  { value: 2, icon: Meh, label: "Meh" },
  { value: 3, icon: Smile, label: "Okay" },
  { value: 4, icon: Heart, label: "Good" },
  { value: 5, icon: Star, label: "Amazing" },
];

const CheckInDialog = ({ open, onClose, goal, milestoneId }: CheckInDialogProps) => {
  const [notes, setNotes] = useState("");
  const [mood, setMood] = useState<number | null>(null);
  const createCheckIn = useCreateCheckIn();
  const { user } = useAuth();
  const { data: milestones } = useMilestones(goal.id);
  const validate = useValidateCheckInPdf();
  const toggleMilestone = useToggleMilestone();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const nextMilestone =
    (milestones || []).find((m) => m.id === milestoneId) ||
    (milestones || []).find((m) => !m.completed) ||
    null;

  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfPath, setPdfPath] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [evaluation, setEvaluation] = useState<{ score: number; feedback: string; meets_expectations: boolean } | null>(null);
  const [override, setOverride] = useState(false);

  const onPickFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.type !== "application/pdf") {
      toast.error("Please upload a PDF");
      return;
    }
    if (f.size > 10 * 1024 * 1024) {
      toast.error("Max 10MB");
      return;
    }
    setPdfFile(f);
    setEvaluation(null);
    setPdfPath(null);
  };

  const uploadAndValidate = async () => {
    if (!pdfFile || !user || !nextMilestone) return;
    try {
      setUploading(true);
      const path = `${user.id}/${goal.id}/${Date.now()}-${pdfFile.name}`;
      const { error: upErr } = await supabase.storage.from("checkin-pdfs").upload(path, pdfFile, {
        contentType: "application/pdf",
        upsert: false,
      });
      if (upErr) throw upErr;
      setPdfPath(path);
      const result = await validate.mutateAsync({
        pdfPath: path,
        deliverable: nextMilestone.deliverable,
        goalTitle: goal.title,
        milestoneTitle: nextMilestone.title,
      });
      setEvaluation(result);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Validation failed");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = () => {
    const milestoneSatisfied = !!evaluation && (evaluation.meets_expectations || override);
    const totalMs = milestones?.length || 0;
    const completedMs = (milestones || []).filter((m) => m.completed).length;
    const willComplete = nextMilestone && milestoneSatisfied ? 1 : 0;
    const derivedProgress = totalMs > 0
      ? Math.round(((completedMs + willComplete) / totalMs) * 100)
      : goal.progress;
    createCheckIn.mutate(
      {
        goal_id: goal.id,
        notes: notes.trim() || null,
        progress_value: derivedProgress,
        mood,
        milestone_id: nextMilestone?.id ?? null,
        pdf_url: pdfPath,
        deliverable_score: evaluation?.score ?? null,
        ai_feedback: evaluation?.feedback ?? null,
        user_override: override,
      },
      {
        onSuccess: () => {
          if (nextMilestone && milestoneSatisfied) {
            toggleMilestone.mutate({ id: nextMilestone.id, completed: true, goal_id: goal.id });
          }
          setNotes("");
          setMood(null);
          setPdfFile(null);
          setPdfPath(null);
          setEvaluation(null);
          setOverride(false);
          onClose();
        },
      }
    );
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-end sm:items-center justify-center"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg rounded-t-2xl sm:rounded-2xl bg-card border border-border p-6 space-y-5 shadow-card"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare size={20} className="text-primary" />
                <h2 className="font-display text-xl font-bold">Check In</h2>
              </div>
              <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
                <X size={20} />
              </button>
            </div>

            <p className="text-sm text-muted-foreground">
              How's your progress on <span className="text-primary font-medium">{goal.title}</span>?
            </p>

            {/* Milestone deliverable + PDF upload */}
            {nextMilestone ? (
              <div className="rounded-xl border border-border p-3 space-y-3 bg-background/40">
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                    Current Milestone
                  </p>
                  <p className="text-sm font-semibold">{nextMilestone.title}</p>
                  <p className="text-xs text-muted-foreground mt-1">{nextMilestone.deliverable}</p>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/pdf"
                  className="hidden"
                  onChange={onPickFile}
                />
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1"
                  >
                    <FileUp size={14} className="mr-1" />
                    {pdfFile ? "Change PDF" : "Choose PDF"}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={uploadAndValidate}
                    disabled={!pdfFile || uploading || validate.isPending}
                    className="gradient-mint text-primary-foreground"
                  >
                    {uploading || validate.isPending ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Sparkles size={14} className="mr-1" />
                    )}
                    Validate
                  </Button>
                </div>
                {pdfFile && (
                  <p className="text-[10px] text-muted-foreground truncate">📄 {pdfFile.name}</p>
                )}

                {evaluation && (
                  <div
                    className={`rounded-lg p-3 text-xs space-y-1 border ${
                      evaluation.meets_expectations
                        ? "border-primary/40 bg-primary/10"
                        : "border-amber-500/40 bg-amber-500/10"
                    }`}
                  >
                    <p className="font-semibold">
                      AI Score: {evaluation.score}/100 —{" "}
                      {evaluation.meets_expectations ? "Meets deliverable ✓" : "Falls short"}
                    </p>
                    <p className="text-muted-foreground">{evaluation.feedback}</p>
                    {!evaluation.meets_expectations && (
                      <label className="flex items-center gap-2 mt-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={override}
                          onChange={(e) => setOverride(e.target.checked)}
                        />
                        <span>Submit anyway (override)</span>
                      </label>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-border p-3 text-xs text-muted-foreground">
                No active milestone. Add deliverables in the Roadmap to enable PDF check-ins.
              </div>
            )}

            {/* Mood */}
            <div>
              <p className="text-xs uppercase tracking-widest text-muted-foreground font-semibold mb-3">How are you feeling?</p>
              <div className="flex justify-between">
                {moods.map((m) => {
                  const Icon = m.icon;
                  return (
                    <button
                      key={m.value}
                      onClick={() => setMood(m.value)}
                      className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${
                        mood === m.value
                          ? "bg-primary/10 text-primary scale-110"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <Icon size={24} />
                      <span className="text-[10px] font-semibold">{m.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Notes */}
            <Textarea
              placeholder="Any notes on your progress? (optional)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="bg-secondary border-border rounded-xl text-foreground placeholder:text-muted-foreground min-h-[80px]"
            />

            <Button
              onClick={handleSubmit}
              disabled={createCheckIn.isPending}
              className="w-full h-12 rounded-xl gradient-mint text-primary-foreground font-semibold text-base shadow-mint hover:opacity-90"
            >
              {createCheckIn.isPending ? "Saving..." : "Submit Check-In"}
            </Button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CheckInDialog;
