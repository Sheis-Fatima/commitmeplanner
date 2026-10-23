import { useLocation, useNavigate } from "react-router-dom";
import { LayoutGrid, Calendar, TrendingUp, BarChart3 } from "lucide-react";
import { motion } from "framer-motion";

const tabs = [
  { path: "/app", label: "Overview", icon: LayoutGrid },
  { path: "/planner", label: "Planner", icon: Calendar },
  { path: "/roadmap", label: "Roadmap", icon: TrendingUp },
  { path: "/insights", label: "Insights", icon: BarChart3 },
];

const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav aria-label="Primary navigation" className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/95 backdrop-blur-xl md:hidden">
      <div className="mx-auto flex max-w-lg items-center justify-around px-2 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        {tabs.map((tab) => {
          const isActive = location.pathname === tab.path;
          const Icon = tab.icon;
          return (
            <button key={tab.path} onClick={() => navigate(tab.path)} aria-current={isActive ? "page" : undefined} aria-label={tab.label} className="relative flex min-h-12 min-w-12 flex-col items-center justify-center gap-1 rounded-xl px-2 transition-colors hover:bg-muted/70">
              {isActive && <motion.div layoutId="activeTab" className="absolute inset-0 rounded-xl bg-primary/10" />}
              <Icon size={21} className={isActive ? "relative z-10 text-primary" : "relative z-10 text-muted-foreground"} />
              <span className={isActive ? "relative z-10 text-[9px] font-semibold text-primary" : "relative z-10 text-[9px] font-semibold text-muted-foreground"}>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
