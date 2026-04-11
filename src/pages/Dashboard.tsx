import { motion } from "framer-motion";
import { ChevronRight, Flame, Zap, BookOpen } from "lucide-react";
import AppHeader from "@/components/AppHeader";
import AppShell from "@/components/AppShell";

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4 },
};

const Dashboard = () => (
  <AppShell>
    <AppHeader />

    <div className="px-5 space-y-5 pt-2">
      {/* Greeting */}
      <motion.div {...fadeUp}>
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Monday, Oct 23
        </p>
        <h2 className="font-display text-3xl font-bold mt-1">
          Welcome Back, Julian.
        </h2>
        <p className="text-muted-foreground mt-1">
          Your focus window is currently{" "}
          <em className="text-primary font-medium not-italic">Peak Performance</em>.
        </p>
      </motion.div>

      {/* Current Goal */}
      <motion.div {...fadeUp} transition={{ delay: 0.1 }} className="rounded-xl bg-card p-4 shadow-card border border-border">
        <div className="flex items-center justify-between">
          <h3 className="font-display font-semibold">Master Python Architecture</h3>
          <span className="text-primary text-sm font-bold">45%</span>
        </div>
        <div className="mt-3 h-1.5 rounded-full bg-muted overflow-hidden">
          <div className="h-full rounded-full gradient-mint" style={{ width: "45%" }} />
        </div>
        <p className="text-xs text-muted-foreground mt-2 uppercase tracking-wider">
          Next: Design Patterns Deep Dive
        </p>
      </motion.div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 gap-3">
        <motion.div {...fadeUp} transition={{ delay: 0.15 }} className="rounded-xl bg-card p-4 shadow-card border border-border">
          <Zap size={20} className="text-primary mb-2" />
          <p className="text-sm text-muted-foreground">Strength</p>
          <p className="font-display text-2xl font-bold">12/20</p>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground mt-1">Sessions Done</p>
        </motion.div>
        <motion.div {...fadeUp} transition={{ delay: 0.2 }} className="rounded-xl bg-card p-4 shadow-card border border-border">
          <BookOpen size={20} className="text-primary mb-2" />
          <p className="text-sm text-muted-foreground">Reading</p>
          <p className="font-display text-2xl font-bold">78%</p>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground mt-1">The Daily Stoic</p>
        </motion.div>
      </div>

      {/* Today's Flow */}
      <motion.div {...fadeUp} transition={{ delay: 0.25 }}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-display text-lg font-semibold">Today's Flow</h3>
          <span className="text-primary text-sm font-medium">Full View</span>
        </div>

        <div className="space-y-4">
          {[
            { time: "09:00", title: "Architecture Sync", desc: "System Design Workshop with Team", active: true },
            { time: "11:30", title: "Deep Focus: Coding", desc: "60m Dedicated Block", active: false },
            { time: "13:00", title: "Lunch & Mobility", desc: "Mindful rest period", active: false },
          ].map((item, i) => (
            <div key={i} className="flex gap-4">
              <span className="text-xs text-muted-foreground w-12 pt-1 shrink-0">{item.time}</span>
              <div className={`flex-1 rounded-lg p-3 border ${item.active ? "border-primary/40 bg-primary/5" : "border-border bg-card"}`}>
                <p className="font-semibold text-sm">{item.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Disruption Alert */}
      <motion.div {...fadeUp} transition={{ delay: 0.3 }} className="rounded-xl bg-destructive/10 border border-destructive/30 p-4 flex items-center gap-3">
        <div className="rounded-lg bg-destructive/20 p-2">
          <Flame size={20} className="text-destructive" />
        </div>
        <div className="flex-1">
          <p className="font-semibold text-sm">Disruption Detected</p>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Recalibrate Flow Immediately</p>
        </div>
        <ChevronRight size={18} className="text-muted-foreground" />
      </motion.div>
    </div>
  </AppShell>
);

export default Dashboard;
