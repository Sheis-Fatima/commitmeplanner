import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Sparkles, Loader2, Plus, Trash2, Save, CheckCircle2, Circle, Flag, MessageSquare, SkipForward } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  useMilestones,
  useGenerateMilestones,
  useSaveMilestones,
  useToggleMilestone,
} from "@/hooks/useMilestones";
import type { Goal } from "@/hooks/useGoals";
import { useSkipStep } from "@/hooks/useGoals";
import CheckInDialog from "@/components/CheckInDialog";
import { toast } from "sonner";

interface DraftMilestone {
  id?: string;
  title: string;
  deliverable: string;
  period_index: number;
  due_date: string | null;
  completed?: boolean;
}

const MilestonesSection = ({ goal }: { goal: Goal }) => {
  const { data: existing, isLoading } = useMilestones(goal.id);
  const generate = useGenerateMilestones();
  const save = useSaveMilestones();
  const toggle = useToggleMilestone();
  const skip = useSkipStep();
  const [checkInMilestoneId, setCheckInMilestoneId] = useState<string | null>(null);

  const [drafts, setDrafts] = useState<DraftMilestone[]>([]);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    if (existing && !editing) {
      setDrafts(
        existing.map((m) => ({
          id: m.id,
          title: m.title,
          deliverable: m.deliverable,
          period_index: m.period_index,
          due_date: m.due_date,
          completed: m.completed,
        })),
      );
    }
  }, [existing, editing]);

  const onGenerate = async () => {
    const suggestions = await generate.mutateAsync(goal);
    setDrafts(suggestions.map((s) => ({ ...s, completed: false })));
    setEditing(true);
    toast.success("AI suggestions ready — edit and save");
  };

  const updateDraft = (i: number, patch: Partial<DraftMilestone>) =>
    setDrafts((prev) => prev.map((d, idx) => (idx === i ? { ...d, ...patch } : d)));

  const removeDraft = (i: number) => setDrafts((prev) => prev.filter((_, idx) => idx !== i));

  const addDraft = () =>
    setDrafts((prev) => [
      ...prev,
      { title: "", deliverable: "", period_index: prev.length, due_date: null },
    ]);

  const onSave = async () => {
    const cleaned = drafts
      .filter((d) => d.title.trim() && d.deliverable.trim())
      .map((d, i) => ({
        title: d.title.trim(),
        deliverable: d.deliverable.trim(),
        period_index: i,
        due_date: d.due_date,
      }));
    if (cleaned.length === 0) {
      toast.error("Add at least one milestone");
      return;
    }
    await save.mutateAsync({ goalId: goal.id, milestones: cleaned });
    setEditing(false);
  };

  const hasMilestones = (existing?.length ?? 0) > 0;

  return (
    <div className="rounded-xl bg-card border border-border p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Flag size={16} className="text-primary" />
          <h4 className="font-display font-semibold text-sm">Milestone Deliverables</h4>
        </div>
        <div className="flex items-center gap-2">
          {!editing && hasMilestones && (
            <button onClick={() => setEditing(true)} className="text-xs text-primary font-semibold hover:underline">
              Edit
            </button>
          )}
          <button
            onClick={onGenerate}
            disabled={generate.isPending}
            className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline disabled:opacity-50"
            title="Generate with AI"
          >
            {generate.isPending ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
            AI Suggest
          </button>
        </div>
      </div>

      {isLoading && <p className="text-xs text-muted-foreground">Loading…</p>}

      {!isLoading && !hasMilestones && !editing && drafts.length === 0 && (
        <p className="text-xs text-muted-foreground">
          No milestones yet. Use “AI Suggest” to generate one deliverable per check-in period — you can edit before saving.
        </p>
      )}

      {(editing || (!hasMilestones && drafts.length > 0)) ? (
        <div className="space-y-3">
          {drafts.map((d, i) => (
            <div key={i} className="rounded-lg border border-border p-3 space-y-2 bg-background/40">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                  Period {i + 1}
                </span>
                <button onClick={() => removeDraft(i)} className="text-muted-foreground hover:text-destructive">
                  <Trash2 size={14} />
                </button>
              </div>
              <Input
                value={d.title}
                onChange={(e) => updateDraft(i, { title: e.target.value })}
                placeholder="Milestone title"
                className="text-sm h-9"
              />
              <Textarea
                value={d.deliverable}
                onChange={(e) => updateDraft(i, { deliverable: e.target.value })}
                placeholder="Concrete deliverable (what you'll upload as proof)"
                rows={2}
                className="text-sm resize-none"
              />
              <Input
                type="date"
                value={d.due_date ?? ""}
                onChange={(e) => updateDraft(i, { due_date: e.target.value || null })}
                className="text-sm h-9"
              />
            </div>
          ))}
          <div className="flex items-center justify-between">
            <Button size="sm" variant="outline" onClick={addDraft}>
              <Plus size={14} className="mr-1" /> Add
            </Button>
            <div className="flex gap-2">
              {hasMilestones && (
                <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>
                  Cancel
                </Button>
              )}
              <Button size="sm" onClick={onSave} disabled={save.isPending} className="gradient-mint text-primary-foreground">
                {save.isPending ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} className="mr-1" />}
                Save
              </Button>
            </div>
          </div>
        </div>
      ) : hasMilestones ? (
        <div className="space-y-2">
          {(existing || []).map((m) => (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-lg border border-border p-2 space-y-2"
            >
              <div className="flex items-start gap-2">
                <button
                  onClick={() => toggle.mutate({ id: m.id, completed: !m.completed, goal_id: m.goal_id })}
                  className="mt-0.5 text-primary"
                >
                  {m.completed ? <CheckCircle2 size={18} /> : <Circle size={18} className="text-muted-foreground" />}
                </button>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${m.completed ? "line-through text-muted-foreground" : ""}`}>
                    {m.title}
                  </p>
                  <p className="text-xs text-muted-foreground">{m.deliverable}</p>
                  {m.due_date && (
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground mt-1">
                      Due {new Date(m.due_date + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </p>
                  )}
                </div>
              </div>
              {!m.completed && (
                <div className="flex items-center gap-2 pl-6">
                  <button
                    onClick={() => setCheckInMilestoneId(m.id)}
                    className="text-[11px] font-semibold text-primary hover:underline flex items-center gap-1"
                  >
                    <MessageSquare size={11} /> Check In
                  </button>
                  <button
                    onClick={() => {
                      skip.mutate({ id: m.id });
                      toast.message("Marked as skipped — reallocating");
                    }}
                    className="text-[11px] font-semibold text-muted-foreground hover:text-foreground flex items-center gap-1"
                  >
                    <SkipForward size={11} /> Skip
                  </button>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      ) : null}
      {checkInMilestoneId && (
        <CheckInDialog
          open={!!checkInMilestoneId}
          onClose={() => setCheckInMilestoneId(null)}
          goal={goal}
          milestoneId={checkInMilestoneId}
        />
      )}
    </div>
  );
};

export default MilestonesSection;