import { motion } from "framer-motion";
import { ArrowRight, CalendarCheck, Clock3 } from "lucide-react";
import { useTimeAllocation } from "@/hooks/useTimeAllocation";

const TodaysPlan = () => {
  const { allocations } = useTimeAllocation();
  const today = new Date().toISOString().slice(0, 10);
  const items = allocations.filter((a) => a.date === today).slice(0, 6);

  return (
    <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="panel overflow-hidden">
      <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4 sm:px-6">
        <div><p className="eyebrow">Today</p><h2 className="mt-1 text-xl font-semibold">Planned focus</h2></div>
        <CalendarCheck size={18} className="text-primary" />
      </div>
      {items.length > 0 ? (
        <div className="divide-y divide-white/[0.05]">
          {items.map((item, index) => (
            <motion.div key={item.stepId} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.04 }} className="group flex items-center gap-4 px-5 py-4 sm:px-6">
              <div className="w-20 shrink-0 text-xs font-medium tabular-nums text-muted-foreground">{item.start}–{item.end}</div>
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary"><Clock3 size={15} /></div>
              <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{item.title}</p><p className="mt-0.5 text-xs text-muted-foreground">Goal work</p></div>
              <ArrowRight size={16} className="text-muted-foreground/50 transition group-hover:text-primary" />
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="px-6 py-10 text-center">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-white/[0.035]"><CalendarCheck size={21} className="text-muted-foreground" /></div>
          <p className="mt-4 font-semibold">Your day is open</p>
          <p className="mx-auto mt-1 max-w-sm text-xs leading-5 text-muted-foreground">Add goal steps and commitments. The planner will fill in only the room that actually exists.</p>
        </div>
      )}
    </motion.section>
  );
};

export default TodaysPlan;
