import { CheckCircle2, AlertCircle, XCircle } from "lucide-react";
import type { RuleResult } from "@/lib/label-rules";

const badge = {
  ok: {
    Icon: CheckCircle2,
    className: "text-[hsl(var(--risk-low))]",
    pill: "bg-[hsl(var(--risk-low-bg))] text-[hsl(var(--risk-low))]",
    label: "OK",
  },
  review: {
    Icon: AlertCircle,
    className: "text-[hsl(var(--risk-medium))]",
    pill: "bg-[hsl(var(--risk-medium-bg))] text-[hsl(var(--risk-medium))]",
    label: "Review",
  },
  missing: {
    Icon: XCircle,
    className: "text-[hsl(var(--risk-high))]",
    pill: "bg-[hsl(var(--risk-high-bg))] text-[hsl(var(--risk-high))]",
    label: "Missing",
  },
} as const;

const ComplianceCheck = ({ rules }: { rules: RuleResult[] }) => (
  <ul className="space-y-1.5">
    {rules.map((r) => {
      const b = badge[r.status];
      return (
        <li key={r.key} className="flex items-center justify-between gap-3 rounded-md border bg-card px-3 py-2 text-sm">
          <span className="flex items-center gap-2">
            <b.Icon className={`h-4 w-4 ${b.className}`} />
            {r.label}
          </span>
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${b.pill}`}>
            {b.label}
          </span>
        </li>
      );
    })}
  </ul>
);

export default ComplianceCheck;
