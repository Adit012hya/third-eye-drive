import { Outlet } from "react-router-dom";
import BottomTabBar from "@/components/BottomTabBar";

export default function AppShell() {
  return (
    <div className="max-w-md mx-auto h-screen overflow-hidden bg-background flex flex-col relative w-full border-x border-border/10">
      <div className="flex-1 overflow-hidden relative">
        <Outlet />
      </div>
      <BottomTabBar />
    </div>
  );
}

