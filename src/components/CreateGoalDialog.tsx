import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Target, Calendar, Repeat, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useCreateGoal, useUpdateGoal, useDeleteGoal, type Goal } from "@/hooks/useGoals";

interface CreateGoalDialogProps {
  open: boolean;
  onClose: () => void;
  editGoal?: Goal | null;
}

const categories = ["Health", "Career", "Learning", "Finance", "Personal", "Creative"];
const statuses = ["active", "paused", "completed"] as const;

const CreateGoalDialog = ({ open, onClose, editGoal }: CreateGoalDialogProps) => {
  const isEdit = !!editGoal;
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [frequency, setFrequency] = useState<"weekly" | "monthly">("weekly");
  const [targetDate, setTargetDate] = useState("");
  const [status, setStatus] = useState<(typeof statuses)[number]>("active");
  const [confirmDelete, setConfirmDelete] = useState(false);

  const createGoal = useCreateGoal();
  const updateGoal = useUpdateGoal();
  const deleteGoal = useDeleteGoal();

  useEffect(() => {
    if (!open) return;
    setConfirmDelete(false);
    if (editGoal) {
      setTitle(editGoal.title);
      setDescription(editGoal.description ?? "");
      setCategory(editGoal.category ?? "");
      setFrequency(editGoal.checkin_frequency as "weekly" | "monthly");
      setTargetDate(editGoal.target_date ?? "");
      setStatus(editGoal.status as (typeof statuses)[number]);
    } else {
      setTitle("");
      setDescription("");
      setCategory("");
      setFrequency("weekly");
      setTargetDate("");
      setStatus("active");
    }
  }, [open, editGoal]);

  const pending = createGoal.isPending || updateGoal.isPending || deleteGoal.isPending;

  const handleSubmit = () => {
    if (!title.trim()) return;
    const payload = {
      title: title.trim(),
      description: description.trim() || null,
      category: category || null,
      checkin_frequency: frequency,
      target_date: targetDate || null,
    };
    if (isEdit) {
      updateGoal.mutate(
        { id: editGoal!.id, ...payload, status },
        { onSuccess: () => onClose() },
      );
    } else {
      createGoal.mutate(payload, { onSuccess: () => onClose() });
    }
  };

  const handleDelete = () => {
    if (!editGoal) return;
    deleteGoal.mutate(editGoal.id, { onSuccess: () => onClose() });
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
            className="w-full max-w-lg rounded-t-2xl sm:rounded-2xl bg-card border border-border shadow-card flex flex-col max-h-[90vh] sm:max-h-[85vh]"
          >
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-border shrink-0">
              <div className="flex items-center gap-2">
                <Target size={20} className="text-primary" />
                <h2 className="font-display text-xl font-bold">{isEdit ? "Edit Goal" : "New Goal"}</h2>
              </div>
              <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
              <Input
                placeholder="What do you want to achieve?"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="bg-secondary border-border h-12 rounded-xl text-foreground placeholder:text-muted-foreground"
              />
              <Textarea
                placeholder="Describe your goal (optional)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="bg-secondary border-border rounded-xl text-foreground placeholder:text-muted-foreground min-h-[80px]"
              />

              {/* Category */}
              <div>
                <p className="text-xs uppercase tracking-widest text-muted-foreground font-semibold mb-2">Category</p>
                <div className="flex flex-wrap gap-2">
                  {categories.map((c) => (
                    <button
                      key={c}
                      onClick={() => setCategory(c === category ? "" : c)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        c === category
                          ? "gradient-mint text-primary-foreground shadow-mint"
                          : "bg-secondary text-muted-foreground border border-border"
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              {/* Check-in Frequency */}
              <div>
                <p className="text-xs uppercase tracking-widest text-muted-foreground font-semibold mb-2 flex items-center gap-1">
                  <Repeat size={12} /> Check-in Frequency
                </p>
                <div className="flex rounded-xl bg-secondary p-1 border border-border">
                  {(["weekly", "monthly"] as const).map((f) => (
                    <button
                      key={f}
                      onClick={() => setFrequency(f)}
                      className={`flex-1 py-2.5 text-sm font-medium rounded-lg capitalize transition-all ${
                        frequency === f
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "text-muted-foreground"
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              {/* Target Date */}
              <div>
                <p className="text-xs uppercase tracking-widest text-muted-foreground font-semibold mb-2 flex items-center gap-1">
                  <Calendar size={12} /> Target Date (optional)
                </p>
                <Input
                  type="date"
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                  className="bg-secondary border-border h-12 rounded-xl text-foreground"
                />
              </div>

              {/* Status (edit only) */}
              {isEdit && (
                <div>
                  <p className="text-xs uppercase tracking-widest text-muted-foreground font-semibold mb-2">Status</p>
                  <div className="flex rounded-xl bg-secondary p-1 border border-border">
                    {statuses.map((s) => (
                      <button
                        key={s}
                        onClick={() => setStatus(s)}
                        className={`flex-1 py-2.5 text-sm font-medium rounded-lg capitalize transition-all ${
                          status === s ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground"
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {isEdit && (
                <div className="pt-2">
                  {confirmDelete ? (
                    <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-3 space-y-2">
                      <p className="text-sm font-medium">Delete this goal and everything in it?</p>
                      <div className="flex gap-2">
                        <Button variant="outline" className="flex-1 h-10 rounded-lg" onClick={() => setConfirmDelete(false)}>
                          Keep it
                        </Button>
                        <Button
                          variant="destructive"
                          className="flex-1 h-10 rounded-lg"
                          disabled={pending}
                          onClick={handleDelete}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmDelete(true)}
                      className="text-xs font-semibold text-destructive flex items-center gap-1 hover:underline"
                    >
                      <Trash2 size={14} /> Delete goal
                    </button>
                  )}
                </div>
              )}
            </div>

            <div className="p-4 sm:p-6 border-t border-border shrink-0 flex gap-2">
              <Button
                variant="outline"
                onClick={onClose}
                className="h-12 rounded-xl flex-1 sm:flex-none sm:px-6"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!title.trim() || pending}
                className="flex-1 h-12 rounded-xl gradient-mint text-primary-foreground font-semibold text-base shadow-mint hover:opacity-90"
              >
                {pending
                  ? isEdit
                    ? "Saving..."
                    : "Creating..."
                  : isEdit
                    ? "Save Changes"
                    : "Create Goal"}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CreateGoalDialog;
