import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Tag, Database, ClipboardCheck,
  Factory, CalendarClock, History, QrCode,
  Users, Settings, CircleDot,
} from "lucide-react";

const groups = [
  {
    label: "Workspace",
    items: [
      { to: "/workspace", icon: LayoutDashboard, label: "Dashboard", end: true },
      { to: "/workspace/labels", icon: Tag, label: "Labels" },
      { to: "/workspace/products", icon: Database, label: "Product data" },
      { to: "/workspace/compliance", icon: ClipboardCheck, label: "Compliance" },
    ],
  },
  {
    label: "Monitoring",
    items: [
      { to: "/workspace/suppliers", icon: Factory, label: "Suppliers" },
      { to: "/workspace/seasonal", icon: CalendarClock, label: "Seasonal SKUs" },
      { to: "/workspace/versions", icon: History, label: "Version history" },
      { to: "/workspace/dpp", icon: QrCode, label: "Digital passport" },
    ],
  },
  {
    label: "Settings",
    items: [
      { to: "/workspace/team", icon: Users, label: "Team" },
      { to: "/workspace/settings", icon: Settings, label: "Settings" },
    ],
  },
];

interface Props { onNavigate?: () => void; }

const WorkspaceSidebar = ({ onNavigate }: Props) => {
  const location = useLocation();
  const isActive = (to: string, end?: boolean) =>
    end ? location.pathname === to : location.pathname === to || location.pathname.startsWith(to + "/");

  return (
    <aside className="flex h-full w-60 flex-col bg-sidebar border-r border-sidebar-border md:fixed md:inset-y-0 md:left-0 md:z-30">
      <div className="flex h-14 items-center gap-2.5 px-5 border-b border-sidebar-border shrink-0">
        <CircleDot className="h-6 w-6 text-sidebar-primary" />
        <span className="text-base font-semibold text-sidebar-primary tracking-tight">Labelring</span>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
        {groups.map((group) => (
          <div key={group.label}>
            <p className="px-3 mb-1 text-[10px] uppercase tracking-wider font-semibold text-sidebar-muted">
              {group.label}
            </p>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const active = isActive(item.to, item.end);
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={onNavigate}
                    className={`flex items-center gap-3 rounded-md px-3 py-1.5 text-[13px] font-medium transition-colors ${
                      active
                        ? "bg-sidebar-accent text-sidebar-accent-foreground"
                        : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
                    }`}
                  >
                    <item.icon className="h-4 w-4 shrink-0" />
                    {item.label}
                  </NavLink>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-sidebar-border px-4 py-3 shrink-0">
        <NavLink to="/" className="text-xs text-sidebar-muted hover:text-sidebar-foreground">
          ← Back to scan funnel
        </NavLink>
      </div>
    </aside>
  );
};

export default WorkspaceSidebar;
