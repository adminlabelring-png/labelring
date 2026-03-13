import { motion } from "framer-motion";
import { ShieldCheck, AlertTriangle, XCircle } from "lucide-react";
import { mockProducts } from "@/lib/mock-data";
import ComplianceScoreBadge from "@/components/ComplianceScoreBadge";
import RiskBadge from "@/components/RiskBadge";

const allIssues = mockProducts.flatMap((p) =>
  p.issues.map((issue) => ({ ...issue, productName: p.name, productSku: p.sku }))
);

const ComplianceDashboard = () => {
  const avgScore = Math.round(
    mockProducts.reduce((sum, p) => sum + p.complianceScore, 0) / mockProducts.length
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Compliance Overview</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Review compliance status and detected issues across all products
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="rounded-lg border bg-card p-5">
          <div className="flex items-center gap-4">
            <ComplianceScoreBadge score={avgScore} size="lg" />
            <div>
              <p className="text-sm text-muted-foreground">Average Score</p>
              <p className="text-lg font-semibold">Across {mockProducts.length} products</p>
            </div>
          </div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="rounded-lg border bg-card p-5">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-full bg-risk-high-bg flex items-center justify-center">
              <AlertTriangle className="h-6 w-6 text-risk-high" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">High Risk Issues</p>
              <p className="text-lg font-semibold">{allIssues.filter((i) => i.severity === "high").length} detected</p>
            </div>
          </div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="rounded-lg border bg-card p-5">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-full bg-risk-low-bg flex items-center justify-center">
              <ShieldCheck className="h-6 w-6 text-risk-low" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Fully Compliant</p>
              <p className="text-lg font-semibold">{mockProducts.filter((p) => p.issues.length === 0).length} products</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Product compliance list */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="rounded-lg border bg-card">
        <div className="p-4 border-b">
          <h2 className="text-base font-semibold">Product Compliance Scores</h2>
        </div>
        <div className="divide-y">
          {mockProducts.map((product) => (
            <div key={product.id} className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-4">
                <ComplianceScoreBadge score={product.complianceScore} />
                <div>
                  <p className="font-medium">{product.name}</p>
                  <p className="text-xs text-muted-foreground font-mono">{product.sku}</p>
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
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="rounded-lg border bg-card">
        <div className="p-4 border-b">
          <h2 className="text-base font-semibold">All Detected Issues</h2>
        </div>
        <div className="divide-y">
          {allIssues.map((issue) => (
            <div key={issue.id} className="p-4 space-y-2">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <XCircle className={`h-4 w-4 mt-0.5 shrink-0 ${
                    issue.severity === "high" ? "text-risk-high" : issue.severity === "medium" ? "text-risk-medium" : "text-risk-low"
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
                <p className="text-xs text-success">
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
