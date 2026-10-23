import { ReactNode } from "react";
import BottomNav from "./BottomNav";
import DesktopSidebar from "./DesktopSidebar";

const AppShell = ({ children }: { children: ReactNode }) => (
  <div className="min-h-screen bg-background text-foreground">
    <DesktopSidebar />
    <main className="min-h-screen md:pl-[248px]">
      <div className="mx-auto w-full max-w-[1440px] px-4 pb-28 sm:px-6 md:px-8 md:pb-12 xl:px-10">
        {children}
      </div>
    </main>
    <BottomNav />
  </div>
);

export default AppShell;
