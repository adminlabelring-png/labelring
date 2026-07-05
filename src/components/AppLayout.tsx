import { Outlet } from "react-router-dom";
import PillNav from "./PillNav";
import BottomTabBar from "./BottomTabBar";

const AppLayout = () => {
  return (
    <div className="min-h-screen bg-background">
      <PillNav />
      <main className="pt-6 md:pt-24 pb-24 md:pb-10 px-4 md:px-8">
        <div className="max-w-[1400px] mx-auto">
          <Outlet />
        </div>
      </main>
      <BottomTabBar />
    </div>
  );
};

export default AppLayout;
