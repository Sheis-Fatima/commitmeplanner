import { motion } from "framer-motion";
import { CheckCircle2, SkipForward, ListChecks } from "lucide-react";
import { useTimeAllocation } from "@/hooks/useTimeAllocation";
import { useToggleStep, useSkipStep } from "@/hooks/useGoals";

const WeeklyCheckInCard = () => {
  const { allocations } = useTimeAllocation();
  const toggleStep = useToggleStep();
  const skipStep = useSkipStep();

  if (allocations.length === 0) return null;

  // Deduplicate by stepId — show each allocated step once with its earliest slot
  const seen = new Set<string>();
  const items = allocations.filter((a) => {
    if (seen.has(a.stepId)) return false;
    seen.add(a.stepId);
    return true;
  });

  const today = new Date().toISOString().slice(0, 10);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl bg-card border border-border p-4 shadow-card"
    >
      <div className="flex items-center gap-2 mb-3">
        <ListChecks size={18} className="text-primary" />
        <h3 className="font-display font-semibold">Weekly Check-In</h3>
      </div>
      <p className="text-xs text-muted-foreground mb-3">
        Mark progress on your scheduled steps. Skipped items get re-allocated.
      </p>
      <div className="space-y-2">
        {items.slice(0, 8).map((a) => {
          const d = new Date(a.date + "T00:00:00");
          const dayLabel =
            a.date === today
              ? "Today"
              : d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
          const busy = toggleStep.isPending || skipStep.isPending;
          return (
            <div
              key={a.stepId}
              className="flex items-center gap-2 rounded-lg border border-border p-2"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{a.title}</p>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  {dayLabel} · {a.start}–{a.end}
                </p>
              </div>
              <button
                disabled={busy}
                onClick={() =>
                  toggleStep.mutate({ id: a.stepId, completed: true, goal_id: a.goalId })
                }
                className="p-1.5 rounded-md text-primary hover:bg-primary/10 transition-colors disabled:opacity-50"
                title="Mark complete"
              >
                <CheckCircle2 size={18} />
              </button>
              <button
                disabled={busy}
                onClick={() => skipStep.mutate({ id: a.stepId })}
                className="p-1.5 rounded-md text-muted-foreground hover:bg-muted transition-colors disabled:opacity-50"
                title="Skip — re-allocate"
              >
                <SkipForward size={18} />
              </button>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
};

export default WeeklyCheckInCard;