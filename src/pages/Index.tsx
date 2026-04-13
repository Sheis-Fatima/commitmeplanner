import { useGoals } from "@/hooks/useGoals";
import Dashboard from "./Dashboard";
import Onboarding from "./Onboarding";

const Index = () => {
  const { data: goals, isLoading } = useGoals();

  if (isLoading) return null;

  // First-time user: no goals yet → show onboarding
  if (!goals || goals.length === 0) {
    return <Onboarding />;
  }

  return <Dashboard />;
};

export default Index;
