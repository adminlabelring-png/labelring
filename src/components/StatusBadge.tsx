interface StatusBadgeProps {
  status: "approved" | "pending" | "rejected" | "active" | "draft" | "archived";
}

const StatusBadge = ({ status }: StatusBadgeProps) => {
  const config: Record<string, string> = {
    approved: "compliance-badge-high",
    active: "compliance-badge-high",
    pending: "compliance-badge-medium",
    draft: "bg-muted text-muted-foreground",
    rejected: "compliance-badge-low",
    archived: "bg-muted text-muted-foreground",
  };

  return (
    <span className={`${config[status]} inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize`}>
      {status}
    </span>
  );
};

export default StatusBadge;
