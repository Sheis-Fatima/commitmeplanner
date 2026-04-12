import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Plus, ChevronDown, ChevronRight, Sparkles, Loader2 } from "lucide-react";
import AppHeader from "@/components/AppHeader";
import AppShell from "@/components/AppShell";
import { useGoals, useGoalSteps, useCreateGoalStep, useToggleStep, Goal } from "@/hooks/useGoals";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";

const GoalStepsSection = ({ goal }: { goal: Goal }) => {
  const { data: steps, isLoading } = useGoalSteps(goal.id);
  const createStep = useCreateGoalStep();
  const toggleStep = useToggleStep();
  const [expanded, setExpanded] = useState(goal.status === "active");
  const [newStepTitle, setNewStepTitle] = useState("");
  const [showInput, setShowInput] = useState(false);

  const completedCount = steps?.filter((s) => s.completed).length ?? 0;
  const totalCount = steps?.length ?? 0;
  const pct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const handleAddStep = () => {
    if (!newStepTitle.trim()) return;
    createStep.mutate(
      { goal_id: goal.id, title: newStepTitle.trim(), step_order: totalCount },
      { onSuccess: () => { setNewStepTitle(""); setShowInput(false); } }
    );
  };

  const statusColor =
    goal.status === "completed"
      ? "gradient-mint"
      : goal.status === "active"
      ? "border-2 border-primary"
      : "bg-muted";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl bg-card border border-border shadow-card overflow-hidden"
    >
      {/* Goal header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 p-4 text-left"
      >
        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${statusColor}`}>
          {goal.status === "completed" ? (
            <Check size={16} className="text-primary-foreground" />
          ) : (
            <span className="text-xs font-bold text-primary">{pct}%</span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            {goal.category && (
              <span className="text-[10px] uppercase tracking-widest font-semibold text-primary">
                {goal.category}
              </span>
            )}
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
              {goal.checkin_frequency}
            </span>
          </div>
          <h3 className="font-display text-lg font-bold truncate">{goal.title}</h3>
          <p className="text-xs text-muted-foreground">
            {completedCount}/{totalCount} steps completed
          </p>
        </div>
        {expanded ? <ChevronDown size={18} className="text-muted-foreground" /> : <ChevronRight size={18} className="text-muted-foreground" />}
      </button>

      {/* Progress bar */}
      <div className="px-4 pb-2">
        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
          <motion.div
            className="h-full rounded-full gradient-mint"
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </div>

      {/* Steps list */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-2">
              {isLoading && (
                <div className="space-y-2">
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-3/4" />
                </div>
              )}

              {steps?.map((step) => (
                <motion.div
                  key={step.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-3 py-2 border-b border-border last:border-0"
                >
                  <Checkbox
                    checked={step.completed}
                    onCheckedChange={(checked) =>
                      toggleStep.mutate({
                        id: step.id,
                        completed: !!checked,
                        goal_id: step.goal_id,
                      })
                    }
                  />
                  <span className={`text-sm flex-1 ${step.completed ? "line-through text-muted-foreground" : ""}`}>
                    {step.title}
                  </span>
                </motion.div>
              ))}

              {!isLoading && steps?.length === 0 && (
                <p className="text-xs text-muted-foreground italic py-2">No steps yet. Add one to get started!</p>
              )}

              {/* Add step */}
              {showInput ? (
                <div className="flex gap-2 pt-1">
                  <Input
                    value={newStepTitle}
                    onChange={(e) => setNewStepTitle(e.target.value)}
                    placeholder="Step title..."
                    className="text-sm h-9"
                    onKeyDown={(e) => e.key === "Enter" && handleAddStep()}
                    autoFocus
                  />
                  <Button
                    size="sm"
                    onClick={handleAddStep}
                    disabled={!newStepTitle.trim() || createStep.isPending}
                    className="gradient-mint text-primary-foreground"
                  >
                    {createStep.isPending ? <Loader2 size={14} className="animate-spin" /> : "Add"}
                  </Button>
                </div>
              ) : (
                <button
                  onClick={() => setShowInput(true)}
                  className="flex items-center gap-1.5 text-primary text-sm font-medium pt-1 hover:opacity-80 transition"
                >
                  <Plus size={14} /> Add Step
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const Roadmap = () => {
  const { data: goals, isLoading } = useGoals();

  const activeGoals = goals?.filter((g) => g.status === "active") ?? [];
  const completedGoals = goals?.filter((g) => g.status === "completed") ?? [];
  const pausedGoals = goals?.filter((g) => g.status === "paused") ?? [];

  const totalStepsInfo = goals?.length ?? 0;

  return (
    <AppShell>
      <AppHeader />
      <div className="px-5 space-y-6 pt-2 pb-6">
        <div>
          <p className="text-[10px] uppercase tracking-widest font-semibold text-primary">Your Roadmap</p>
          <h2 className="font-display text-3xl font-bold mt-1">Goal Steps</h2>
          <p className="text-muted-foreground text-sm mt-2">
            Break down your goals into actionable steps and track your progress.
          </p>
        </div>

        {isLoading && (
          <div className="space-y-4">
            <Skeleton className="h-32 w-full rounded-xl" />
            <Skeleton className="h-32 w-full rounded-xl" />
          </div>
        )}

        {!isLoading && goals?.length === 0 && (
          <div className="rounded-xl bg-card border border-border p-6 text-center shadow-card">
            <Sparkles size={28} className="text-primary mx-auto mb-2" />
            <h3 className="font-display font-bold">No goals yet</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Create a goal in the Planner to start building your roadmap.
            </p>
          </div>
        )}

        {/* Active Goals */}
        {activeGoals.length > 0 && (
          <div className="space-y-3">
            <p className="text-xs uppercase tracking-widest font-semibold text-primary">
              In Progress ({activeGoals.length})
            </p>
            {activeGoals.map((goal) => (
              <GoalStepsSection key={goal.id} goal={goal} />
            ))}
          </div>
        )}

        {/* Paused Goals */}
        {pausedGoals.length > 0 && (
          <div className="space-y-3">
            <p className="text-xs uppercase tracking-widest font-semibold text-muted-foreground">
              Paused ({pausedGoals.length})
            </p>
            {pausedGoals.map((goal) => (
              <GoalStepsSection key={goal.id} goal={goal} />
            ))}
          </div>
        )}

        {/* Completed Goals */}
        {completedGoals.length > 0 && (
          <div className="space-y-3">
            <p className="text-xs uppercase tracking-widest font-semibold text-muted-foreground">
              Completed ({completedGoals.length})
            </p>
            {completedGoals.map((goal) => (
              <GoalStepsSection key={goal.id} goal={goal} />
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
};

export default Roadmap;
