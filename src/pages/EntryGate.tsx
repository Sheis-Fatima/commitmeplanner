import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuthReady } from "@/contexts/AuthContext";
import LaunchScreen from "./LaunchScreen";
import SplashScreen from "./SplashScreen";

const EntryGate = () => {
  const { user, isReady } = useAuthReady();
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => setShowSplash(false), 1100);
    return () => window.clearTimeout(timer);
  }, []);

  if (showSplash || !isReady) return <SplashScreen />;
  if (user) return <Navigate to="/app" replace />;
  return <LaunchScreen />;
};

export default EntryGate;
