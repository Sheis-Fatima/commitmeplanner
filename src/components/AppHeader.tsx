import { Bell, LogOut, User } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface AppHeaderProps {
  title?: string;
  showAvatar?: boolean;
}

const AppHeader = ({ title = "Overview", showAvatar = true }: AppHeaderProps) => {
  const { user, signOut } = useAuth();
  const displayName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "there";

  const handleSignOut = async () => {
    await signOut();
    toast.success("Signed out");
  };

  return (
    <header className="flex items-center justify-between border-b border-white/[0.06] px-0 py-5 md:py-7">
      <div className="flex items-center gap-3">
        {showAvatar && (
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-white/[0.04] ring-1 ring-white/[0.07] md:hidden">
            <User size={18} className="text-primary" />
          </div>
        )}
        <div>
          <p className="font-display text-lg font-semibold tracking-tight">{title}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">Good to see you, {displayName.split(" ")[0]}.</p>
        </div>
      </div>
      <div className="flex items-center gap-1">
        <button className="grid h-10 w-10 place-items-center rounded-xl text-muted-foreground hover:bg-white/[0.04] hover:text-foreground" aria-label="Notifications">
          <Bell size={18} />
        </button>
        <button onClick={handleSignOut} className="grid h-10 w-10 place-items-center rounded-xl text-muted-foreground hover:bg-white/[0.04] hover:text-foreground md:hidden" aria-label="Sign out">
          <LogOut size={18} />
        </button>
      </div>
    </header>
  );
};

export default AppHeader;
