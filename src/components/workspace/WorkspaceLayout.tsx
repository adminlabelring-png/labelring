import { useState } from "react";
import { Outlet } from "react-router-dom";
import { Bell, Menu } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { BrandProvider, useBrand } from "@/lib/brand-context";
import WorkspaceSidebar from "./WorkspaceSidebar";
import BrandSwitcher from "./BrandSwitcher";

const TopBar = () => {
  const { brand } = useBrand();
  return (
    <header className="h-12 flex items-center justify-between px-4 md:px-6 border-b border-border bg-card shrink-0">
      <div className="text-sm font-medium text-muted-foreground hidden sm:block">
        {brand ? brand.name : "Loading…"} workspace
      </div>
      <div className="flex items-center gap-2 ml-auto">
        <BrandSwitcher />
        <button className="h-8 w-8 inline-flex items-center justify-center rounded-md hover:bg-accent text-muted-foreground">
          <Bell className="h-4 w-4" />
        </button>
        <div className="h-7 w-7 rounded-full bg-accent text-accent-foreground text-[11px] font-semibold inline-flex items-center justify-center">
          RK
        </div>
      </div>
    </header>
  );
};

const Shell = () => {
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);

  if (isMobile) {
    return (
      <div className="min-h-screen bg-muted/30 flex flex-col">
        <header className="sticky top-0 z-40 flex h-12 items-center gap-3 border-b bg-card px-4 shrink-0">
          <button onClick={() => setOpen(true)}><Menu className="h-5 w-5" /></button>
          <span className="text-sm font-semibold">Workspace</span>
          <div className="ml-auto"><BrandSwitcher /></div>
        </header>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetContent side="left" className="w-60 p-0">
            <SheetTitle className="sr-only">Navigation</SheetTitle>
            <WorkspaceSidebar onNavigate={() => setOpen(false)} />
          </SheetContent>
        </Sheet>
        <main className="flex-1 p-4"><Outlet /></main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <WorkspaceSidebar />
      <div className="md:pl-60 flex flex-col min-h-screen">
        <TopBar />
        <main className="flex-1 p-6 lg:p-8 max-w-[1400px] w-full">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

const WorkspaceLayout = () => (
  <BrandProvider>
    <Shell />
  </BrandProvider>
);

export default WorkspaceLayout;
