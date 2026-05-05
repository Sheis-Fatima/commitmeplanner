import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useUpsertSleepLog, useSleepPreferences } from "@/hooks/useSleep";

interface Props {
  open: boolean;
  onClose: () => void;
  defaultDate?: string;
}

const pad = (n: number) => String(n).padStart(2, "0");
const todayISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};
const yesterdayISO = () => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

const toMin = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + (m || 0);
};

const SleepLogDialog = ({ open, onClose, defaultDate }: Props) => {
  const { data: prefs } = useSleepPreferences();
  const upsert = useUpsertSleepLog();
  const [sleepDate, setSleepDate] = useState(defaultDate || yesterdayISO());
  const [bed, setBed] = useState(prefs?.typical_bedtime ?? "23:00");
  const [wake, setWake] = useState(prefs?.typical_waketime ?? "07:00");

  useEffect(() => {
    if (!open) return;
    setSleepDate(defaultDate || yesterdayISO());
    setBed(prefs?.typical_bedtime ?? "23:00");
    setWake(prefs?.typical_waketime ?? "07:00");
  }, [open, defaultDate, prefs]);

  const { startISO, endISO, durationH } = useMemo(() => {
    const [by, bm, bd] = sleepDate.split("-").map(Number);
    const start = new Date(by, bm - 1, bd, ...bed.split(":").map(Number) as [number, number]);
    const end = new Date(by, bm - 1, bd, ...wake.split(":").map(Number) as [number, number]);
    if (toMin(wake) <= toMin(bed)) end.setDate(end.getDate() + 1);
    const dur = (end.getTime() - start.getTime()) / 3600000;
    return { startISO: start.toISOString(), endISO: end.toISOString(), durationH: dur };
  }, [sleepDate, bed, wake]);

  // Render the sleep range on a 24h ruler (handles cross-midnight by showing two segments)
  const bedMin = toMin(bed);
  const wakeMin = toMin(wake);
  const segments: Array<{ left: number; width: number }> = [];
  if (wakeMin > bedMin) {
    segments.push({ left: (bedMin / 1440) * 100, width: ((wakeMin - bedMin) / 1440) * 100 });
  } else {
    segments.push({ left: (bedMin / 1440) * 100, width: ((1440 - bedMin) / 1440) * 100 });
    segments.push({ left: 0, width: (wakeMin / 1440) * 100 });
  }

  const handleSubmit = () => {
    upsert.mutate(
      { sleep_date: sleepDate, start_time: startISO, end_time: endISO, source: "manual" },
      { onSuccess: () => onClose() },
    );
  };

  const inRange = durationH >= 7 && durationH <= 8;
  const tooShort = durationH < 7;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg rounded-t-2xl sm:rounded-2xl bg-card border border-border shadow-card flex flex-col max-h-[90vh]"
          >
            <div className="flex items-center justify-between p-5 border-b border-border shrink-0">
              <div className="flex items-center gap-2">
                <Moon size={20} className="text-primary" />
                <h2 className="font-display text-xl font-bold">Log Sleep</h2>
              </div>
              <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
                <X size={20} />
              </button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto flex-1">
              <div>
                <label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Night of</label>
                <Input type="date" value={sleepDate} max={todayISO()} onChange={(e) => setSleepDate(e.target.value)} className="mt-1" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Bedtime</label>
                  <Input type="time" value={bed} onChange={(e) => setBed(e.target.value)} className="mt-1" />
                </div>
                <div>
                  <label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Wake time</label>
                  <Input type="time" value={wake} onChange={(e) => setWake(e.target.value)} className="mt-1" />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">
                  <span>00:00</span>
                  <span>12:00</span>
                  <span>24:00</span>
                </div>
                <div className="relative h-3 w-full rounded-full bg-muted overflow-hidden">
                  {segments.map((s, i) => (
                    <div
                      key={i}
                      className="absolute top-0 bottom-0 bg-indigo-500/70"
                      style={{ left: `${s.left}%`, width: `${s.width}%` }}
                    />
                  ))}
                </div>
                <p className={`mt-2 text-sm font-semibold ${inRange ? "text-primary" : tooShort ? "text-amber-500" : "text-muted-foreground"}`}>
                  Duration: {durationH.toFixed(1)}h
                  <span className="ml-2 text-xs font-normal text-muted-foreground">
                    ({inRange ? "in recommended range" : tooShort ? "below 7h target" : "above 8h"})
                  </span>
                </p>
              </div>
            </div>

            <div className="p-5 border-t border-border shrink-0 flex gap-2">
              <Button variant="outline" onClick={onClose} className="flex-1 sm:flex-none">Cancel</Button>
              <Button onClick={handleSubmit} disabled={upsert.isPending || durationH <= 0} className="flex-1 gradient-mint text-primary-foreground">
                {upsert.isPending ? "Saving..." : "Save Sleep"}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SleepLogDialog;
