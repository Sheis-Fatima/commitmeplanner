import { motion } from "framer-motion";
import { Check, MessageCircle, Lock, Sparkles, ArrowRight } from "lucide-react";
import AppHeader from "@/components/AppHeader";
import AppShell from "@/components/AppShell";

const phases = [
  {
    num: "01",
    title: "Foundational Patterns",
    status: "complete" as const,
    items: [
      { title: "Solid Principles in Python", desc: "Applying decoupling techniques." },
      { title: "Creational Patterns", desc: "Factories, Builders, and Singletons." },
    ],
  },
  {
    num: "02",
    title: "Advanced Decoupling",
    status: "in_progress" as const,
    items: [
      { title: "Dependency Injection Frameworks", desc: "Exploring 'Dependency Injector' and 'Pinject' for enterprise apps.", labs: 3, hours: 4, cta: true },
      { title: "Interface Segregation", desc: "Using Abstract Base Classes (ABCs)." },
      { title: "Service Layer Pattern", desc: "Managing business logic flow." },
    ],
  },
  {
    num: "03",
    title: "Microservices & Scaling",
    status: "locked" as const,
    items: [],
    lockMsg: "Unlock after completing Phase 02. This module covers Event-Driven Architecture, CQRS, and Domain-Driven Design (DDD).",
  },
];

const statusIcon = (s: string) => {
  if (s === "complete") return <div className="w-8 h-8 rounded-full gradient-mint flex items-center justify-center"><Check size={16} className="text-primary-foreground" /></div>;
  if (s === "in_progress") return <div className="w-8 h-8 rounded-full border-2 border-primary flex items-center justify-center"><MessageCircle size={14} className="text-primary" /></div>;
  return <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center"><Lock size={14} className="text-muted-foreground" /></div>;
};

const Roadmap = () => (
  <AppShell>
    <AppHeader />
    <div className="px-5 space-y-6 pt-2">
      <div>
        <p className="text-[10px] uppercase tracking-widest font-semibold text-primary">Current Path</p>
        <h2 className="font-display text-3xl font-bold mt-1">Master Python Architecture</h2>
        <p className="text-muted-foreground text-sm mt-2">Deep dive into scalable patterns, clean code principles, and enterprise-grade system design.</p>
      </div>

      {/* Progress */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-xl bg-card border border-border p-4 shadow-card">
        <div className="flex justify-between items-end">
          <div>
            <p className="font-display text-3xl font-bold">34%</p>
            <p className="text-xs text-muted-foreground mt-1">Overall Completion</p>
          </div>
          <div className="text-right">
            <p className="text-primary font-bold">12 / 35</p>
            <p className="text-xs text-muted-foreground">Milestones reached</p>
          </div>
        </div>
        <div className="mt-3 h-1.5 rounded-full bg-muted overflow-hidden">
          <div className="h-full rounded-full gradient-mint" style={{ width: "34%" }} />
        </div>
      </motion.div>

      {/* Phases */}
      {phases.map((phase, i) => (
        <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="relative">
          <div className="flex items-center gap-3 mb-3">
            {statusIcon(phase.status)}
            <div>
              <p className="text-[10px] uppercase tracking-widest text-primary font-semibold">Phase {phase.num}</p>
              {phase.status === "in_progress" && <span className="text-[10px] uppercase tracking-wider text-primary font-bold ml-2">In Progress</span>}
              <h3 className="font-display text-xl font-bold">{phase.title}</h3>
            </div>
          </div>

          <div className="ml-4 border-l border-border pl-6 space-y-3">
            {phase.items.map((item, j) => (
              <div key={j} className={`rounded-xl p-4 border ${item.cta ? "bg-card border-primary/30 shadow-card" : "bg-transparent border-border"}`}>
                <p className="font-semibold">{item.title}</p>
                <p className="text-xs text-muted-foreground mt-1">{item.desc}</p>
                {item.cta && (
                  <div className="mt-3 space-y-2">
                    <div className="flex gap-2">
                      <span className="text-[10px] bg-muted px-2 py-1 rounded-full font-medium">{item.labs} Labs</span>
                      <span className="text-[10px] bg-muted px-2 py-1 rounded-full font-medium">{item.hours}h Estimated</span>
                    </div>
                    <button className="gradient-mint text-primary-foreground font-semibold text-sm px-4 py-2 rounded-lg shadow-mint">
                      Resume Learning
                    </button>
                  </div>
                )}
              </div>
            ))}
            {phase.lockMsg && (
              <p className="text-xs text-muted-foreground italic">{phase.lockMsg}</p>
            )}
          </div>
        </motion.div>
      ))}

      {/* Mentor CTA */}
      <div className="rounded-xl bg-card border border-border p-5 shadow-card">
        <h3 className="font-display text-xl font-bold">Stuck on Architecture?</h3>
        <p className="text-sm text-muted-foreground mt-2">Schedule a 15-minute quick sync with a Principal Engineer to review your UML diagrams.</p>
        <button className="text-primary font-semibold text-sm mt-3 flex items-center gap-1">
          View Mentors <ArrowRight size={14} />
        </button>
      </div>

      {/* AI Forecast */}
      <div className="rounded-xl gradient-card border border-border p-5 text-center shadow-card">
        <Sparkles size={28} className="text-primary mx-auto mb-2" />
        <h3 className="font-display font-bold">AI Career Forecast</h3>
        <p className="text-xs text-muted-foreground mt-1">Finish this path to qualify for Senior Python roles in Fintech.</p>
      </div>
    </div>
  </AppShell>
);

export default Roadmap;
