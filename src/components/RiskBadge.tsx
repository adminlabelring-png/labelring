interface RiskBadgeProps {
  level: "low" | "medium" | "high";
}

const RiskBadge = ({ level }: RiskBadgeProps) => {
  const classes = {
    low: "risk-badge-low",
    medium: "risk-badge-medium",
    high: "risk-badge-high",
  };

  return (
    <span className={`${classes[level]} inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize`}>
      {level}
    </span>
  );
};

export default RiskBadge;
