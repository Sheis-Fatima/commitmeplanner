import { useState } from "react";
import { motion } from "framer-motion";
import { Flame, Code, BookOpen } from "lucide-react";
import AppHeader from "@/components/AppHeader";
import AppShell from "@/components/AppShell";

const heatmap = Array.from({ length: 35 }, () => Math.random());

const milestoneData = [
  { day: "Mon", value: 30 },
  { day: "Tue", value: 45 },
  { day: "Wed", value: 20 },
  { day: "Thu", value: 55 },
  { day: "Fri", value: 85 },
  { day: "Sat", value: 70 },
  { day: "Sun", value: 40 },
];

const upcoming = [
  { icon: Code, title: "Design Pattern Review", desc: "Refactor microservices module", day: "TUE" },
  { icon: BookOpen, title: "Schema Optimization", desc: "Finalize PostgreSQL indexing", day: "THU" },
  { icon: Code, title: "CI/CD Pipeline Setup", desc: "Deploy prototype to staging", day: "FRI" },
];

const Insights = () => {
  const [period, setPeriod] = useState<"Weekly" | "Monthly">("Weekly");
  const maxVal = Math.max(...milestoneData.map(d => d.value));

  return (
    <AppShell>
      <AppHeader title="Insights" showAvatar={false} />
      <div className="px-5 space-y-5 pt-2">
        {/* Period Toggle */}
        <div className="flex justify-center">
          <div className="flex rounded-full bg-card border border-border p-1">
            {(["Weekly", "Monthly"] as const).map((v) => (
              <button
                key={v}
                onClick={() => setPeriod(v)}
                className={`px-5 py-1.5 rounded-full text-sm font-semibold transition-all ${
                  period === v ? "gradient-mint text-primary-foreground" : "text-muted-foreground"
                }`}
              >
                {v}
              </button>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-card border border-border p-4 shadow-card">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">Completion</p>
            <p className="font-display text-3xl font-bold text-primary mt-1">92%</p>
            <p className="text-xs text-muted-foreground mt-1">+4.2% from last week</p>
          </div>
          <div className="rounded-xl bg-card border border-border p-4 shadow-card">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">Deep Work</p>
            <p className="font-display text-3xl font-bold mt-1">24h</p>
            <p className="text-xs text-muted-foreground mt-1">Goal: 30h/week</p>
          </div>
        </div>

        {/* Score */}
        <div className="rounded-xl bg-card border border-border p-4 shadow-card">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">Score</p>
          <div className="flex items-baseline gap-3 mt-1">
            <span className="font-display text-4xl font-bold">A+</span>
            <span className="text-sm text-muted-foreground">Top 5% of Users</span>
          </div>
        </div>

        {/* Streak */}
        <div className="rounded-xl gradient-card border border-border p-4 shadow-card flex items-center justify-between">
          <div>
            <p className="text-xs text-primary font-semibold">Current Streak</p>
            <p className="font-display text-2xl font-bold mt-1">14 Days <span className="text-primary">On Fire</span></p>
          </div>
          <Flame size={32} className="text-primary animate-pulse-mint" />
        </div>

        <div className="rounded-xl bg-card border border-border p-4 shadow-card flex items-center justify-between">
          <p className="text-sm text-muted-foreground">Longest Streak</p>
          <p className="font-display text-2xl font-bold">32 Days</p>
        </div>

        {/* Heatmap */}
        <div className="rounded-xl bg-card border border-border p-4 shadow-card">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-display font-semibold">Consistency Heatmap</h3>
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
              Less
              {[0.1, 0.3, 0.5, 0.7, 1].map((o, i) => (
                <div key={i} className="w-3 h-3 rounded-sm gradient-mint" style={{ opacity: o }} />
              ))}
              More
            </div>
          </div>
          <div className="grid grid-cols-7 gap-1.5">
            {heatmap.map((v, i) => (
              <div key={i} className="aspect-square rounded-sm gradient-mint" style={{ opacity: Math.max(0.1, v) }} />
            ))}
          </div>
        </div>

        {/* Milestones Chart */}
        <div className="rounded-xl bg-card border border-border p-4 shadow-card">
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-display font-semibold">Milestones Reached</h3>
            <span className="text-xs gradient-mint text-primary-foreground px-2 py-0.5 rounded-full font-semibold">65% Overall</span>
          </div>
          <p className="text-xs text-muted-foreground mb-4">Master Python Architecture</p>
          <div className="flex items-end gap-2 h-28">
            {milestoneData.map((d, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${(d.value / maxVal) * 100}%` }}
                  transition={{ delay: i * 0.05, duration: 0.4 }}
                  className={`w-full rounded-t-md ${d.day === "Fri" ? "gradient-mint shadow-mint" : "bg-primary/30"}`}
                />
                <span className={`text-[10px] ${d.day === "Fri" ? "text-primary font-bold" : "text-muted-foreground"}`}>{d.day}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming */}
        <div>
          <h3 className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground mb-3">Upcoming Milestones</h3>
          <div className="space-y-3">
            {upcoming.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.08 }}
                className="rounded-xl bg-card border border-border p-4 shadow-card flex items-center gap-3"
              >
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <item.icon size={18} className="text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{item.title}</p>
                  <p className="text-xs text-muted-foreground truncate">{item.desc}</p>
                </div>
                <span className="text-xs text-primary font-bold">{item.day}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
};

export default Insights;
