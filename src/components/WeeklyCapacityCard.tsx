import { motion } from "framer-motion";
import { Clock3, Moon, Sparkles } from "lucide-react";
import { useTimeAllocation } from "@/hooks/useTimeAllocation";

const WeeklyCapacityCard = () => {
  const { summary, loggedSleepMin } = useTimeAllocation();
  const total = Math.max(summary.totalHours || 168, 1);
  const sections = [
    { label: "Sleep", value: summary.sleepHours, color: "bg-sky-400/70", icon: Moon },
    { label: "Commitments", value: summary.committedHours, color: "bg-amber-300/80", icon: Clock3 },
    { label: "Goal work", value: summary.allocatedHours, color: "bg-primary", icon: Sparkles },
    { label: "Open", value: summary.freeHours, color: "bg-white/[0.08]", icon: null },
  ];

  const loggedH = loggedSleepMin / 60;
  const sleepTarget = Math.max(summary.sleepTargetHours, 1);
  const sleepProgress = Math.min(100, (loggedH / sleepTarget) * 100);

  return (
    <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="panel p-5 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="eyebrow">Capacity</p>
          <h2 className="mt-1 text-xl font-semibold">Where your week is going</h2>
        </div>
        <span className="rounded-full border border-white/[0.07] bg-white/[0.025] px-2.5 py-1 text-[10px] font-semibold text-muted-foreground">168h total</span>
      </div>
      <div className="mt-5 overflow-hidden rounded-full bg-white/[0.04]">
        <div className="flex h-3 w-full">
          {sections.map((item) => <div key={item.label} className={item.color} style={{ width: `${Math.max(0, item.value / total * 100)}%` }} />)}
        </div>
      </div>
      <div className="mt-5 grid grid-cols-2 gap-x-4 gap-y-4 sm:grid-cols-4">
        {sections.map(({ label, value, icon: Icon }) => (
          <div key={label} className="flex items-center gap-2">
            <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-white/[0.035] text-muted-foreground">
              {Icon ? <Icon size={14} /> : <span className="h-2 w-2 rounded-full bg-white/20" />}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold">{value.toFixed(1)}h</p>
              <p className="truncate text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-5 border-t border-white/[0.06] pt-4">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Sleep target</span>
          <span className="font-medium">{loggedH.toFixed(1)}h logged · {sleepTarget.toFixed(1)}h target</span>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/[0.05]">
          <motion.div initial={{ width: 0 }} animate={{ width: `${sleepProgress}%` }} className="h-full rounded-full bg-sky-400/70" />
        </div>
      </div>
    </motion.section>
  );
};

export default WeeklyCapacityCard;
