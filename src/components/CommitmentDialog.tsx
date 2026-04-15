import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Briefcase, X, Loader2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useCreateCommitment, useUpdateCommitment, type Commitment } from "@/hooks/useCommitments";

interface Props {
  open: boolean;
  onClose: () => void;
  editCommitment?: Commitment | null;
}

const DAYS_OF_WEEK = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const CommitmentDialog = ({ open, onClose, editCommitment }: Props) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [frequency, setFrequency] = useState<"daily" | "weekdays" | "weekends" | "custom">("daily");
  const [customDays, setCustomDays] = useState<string[]>([]);

  const createCommitment = useCreateCommitment();
  const updateCommitment = useUpdateCommitment();
  const isEditing = !!editCommitment;

  useEffect(() => {
    if (editCommitment) {
      setTitle(editCommitment.title);
      setDescription(editCommitment.description || "");
      setPriority((editCommitment.priority as "low" | "medium" | "high") || "medium");
      setStartTime(editCommitment.start_time || "");
      setEndTime(editCommitment.end_time || "");
      setFrequency((editCommitment.frequency as "daily" | "weekdays" | "weekends" | "custom") || "daily");
      setCustomDays(editCommitment.custom_days || []);
    } else {
      resetForm();
    }
  }, [editCommitment, open]);

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setPriority("medium");
    setStartTime("");
    setEndTime("");
    setFrequency("daily");
    setCustomDays([]);
  };

  const toggleDay = (day: string) => {
    setCustomDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const handleSubmit = () => {
    if (!title.trim()) return;
    const payload = {
      title: title.trim(),
      description: description.trim() || undefined,
      priority,
      start_time: startTime || undefined,
      end_time: endTime || undefined,
      frequency,
      custom_days: frequency === "custom" ? customDays : undefined,
    };

    if (isEditing) {
      updateCommitment.mutate({ id: editCommitment!.id, ...payload }, {
        onSuccess: () => { resetForm(); onClose(); },
      });
    } else {
      createCommitment.mutate(payload, {
        onSuccess: () => { resetForm(); onClose(); },
      });
    }
  };

  const isPending = createCommitment.isPending || updateCommitment.isPending;

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
            className="fixed inset-x-4 bottom-8 z-50 max-w-md mx-auto rounded-2xl bg-card border border-border shadow-2xl p-5 space-y-4 max-h-[80vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Briefcase size={16} className="text-primary" />
                </div>
                <h3 className="font-display text-lg font-bold">
                  {isEditing ? "Edit Commitment" : "Add Commitment"}
                </h3>
              </div>
              <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
                <X size={20} />
              </button>
            </div>

            <p className="text-xs text-muted-foreground">
              Add tasks and engagements to your schedule. These <strong>won't affect</strong> your goals.
            </p>

            <Input
              placeholder="What's the commitment? (e.g. Freelance project)"
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

            {/* Time Range */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1">
                <Clock size={12} /> Time Range
              </p>
              <div className="flex items-center gap-2">
                <Input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="text-sm flex-1"
                  placeholder="Start"
                />
                <span className="text-xs text-muted-foreground">to</span>
                <Input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="text-sm flex-1"
                  placeholder="End"
                />
              </div>
            </div>

            {/* Frequency */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-2">Schedule</p>
              <div className="grid grid-cols-2 gap-2">
                {(["daily", "weekdays", "weekends", "custom"] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFrequency(f)}
                    className={`py-2 rounded-lg text-sm font-semibold capitalize transition-all ${
                      frequency === f
                        ? "gradient-mint text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>

              {frequency === "custom" && (
                <div className="flex gap-1.5 mt-2 flex-wrap">
                  {DAYS_OF_WEEK.map((day) => (
                    <button
                      key={day}
                      onClick={() => toggleDay(day)}
                      className={`w-10 h-10 rounded-lg text-xs font-semibold transition-all ${
                        customDays.includes(day)
                          ? "gradient-mint text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {day}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Priority */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-2">Priority</p>
              <div className="flex gap-2">
                {(["low", "medium", "high"] as const).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPriority(p)}
                    className={`flex-1 py-2 rounded-lg text-sm font-semibold capitalize transition-all ${
                      priority === p
                        ? "gradient-mint text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            <Button
              onClick={handleSubmit}
              disabled={!title.trim() || isPending}
              className="w-full gradient-mint text-primary-foreground font-semibold"
            >
              {isPending ? (
                <Loader2 size={16} className="animate-spin mr-2" />
              ) : (
                <Briefcase size={16} className="mr-2" />
              )}
              {isEditing ? "Save Changes" : "Add to Schedule"}
            </Button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default CommitmentDialog;
