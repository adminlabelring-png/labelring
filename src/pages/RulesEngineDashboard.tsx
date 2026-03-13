import { motion } from "framer-motion";
import { complianceRules } from "@/lib/mock-data";
import RiskBadge from "@/components/RiskBadge";

const RulesEngineDashboard = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Compliance Rules Engine</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Library of regulatory rules for UK skincare products
        </p>
      </div>

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="rounded-lg border bg-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left">
              <th className="px-4 py-3 font-medium text-muted-foreground">Rule</th>
              <th className="px-4 py-3 font-medium text-muted-foreground">Category</th>
              <th className="px-4 py-3 font-medium text-muted-foreground">Severity</th>
              <th className="px-4 py-3 font-medium text-muted-foreground">Status</th>
            </tr>
          </thead>
          <tbody>
            {complianceRules.map((rule) => (
              <tr key={rule.id} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                <td className="px-4 py-3 font-medium">{rule.name}</td>
                <td className="px-4 py-3 text-muted-foreground">{rule.category}</td>
                <td className="px-4 py-3"><RiskBadge level={rule.severity as "low" | "medium" | "high"} /></td>
                <td className="px-4 py-3">
                  <span className="compliance-badge-high rounded-full px-2.5 py-0.5 text-xs font-medium capitalize">{rule.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </motion.div>
    </div>
  );
};

export default RulesEngineDashboard;
