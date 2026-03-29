import { motion } from "framer-motion";
import { ShieldCheck, AlertTriangle, XCircle, Ban, FileWarning, Store } from "lucide-react";
import { mockProducts } from "@/lib/mock-data";
import ComplianceScoreBadge from "@/components/ComplianceScoreBadge";
import RiskBadge from "@/components/RiskBadge";
import { Progress } from "@/components/ui/progress";

const allIssues = mockProducts.flatMap((p) =>
  p.issues.map((issue) => ({ ...issue, productName: p.name, productSku: p.sku }))
);

const ComplianceDashboard = () => {
  const avgScore = Math.round(
    mockProducts.reduce((sum, p) => sum + p.complianceScore, 0) / mockProducts.length
  );

  const getScoreColor = (score: number) => {
    if (score >= 85) return "text-[hsl(var(--risk-low))]";
    if (score >= 60) return "text-[hsl(var(--risk-medium))]";
    return "text-[hsl(var(--risk-high))]";
  };

  const getProgressColor = (score: number) => {
    if (score >= 85) return "bg-[hsl(var(--risk-low))]";
    if (score >= 60) return "bg-[hsl(var(--risk-medium))]";
    return "bg-[hsl(var(--risk-high))]";
  };

  const highIssues = allIssues.filter((i) => i.severity === "high").length;
  const mediumIssues = allIssues.filter((i) => i.severity === "medium").length;
  const compliantCount = mockProducts.filter((p) => p.issues.length === 0).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Compliance Overview</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Review compliance status and detected issues across all products
        </p>
      </div>

      {/* Company-wide compliance score hero */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-lg border bg-card p-6"
      >
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <div className="flex flex-col items-center gap-2">
            <div className="relative h-28 w-28">
              <svg className="h-28 w-28 -rotate-90" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="50" fill="none" stroke="hsl(var(--border))" strokeWidth="10" />
                <circle
                  cx="60" cy="60" r="50" fill="none"
                  stroke={avgScore >= 85 ? "hsl(var(--risk-low))" : avgScore >= 60 ? "hsl(var(--risk-medium))" : "hsl(var(--risk-high))"}
                  strokeWidth="10" strokeLinecap="round"
                  strokeDasharray={`${(avgScore / 100) * 314} 314`}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className={`text-3xl font-bold ${getScoreColor(avgScore)}`}>{avgScore}%</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground font-medium">Company Score</p>
          </div>
          <div className="flex-1 space-y-3">
            <div>
              <p className="text-lg font-semibold">Overall Compliance Health</p>
              <p className="text-sm text-muted-foreground">
                Across {mockProducts.length} products · {compliantCount} fully compliant · {allIssues.length} total issues
              </p>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-3 rounded-md bg-muted/50">
                <p className="text-2xl font-bold text-[hsl(var(--risk-high))]">{highIssues}</p>
                <p className="text-xs text-muted-foreground">High Risk</p>
              </div>
              <div className="text-center p-3 rounded-md bg-muted/50">
                <p className="text-2xl font-bold text-[hsl(var(--risk-medium))]">{mediumIssues}</p>
                <p className="text-xs text-muted-foreground">Medium Risk</p>
              </div>
              <div className="text-center p-3 rounded-md bg-muted/50">
                <p className="text-2xl font-bold text-[hsl(var(--risk-low))]">{compliantCount}</p>
                <p className="text-xs text-muted-foreground">Compliant</p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Why compliance matters */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="rounded-lg border border-[hsl(var(--risk-medium)/0.3)] bg-[hsl(var(--risk-medium-bg))] p-5"
      >
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-[hsl(var(--risk-medium))] mt-0.5 shrink-0" />
          <div className="space-y-2">
            <p className="font-semibold text-sm">Why compliance matters</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
              <div className="flex items-start gap-2">
                <Store className="h-4 w-4 text-[hsl(var(--risk-high))] mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium text-foreground">Retailer Rejection</p>
                  <p className="text-xs text-muted-foreground">Non-compliant labels get rejected at shelf review, costing weeks of delay</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Ban className="h-4 w-4 text-[hsl(var(--risk-high))] mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium text-foreground">Regulatory Fines</p>
                  <p className="text-xs text-muted-foreground">Missing declarations can result in product recalls and regulatory penalties</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <FileWarning className="h-4 w-4 text-[hsl(var(--risk-medium))] mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium text-foreground">Costly Reprints</p>
                  <p className="text-xs text-muted-foreground">Catching issues late means reprinting entire packaging runs</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Product compliance list */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="rounded-lg border bg-card">
        <div className="p-4 border-b">
          <h2 className="text-base font-semibold">Product Compliance Scores</h2>
        </div>
        <div className="divide-y">
          {mockProducts.map((product) => (
            <div key={product.id} className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-4">
                <ComplianceScoreBadge score={product.complianceScore} />
                <div className="flex-1 min-w-0">
                  <p className="font-medium">{product.name}</p>
                  <p className="text-xs text-muted-foreground font-mono">{product.sku}</p>
                  <div className="mt-1.5 w-32">
                    <Progress value={product.complianceScore} className="h-1.5 bg-muted" />
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {product.issues.length > 0 && (
                  <span className="text-xs text-muted-foreground">{product.issues.length} issue{product.issues.length !== 1 ? "s" : ""}</span>
                )}
                <RiskBadge level={product.riskLevel} />
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Issues list */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="rounded-lg border bg-card">
        <div className="p-4 border-b">
          <h2 className="text-base font-semibold">All Detected Issues</h2>
        </div>
        <div className="divide-y">
          {allIssues.map((issue) => (
            <div key={issue.id} className="p-4 space-y-2">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <XCircle className={`h-4 w-4 mt-0.5 shrink-0 ${
                    issue.severity === "high" ? "text-[hsl(var(--risk-high))]" : issue.severity === "medium" ? "text-[hsl(var(--risk-medium))]" : "text-[hsl(var(--risk-low))]"
                  }`} />
                  <div>
                    <p className="font-medium text-sm">{issue.description}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {issue.productName} · {issue.type}
                    </p>
                  </div>
                </div>
                <RiskBadge level={issue.severity} />
              </div>
              <div className="ml-7 space-y-1">
                <p className="text-xs text-muted-foreground">
                  <span className="font-medium">Regulation:</span> {issue.regulation}
                </p>
                <p className="text-xs text-[hsl(var(--success))]">
                  <span className="font-medium">Fix:</span> {issue.recommendation}
                </p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default ComplianceDashboard;
