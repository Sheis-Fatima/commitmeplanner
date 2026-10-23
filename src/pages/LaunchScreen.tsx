import { motion } from "framer-motion";
import { ArrowRight, CalendarClock, Check, Moon, Sparkles, Target } from "lucide-react";
import { useNavigate } from "react-router-dom";

const LaunchScreen = () => {
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[8%] top-[8%] h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute bottom-[-5rem] right-[-4rem] h-96 w-96 rounded-full bg-sky-400/5 blur-3xl" />
      </div>

      <div className="relative mx-auto flex min-h-screen w-full max-w-6xl flex-col px-5 py-6 sm:px-8 lg:px-10">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary text-primary-foreground shadow-[0_0_30px_rgba(74,222,128,.18)]">
              <Target size={19} strokeWidth={2.5} />
            </div>
            <div>
              <p className="font-display text-lg font-bold tracking-tight">commit<span className="text-primary">me</span></p>
              <p className="eyebrow mt-0.5">Personal planning system</p>
            </div>
          </div>
          <button onClick={() => navigate("/auth")} className="rounded-xl border border-white/[0.08] bg-white/[0.03] px-3.5 py-2 text-xs font-semibold text-muted-foreground transition hover:bg-white/[0.06] hover:text-foreground">
            Sign in
          </button>
        </header>

        <main className="grid flex-1 items-center gap-10 py-10 lg:grid-cols-[1.05fr_.95fr] lg:gap-20">
          <section>
            <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .55 }}>
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/[0.06] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.15em] text-primary">
                <Sparkles size={12} /> Built around real life
              </div>
              <h1 className="mt-5 max-w-2xl font-display text-5xl font-semibold leading-[1.02] tracking-[-0.04em] sm:text-6xl">
                Commit to what matters.
                <span className="block text-muted-foreground/80">Make room for everything else.</span>
              </h1>
              <p className="mt-6 max-w-xl text-base leading-7 text-muted-foreground sm:text-lg">
                commitme plans your goals around the commitments, sleep, and interruptions already happening in your life.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <button onClick={() => navigate("/auth")} className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-[0_14px_35px_-18px_rgba(74,222,128,.9)] transition hover:-translate-y-0.5">
                  Open commitme <ArrowRight size={16} />
                </button>
                <button onClick={() => document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" })} className="rounded-xl border border-white/[0.08] bg-white/[0.025] px-5 py-3 text-sm font-semibold text-muted-foreground transition hover:bg-white/[0.05] hover:text-foreground">
                  See how it works
                </button>
              </div>
              <div className="mt-10 flex flex-wrap gap-x-6 gap-y-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-2"><Check size={14} className="text-primary" /> Goals</span>
                <span className="flex items-center gap-2"><Check size={14} className="text-primary" /> Commitments</span>
                <span className="flex items-center gap-2"><Check size={14} className="text-primary" /> Sleep</span>
                <span className="flex items-center gap-2"><Check size={14} className="text-primary" /> Daily mood</span>
              </div>
            </motion.div>
          </section>

          <motion.section initial={{ opacity: 0, scale: .97, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ duration: .65, delay: .1 }} className="relative">
            <div className="absolute -inset-6 rounded-[36px] bg-primary/[0.025] blur-2xl" />
            <div className="relative overflow-hidden rounded-[28px] border border-white/[0.08] bg-[#0c1115] shadow-[0_30px_90px_-40px_rgba(0,0,0,.95)]">
              <div className="border-b border-white/[0.06] px-5 py-4 sm:px-6">
                <div className="flex items-center justify-between">
                  <div><p className="eyebrow text-primary/80">Today</p><p className="mt-1 text-lg font-semibold">Your plan, without the guilt.</p></div>
                  <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-semibold text-primary">7:42 AM</span>
                </div>
              </div>
              <div className="p-5 sm:p-6">
                <div className="grid grid-cols-3 gap-2">
                  <div className="rounded-xl border border-white/[0.06] bg-white/[0.025] p-3"><p className="eyebrow">Goals</p><p className="mt-1.5 text-xl font-semibold">3</p></div>
                  <div className="rounded-xl border border-white/[0.06] bg-white/[0.025] p-3"><p className="eyebrow">Free</p><p className="mt-1.5 text-xl font-semibold">18.5h</p></div>
                  <div className="rounded-xl border border-white/[0.06] bg-white/[0.025] p-3"><p className="eyebrow">Sleep</p><p className="mt-1.5 text-xl font-semibold">7.4h</p></div>
                </div>
                <div className="mt-5 rounded-2xl border border-white/[0.06] bg-white/[0.018]">
                  {[
                    { time: "08:00", title: "Client work", meta: "Protected commitment", icon: CalendarClock, muted: true },
                    { time: "13:00", title: "Build portfolio case study", meta: "Goal work · 60 min", icon: Target, muted: false },
                    { time: "15:00", title: "Deep work · Product", meta: "Goal work · 45 min", icon: Sparkles, muted: false },
                    { time: "23:00", title: "Sleep", meta: "Planned · 7.5h", icon: Moon, muted: true },
                  ].map(({ time, title, meta, icon: Icon, muted }, index) => (
                    <motion.div key={title} initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: .35 + index * .08 }} className="flex items-center gap-3 border-b border-white/[0.05] px-4 py-3.5 last:border-0">
                      <span className="w-12 shrink-0 text-[11px] tabular-nums text-muted-foreground">{time}</span>
                      <div className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${muted ? "bg-white/[0.04] text-muted-foreground" : "bg-primary/10 text-primary"}`}>
                        <Icon size={15} />
                      </div>
                      <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{title}</p><p className="mt-0.5 truncate text-[11px] text-muted-foreground">{meta}</p></div>
                    </motion.div>
                  ))}
                </div>
                <div className="mt-4 rounded-xl border border-primary/10 bg-primary/[0.035] px-4 py-3">
                  <p className="text-xs font-medium">Plan changed?</p>
                  <p className="mt-1 text-[11px] leading-5 text-muted-foreground">Tell commitme what happened. It will make room without throwing away your goals.</p>
                </div>
              </div>
            </div>
          </motion.section>
        </main>

        <section id="how-it-works" className="grid gap-3 border-t border-white/[0.06] pt-6 sm:grid-cols-3">
          {[
            ["01", "Commit", "Add the things your life already demands."],
            ["02", "Plan", "Let the planner find realistic room for your goals."],
            ["03", "Adapt", "Handle changes without abandoning the bigger picture."],
          ].map(([number, title, copy]) => (
            <div key={number} className="rounded-2xl border border-white/[0.05] bg-white/[0.018] p-4">
              <span className="text-[10px] font-semibold tracking-[0.15em] text-primary">{number}</span>
              <h2 className="mt-2 text-sm font-semibold">{title}</h2>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">{copy}</p>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
};

export default LaunchScreen;
