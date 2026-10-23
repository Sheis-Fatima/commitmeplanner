import { useMemo, useState } from "react";
import { Moon, Plus } from "lucide-react";
import { useSleepLogs, useSleepPreferences } from "@/hooks/useSleep";
import { getWeekStart } from "@/lib/timeAllocation";
import SleepLogDialog from "./SleepLogDialog";

const SleepCard = () => {
  const [open, setOpen] = useState(false);
  const weekStart = useMemo(() => getWeekStart(), []);
  const weekEnd = useMemo(() => { const d = new Date(weekStart); d.setDate(d.getDate() + 7); return d; }, [weekStart]);
  const { data: logs } = useSleepLogs(weekStart.toISOString().slice(0,10), weekEnd.toISOString().slice(0,10));
  const { data: prefs } = useSleepPreferences();

  const target = prefs?.target_hours ?? 7.5;
  const loggedH = ((logs ?? []).reduce((sum, log) => sum + log.duration_min, 0)) / 60;
  const targetWeek = target * 7;
  const progress = Math.min(100, targetWeek ? (loggedH / targetWeek) * 100 : 0);
  const last = logs?.[0];

  return (
    <>
      <section className="panel p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-sky-400/10 text-sky-300"><Moon size={18} /></div>
            <div><p className="eyebrow">Wellbeing</p><h3 className="mt-1 text-lg font-semibold">Sleep</h3></div>
          </div>
          <button onClick={() => setOpen(true)} className="inline-flex items-center gap-1.5 rounded-lg bg-white/[0.04] px-2.5 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground"><Plus size={14} /> Log</button>
        </div>
        <div className="mt-5 flex items-end justify-between gap-3">
          <div><p className="text-3xl font-semibold tracking-tight">{loggedH.toFixed(1)}<span className="ml-1 text-sm font-medium text-muted-foreground">h</span></p><p className="mt-1 text-xs text-muted-foreground">of {targetWeek.toFixed(0)}h weekly target</p></div>
          {last && <p className="text-right text-xs text-muted-foreground">Last logged<br /><span className="font-medium text-foreground">{(last.duration_min/60).toFixed(1)}h</span></p>}
        </div>
        <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/[0.05]"><div className="h-full rounded-full bg-sky-400/70 transition-all" style={{ width: `${progress}%` }} /></div>
        <p className="mt-2 text-[11px] text-muted-foreground">{Math.max(0, targetWeek - loggedH).toFixed(1)}h remaining to target</p>
      </section>
      <SleepLogDialog open={open} onClose={() => setOpen(false)} />
    </>
  );
};

export default SleepCard;
