import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CalendarX2, X, Loader2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCreateEmergencyCommitment } from "@/hooks/useEmergencyCommitments";
import { useGoals } from "@/hooks/useGoals";

interface Props {
  open: boolean;
  onClose: () => void;
}

const DURATIONS = [
  { label: "1 day", days: 1 },
  { label: "3 days", days: 3 },
  { label: "1 week", days: 7 },
];

const QuickAdjustDialog = ({ open, onClose }: Props) => {
  const [title, setTitle] = useState("");
  const [allDay, setAllDay] = useState(true);
  const [timeOfDay, setTimeOfDay] = useState("");
  const [durationDays, setDurationDays] = useState(1);
  const createEmergency = useCreateEmergencyCommitment();
  const { data: goals } = useGoals();

  const activeGoals = goals?.filter((g) => g.status === "active") ?? [];

  const handleSubmit = () => {
    if (!title.trim()) return;
    const start = new Date();
    const end = new Date();
    end.setDate(end.getDate() + durationDays);

    createEmergency.mutate(
      {
        title: title.trim(),
        priority: "high",
        duration_days: durationDays,
        start_date: start.toISOString().split("T")[0],
        end_date: end.toISOString().split("T")[0],
        time_of_day: allDay ? undefined : timeOfDay || undefined,
        frequency: "daily",
      },
      {
        onSuccess: () => {
          setTitle("");
          setAllDay(true);
          setTimeOfDay("");
          setDurationDays(1);
          onClose();
        },
      }
    );
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-50"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            className="fixed inset-x-4 bottom-8 z-50 max-w-md mx-auto rounded-2xl bg-card border border-amber-500/30 shadow-2xl p-5 space-y-4"
          >
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center">
                  <CalendarX2 size={16} className="text-amber-600" />
                </div>
                <h3 className="font-display text-lg font-bold">Something Came Up</h3>
              </div>
              <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
                <X size={20} />
              </button>
            </div>

            {/* What happened */}
            <Input
              placeholder="What happened?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-sm"
              autoFocus
            />

            {/* Time selector */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1">
                <Clock size={12} /> When
              </p>
              <div className="flex gap-2 mb-2">
                <button
                  onClick={() => setAllDay(true)}
                  className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
                    allDay ? "gradient-mint text-primary-foreground" : "bg-muted text-muted-foreground"
                  }`}
                >
                  All day
                </button>
                <button
                  onClick={() => setAllDay(false)}
                  className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
                    !allDay ? "gradient-mint text-primary-foreground" : "bg-muted text-muted-foreground"
                  }`}
                >
                  Specific time
                </button>
              </div>
              {!allDay && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}>
                  <Input
                    type="time"
                    value={timeOfDay}
                    onChange={(e) => setTimeOfDay(e.target.value)}
                    className="text-sm"
                  />
                </motion.div>
              )}
            </div>

            {/* Duration */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-2">How long?</p>
              <div className="flex gap-2">
                {DURATIONS.map((d) => (
                  <button
                    key={d.days}
                    onClick={() => setDurationDays(d.days)}
                    className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                      durationDays === d.days
                        ? "gradient-mint text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Impact preview */}
            {activeGoals.length > 0 && (
              <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 p-3">
                <p className="text-xs text-amber-700 dark:text-amber-400">
                  This will <strong>pause {activeGoals.length} active goal{activeGoals.length !== 1 ? "s" : ""}</strong> and extend deadlines by <strong>{durationDays} day{durationDays !== 1 ? "s" : ""}</strong>.
                </p>
              </div>
            )}

            {/* Submit */}
            <Button
              onClick={handleSubmit}
              disabled={!title.trim() || createEmergency.isPending}
              className="w-full font-semibold"
            >
              {createEmergency.isPending ? (
                <Loader2 size={16} className="animate-spin mr-2" />
              ) : (
                <CalendarX2 size={16} className="mr-2" />
              )}
              Adjust My Plan
            </Button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default QuickAdjustDialog;
