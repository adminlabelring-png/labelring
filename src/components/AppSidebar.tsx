import { NavLink, useLocation } from "react-router-dom";
import { Home, ScanLine, CircleDot, LayoutDashboard, Sparkles } from "lucide-react";

const navItems = [
  { to: "/", icon: Home, label: "Home" },
  { to: "/scan", icon: ScanLine, label: "Scan Label" },
  { to: "/generate", icon: Sparkles, label: "Generate Label" },
  { to: "/workspace", icon: LayoutDashboard, label: "Workspace" },
];

interface AppSidebarProps {
  onNavigate?: () => void;
}

const AppSidebar = ({ onNavigate }: AppSidebarProps) => {
  const location = useLocation();

  return (
    <aside className="flex h-full w-60 flex-col bg-sidebar border-r border-sidebar-border md:fixed md:inset-y-0 md:left-0 md:z-30">
      {/* Logo */}
      <div className="flex h-14 items-center gap-2.5 px-5 border-b border-sidebar-border">
        <CircleDot className="h-6 w-6 text-sidebar-primary" />
        <span className="text-base font-semibold text-sidebar-primary tracking-tight">
          Labelring
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
        {navItems.map((item) => {
          const isActive = item.to === "/" ? location.pathname === "/" : location.pathname.startsWith(item.to);
          return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onNavigate}
              className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
              }`}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {item.label}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-sidebar-border px-4 py-3">
        <p className="text-xs text-sidebar-muted">Guided label review tool</p>
      </div>
    </aside>
  );
};

export default AppSidebar;
