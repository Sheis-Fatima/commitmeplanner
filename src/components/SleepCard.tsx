import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Moon, Plus } from "lucide-react";
import { useSleepLogs, useSleepPreferences } from "@/hooks/useSleep";
import { getWeekStart } from "@/lib/timeAllocation";
import SleepLogDialog from "./SleepLogDialog";

const fmtTime = (iso: string) => new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

const SleepCard = () => {
  const [open, setOpen] = useState(false);
  const weekStart = useMemo(() => getWeekStart(), []);
  const weekEnd = useMemo(() => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + 7);
    return d;
  }, [weekStart]);
  const { data: logs } = useSleepLogs(weekStart.toISOString().slice(0, 10), weekEnd.toISOString().slice(0, 10));
  const { data: prefs } = useSleepPreferences();
  const target = prefs?.target_hours ?? 7.5;
  const targetWeek = target * 7;
  const loggedH = ((logs ?? []).reduce((s, l) => s + l.duration_min, 0)) / 60;
  const remaining = Math.max(0, targetWeek - loggedH);
  const pct = Math.min(100, (loggedH / targetWeek) * 100);
  const last = (logs ?? [])[0];

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl bg-card p-4 shadow-card border border-border"
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Moon size={18} className="text-primary" />
            <h3 className="font-display font-semibold">Sleep</h3>
          </div>
          <button
            onClick={() => setOpen(true)}
            className="text-xs flex items-center gap-1 px-2 py-1 rounded-lg bg-primary/10 text-primary hover:bg-primary/20"
          >
            <Plus size={12} /> Log sleep
          </button>
        </div>

        {last ? (
          <p className="text-xs text-muted-foreground mb-2">
            Last night: {fmtTime(last.start_time)} → {fmtTime(last.end_time)} ·{" "}
            <span className="text-foreground font-semibold">{(last.duration_min / 60).toFixed(1)}h</span>
          </p>
        ) : (
          <p className="text-xs text-muted-foreground mb-2">No sleep logged yet — tap to add.</p>
        )}

        <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
          <div className="h-full bg-indigo-500/70" style={{ width: `${pct}%` }} />
        </div>
        <p className="text-[11px] text-muted-foreground mt-2">
          {loggedH.toFixed(1)}h / {targetWeek.toFixed(0)}h this week ·{" "}
          <span className="text-foreground">{remaining.toFixed(1)}h to go</span>
        </p>
      </motion.div>

      <SleepLogDialog open={open} onClose={() => setOpen(false)} />
    </>
  );
};

export default SleepCard;
