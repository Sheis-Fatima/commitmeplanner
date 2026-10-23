import { useAuthReady } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import SplashScreen from "@/pages/SplashScreen";

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isReady } = useAuthReady();

  if (!isReady) return <SplashScreen />;
  if (!user) return <Navigate to="/auth" replace />;
  return <>{children}</>;
};

export default ProtectedRoute;
