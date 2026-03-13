interface ComplianceScoreBadgeProps {
  score: number;
  size?: "sm" | "md" | "lg";
}

const ComplianceScoreBadge = ({ score, size = "md" }: ComplianceScoreBadgeProps) => {
  const getColor = () => {
    if (score >= 85) return "compliance-badge-high";
    if (score >= 60) return "compliance-badge-medium";
    return "compliance-badge-low";
  };

  const sizeClasses = {
    sm: "h-7 w-7 text-xs",
    md: "h-9 w-9 text-sm",
    lg: "h-14 w-14 text-lg",
  };

  return (
    <div
      className={`${sizeClasses[size]} ${getColor()} rounded-full flex items-center justify-center font-semibold`}
    >
      {score}
    </div>
  );
};

export default ComplianceScoreBadge;
