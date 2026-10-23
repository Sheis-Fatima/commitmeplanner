import { motion } from "framer-motion";
import { Frown, Heart, Meh, Smile, Sparkles, Star } from "lucide-react";
import { useDailyMoodLogs, useSetDailyMood, useTodayMood } from "@/hooks/useDailyMood";

const moods = [
  { value: 1, icon: Frown, label: "Low" },
  { value: 2, icon: Meh, label: "Off" },
  { value: 3, icon: Smile, label: "Okay" },
  { value: 4, icon: Heart, label: "Good" },
  { value: 5, icon: Star, label: "Great" },
];

const DailyMoodCard = () => {
  const { data: todayMood } = useTodayMood();
  const { data: history } = useDailyMoodLogs(7);
  const setMood = useSetDailyMood();

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl bg-card border border-border p-4 shadow-card"
      aria-labelledby="daily-mood-title"
    >
      <div className="flex items-start gap-3 mb-4">
        <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
          <Sparkles size={17} className="text-primary" />
        </div>
        <div className="flex-1">
          <h3 id="daily-mood-title" className="font-display font-semibold">Daily check-in</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Notice how you feel. This does not change your plan automatically.
          </p>
        </div>
        {todayMood && (
          <span className="text-[10px] uppercase tracking-wider font-semibold text-primary">
            Logged
          </span>
        )}
      </div>

      <div className="grid grid-cols-5 gap-2">
        {moods.map(({ value, icon: Icon, label }) => {
          const selected = todayMood?.mood === value;
          return (
            <button
              key={value}
              type="button"
              aria-label={label}
              aria-pressed={selected}
              onClick={() => setMood.mutate({ mood: value })}
              disabled={setMood.isPending}
              className={[
                "min-h-16 rounded-xl border px-1 py-2 flex flex-col items-center justify-center gap-1 transition-all",
                selected
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-secondary/60 text-muted-foreground hover:text-foreground hover:border-primary/40",
              ].join(" ")}
            >
              <Icon size={18} />
              <span className="text-[10px] font-medium">{label}</span>
            </button>
          );
        })}
      </div>

      <div className="mt-4 flex items-center justify-between">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Last 7 days</p>
        <div className="flex items-center gap-1">
          {(history ?? []).map((entry) => (
            <div
              key={entry.check_in_date}
              title={entry.check_in_date}
              className="w-2.5 h-2.5 rounded-full bg-primary"
              style={{ opacity: 0.2 + entry.mood * 0.15 }}
            />
          ))}
          {(history?.length ?? 0) === 0 && <span className="text-[10px] text-muted-foreground">No history yet</span>}
        </div>
      </div>
    </motion.section>
  );
};

export default DailyMoodCard;
