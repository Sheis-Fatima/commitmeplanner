import { motion } from "framer-motion";
import { CalendarCheck } from "lucide-react";
import { useTimeAllocation } from "@/hooks/useTimeAllocation";

const TodaysPlan = () => {
  const { allocations } = useTimeAllocation();
  const today = new Date().toISOString().slice(0, 10);
  const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
  const items = allocations.filter((a) => a.date === today || a.date === tomorrow);

  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-card/50 p-4 text-center">
        <CalendarCheck size={20} className="text-muted-foreground mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">
          No goal blocks scheduled for today. Add commitments and goal steps to populate your plan.
        </p>
      </div>
    );
  }

  const byDate = items.reduce<Record<string, typeof items>>((acc, a) => {
    (acc[a.date] = acc[a.date] || []).push(a);
    return acc;
  }, {});

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
      <div className="flex items-center gap-2">
        <CalendarCheck size={18} className="text-primary" />
        <h3 className="font-display font-semibold text-lg">Today's Plan</h3>
      </div>
      {Object.entries(byDate).map(([date, list]) => (
        <div key={date} className="rounded-xl bg-card border border-border p-3">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-2">
            {date === today ? "Today" : "Tomorrow"}
          </p>
          <div className="space-y-2">
            {list.map((a) => (
              <div key={a.stepId} className="flex items-center gap-3">
                <div className="text-xs font-mono text-primary w-24 shrink-0">
                  {a.start}–{a.end}
                </div>
                <p className="text-sm flex-1 truncate">{a.title}</p>
              </div>
            ))}
          </div>
        </div>
      ))}
    </motion.div>
  );
};

export default TodaysPlan;