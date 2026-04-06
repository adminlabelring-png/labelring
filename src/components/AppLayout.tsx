import { useState } from "react";
import { Outlet } from "react-router-dom";
import { Menu } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import AppSidebar from "./AppSidebar";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";

const AppLayout = () => {
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);

  if (isMobile) {
    return (
      <div className="min-h-screen bg-background">
        {/* Mobile header with hamburger */}
        <header className="sticky top-0 z-40 flex h-12 items-center gap-3 border-b border-border bg-background px-4">
          <button onClick={() => setOpen(true)} className="text-foreground">
            <Menu className="h-5 w-5" />
          </button>
          <span className="text-sm font-semibold tracking-tight">Labelring</span>
        </header>

        {/* Sidebar in a sheet */}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetContent side="left" className="w-60 p-0">
            <SheetTitle className="sr-only">Navigation</SheetTitle>
            <AppSidebar onNavigate={() => setOpen(false)} />
          </SheetContent>
        </Sheet>

        <main className="p-4">
          <Outlet />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AppSidebar />
      <main className="pl-60">
        <div className="p-6 lg:p-8 max-w-[1400px]">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AppLayout;
