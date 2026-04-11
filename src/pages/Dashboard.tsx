import { useState } from "react";
import { motion } from "framer-motion";
import { ChevronRight, Flame, Zap, Plus, Target, MessageSquare } from "lucide-react";
import AppHeader from "@/components/AppHeader";
import AppShell from "@/components/AppShell";
import { useGoals } from "@/hooks/useGoals";
import { useAuth } from "@/contexts/AuthContext";
import CreateGoalDialog from "@/components/CreateGoalDialog";
import CheckInDialog from "@/components/CheckInDialog";
import type { Goal } from "@/hooks/useGoals";

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4 },
};

const Dashboard = () => {
  const { user } = useAuth();
  const { data: goals, isLoading } = useGoals();
  const [showCreate, setShowCreate] = useState(false);
  const [checkInGoal, setCheckInGoal] = useState<Goal | null>(null);

  const activeGoals = goals?.filter((g) => g.status === "active") ?? [];
  const completedCount = goals?.filter((g) => g.status === "completed").length ?? 0;
  const totalProgress = activeGoals.length
    ? Math.round(activeGoals.reduce((sum, g) => sum + g.progress, 0) / activeGoals.length)
    : 0;

  const displayName = user?.user_metadata?.full_name?.split(" ")[0] || "there";
  const now = new Date();
  const dateStr = now.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });

  return (
    <AppShell>
      <AppHeader />
      <div className="px-5 space-y-5 pt-2">
        {/* Greeting */}
        <motion.div {...fadeUp}>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            {dateStr}
          </p>
          <h2 className="font-display text-3xl font-bold mt-1">
            Welcome Back, {displayName}.
          </h2>
          <p className="text-muted-foreground mt-1">
            You have <span className="text-primary font-medium">{activeGoals.length} active goal{activeGoals.length !== 1 ? "s" : ""}</span>
          </p>
        </motion.div>

        {/* Active Goals */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="rounded-xl bg-card p-4 border border-border animate-pulse h-20" />
            ))}
          </div>
        ) : activeGoals.length > 0 ? (
          <div className="space-y-3">
            {activeGoals.map((goal, i) => (
              <motion.div
                key={goal.id}
                {...fadeUp}
                transition={{ delay: i * 0.08 }}
                className="rounded-xl bg-card p-4 shadow-card border border-border"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-display font-semibold">{goal.title}</h3>
                      {goal.category && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-semibold uppercase">
                          {goal.category}
                        </span>
                      )}
                    </div>
                    <div className="mt-3 h-1.5 rounded-full bg-muted overflow-hidden">
                      <motion.div
                        className="h-full rounded-full gradient-mint"
                        initial={{ width: 0 }}
                        animate={{ width: `${goal.progress}%` }}
                        transition={{ duration: 0.8, delay: i * 0.1 }}
                      />
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                        {goal.checkin_frequency} check-in
                      </p>
                      <span className="text-primary text-sm font-bold">{goal.progress}%</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setCheckInGoal(goal)}
                  className="mt-3 w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-primary/10 text-primary text-xs font-semibold hover:bg-primary/20 transition-colors"
                >
                  <MessageSquare size={14} /> Check In
                </button>
              </motion.div>
            ))}
          </div>
        ) : (
          <motion.div
            {...fadeUp}
            className="rounded-xl border border-dashed border-border bg-card/50 p-8 text-center"
          >
            <Target size={32} className="text-muted-foreground mx-auto mb-3" />
            <p className="font-display font-semibold text-lg">No goals yet</p>
            <p className="text-sm text-muted-foreground mt-1 mb-4">
              Create your first goal to start tracking progress
            </p>
            <button
              onClick={() => setShowCreate(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl gradient-mint text-primary-foreground font-semibold text-sm shadow-mint"
            >
              <Plus size={16} /> Create Goal
            </button>
          </motion.div>
        )}

        {/* Stats Row */}
        <div className="grid grid-cols-2 gap-3">
          <motion.div {...fadeUp} transition={{ delay: 0.15 }} className="rounded-xl bg-card p-4 shadow-card border border-border">
            <Zap size={20} className="text-primary mb-2" />
            <p className="text-sm text-muted-foreground">Active</p>
            <p className="font-display text-2xl font-bold">{activeGoals.length}</p>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mt-1">Goals in progress</p>
          </motion.div>
          <motion.div {...fadeUp} transition={{ delay: 0.2 }} className="rounded-xl bg-card p-4 shadow-card border border-border">
            <Target size={20} className="text-primary mb-2" />
            <p className="text-sm text-muted-foreground">Overall</p>
            <p className="font-display text-2xl font-bold">{totalProgress}%</p>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mt-1">Avg progress</p>
          </motion.div>
        </div>

        {/* Disruption Alert (only if goals exist) */}
        {completedCount > 0 && (
          <motion.div {...fadeUp} transition={{ delay: 0.3 }} className="rounded-xl bg-primary/10 border border-primary/30 p-4 flex items-center gap-3">
            <div className="rounded-lg bg-primary/20 p-2">
              <Flame size={20} className="text-primary" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-sm">{completedCount} Goal{completedCount !== 1 ? "s" : ""} Completed</p>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Keep up the momentum!</p>
            </div>
            <ChevronRight size={18} className="text-muted-foreground" />
          </motion.div>
        )}
      </div>

      {/* FAB */}
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={() => setShowCreate(true)}
        className="fixed bottom-24 right-6 h-14 w-14 rounded-2xl gradient-mint shadow-mint flex items-center justify-center z-40"
      >
        <Plus size={24} className="text-primary-foreground" />
      </motion.button>

      <CreateGoalDialog open={showCreate} onClose={() => setShowCreate(false)} />
      {checkInGoal && (
        <CheckInDialog open={!!checkInGoal} onClose={() => setCheckInGoal(null)} goal={checkInGoal} />
      )}
    </AppShell>
  );
};

export default Dashboard;
