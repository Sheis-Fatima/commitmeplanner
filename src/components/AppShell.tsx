import { ReactNode } from "react";
import BottomNav from "./BottomNav";

const AppShell = ({ children }: { children: ReactNode }) => (
  <div className="min-h-screen bg-background">
    <div className="mx-auto w-full max-w-lg md:max-w-3xl lg:max-w-5xl pb-24">
      {children}
    </div>
    <BottomNav />
  </div>
);

export default AppShell;
