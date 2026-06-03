import { CheckCircle2, Clock, AlertTriangle, Archive } from "lucide-react";

export type LabelStatus = "approved" | "in_review" | "flagged" | "archived";

const map: Record<LabelStatus, { label: string; cls: string; Icon: typeof CheckCircle2 }> = {
  approved:  { label: "Approved",  cls: "bg-[hsl(var(--risk-low-bg))] text-[hsl(var(--risk-low))]",       Icon: CheckCircle2 },
  in_review: { label: "In review", cls: "bg-[hsl(var(--risk-medium-bg))] text-[hsl(var(--risk-medium))]", Icon: Clock },
  flagged:   { label: "Flagged",   cls: "bg-[hsl(var(--risk-high-bg))] text-[hsl(var(--risk-high))]",     Icon: AlertTriangle },
  archived:  { label: "Archived",  cls: "bg-muted text-muted-foreground",                                  Icon: Archive },
};

const StatusPill = ({ status }: { status: LabelStatus | string }) => {
  const cfg = map[(status as LabelStatus)] ?? map.approved;
  const Icon = cfg.Icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${cfg.cls}`}>
      <Icon className="h-3 w-3" />
      {cfg.label}
    </span>
  );
};

export default StatusPill;
