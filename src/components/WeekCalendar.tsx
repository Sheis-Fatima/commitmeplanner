import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCommitments } from "@/hooks/useCommitments";
import { useAllActiveGoalSteps } from "@/hooks/useGoals";
import { useSleepLogs, useSleepPreferences } from "@/hooks/useSleep";
import { useEmergencyCommitments } from "@/hooks/useEmergencyCommitments";
import {
  computeFreeSlots,
  allocateTasks,
  expandCommitmentsToWeek,
  stripConflicts,
  getWeekStart,
  sleepLogToBlocks,
  projectSleepForWeek,
  expandEmergencyCommitmentsToWeek,
  type SleepBlock,
} from "@/lib/timeAllocation";

const HOURS = Array.from({ length: 24 }, (_, i) => i); // 00:00 - 23:00
const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const toMin = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + (m || 0);
};

const WeekCalendar = () => {
  const [offset, setOffset] = useState(0);
  const { data: commitments } = useCommitments();
  const { data: steps } = useAllActiveGoalSteps();
  const { data: prefs } = useSleepPreferences();
  const { data: emergencies } = useEmergencyCommitments();

  const weekStart = useMemo(() => {
    const d = getWeekStart();
    d.setDate(d.getDate() + offset * 7);
    return d;
  }, [offset]);
  const weekEnd = useMemo(() => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + 7);
    return d;
  }, [weekStart]);
  const { data: sleepLogs } = useSleepLogs(
    weekStart.toISOString().slice(0, 10),
    weekEnd.toISOString().slice(0, 10),
  );

  const { commitmentBlocks, allocBlocks, sleepBlocks, emergencyBlocks } = useMemo(() => {
    const cs = commitments ?? [];
    const expanded = expandCommitmentsToWeek(cs, weekStart);
    const loggedBlocks: SleepBlock[] = [];
    const loggedDates = new Set<string>();
    for (const l of sleepLogs ?? []) {
      const s = new Date(l.start_time);
      const e = new Date(l.end_time);
      if (e <= s) continue;
      loggedDates.add(l.sleep_date);
      loggedBlocks.push(...sleepLogToBlocks(s, e, "logged"));
    }
    const projected = projectSleepForWeek(weekStart, prefs?.typical_bedtime ?? "23:00", prefs?.typical_waketime ?? "07:00", loggedDates);
    const allSleep = [...loggedBlocks, ...projected];
    const emergencyBlocks = expandEmergencyCommitmentsToWeek(emergencies ?? [], weekStart);
    const slots = computeFreeSlots(cs, weekStart, allSleep, emergencyBlocks);
    const tasks = (steps ?? []).map((s) => ({
      id: s.id,
      goal_id: s.goal_id,
      title: `${(s as any).goal_title ? (s as any).goal_title + ": " : ""}${s.title}`,
    }));
    const allocs = stripConflicts(allocateTasks(tasks, slots), cs, weekStart, allSleep);
    return { commitmentBlocks: expanded, allocBlocks: allocs, sleepBlocks: allSleep, emergencyBlocks };
  }, [commitments, steps, weekStart, sleepLogs, prefs, emergencies]);

  const dates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return d;
  });
  const today = new Date().toISOString().slice(0, 10);
  const winStartMin = 0;
  const winMin = 24 * 60;

  const blockStyle = (startMin: number, endMin: number) => {
    const top = ((Math.max(startMin, winStartMin) - winStartMin) / winMin) * 100;
    const height = ((Math.min(endMin, winStartMin + winMin) - Math.max(startMin, winStartMin)) / winMin) * 100;
    return { top: `${top}%`, height: `${Math.max(height, 2)}%` };
  };

  const weekLabel = `${weekStart.toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${dates[6].toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;

  return (
    <div className="rounded-xl bg-card border border-border p-3">
      <div className="flex items-center justify-between mb-3">
        <button onClick={() => setOffset((o) => o - 1)} className="p-1 rounded hover:bg-muted">
          <ChevronLeft size={16} />
        </button>
        <p className="text-sm font-semibold">{weekLabel}</p>
        <button onClick={() => setOffset((o) => o + 1)} className="p-1 rounded hover:bg-muted">
          <ChevronRight size={16} />
        </button>
      </div>

      <div className="grid" style={{ gridTemplateColumns: "40px repeat(7, 1fr)" }}>
        <div />
        {dates.map((d) => {
          const iso = d.toISOString().slice(0, 10);
          return (
            <div
              key={iso}
              className={`text-center text-[10px] uppercase tracking-wider font-semibold pb-2 ${
                iso === today ? "text-primary" : "text-muted-foreground"
              }`}
            >
              {DAY_LABELS[d.getDay()]}
              <div className="text-sm font-bold text-foreground">{d.getDate()}</div>
            </div>
          );
        })}
      </div>

      <div className="grid relative" style={{ gridTemplateColumns: "40px repeat(7, 1fr)", height: `${HOURS.length * 36}px` }}>
        <div className="flex flex-col justify-between text-[9px] text-muted-foreground pr-1 text-right">
          {HOURS.map((h) => (
            <div key={h} style={{ height: "36px" }}>
              {String(h).padStart(2, "0")}:00
            </div>
          ))}
        </div>
        {dates.map((d) => {
          const iso = d.toISOString().slice(0, 10);
          const dayCommitments = commitmentBlocks.filter((b) => b.date === iso);
          const dayAllocs = allocBlocks.filter((b) => b.date === iso);
          return (
            <div key={iso} className="relative border-l border-border/50">
              {HOURS.map((h) => (
                <div key={h} style={{ height: "36px" }} className="border-t border-border/30" />
              ))}
              {dayCommitments.map((b, idx) => (
                <div
                  key={`c-${idx}`}
                  className="absolute left-0.5 right-0.5 rounded bg-secondary border border-border px-1 text-[9px] text-secondary-foreground overflow-hidden"
                  style={blockStyle(b.start, b.end)}
                  title={b.title}
                >
                  {b.title}
                </div>
              ))}
              {dayAllocs.map((a) => (
                <div
                  key={`a-${a.stepId}-${a.date}`}
                  className="absolute left-0.5 right-0.5 rounded gradient-mint text-primary-foreground px-1 text-[9px] overflow-hidden"
                  style={blockStyle(toMin(a.start), toMin(a.end))}
                  title={a.title}
                >
                  {a.title}
                </div>
              ))}
              {emergencyBlocks.filter((b) => b.date === iso).map((b, idx) => (
                <div
                  key={`e-${idx}`}
                  className="absolute left-0.5 right-0.5 rounded bg-amber-500/20 border border-amber-500/40 text-amber-700 dark:text-amber-300 px-1 text-[9px] overflow-hidden"
                  style={blockStyle(b.start, b.end)}
                  title={`Interruption: ${b.title}`}
                >
                  {b.title}
                </div>
              ))}

              {sleepBlocks.filter((b) => b.date === iso).map((b, idx) => (
                <div
                  key={`s-${idx}`}
                  className={`absolute left-0.5 right-0.5 rounded px-1 text-[9px] overflow-hidden border ${
                    b.source === "logged"
                      ? "bg-indigo-500/30 border-indigo-500/50 text-foreground"
                      : "bg-indigo-500/10 border-indigo-500/30 text-muted-foreground"
                  }`}
                  style={blockStyle(b.start, b.end)}
                  title={b.source === "logged" ? "Sleep (logged)" : "Sleep (planned)"}
                >
                  💤
                </div>
              ))}
            </div>
          );
        })}
      </div>

      <div className="flex items-center gap-3 mt-3 text-[10px] text-muted-foreground">
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-secondary border border-border" /> Commitments</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm gradient-mint" /> Goal blocks</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-indigo-500/40" /> Sleep</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-amber-500/40" /> Interruptions</span>
      </div>
    </div>
  );
};

export default WeekCalendar;