import { NavLink, useLocation } from "react-router-dom";
import {
  Home,
  LayoutDashboard,
  ShieldCheck,
  Database,
  Upload,
  BookOpen,
  Users,
  History,
  BarChart3,
  CircleDot,
} from "lucide-react";

const navItems = [
  { to: "/", icon: Home, label: "Home" },
  { to: "/products", icon: LayoutDashboard, label: "Products" },
  { to: "/compliance", icon: ShieldCheck, label: "Compliance" },
  { to: "/label-data", icon: Database, label: "Label Data" },
  { to: "/upload", icon: Upload, label: "Upload & Scan" },
  { to: "/rules", icon: BookOpen, label: "Rules Engine" },
  { to: "/collaboration", icon: Users, label: "Collaboration" },
  { to: "/versions", icon: History, label: "Version Control" },
  { to: "/analytics", icon: BarChart3, label: "Analytics" },
];

const AppSidebar = () => {
  const location = useLocation();

  return (
    <aside className="fixed inset-y-0 left-0 z-30 flex w-60 flex-col bg-sidebar border-r border-sidebar-border">
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
          const isActive = location.pathname === item.to;
          return (
            <NavLink
              key={item.to}
              to={item.to}
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
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-sidebar-accent flex items-center justify-center text-xs font-semibold text-sidebar-accent-foreground">
            NG
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-sidebar-primary truncate">NaturGlow</p>
            <p className="text-xs text-sidebar-muted truncate">Pro Plan</p>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default AppSidebar;
