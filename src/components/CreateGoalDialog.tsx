import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Target, Calendar, Repeat } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useCreateGoal } from "@/hooks/useGoals";

interface CreateGoalDialogProps {
  open: boolean;
  onClose: () => void;
}

const categories = ["Health", "Career", "Learning", "Finance", "Personal", "Creative"];

const CreateGoalDialog = ({ open, onClose }: CreateGoalDialogProps) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [frequency, setFrequency] = useState<"weekly" | "monthly">("weekly");
  const [targetDate, setTargetDate] = useState("");
  const createGoal = useCreateGoal();

  const handleSubmit = () => {
    if (!title.trim()) return;
    createGoal.mutate(
      {
        title: title.trim(),
        description: description.trim() || null,
        category: category || null,
        checkin_frequency: frequency,
        target_date: targetDate || null,
      },
      {
        onSuccess: () => {
          setTitle("");
          setDescription("");
          setCategory("");
          setFrequency("weekly");
          setTargetDate("");
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
                <Target size={20} className="text-primary" />
                <h2 className="font-display text-xl font-bold">New Goal</h2>
              </div>
              <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
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
            </div>

            <Button
              onClick={handleSubmit}
              disabled={!title.trim() || createGoal.isPending}
              className="w-full h-12 rounded-xl gradient-mint text-primary-foreground font-semibold text-base shadow-mint hover:opacity-90"
            >
              {createGoal.isPending ? "Creating..." : "Create Goal"}
            </Button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CreateGoalDialog;
