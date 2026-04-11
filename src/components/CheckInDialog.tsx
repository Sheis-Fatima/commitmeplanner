import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, MessageSquare, Smile, Meh, Frown, Heart, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { useCreateCheckIn } from "@/hooks/useGoals";
import type { Goal } from "@/hooks/useGoals";

interface CheckInDialogProps {
  open: boolean;
  onClose: () => void;
  goal: Goal;
}

const moods = [
  { value: 1, icon: Frown, label: "Struggling" },
  { value: 2, icon: Meh, label: "Meh" },
  { value: 3, icon: Smile, label: "Okay" },
  { value: 4, icon: Heart, label: "Good" },
  { value: 5, icon: Star, label: "Amazing" },
];

const CheckInDialog = ({ open, onClose, goal }: CheckInDialogProps) => {
  const [notes, setNotes] = useState("");
  const [progress, setProgress] = useState([goal.progress]);
  const [mood, setMood] = useState<number | null>(null);
  const createCheckIn = useCreateCheckIn();

  const handleSubmit = () => {
    createCheckIn.mutate(
      {
        goal_id: goal.id,
        notes: notes.trim() || null,
        progress_value: progress[0],
        mood,
      },
      {
        onSuccess: () => {
          setNotes("");
          setMood(null);
          onClose();
        },
      }
    );
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-end sm:items-center justify-center"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg rounded-t-2xl sm:rounded-2xl bg-card border border-border p-6 space-y-5 shadow-card"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare size={20} className="text-primary" />
                <h2 className="font-display text-xl font-bold">Check In</h2>
              </div>
              <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
                <X size={20} />
              </button>
            </div>

            <p className="text-sm text-muted-foreground">
              How's your progress on <span className="text-primary font-medium">{goal.title}</span>?
            </p>

            {/* Progress Slider */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">Progress</p>
                <span className="text-primary font-bold text-sm">{progress[0]}%</span>
              </div>
              <Slider
                value={progress}
                onValueChange={setProgress}
                max={100}
                step={5}
                className="w-full"
              />
            </div>

            {/* Mood */}
            <div>
              <p className="text-xs uppercase tracking-widest text-muted-foreground font-semibold mb-3">How are you feeling?</p>
              <div className="flex justify-between">
                {moods.map((m) => {
                  const Icon = m.icon;
                  return (
                    <button
                      key={m.value}
                      onClick={() => setMood(m.value)}
                      className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${
                        mood === m.value
                          ? "bg-primary/10 text-primary scale-110"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <Icon size={24} />
                      <span className="text-[10px] font-semibold">{m.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Notes */}
            <Textarea
              placeholder="Any notes on your progress? (optional)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="bg-secondary border-border rounded-xl text-foreground placeholder:text-muted-foreground min-h-[80px]"
            />

            <Button
              onClick={handleSubmit}
              disabled={createCheckIn.isPending}
              className="w-full h-12 rounded-xl gradient-mint text-primary-foreground font-semibold text-base shadow-mint hover:opacity-90"
            >
              {createCheckIn.isPending ? "Saving..." : "Submit Check-In"}
            </Button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CheckInDialog;
