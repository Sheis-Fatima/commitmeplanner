import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowUpRight,
  CalendarClock,
  Check,
  CheckCircle2,
  ChevronRight,
  Circle,
  Clock3,
  Flame,
  Plus,
  Target,
  Zap,
} from "lucide-react";
import AppHeader from "@/components/AppHeader";
import AppShell from "@/components/AppShell";
import { useAuth } from "@/contexts/AuthContext";
import { useGoals } from "@/hooks/useGoals";
import { useCommitments, useCompleteCommitment, type Commitment } from "@/hooks/useCommitments";
import { useEmergencyCommitments } from "@/hooks/useEmergencyCommitments";
import { useTimeAllocation } from "@/hooks/useTimeAllocation";
import CreateGoalDialog from "@/components/CreateGoalDialog";
import CheckInDialog from "@/components/CheckInDialog";
import CommitmentDialog from "@/components/CommitmentDialog";
import QuickAdjustDialog from "@/components/QuickAdjustDialog";
import DailyMoodCard from "@/components/DailyMoodCard";
import SleepCard from "@/components/SleepCard";
import type { Goal } from "@/hooks/useGoals";

const Dashboard = () => {
  const { user } = useAuth();
  const { data: goals, isLoading } = useGoals();
  const { data: commitments } = useCommitments();
  const { data: emergencies } = useEmergencyCommitments();
  const { allocations, summary } = useTimeAllocation();
  const completeCommitment = useCompleteCommitment();

  const [showCreate, setShowCreate] = useState(false);
  const [showCommitment, setShowCommitment] = useState(false);
  const [editingCommitment, setEditingCommitment] = useState<Commitment | null>(null);
  const [showEmergency, setShowEmergency] = useState(false);
  const [checkInGoal, setCheckInGoal] = useState<Goal | null>(null);

  const activeGoals = goals?.filter((g) => g.status === "active") ?? [];
  const activeCommitments = commitments?.filter((c) => !c.resolved) ?? [];
  const activeEmergencies = emergencies?.filter((e) => !e.resolved) ?? [];
  const avgProgress = activeGoals.length
    ? Math.round(activeGoals.reduce((sum, goal) => sum + goal.progress, 0) / activeGoals.length)
    : 0;

  const dateLabel = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(new Date());

  const today = new Date().toISOString().slice(0, 10);
  const todayPlan = allocations.filter((a) => a.date === today);

  const initials = (user?.user_metadata?.full_name || user?.email || "U")
    .split(" ")
    .map((part: string) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const topGoal = useMemo(
    () => [...activeGoals].sort((a, b) => b.progress - a.progress)[0],
    [activeGoals],
  );

  return (
    <AppShell>
      <AppHeader title="Overview" />

      <div className="space-y-6 pt-1">
        <section className="grid gap-4 xl:grid-cols-[minmax(0,1.65fr)_minmax(320px,.85fr)]">
          <div className="relative overflow-hidden rounded-[28px] border border-white/[0.07] bg-[linear-gradient(145deg,#10161b_0%,#0b1014_62%,#0e1713_100%)] p-6 shadow-card sm:p-8">
            <div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
            <div className="relative">
              <div className="flex flex-wrap items-start justify-between gap-6">
                <div className="max-w-2xl">
                  <p className="eyebrow text-primary/80">{dateLabel}</p>
                  <h1 className="mt-2 max-w-xl text-3xl font-semibold leading-tight sm:text-4xl">
                    Build a day you can actually keep.
                  </h1>
                  <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground sm:text-base">
                    Your plan is built around the commitments, sleep, and goals already on your calendar.
                  </p>
                </div>
                <div className="hidden h-12 w-12 place-items-center rounded-2xl bg-white/[0.04] ring-1 ring-white/[0.08] sm:grid">
                  <span className="text-sm font-semibold text-primary">{initials}</span>
                </div>
              </div>

              <div className="mt-7 flex flex-wrap gap-3">
                <button
                  onClick={() => setShowCreate(true)}
                  className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-[0_12px_30px_-16px_rgba(74,222,128,.8)] transition hover:translate-y-[-1px]"
                >
                  <Plus size={17} /> Add goal
                </button>
                <button
                  onClick={() => { setEditingCommitment(null); setShowCommitment(true); }}
                  className="inline-flex items-center gap-2 rounded-xl border border-white/[0.09] bg-white/[0.03] px-4 py-2.5 text-sm font-semibold text-foreground transition hover:bg-white/[0.06]"
                >
                  <CalendarClock size={17} /> Add commitment
                </button>
              </div>

              <div className="mt-8 grid grid-cols-2 gap-3 border-t border-white/[0.07] pt-5 sm:grid-cols-4">
                <div>
                  <p className="eyebrow">Active goals</p>
                  <p className="mt-1.5 text-2xl font-semibold">{activeGoals.length}</p>
                </div>
                <div>
                  <p className="eyebrow">Avg progress</p>
                  <p className="mt-1.5 text-2xl font-semibold text-primary">{avgProgress}%</p>
                </div>
                <div>
                  <p className="eyebrow">Free this week</p>
                  <p className="mt-1.5 text-2xl font-semibold">{summary.freeHours.toFixed(1)}h</p>
                </div>
                <div>
                  <p className="eyebrow">Goal time</p>
                  <p className="mt-1.5 text-2xl font-semibold">{summary.allocatedHours.toFixed(1)}h</p>
                </div>
              </div>
            </div>
          </div>

          <div className="panel p-5 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="eyebrow text-primary/80">Today</p>
                <h2 className="mt-1 text-xl font-semibold">Your next moves</h2>
              </div>
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
                <Zap size={18} />
              </div>
            </div>
            <div className="mt-5 space-y-3">
              {todayPlan.length > 0 ? todayPlan.slice(0, 4).map((item, index) => (
                <motion.div
                  key={item.stepId}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="group flex items-center gap-3 rounded-xl border border-white/[0.05] bg-white/[0.02] p-3"
                >
                  <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                    <Clock3 size={15} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{item.title}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{item.start} – {item.end}</p>
                  </div>
                  <ArrowUpRight size={15} className="text-muted-foreground opacity-60 transition group-hover:text-primary" />
                </motion.div>
              )) : (
                <div className="rounded-2xl border border-dashed border-white/[0.08] bg-white/[0.015] p-5 text-center">
                  <CalendarClock size={20} className="mx-auto text-muted-foreground" />
                  <p className="mt-3 text-sm font-medium">No goal work scheduled</p>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">Add a goal step or commitment and the planner will find room.</p>
                </div>
              )}
            </div>
            {todayPlan.length > 4 && (
              <p className="mt-4 text-xs text-muted-foreground">+{todayPlan.length - 4} more planned block{todayPlan.length - 4 === 1 ? "" : "s"} today</p>
            )}
          </div>
        </section>

        {activeEmergencies.length > 0 && (
          <section className="flex flex-col gap-4 rounded-2xl border border-amber-400/20 bg-amber-400/[0.06] p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
            <div className="flex items-start gap-3">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-amber-400/10 text-amber-300">
                <CalendarClock size={18} />
              </div>
              <div>
                <p className="font-semibold">Plan changed around an interruption</p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  {activeEmergencies.map((e) => e.title).join(", ")} · goal work will be redistributed around it.
                </p>
              </div>
            </div>
            <button onClick={() => setShowEmergency(true)} className="self-start rounded-xl border border-amber-300/20 px-3 py-2 text-xs font-semibold text-amber-200 hover:bg-amber-300/10 sm:self-auto">
              Manage interruption
            </button>
          </section>
        )}

        <section className="grid gap-4 lg:grid-cols-[minmax(0,1.5fr)_minmax(320px,.9fr)]">
          <div className="panel overflow-hidden">
            <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4 sm:px-6">
              <div>
                <p className="eyebrow">Progress</p>
                <h2 className="mt-1 text-xl font-semibold">Goals in motion</h2>
              </div>
              <button onClick={() => setShowCreate(true)} className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary/80">
                <Plus size={14} /> New goal
              </button>
            </div>

            <div>
              {isLoading ? (
                <div className="space-y-px bg-white/[0.03]">
                  {[1,2,3].map((i) => <div key={i} className="h-20 animate-pulse border-b border-white/[0.05] bg-white/[0.015]" />)}
                </div>
              ) : activeGoals.length > 0 ? (
                activeGoals.slice(0, 6).map((goal, index) => (
                  <div key={goal.id} className="border-b border-white/[0.05] px-5 py-4 last:border-0 sm:px-6">
                    <div className="flex items-start gap-4">
                      <div className="mt-1 shrink-0">
                        {goal.progress >= 100 ? <CheckCircle2 size={18} className="text-primary" /> : <Circle size={18} className="text-muted-foreground" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex min-w-0 items-center gap-2">
                            <h3 className="truncate text-sm font-semibold">{goal.title}</h3>
                            {goal.category && <span className="rounded-full bg-white/[0.04] px-2 py-0.5 text-[10px] font-medium text-muted-foreground">{goal.category}</span>}
                          </div>
                          <span className="text-xs font-semibold text-primary">{goal.progress}%</span>
                        </div>
                        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/[0.05]">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${goal.progress}%` }}
                            transition={{ duration: .6, delay: index * .04 }}
                            className="h-full rounded-full bg-primary"
                          />
                        </div>
                        <div className="mt-2 flex items-center justify-between gap-4 text-[11px] text-muted-foreground">
                          <span>{goal.checkin_frequency} check-in</span>
                          {goal.target_date ? <span>Due {new Date(goal.target_date + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span> : <span>No deadline</span>}
                        </div>
                      </div>
                      <button onClick={() => setCheckInGoal(goal)} className="mt-0.5 hidden items-center gap-1 rounded-lg bg-primary/10 px-2.5 py-1.5 text-[11px] font-semibold text-primary hover:bg-primary/15 sm:inline-flex">
                        Check in
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center">
                  <Target size={28} className="mx-auto text-muted-foreground" />
                  <p className="mt-3 font-semibold">Start with one meaningful goal</p>
                  <p className="mx-auto mt-1 max-w-sm text-xs leading-5 text-muted-foreground">Commitme will break it down and protect space for it around your real schedule.</p>
                  <button onClick={() => setShowCreate(true)} className="mt-4 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground">
                    Create your first goal
                  </button>
                </div>
              )}
            </div>

            {activeGoals.length > 6 && (
              <div className="border-t border-white/[0.06] px-5 py-3 sm:px-6">
                <button className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground">
                  View all goals <ChevronRight size={14} />
                </button>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <SleepCard />
            <DailyMoodCard />
          </div>
        </section>

        <section className="panel">
          <div className="flex flex-col gap-2 border-b border-white/[0.06] px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div>
              <p className="eyebrow">Protected time</p>
              <h2 className="mt-1 text-xl font-semibold">Your commitments</h2>
            </div>
            <button onClick={() => { setEditingCommitment(null); setShowCommitment(true); }} className="inline-flex items-center gap-1.5 self-start rounded-lg bg-white/[0.04] px-3 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground">
              <Plus size={14} /> Add commitment
            </button>
          </div>
          <div className="grid gap-px bg-white/[0.04] md:grid-cols-2">
            {activeCommitments.slice(0, 6).map((commitment) => (
              <div key={commitment.id} className="flex items-center gap-3 bg-card px-5 py-4 sm:px-6">
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white/[0.04] text-muted-foreground">
                  <CalendarClock size={16} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{commitment.title}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {commitment.frequency}{commitment.start_time ? ` · ${commitment.start_time}${commitment.end_time ? `–${commitment.end_time}` : ""}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => { setEditingCommitment(commitment); setShowCommitment(true); }} className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground hover:bg-white/[0.04] hover:text-foreground" aria-label={`Edit ${commitment.title}`}>
                    <ArrowUpRight size={14} />
                  </button>
                  <button onClick={() => completeCommitment.mutate(commitment.id)} className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground hover:bg-primary/10 hover:text-primary" aria-label={`Complete ${commitment.title}`}>
                    <Check size={15} />
                  </button>
                </div>
              </div>
            ))}
            {activeCommitments.length === 0 && (
              <div className="col-span-full px-5 py-8 text-center sm:px-6">
                <p className="text-sm font-medium">No recurring commitments yet</p>
                <p className="mt-1 text-xs text-muted-foreground">Add work, classes, routines, or anything the planner should always protect.</p>
              </div>
            )}
          </div>
        </section>

        {topGoal && (
          <div className="flex items-center justify-between rounded-2xl border border-primary/10 bg-primary/[0.04] px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary/10 text-primary"><Flame size={16} /></div>
              <div>
                <p className="text-xs font-semibold text-primary">Keep the momentum</p>
                <p className="mt-0.5 text-sm">Your most advanced goal is <span className="font-semibold">{topGoal.title}</span>.</p>
              </div>
            </div>
            <ArrowUpRight size={17} className="text-muted-foreground" />
          </div>
        )}
      </div>

      <CreateGoalDialog open={showCreate} onClose={() => setShowCreate(false)} />
      <CommitmentDialog
        open={showCommitment}
        onClose={() => { setShowCommitment(false); setEditingCommitment(null); }}
        editCommitment={editingCommitment}
      />
      <QuickAdjustDialog open={showEmergency} onClose={() => setShowEmergency(false)} />
      {checkInGoal && <CheckInDialog open={!!checkInGoal} onClose={() => setCheckInGoal(null)} goal={checkInGoal} />}
    </AppShell>
  );
};

export default Dashboard;
