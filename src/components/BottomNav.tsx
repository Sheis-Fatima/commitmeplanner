import { useLocation, useNavigate } from "react-router-dom";
import { LayoutGrid, Calendar, TrendingUp, BarChart3 } from "lucide-react";
import { motion } from "framer-motion";

const tabs = [
  { path: "/", label: "Dashboard", icon: LayoutGrid },
  { path: "/planner", label: "Planner", icon: Calendar },
  { path: "/roadmap", label: "Roadmap", icon: TrendingUp },
  { path: "/insights", label: "Insights", icon: BarChart3 },
];

const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/95 backdrop-blur-xl">
      <div className="mx-auto flex max-w-lg items-center justify-around py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        {tabs.map((tab) => {
          const isActive = location.pathname === tab.path;
          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              className="relative flex flex-col items-center gap-1 px-4 py-1.5"
            >
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 rounded-xl gradient-mint opacity-15"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <tab.icon
                size={22}
                className={isActive ? "text-primary" : "text-muted-foreground"}
              />
              <span
                className={`text-[10px] font-semibold uppercase tracking-wider ${
                  isActive ? "text-primary" : "text-muted-foreground"
                }`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
