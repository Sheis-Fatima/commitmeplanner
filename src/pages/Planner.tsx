import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Clock, AlertTriangle, Target, MessageSquare, CheckCircle2, Trash2, Check, MoreVertical, Sparkles } from "lucide-react";
import AppHeader from "@/components/AppHeader";
import AppShell from "@/components/AppShell";
import { useGoals, useDeleteGoal, useCompleteGoal, useGenerateRoadmap } from "@/hooks/useGoals";
import { useEmergencyCommitments, useResolveEmergency } from "@/hooks/useEmergencyCommitments";
import CreateGoalDialog from "@/components/CreateGoalDialog";
import CheckInDialog from "@/components/CheckInDialog";
import EmergencyCommitmentDialog from "@/components/EmergencyCommitmentDialog";
import type { Goal } from "@/hooks/useGoals";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Planner = () => {
  const [view, setView] = useState<"Active" | "All">("Active");
  const { data: goals, isLoading } = useGoals();
  const { data: emergencies } = useEmergencyCommitments();
  const resolveEmergency = useResolveEmergency();
  const deleteGoal = useDeleteGoal();
  const completeGoal = useCompleteGoal();
  const generateRoadmap = useGenerateRoadmap();
  const [showCreate, setShowCreate] = useState(false);
  const [showEmergency, setShowEmergency] = useState(false);
  const [checkInGoal, setCheckInGoal] = useState<Goal | null>(null);

  const activeEmergencies = emergencies?.filter((e) => !e.resolved) ?? [];

  const filtered = view === "Active"
    ? goals?.filter((g) => g.status === "active") ?? []
    : goals ?? [];

  return (
    <AppShell>
      <AppHeader />
      <div className="px-5 space-y-5 pt-2">
        {/* Active Emergencies Banner */}
        {activeEmergencies.map((em) => (
          <motion.div
            key={em.id}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl bg-destructive/10 border border-destructive/30 p-4"
          >
            <div className="flex items-start gap-3">
              <AlertTriangle size={18} className="text-destructive mt-0.5 shrink-0" />
              <div className="flex-1">
                <p className="font-semibold text-sm">{em.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {em.priority === "critical" ? "🔴 Critical" : "🟠 High"} · {em.duration_days} days · Ends {new Date(em.end_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </p>
                {em.description && (
                  <p className="text-xs text-muted-foreground mt-1">{em.description}</p>
                )}
              </div>
              <button
                onClick={() => resolveEmergency.mutate(em.id)}
                disabled={resolveEmergency.isPending}
                className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline shrink-0"
              >
                <CheckCircle2 size={14} /> Resolve
              </button>
            </div>
          </motion.div>
        ))}

        {/* Toggle */}
        <div className="flex items-center justify-between">
          <div className="flex rounded-full bg-card border border-border p-1">
            {(["Active", "All"] as const).map((v) => (
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
          <span className="text-sm text-muted-foreground font-medium">
            {filtered.length} goal{filtered.length !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Goals List */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-xl bg-card p-4 border border-border animate-pulse h-28" />
            ))}
          </div>
        ) : filtered.length > 0 ? (
          <div className="space-y-3">
            {filtered.map((goal, i) => (
              <motion.div
                key={goal.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                className={`rounded-xl p-4 border shadow-card ${
                  goal.status === "completed"
                    ? "bg-primary/5 border-primary/20"
                    : goal.status === "paused"
                    ? "bg-destructive/5 border-destructive/20"
                    : "bg-card border-border"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground">
                      {goal.category || "Goal"}
                    </p>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase ${
                      goal.status === "active"
                        ? "bg-primary/10 text-primary"
                        : goal.status === "completed"
                        ? "bg-primary/20 text-primary"
                        : "bg-destructive/10 text-destructive"
                    }`}>
                      {goal.status}
                    </span>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="p-1 rounded-lg hover:bg-muted transition-colors">
                        <MoreVertical size={16} className="text-muted-foreground" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      {goal.status === "active" && (
                        <DropdownMenuItem
                          onClick={() => completeGoal.mutate(goal.id)}
                          className="gap-2"
                        >
                          <Check size={14} className="text-primary" /> Mark Complete
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem
                        onClick={() => generateRoadmap.mutate(goal)}
                        disabled={generateRoadmap.isPending}
                        className="gap-2"
                      >
                        <Sparkles size={14} className="text-primary" /> AI Roadmap
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => deleteGoal.mutate(goal.id)}
                        className="gap-2 text-destructive focus:text-destructive"
                      >
                        <Trash2 size={14} /> Delete Goal
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <h3 className="font-display text-lg font-bold">{goal.title}</h3>
                {goal.description && (
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{goal.description}</p>
                )}
                <div className="flex items-center gap-3 mt-3">
                  <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                    <motion.div
                      className="h-full rounded-full gradient-mint"
                      initial={{ width: 0 }}
                      animate={{ width: `${goal.progress}%` }}
                      transition={{ duration: 0.6 }}
                    />
                  </div>
                  <span className="text-primary text-sm font-bold">{goal.progress}%</span>
                </div>
                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock size={12} />
                    <span className="capitalize">{goal.checkin_frequency} check-in</span>
                    {goal.target_date && (
                      <>
                        <span>·</span>
                        <span>Due {new Date(goal.target_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                      </>
                    )}
                  </div>
                  {goal.status === "active" && (
                    <button
                      onClick={() => setCheckInGoal(goal)}
                      className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                    >
                      <MessageSquare size={12} /> Check In
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-border bg-card/50 p-8 text-center">
            <Target size={32} className="text-muted-foreground mx-auto mb-3" />
            <p className="font-display font-semibold text-lg">No goals yet</p>
            <p className="text-sm text-muted-foreground mt-1">Tap + to create your first goal</p>
          </div>
        )}

        {/* Emergency Commitment */}
        <button
          onClick={() => setShowEmergency(true)}
          className="w-full rounded-xl border border-dashed border-destructive/40 bg-destructive/5 p-4 flex items-center gap-3 hover:bg-destructive/10 transition-colors"
        >
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
        onClick={() => setShowCreate(true)}
        className="fixed bottom-24 right-6 h-14 w-14 rounded-2xl gradient-mint shadow-mint flex items-center justify-center z-40"
      >
        <Plus size={24} className="text-primary-foreground" />
      </motion.button>

      <CreateGoalDialog open={showCreate} onClose={() => setShowCreate(false)} />
      <EmergencyCommitmentDialog open={showEmergency} onClose={() => setShowEmergency(false)} />
      {checkInGoal && (
        <CheckInDialog open={!!checkInGoal} onClose={() => setCheckInGoal(null)} goal={checkInGoal} />
      )}
    </AppShell>
  );
};

export default Planner;
