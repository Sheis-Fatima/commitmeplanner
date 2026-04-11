import { Settings, User } from "lucide-react";

interface AppHeaderProps {
  title?: string;
  showAvatar?: boolean;
}

const AppHeader = ({ title = "commitme", showAvatar = true }: AppHeaderProps) => (
  <header className="flex items-center justify-between px-5 pt-4 pb-2">
    <div className="flex items-center gap-3">
      {showAvatar && (
        <div className="h-10 w-10 rounded-full gradient-mint flex items-center justify-center">
          <User size={20} className="text-primary-foreground" />
        </div>
      )}
      <h1 className="font-display text-xl font-bold tracking-tight">
        <span className="text-foreground">commit</span>
        <span className="text-primary">me</span>
      </h1>
    </div>
    <button className="rounded-full p-2 text-muted-foreground hover:text-primary transition-colors">
      <Settings size={20} />
    </button>
  </header>
);

export default AppHeader;
