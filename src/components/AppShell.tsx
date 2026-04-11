import { ReactNode } from "react";
import BottomNav from "./BottomNav";

const AppShell = ({ children }: { children: ReactNode }) => (
  <div className="min-h-screen bg-background">
    <div className="mx-auto max-w-lg pb-24">
      {children}
    </div>
    <BottomNav />
  </div>
);

export default AppShell;
