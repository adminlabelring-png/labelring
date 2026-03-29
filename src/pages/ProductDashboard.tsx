import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Package, AlertTriangle, CheckCircle, Clock, ArrowRight } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { mockProducts } from "@/lib/mock-data";
import ComplianceScoreBadge from "@/components/ComplianceScoreBadge";
import RiskBadge from "@/components/RiskBadge";
import StatusBadge from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import {
  getSessionScanResults,
  subscribeToSessionScanResults,
  type SessionScanResult,
} from "@/lib/session-store";

type DashboardRow = {
  id: string;
  name: string;
  sku: string;
  category: string;
  approvalStatus: "approved" | "pending" | "rejected";
  complianceScore: number;
  riskLevel: "low" | "medium" | "high";
  issueCount: number;
  lastUpdated: string;
  recentlyScanned: boolean;
  scannedMarket?: SessionScanResult["market"];
};

const getRiskLevelFromScore = (score: number): DashboardRow["riskLevel"] => {
  if (score >= 85) return "low";
  if (score >= 60) return "medium";
  return "high";
};

const formatScanDate = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });

const ProductDashboard = () => {
  const navigate = useNavigate();
  const [sessionScans, setSessionScans] = useState(() => getSessionScanResults());

  useEffect(() => {
    const unsubscribe = subscribeToSessionScanResults(() => {
      setSessionScans(getSessionScanResults());
    });
    return unsubscribe;
  }, []);

  const rows = useMemo<DashboardRow[]>(() => {
    const merged = new Map(
      mockProducts.map((product) => [
        product.name.toLowerCase(),
        {
          id: product.id,
          name: product.name,
          sku: product.sku,
          category: product.category,
          approvalStatus: product.approvalStatus,
          complianceScore: product.complianceScore,
          riskLevel: product.riskLevel,
          issueCount: product.issues.length,
          lastUpdated: product.lastUpdated,
          recentlyScanned: false,
        } as DashboardRow,
      ]),
    );

    sessionScans.forEach((scan, index) => {
      const key = scan.productName.toLowerCase();
      const existing = merged.get(key);
      if (existing) {
        merged.set(key, {
          ...existing,
          complianceScore: scan.score,
          riskLevel: getRiskLevelFromScore(scan.score),
          issueCount: scan.issueCount,
          lastUpdated: formatScanDate(scan.scannedAt),
          approvalStatus: "pending",
          recentlyScanned: true,
          scannedMarket: scan.market,
        });
        return;
      }

      merged.set(key, {
        id: scan.id,
        name: scan.productName,
        sku: `SESSION-${String(index + 1).padStart(3, "0")}`,
        category: "Recently Uploaded",
        approvalStatus: "pending",
        complianceScore: scan.score,
        riskLevel: getRiskLevelFromScore(scan.score),
        issueCount: scan.issueCount,
        lastUpdated: formatScanDate(scan.scannedAt),
        recentlyScanned: true,
        scannedMarket: scan.market,
      });
    });

    return Array.from(merged.values());
  }, [sessionScans]);

  const stats = [
    {
      label: "Total Products",
      value: rows.length,
      icon: Package,
      color: "text-primary",
    },
    {
      label: "Compliant",
      value: rows.filter((p) => p.complianceScore >= 85).length,
      icon: CheckCircle,
      color: "text-success",
    },
    {
      label: "Issues Found",
      value: rows.reduce((sum, p) => sum + p.issueCount, 0),
      icon: AlertTriangle,
      color: "text-warning",
    },
    {
      label: "Pending Review",
      value: rows.filter((p) => p.approvalStatus === "pending").length,
      icon: Clock,
      color: "text-muted-foreground",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Products</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Track compliance status across all your products. Upload a new label to see it scored instantly.
          </p>
        </div>
        <Link to="/upload">
          <Button className="gap-2">
            <Package className="h-4 w-4" />
            Check a Label
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="rounded-lg border bg-card p-4"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{stat.label}</span>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </div>
            <p className="mt-2 text-2xl font-semibold">{stat.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Table */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="rounded-lg border bg-card"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="px-4 py-3 font-medium text-muted-foreground">Product</th>
                <th className="px-4 py-3 font-medium text-muted-foreground">SKU</th>
                <th className="px-4 py-3 font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-3 font-medium text-muted-foreground">Compliance</th>
                <th className="px-4 py-3 font-medium text-muted-foreground">Risk</th>
                <th className="px-4 py-3 font-medium text-muted-foreground">Issues</th>
                <th className="px-4 py-3 font-medium text-muted-foreground">Updated</th>
                <th className="px-4 py-3 font-medium text-muted-foreground"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((product) => (
                <tr key={product.id} className="border-b last:border-0 hover:bg-muted/50 transition-colors cursor-pointer" onClick={() => navigate('/upload')}>
                  <td className="px-4 py-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{product.name}</p>
                        {product.recentlyScanned && (
                          <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-primary">
                            Recently Scanned
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">{product.category}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{product.sku}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col items-start gap-1">
                      <StatusBadge status={product.approvalStatus} />
                      {product.recentlyScanned && (
                        <span className="text-[11px] text-muted-foreground">
                          Ongoing management ({product.scannedMarket?.toUpperCase()})
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3"><ComplianceScoreBadge score={product.complianceScore} size="sm" /></td>
                  <td className="px-4 py-3"><RiskBadge level={product.riskLevel} /></td>
                  <td className="px-4 py-3">
                    {product.issueCount > 0 ? (
                      <span className="text-warning font-medium">{product.issueCount}</span>
                    ) : (
                      <span className="text-success">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">{product.lastUpdated}</td>
                  <td className="px-4 py-3">
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
};

export default ProductDashboard;
