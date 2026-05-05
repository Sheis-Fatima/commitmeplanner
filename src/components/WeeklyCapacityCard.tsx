import { motion } from "framer-motion";
import { Clock } from "lucide-react";
import { useTimeAllocation } from "@/hooks/useTimeAllocation";

const WeeklyCapacityCard = () => {
  const { summary, loggedSleepMin } = useTimeAllocation();
  const total = summary.totalHours || 1;
  const sleepPct = (summary.sleepHours / total) * 100;
  const committedPct = (summary.committedHours / total) * 100;
  const allocatedPct = (summary.allocatedHours / total) * 100;
  const freePct = Math.max(0, 100 - sleepPct - committedPct - allocatedPct);

  const fmt = (h: number) => `${h.toFixed(1)}h`;
  const loggedH = loggedSleepMin / 60;
  const targetH = summary.sleepTargetHours;
  const sleepProgressPct = Math.min(100, (loggedH / Math.max(1, targetH)) * 100);

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
          168h · {targetH.toFixed(0)}h sleep target
        </span>
      </div>

      <div className="flex h-3 w-full rounded-full overflow-hidden bg-muted">
        <div style={{ width: `${sleepPct}%` }} className="bg-indigo-500/70" />
        <div style={{ width: `${committedPct}%` }} className="bg-amber-500/80" />
        <div style={{ width: `${allocatedPct}%` }} className="bg-primary" />
        <div style={{ width: `${freePct}%` }} className="bg-muted-foreground/20" />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3 text-center">
        <div>
          <p className="font-display font-bold text-lg text-indigo-400">{fmt(summary.sleepHours)}</p>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Sleep</p>
        </div>
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

      <div className="mt-4 pt-3 border-t border-border/50">
        <div className="flex items-center justify-between text-[11px] mb-1">
          <span className="text-muted-foreground">Sleep logged</span>
          <span className="text-foreground font-semibold">
            {loggedH.toFixed(1)}h / {targetH.toFixed(0)}h
            <span className="text-muted-foreground font-normal"> · {summary.sleepRemainingHours.toFixed(1)}h to go</span>
          </span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
          <div className="h-full bg-indigo-500/70" style={{ width: `${sleepProgressPct}%` }} />
        </div>
      </div>
    </motion.div>
  );
};

export default WeeklyCapacityCard;
