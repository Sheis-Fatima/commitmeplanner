import { useMemo } from "react";
import { motion } from "framer-motion";
import { Flame, TrendingUp, Target, BarChart3, Calendar, Smile, Meh, Frown, Heart, Star } from "lucide-react";
import AppHeader from "@/components/AppHeader";
import AppShell from "@/components/AppShell";
import { useGoals } from "@/hooks/useGoals";
import { useAllCheckIns } from "@/hooks/useInsightsData";
import { useDailyMoodLogs } from "@/hooks/useDailyMood";
import { Skeleton } from "@/components/ui/skeleton";

const moodIcons: Record<number, { icon: typeof Smile; label: string }> = {
  1: { icon: Frown, label: "Struggling" },
  2: { icon: Meh, label: "Meh" },
  3: { icon: Smile, label: "Okay" },
  4: { icon: Heart, label: "Good" },
  5: { icon: Star, label: "Amazing" },
};

const Insights = () => {
  const { data: goals, isLoading: goalsLoading } = useGoals();
  const { data: checkIns, isLoading: checkInsLoading } = useAllCheckIns();
  const { data: dailyMoods, isLoading: dailyMoodsLoading } = useDailyMoodLogs(35);

  const isLoading = goalsLoading || checkInsLoading || dailyMoodsLoading;

  const stats = useMemo(() => {
    if (!goals || !checkIns) return null;

    const activeGoals = goals.filter((g) => g.status === "active");
    const completedGoals = goals.filter((g) => g.status === "completed");
    const avgProgress = activeGoals.length
      ? Math.round(activeGoals.reduce((s, g) => s + g.progress, 0) / activeGoals.length)
      : 0;
    const completionRate = goals.length
      ? Math.round((completedGoals.length / goals.length) * 100)
      : 0;

    // Check-in streak
    const checkInDates = [...new Set(checkIns.map((c) => c.created_at.split("T")[0]))].sort().reverse();
    let streak = 0;
    const today = new Date();
    for (let i = 0; i < 365; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      if (checkInDates.includes(dateStr)) {
        streak++;
      } else if (i > 0) {
        break;
      }
    }

    // Mood distribution
    const moodCounts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    let moodTotal = 0;
    let moodSum = 0;
    checkIns.forEach((c) => {
      if (c.mood != null) {
        moodCounts[c.mood] = (moodCounts[c.mood] || 0) + 1;
        moodSum += c.mood;
        moodTotal++;
      }
    });
    const avgMood = moodTotal > 0 ? (moodSum / moodTotal).toFixed(1) : null;

    // Heatmap: last 35 days of check-in activity
    const heatmap: number[] = [];
    for (let i = 34; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      const count = checkIns.filter((c) => c.created_at.startsWith(dateStr)).length;
      heatmap.push(count);
    }
    const maxHeatmap = Math.max(1, ...heatmap);

    // Weekly check-in chart (last 7 days)
    const weeklyData: { day: string; count: number }[] = [];
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      const count = checkIns.filter((c) => c.created_at.startsWith(dateStr)).length;
      weeklyData.push({ day: dayNames[d.getDay()], count });
    }
    const maxWeekly = Math.max(1, ...weeklyData.map((d) => d.count));

    const dailyMoodAverage = dailyMoods?.length
      ? (dailyMoods.reduce((sum, entry) => sum + entry.mood, 0) / dailyMoods.length).toFixed(1)
      : null;

    const dailyMoodSeries = dailyMoods?.map((entry) => entry.mood) ?? [];
    return {
      activeGoals: activeGoals.length,
      completedGoals: completedGoals.length,
      totalGoals: goals.length,
      avgProgress,
      completionRate,
      streak,
      totalCheckIns: checkIns.length,
      avgMood,
      moodCounts,
      moodTotal,
      dailyMoodAverage,
      dailyMoodSeries,
      heatmap,
      maxHeatmap,
      weeklyData,
      maxWeekly,
    };
  }, [goals, checkIns]);

  return (
    <AppShell>
      <AppHeader title="Insights" showAvatar={false} />
      <div className="px-5 space-y-5 pt-2 pb-6">
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-20 w-full rounded-xl" />
            <div className="grid grid-cols-2 gap-3">
              <Skeleton className="h-24 rounded-xl" />
              <Skeleton className="h-24 rounded-xl" />
            </div>
            <Skeleton className="h-32 w-full rounded-xl" />
          </div>
        ) : !stats || stats.totalGoals === 0 ? (
          <div className="rounded-xl bg-card border border-border p-8 text-center shadow-card">
            <BarChart3 size={32} className="text-muted-foreground mx-auto mb-3" />
            <p className="font-display font-semibold text-lg">No data yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Create goals and check in to see your insights here.
            </p>
          </div>
        ) : (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-3">
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-xl bg-card border border-border p-4 shadow-card"
              >
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">Avg Progress</p>
                <p className="font-display text-3xl font-bold text-primary mt-1">{stats.avgProgress}%</p>
                <p className="text-xs text-muted-foreground mt-1">{stats.activeGoals} active goal{stats.activeGoals !== 1 ? "s" : ""}</p>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
                className="rounded-xl bg-card border border-border p-4 shadow-card"
              >
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">Check-ins</p>
                <p className="font-display text-3xl font-bold mt-1">{stats.totalCheckIns}</p>
                <p className="text-xs text-muted-foreground mt-1">Total recorded</p>
              </motion.div>
            </div>

            {/* Completion Rate */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="rounded-xl bg-card border border-border p-4 shadow-card"
            >
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">Completion Rate</p>
              <div className="flex items-baseline gap-3 mt-1">
                <span className="font-display text-4xl font-bold">{stats.completionRate}%</span>
                <span className="text-sm text-muted-foreground">
                  {stats.completedGoals}/{stats.totalGoals} goals completed
                </span>
              </div>
              <div className="h-2 rounded-full bg-muted mt-3 overflow-hidden">
                <motion.div
                  className="h-full rounded-full gradient-mint"
                  initial={{ width: 0 }}
                  animate={{ width: `${stats.completionRate}%` }}
                  transition={{ duration: 0.8 }}
                />
              </div>
            </motion.div>

            {/* Streak */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="rounded-xl gradient-card border border-border p-4 shadow-card flex items-center justify-between"
            >
              <div>
                <p className="text-xs text-primary font-semibold">Current Streak</p>
                <p className="font-display text-2xl font-bold mt-1">
                  {stats.streak} Day{stats.streak !== 1 ? "s" : ""}{" "}
                  {stats.streak >= 3 && <span className="text-primary">On Fire</span>}
                </p>
              </div>
              {stats.streak >= 3 && <Flame size={32} className="text-primary animate-pulse" />}
            </motion.div>

            {stats.dailyMoodAverage && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.23 }}
                className="rounded-xl bg-card border border-border p-4 shadow-card"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">Daily Mood</p>
                    <p className="font-display text-3xl font-bold mt-1">{stats.dailyMoodAverage}/5</p>
                    <p className="text-xs text-muted-foreground mt-1">Average across your last {stats.dailyMoodSeries.length} mood check-in{stats.dailyMoodSeries.length !== 1 ? "s" : ""}</p>
                  </div>
                  <div className="flex items-end gap-1 h-12">
                    {stats.dailyMoodSeries.slice(-14).map((value, index) => (
                      <div
                        key={index}
                        className="w-1.5 rounded-full bg-primary/70"
                        style={{ height: `${8 + value * 7}px`, opacity: 0.25 + value * 0.12 }}
                      />
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Mood Summary */}
            {stats.avgMood && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="rounded-xl bg-card border border-border p-4 shadow-card"
              >
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-3">Mood Overview</p>
                <div className="flex items-center gap-3 mb-3">
                  <span className="font-display text-3xl font-bold">{stats.avgMood}</span>
                  <span className="text-sm text-muted-foreground">avg mood ({stats.moodTotal} entries)</span>
                </div>
                <div className="flex justify-between">
                  {[1, 2, 3, 4, 5].map((m) => {
                    const info = moodIcons[m];
                    const Icon = info.icon;
                    const count = stats.moodCounts[m];
                    const pct = stats.moodTotal > 0 ? Math.round((count / stats.moodTotal) * 100) : 0;
                    return (
                      <div key={m} className="flex flex-col items-center gap-1">
                        <Icon size={20} className={count > 0 ? "text-primary" : "text-muted-foreground"} />
                        <span className="text-xs font-semibold">{pct}%</span>
                        <span className="text-[9px] text-muted-foreground">{info.label}</span>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* Heatmap */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="rounded-xl bg-card border border-border p-4 shadow-card"
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-display font-semibold">Activity Heatmap</h3>
                <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                  Less
                  {[0.1, 0.3, 0.5, 0.7, 1].map((o, i) => (
                    <div key={i} className="w-3 h-3 rounded-sm gradient-mint" style={{ opacity: o }} />
                  ))}
                  More
                </div>
              </div>
              <div className="grid grid-cols-7 gap-1.5">
                {stats.heatmap.map((v, i) => (
                  <div
                    key={i}
                    className="aspect-square rounded-sm gradient-mint"
                    style={{ opacity: v === 0 ? 0.08 : Math.max(0.15, v / stats.maxHeatmap) }}
                  />
                ))}
              </div>
              <p className="text-[10px] text-muted-foreground mt-2 text-center">Last 35 days</p>
            </motion.div>

            {/* Weekly Check-ins Chart */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="rounded-xl bg-card border border-border p-4 shadow-card"
            >
              <h3 className="font-display font-semibold mb-4">This Week's Check-ins</h3>
              <div className="flex items-end gap-2 h-28">
                {stats.weeklyData.map((d, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${(d.count / stats.maxWeekly) * 100}%` }}
                      transition={{ delay: i * 0.05, duration: 0.4 }}
                      className={`w-full rounded-t-md min-h-[4px] ${
                        d.count > 0 ? "gradient-mint shadow-mint" : "bg-muted"
                      }`}
                    />
                    <span className="text-[10px] text-muted-foreground">{d.day}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Goals Summary */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="rounded-xl bg-card border border-border p-4 shadow-card"
            >
              <h3 className="font-display font-semibold mb-3">Goals Overview</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full gradient-mint" />
                    <span className="text-sm">Active</span>
                  </div>
                  <span className="font-bold">{stats.activeGoals}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-primary/30" />
                    <span className="text-sm">Completed</span>
                  </div>
                  <span className="font-bold">{stats.completedGoals}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-muted" />
                    <span className="text-sm">Paused</span>
                  </div>
                  <span className="font-bold">{stats.totalGoals - stats.activeGoals - stats.completedGoals}</span>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </div>
    </AppShell>
  );
};

export default Insights;
