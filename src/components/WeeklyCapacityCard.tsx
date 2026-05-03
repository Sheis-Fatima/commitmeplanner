import { motion } from "framer-motion";
import { Clock } from "lucide-react";
import { useTimeAllocation } from "@/hooks/useTimeAllocation";

const WeeklyCapacityCard = () => {
  const { summary } = useTimeAllocation();
  const total = summary.totalHours || 1;
  const committedPct = (summary.committedHours / total) * 100;
  const allocatedPct = (summary.allocatedHours / total) * 100;
  const freePct = Math.max(0, 100 - committedPct - allocatedPct);

  const fmt = (h: number) => `${h.toFixed(1)}h`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl bg-card p-4 shadow-card border border-border"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Clock size={18} className="text-primary" />
          <h3 className="font-display font-semibold">This Week</h3>
        </div>
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
          {fmt(summary.totalHours)} window
        </span>
      </div>

      <div className="flex h-3 w-full rounded-full overflow-hidden bg-muted">
        <div style={{ width: `${committedPct}%` }} className="bg-amber-500/80" />
        <div style={{ width: `${allocatedPct}%` }} className="bg-primary" />
        <div style={{ width: `${freePct}%` }} className="bg-muted-foreground/20" />
      </div>

      <div className="grid grid-cols-3 gap-2 mt-3 text-center">
        <div>
          <p className="font-display font-bold text-lg">{fmt(summary.committedHours)}</p>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Engaged</p>
        </div>
        <div>
          <p className="font-display font-bold text-lg text-primary">{fmt(summary.allocatedHours)}</p>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Goal Work</p>
        </div>
        <div>
          <p className="font-display font-bold text-lg">{fmt(summary.freeHours)}</p>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Free</p>
        </div>
      </div>
    </motion.div>
  );
};

export default WeeklyCapacityCard;