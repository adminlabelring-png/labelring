import { motion } from "framer-motion";
import { Package, AlertTriangle, CheckCircle, Clock, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { mockProducts } from "@/lib/mock-data";
import ComplianceScoreBadge from "@/components/ComplianceScoreBadge";
import RiskBadge from "@/components/RiskBadge";
import StatusBadge from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";

const stats = [
  {
    label: "Total Products",
    value: mockProducts.length,
    icon: Package,
    color: "text-primary",
  },
  {
    label: "Compliant",
    value: mockProducts.filter((p) => p.complianceScore >= 85).length,
    icon: CheckCircle,
    color: "text-success",
  },
  {
    label: "Issues Found",
    value: mockProducts.reduce((sum, p) => sum + p.issues.length, 0),
    icon: AlertTriangle,
    color: "text-warning",
  },
  {
    label: "Pending Review",
    value: mockProducts.filter((p) => p.approvalStatus === "pending").length,
    icon: Clock,
    color: "text-muted-foreground",
  },
];

const ProductDashboard = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Products</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your product labels and make them retail-ready
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
              {mockProducts.map((product) => (
                <tr key={product.id} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium">{product.name}</p>
                      <p className="text-xs text-muted-foreground">{product.category}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{product.sku}</td>
                  <td className="px-4 py-3"><StatusBadge status={product.approvalStatus} /></td>
                  <td className="px-4 py-3"><ComplianceScoreBadge score={product.complianceScore} size="sm" /></td>
                  <td className="px-4 py-3"><RiskBadge level={product.riskLevel} /></td>
                  <td className="px-4 py-3">
                    {product.issues.length > 0 ? (
                      <span className="text-warning font-medium">{product.issues.length}</span>
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
