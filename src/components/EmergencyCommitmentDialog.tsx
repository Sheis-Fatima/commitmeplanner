import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useCreateEmergencyCommitment } from "@/hooks/useEmergencyCommitments";

interface Props {
  open: boolean;
  onClose: () => void;
}

const EmergencyCommitmentDialog = ({ open, onClose }: Props) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<"high" | "critical">("high");
  const [durationDays, setDurationDays] = useState(7);
  const createEmergency = useCreateEmergencyCommitment();

  const handleSubmit = () => {
    if (!title.trim()) return;
    const start = new Date();
    const end = new Date();
    end.setDate(end.getDate() + durationDays);

    createEmergency.mutate(
      {
        title: title.trim(),
        description: description.trim() || undefined,
        priority,
        duration_days: durationDays,
        start_date: start.toISOString().split("T")[0],
        end_date: end.toISOString().split("T")[0],
      },
      {
        onSuccess: () => {
          setTitle("");
          setDescription("");
          setPriority("high");
          setDurationDays(7);
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
            className="fixed inset-x-4 bottom-8 z-50 max-w-md mx-auto rounded-2xl bg-card border border-destructive/30 shadow-2xl p-5 space-y-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-destructive/10 flex items-center justify-center">
                  <AlertTriangle size={16} className="text-destructive" />
                </div>
                <h3 className="font-display text-lg font-bold">Emergency Commitment</h3>
              </div>
              <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
                <X size={20} />
              </button>
            </div>

            <p className="text-xs text-muted-foreground">
              Adding an emergency will <strong>pause all active goals</strong> and extend their deadlines automatically.
            </p>

            <Input
              placeholder="What's the emergency?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-sm"
            />

            <Textarea
              placeholder="Details (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="text-sm resize-none"
            />

            {/* Priority */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-2">Priority</p>
              <div className="flex gap-2">
                {(["high", "critical"] as const).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPriority(p)}
                    className={`flex-1 py-2 rounded-lg text-sm font-semibold capitalize transition-all ${
                      priority === p
                        ? p === "critical"
                          ? "bg-destructive text-destructive-foreground"
                          : "bg-orange-500/20 text-orange-600 border border-orange-500/30"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {/* Duration */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-2">Duration</p>
              <div className="flex gap-2">
                {[3, 7, 14, 30].map((d) => (
                  <button
                    key={d}
                    onClick={() => setDurationDays(d)}
                    className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
                      durationDays === d
                        ? "gradient-mint text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {d}d
                  </button>
                ))}
              </div>
            </div>

            <Button
              onClick={handleSubmit}
              disabled={!title.trim() || createEmergency.isPending}
              className="w-full bg-destructive hover:bg-destructive/90 text-destructive-foreground font-semibold"
            >
              {createEmergency.isPending ? (
                <Loader2 size={16} className="animate-spin mr-2" />
              ) : (
                <AlertTriangle size={16} className="mr-2" />
              )}
              Activate Emergency
            </Button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default EmergencyCommitmentDialog;
