import { NavLink, useLocation } from "react-router-dom";
import { BarChart3, CalendarDays, LayoutDashboard, LogOut, Settings2, Target, TrendingUp, User } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const links = [
  { to: "/app", label: "Overview", icon: LayoutDashboard },
  { to: "/planner", label: "Planner", icon: CalendarDays },
  { to: "/roadmap", label: "Roadmap", icon: TrendingUp },
  { to: "/insights", label: "Insights", icon: BarChart3 },
];

const DesktopSidebar = () => {
  const { pathname } = useLocation();
  const { user, signOut } = useAuth();
  const displayName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Account";
  const logout = async () => { await signOut(); toast.success("Signed out"); };

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-[248px] border-r border-white/[0.06] bg-[#0a0d11]/95 px-5 py-6 backdrop-blur-xl md:flex md:flex-col">
      <div className="flex items-center gap-3 px-2">
        <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-primary-foreground shadow-[0_0_28px_rgba(74,222,128,0.18)]"><Target size={18} strokeWidth={2.5} /></div>
        <div>
          <p className="font-display text-[17px] font-bold tracking-tight">commit<span className="text-primary">me</span></p>
          <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Personal operating system</p>
        </div>
      </div>
      <div className="mt-10">
        <p className="px-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Workspace</p>
        <nav className="mt-3 space-y-1.5">
          {links.map(({ to, label, icon: Icon }) => {
            const active = pathname === to || (to !== "/app" && pathname.startsWith(to));
            return <NavLink key={to} to={to} className={["group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all", active ? "bg-primary/10 text-primary ring-1 ring-primary/15" : "text-muted-foreground hover:bg-white/[0.04] hover:text-foreground"].join(" ")}><Icon size={18} strokeWidth={2} /><span>{label}</span></NavLink>;
          })}
        </nav>
      </div>
      <div className="mt-auto rounded-2xl border border-white/[0.06] bg-white/[0.025] p-3">
        <div className="flex items-center gap-3">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary/10 text-primary ring-1 ring-primary/10"><User size={16} /></div>
          <div className="min-w-0"><p className="truncate text-sm font-semibold">{displayName}</p><p className="truncate text-xs text-muted-foreground">{user?.email}</p></div>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <button className="flex items-center justify-center gap-1.5 rounded-lg border border-white/[0.06] px-2.5 py-2 text-xs text-muted-foreground hover:bg-white/[0.04] hover:text-foreground"><Settings2 size={13} /> Settings</button>
          <button onClick={logout} className="flex items-center justify-center gap-1.5 rounded-lg border border-white/[0.06] px-2.5 py-2 text-xs text-muted-foreground hover:bg-white/[0.04] hover:text-foreground"><LogOut size={13} /> Sign out</button>
        </div>
      </div>
    </aside>
  );
};

export default DesktopSidebar;
