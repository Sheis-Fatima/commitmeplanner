import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ArrowLeft, Plus, X, Target, Zap, AlertTriangle, Loader2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useCreateGoal } from "@/hooks/useGoals";
import { useCreateEmergencyCommitment } from "@/hooks/useEmergencyCommitments";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const categories = ["Health", "Career", "Learning", "Finance", "Personal", "Creative"];

interface Commitment {
  title: string;
  description: string;
  priority: "high" | "critical";
  durationDays: number;
}

const Onboarding = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const createGoal = useCreateGoal();
  const createEmergency = useCreateEmergencyCommitment();

  const [step, setStep] = useState(0); // 0=welcome, 1=goal, 2=commitments, 3=done

  // Goal state
  const [goalTitle, setGoalTitle] = useState("");
  const [goalDescription, setGoalDescription] = useState("");
  const [goalCategory, setGoalCategory] = useState("");
  const [frequency, setFrequency] = useState<"weekly" | "monthly">("weekly");
  const [targetDate, setTargetDate] = useState("");

  // Commitments state
  const [commitments, setCommitments] = useState<Commitment[]>([]);
  const [newCommitment, setNewCommitment] = useState<Commitment>({
    title: "",
    description: "",
    priority: "high",
    durationDays: 7,
  });
  const [showAddCommitment, setShowAddCommitment] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const displayName = user?.user_metadata?.full_name?.split(" ")[0] || "there";

  const addCommitment = () => {
    if (!newCommitment.title.trim()) return;
    setCommitments([...commitments, { ...newCommitment }]);
    setNewCommitment({ title: "", description: "", priority: "high", durationDays: 7 });
    setShowAddCommitment(false);
  };

  const removeCommitment = (idx: number) => {
    setCommitments(commitments.filter((_, i) => i !== idx));
  };

  const handleFinish = async () => {
    setSubmitting(true);
    try {
      // Create goal
      if (goalTitle.trim()) {
        await createGoal.mutateAsync({
          title: goalTitle.trim(),
          description: goalDescription.trim() || null,
          category: goalCategory || null,
          checkin_frequency: frequency,
          target_date: targetDate || null,
        });
      }

      // Create commitments
      for (const c of commitments) {
        const start = new Date();
        const end = new Date();
        end.setDate(end.getDate() + c.durationDays);
        await createEmergency.mutateAsync({
          title: c.title,
          description: c.description || undefined,
          priority: c.priority,
          duration_days: c.durationDays,
          start_date: start.toISOString().split("T")[0],
          end_date: end.toISOString().split("T")[0],
        });
      }

      toast.success("You're all set! Let's go.");
      navigate("/", { replace: true });
    } catch (err: any) {
      toast.error(err.message || "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  const slideVariants = {
    enter: { x: 60, opacity: 0 },
    center: { x: 0, opacity: 1 },
    exit: { x: -60, opacity: 0 },
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Progress bar */}
      <div className="h-1 bg-muted">
        <motion.div
          className="h-full gradient-mint"
          animate={{ width: `${((step + 1) / 4) * 100}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-5 py-8 max-w-lg mx-auto w-full">
        <AnimatePresence mode="wait">
          {/* Step 0: Welcome */}
          {step === 0 && (
            <motion.div
              key="welcome"
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3 }}
              className="w-full text-center space-y-6"
            >
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl gradient-mint shadow-mint mx-auto">
                <Target size={36} className="text-primary-foreground" />
              </div>
              <h1 className="font-display text-3xl font-bold">Hey {displayName}!</h1>
              <p className="text-muted-foreground text-lg">
                Let's set up your first goal and any current commitments so we can help you stay on track.
              </p>
              <Button
                onClick={() => setStep(1)}
                className="w-full h-12 rounded-xl gradient-mint text-primary-foreground font-semibold text-base shadow-mint"
              >
                Let's Get Started <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </motion.div>
          )}

          {/* Step 1: Create Goal */}
          {step === 1 && (
            <motion.div
              key="goal"
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3 }}
              className="w-full space-y-5"
            >
              <div>
                <p className="text-xs uppercase tracking-widest text-primary font-semibold">Step 1</p>
                <h2 className="font-display text-2xl font-bold mt-1">Define Your Goal</h2>
                <p className="text-sm text-muted-foreground mt-1">What do you want to achieve?</p>
              </div>

              <div className="space-y-4">
                <Input
                  placeholder="Goal title (e.g. Master Python)"
                  value={goalTitle}
                  onChange={(e) => setGoalTitle(e.target.value)}
                  className="bg-secondary border-border h-12 rounded-xl text-foreground"
                />
                <Textarea
                  placeholder="Brief description (optional)"
                  value={goalDescription}
                  onChange={(e) => setGoalDescription(e.target.value)}
                  className="bg-secondary border-border rounded-xl text-foreground min-h-[80px]"
                />

                {/* Category */}
                <div>
                  <p className="text-xs uppercase tracking-widest text-muted-foreground font-semibold mb-2">Category</p>
                  <div className="flex flex-wrap gap-2">
                    {categories.map((c) => (
                      <button
                        key={c}
                        onClick={() => setGoalCategory(goalCategory === c ? "" : c)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                          goalCategory === c
                            ? "gradient-mint text-primary-foreground shadow-mint"
                            : "bg-secondary text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Frequency */}
                <div>
                  <p className="text-xs uppercase tracking-widest text-muted-foreground font-semibold mb-2">Check-in Frequency</p>
                  <div className="flex gap-2">
                    {(["weekly", "monthly"] as const).map((f) => (
                      <button
                        key={f}
                        onClick={() => setFrequency(f)}
                        className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-all ${
                          frequency === f
                            ? "gradient-mint text-primary-foreground shadow-mint"
                            : "bg-secondary text-muted-foreground"
                        }`}
                      >
                        {f.charAt(0).toUpperCase() + f.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Target Date */}
                <div>
                  <p className="text-xs uppercase tracking-widest text-muted-foreground font-semibold mb-2">Target Date (optional)</p>
                  <Input
                    type="date"
                    value={targetDate}
                    onChange={(e) => setTargetDate(e.target.value)}
                    className="bg-secondary border-border h-12 rounded-xl text-foreground"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={() => setStep(0)}
                  className="flex-1 h-12 rounded-xl"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" /> Back
                </Button>
                <Button
                  onClick={() => setStep(2)}
                  disabled={!goalTitle.trim()}
                  className="flex-1 h-12 rounded-xl gradient-mint text-primary-foreground font-semibold shadow-mint"
                >
                  Next <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </div>
            </motion.div>
          )}

          {/* Step 2: Commitments */}
          {step === 2 && (
            <motion.div
              key="commitments"
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3 }}
              className="w-full space-y-5"
            >
              <div>
                <p className="text-xs uppercase tracking-widest text-primary font-semibold">Step 2</p>
                <h2 className="font-display text-2xl font-bold mt-1">Current Commitments</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  What are you currently working on? These help us schedule around your existing obligations.
                </p>
              </div>

              {/* Existing commitments */}
              {commitments.length > 0 && (
                <div className="space-y-2">
                  {commitments.map((c, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="rounded-xl bg-card border border-border p-3 flex items-center gap-3"
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                        c.priority === "critical" ? "bg-destructive/20" : "bg-accent/20"
                      }`}>
                        <AlertTriangle size={16} className={c.priority === "critical" ? "text-destructive" : "text-primary"} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate">{c.title}</p>
                        <p className="text-xs text-muted-foreground">{c.durationDays} days · {c.priority}</p>
                      </div>
                      <button onClick={() => removeCommitment(i)} className="text-muted-foreground hover:text-destructive">
                        <X size={16} />
                      </button>
                    </motion.div>
                  ))}
                </div>
              )}

              {/* Add commitment form */}
              {showAddCommitment ? (
                <div className="rounded-xl bg-card border border-border p-4 space-y-3">
                  <Input
                    placeholder="Commitment title (e.g. Final exams)"
                    value={newCommitment.title}
                    onChange={(e) => setNewCommitment({ ...newCommitment, title: e.target.value })}
                    className="bg-secondary border-border h-10 rounded-xl text-foreground"
                  />
                  <Textarea
                    placeholder="Description (optional)"
                    value={newCommitment.description}
                    onChange={(e) => setNewCommitment({ ...newCommitment, description: e.target.value })}
                    className="bg-secondary border-border rounded-xl text-foreground min-h-[60px]"
                  />
                  <div className="flex gap-2">
                    <p className="text-xs uppercase tracking-widest text-muted-foreground font-semibold self-center mr-1">Priority:</p>
                    {(["high", "critical"] as const).map((p) => (
                      <button
                        key={p}
                        onClick={() => setNewCommitment({ ...newCommitment, priority: p })}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                          newCommitment.priority === p
                            ? p === "critical" ? "bg-destructive text-destructive-foreground" : "gradient-mint text-primary-foreground"
                            : "bg-secondary text-muted-foreground"
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-widest text-muted-foreground font-semibold mb-2">Duration</p>
                    <div className="flex gap-2">
                      {[3, 7, 14, 30].map((d) => (
                        <button
                          key={d}
                          onClick={() => setNewCommitment({ ...newCommitment, durationDays: d })}
                          className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${
                            newCommitment.durationDays === d
                              ? "gradient-mint text-primary-foreground shadow-mint"
                              : "bg-secondary text-muted-foreground"
                          }`}
                        >
                          {d}d
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setShowAddCommitment(false)} className="flex-1 rounded-xl">
                      Cancel
                    </Button>
                    <Button
                      onClick={addCommitment}
                      disabled={!newCommitment.title.trim()}
                      className="flex-1 rounded-xl gradient-mint text-primary-foreground font-semibold"
                    >
                      Add
                    </Button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowAddCommitment(true)}
                  className="w-full rounded-xl border-2 border-dashed border-border py-4 flex items-center justify-center gap-2 text-muted-foreground hover:text-primary hover:border-primary transition-colors"
                >
                  <Plus size={18} /> Add a Commitment
                </button>
              )}

              <div className="flex gap-3 pt-2">
                <Button variant="outline" onClick={() => setStep(1)} className="flex-1 h-12 rounded-xl">
                  <ArrowLeft className="mr-2 h-4 w-4" /> Back
                </Button>
                <Button
                  onClick={() => setStep(3)}
                  className="flex-1 h-12 rounded-xl gradient-mint text-primary-foreground font-semibold shadow-mint"
                >
                  {commitments.length > 0 ? "Next" : "Skip"} <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </div>
            </motion.div>
          )}

          {/* Step 3: Summary / Finish */}
          {step === 3 && (
            <motion.div
              key="finish"
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3 }}
              className="w-full text-center space-y-6"
            >
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl gradient-mint shadow-mint mx-auto">
                <Zap size={36} className="text-primary-foreground" />
              </div>
              <h2 className="font-display text-2xl font-bold">You're Ready!</h2>
              <p className="text-muted-foreground">
                Here's a summary of what we'll set up for you:
              </p>

              <div className="space-y-3 text-left">
                <div className="rounded-xl bg-card border border-border p-4 shadow-card">
                  <div className="flex items-center gap-2 mb-1">
                    <Target size={16} className="text-primary" />
                    <p className="text-xs uppercase tracking-widest font-semibold text-primary">Goal</p>
                  </div>
                  <p className="font-semibold">{goalTitle}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {frequency} check-ins{goalCategory ? ` · ${goalCategory}` : ""}
                    {targetDate ? ` · Due ${targetDate}` : ""}
                  </p>
                </div>

                {commitments.length > 0 && (
                  <div className="rounded-xl bg-card border border-border p-4 shadow-card">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle size={16} className="text-primary" />
                      <p className="text-xs uppercase tracking-widest font-semibold text-primary">
                        Commitments ({commitments.length})
                      </p>
                    </div>
                    {commitments.map((c, i) => (
                      <div key={i} className="flex items-center gap-2 py-1">
                        <Check size={14} className="text-primary shrink-0" />
                        <p className="text-sm">{c.title} <span className="text-muted-foreground">· {c.durationDays}d</span></p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <Button variant="outline" onClick={() => setStep(2)} className="flex-1 h-12 rounded-xl">
                  <ArrowLeft className="mr-2 h-4 w-4" /> Back
                </Button>
                <Button
                  onClick={handleFinish}
                  disabled={submitting}
                  className="flex-1 h-12 rounded-xl gradient-mint text-primary-foreground font-semibold text-base shadow-mint"
                >
                  {submitting ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <>Launch Dashboard <ArrowRight className="ml-2 h-5 w-5" /></>
                  )}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Onboarding;
