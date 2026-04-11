import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Clock, Sparkles, AlertTriangle } from "lucide-react";
import AppHeader from "@/components/AppHeader";
import AppShell from "@/components/AppShell";

const days = [
  { day: "MON", date: 21 },
  { day: "TUE", date: 22 },
  { day: "WED", date: 23 },
  { day: "THU", date: 24, active: true },
  { day: "FRI", date: 25 },
];

const events = [
  { time: "09:00", end: "11:30", label: "ENDEAVOR", title: "Deep Work: Q4 Strategy", variant: "default" as const },
  { time: "11:45", end: "12:30", label: "GOAL TASK", title: "Finalize Design Handoff", variant: "mint" as const, priority: "High Priority" },
  { time: "14:00", end: "15:00", label: "ENDEAVOR", title: "Team Sync", variant: "default" as const },
];

const Planner = () => {
  const [view, setView] = useState<"Daily" | "Weekly">("Daily");

  return (
    <AppShell>
      <AppHeader />
      <div className="px-5 space-y-5 pt-2">
        {/* Toggle */}
        <div className="flex items-center justify-between">
          <div className="flex rounded-full bg-card border border-border p-1">
            {(["Daily", "Weekly"] as const).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-5 py-1.5 rounded-full text-sm font-semibold transition-all ${
                  view === v ? "gradient-mint text-primary-foreground" : "text-muted-foreground"
                }`}
              >
                {v}
              </button>
            ))}
          </div>
          <span className="text-sm text-muted-foreground font-medium">OCT 24</span>
        </div>

        {/* Day Selector */}
        <div className="flex gap-2 justify-between">
          {days.map((d) => (
            <button
              key={d.date}
              className={`flex flex-col items-center rounded-xl px-3 py-2.5 transition-all ${
                d.active
                  ? "gradient-mint text-primary-foreground shadow-mint"
                  : "bg-card border border-border text-muted-foreground"
              }`}
            >
              <span className="text-[10px] uppercase tracking-wider font-semibold">{d.day}</span>
              <span className="text-lg font-bold mt-0.5">{d.date}</span>
              {d.active && <div className="w-1 h-1 rounded-full bg-primary-foreground mt-1" />}
            </button>
          ))}
        </div>

        {/* Timeline */}
        <div className="space-y-3">
          {events.map((ev, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className={`rounded-xl p-4 border ${
                ev.variant === "mint"
                  ? "gradient-mint text-primary-foreground border-transparent shadow-mint"
                  : "bg-card border-border shadow-card"
              }`}
            >
              <p className={`text-[10px] uppercase tracking-widest font-semibold ${ev.variant === "mint" ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                {ev.label}
              </p>
              <h3 className="font-display text-lg font-bold mt-1">{ev.title}</h3>
              <div className="flex items-center gap-2 mt-2">
                {ev.priority && (
                  <span className="flex items-center gap-1 text-xs font-medium">
                    <Sparkles size={12} /> {ev.priority}
                  </span>
                )}
                <span className={`flex items-center gap-1 text-xs ${ev.variant === "mint" ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                  <Clock size={12} /> {ev.time} — {ev.end}
                </span>
              </div>
            </motion.div>
          ))}

          {/* Available Slot */}
          <div className="flex items-center justify-center gap-2 py-4 text-muted-foreground">
            <Plus size={14} />
            <span className="text-[10px] uppercase tracking-widest font-semibold">Available Slot</span>
          </div>

          {/* Emergency Commitment */}
          <button className="w-full rounded-xl border border-dashed border-destructive/40 bg-destructive/5 p-4 flex items-center gap-3 hover:bg-destructive/10 transition-colors">
            <AlertTriangle size={18} className="text-destructive" />
            <div className="text-left">
              <p className="font-semibold text-sm">Add Emergency Commitment</p>
              <p className="text-xs text-muted-foreground">Auto-reschedules your goals around it</p>
            </div>
          </button>
        </div>

        {/* FAB */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          className="fixed bottom-24 right-6 h-14 w-14 rounded-2xl gradient-mint shadow-mint flex items-center justify-center"
        >
          <Plus size={24} className="text-primary-foreground" />
        </motion.button>
      </div>
    </AppShell>
  );
};

export default Planner;
