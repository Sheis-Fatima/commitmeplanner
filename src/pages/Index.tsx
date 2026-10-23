import { Loader2 } from "lucide-react";
import { useGoals } from "@/hooks/useGoals";
import Dashboard from "./Dashboard";
import Onboarding from "./Onboarding";

const Index = () => {
  const { data: goals, isLoading } = useGoals();

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-background"><div className="flex flex-col items-center gap-3 text-muted-foreground"><Loader2 className="h-6 w-6 animate-spin text-primary" /><span className="text-sm">Loading your workspace…</span></div></div>;
  }
  if (!goals || goals.length === 0) return <Onboarding />;
  return <Dashboard />;
};

export default Index;