import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { useTimeAllocation } from "@/hooks/useTimeAllocation";

const SuggestedSchedule = () => {
  const { allocations } = useTimeAllocation();

  if (allocations.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-card/50 p-4 text-center">
        <Sparkles size={20} className="text-muted-foreground mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">
          Add commitments and goal steps to see your suggested schedule
        </p>
      </div>
    );
  }

  // Group by date
  const byDate = allocations.reduce<Record<string, typeof allocations>>((acc, a) => {
    (acc[a.date] = acc[a.date] || []).push(a);
    return acc;
  }, {});

  const today = new Date().toISOString().slice(0, 10);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-3"
    >
      <div className="flex items-center gap-2">
        <Sparkles size={18} className="text-primary" />
        <h3 className="font-display font-semibold text-lg">Suggested Schedule</h3>
      </div>
      <div className="space-y-3">
        {Object.entries(byDate).slice(0, 5).map(([date, items]) => {
          const d = new Date(date + "T00:00:00");
          const label =
            date === today
              ? "Today"
              : d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
          return (
            <div key={date} className="rounded-xl bg-card border border-border p-3">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-2">
                {label}
              </p>
              <div className="space-y-2">
                {items.map((a) => (
                  <div key={a.stepId} className="flex items-center gap-3">
                    <div className="text-xs font-mono text-primary w-24 shrink-0">
                      {a.start}–{a.end}
                    </div>
                    <p className="text-sm flex-1 truncate">{a.title}</p>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
};

export default SuggestedSchedule;