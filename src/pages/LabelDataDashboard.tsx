import { motion } from "framer-motion";
import { mockLabelData } from "@/lib/mock-data";

const fields = [
  { label: "Product Name", value: mockLabelData.productName },
  { label: "Net Quantity", value: mockLabelData.netQuantity },
  { label: "Manufacturer", value: mockLabelData.manufacturer },
  { label: "Country of Origin", value: mockLabelData.countryOfOrigin },
  { label: "Barcode", value: mockLabelData.barcode, mono: true },
  { label: "Storage Instructions", value: mockLabelData.storageInstructions },
  { label: "Use By Format", value: mockLabelData.useByFormat },
];

const LabelDataDashboard = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Label Data</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Structured product data extracted from label — {mockLabelData.productName}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Structured Fields */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="rounded-lg border bg-card">
          <div className="p-4 border-b">
            <h2 className="text-base font-semibold">Product Information</h2>
          </div>
          <div className="divide-y">
            {fields.map((field) => (
              <div key={field.label} className="flex items-start justify-between gap-4 p-4">
                <span className="text-sm text-muted-foreground shrink-0">{field.label}</span>
                <span className={`text-sm text-right ${field.mono ? "font-mono" : ""}`}>{field.value}</span>
              </div>
            ))}
          </div>
        </motion.div>

        <div className="space-y-6">
          {/* Ingredients */}
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="rounded-lg border bg-card">
            <div className="p-4 border-b">
              <h2 className="text-base font-semibold">Ingredients (INCI)</h2>
            </div>
            <div className="p-4">
              <p className="text-sm leading-relaxed">{mockLabelData.ingredients}</p>
            </div>
          </motion.div>

          {/* Allergens */}
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="rounded-lg border bg-card">
            <div className="p-4 border-b">
              <h2 className="text-base font-semibold">Allergens</h2>
            </div>
            <div className="p-4 flex flex-wrap gap-2">
              {mockLabelData.allergens.map((allergen) => (
                <span key={allergen} className="compliance-badge-medium rounded-full px-3 py-1 text-xs font-medium">
                  {allergen}
                </span>
              ))}
            </div>
          </motion.div>

          {/* Version History placeholder */}
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="rounded-lg border bg-card">
            <div className="p-4 border-b">
              <h2 className="text-base font-semibold">Version History</h2>
            </div>
            <div className="p-4 space-y-3">
              {[
                { version: "v3.2", date: "2026-03-10", author: "Sarah M.", note: "Updated allergen list" },
                { version: "v3.1", date: "2026-02-28", author: "James K.", note: "Fixed net quantity format" },
                { version: "v3.0", date: "2026-02-15", author: "Sarah M.", note: "Major label redesign" },
              ].map((v) => (
                <div key={v.version} className="flex items-start gap-3">
                  <span className="font-mono text-xs bg-muted px-2 py-0.5 rounded">{v.version}</span>
                  <div>
                    <p className="text-sm">{v.note}</p>
                    <p className="text-xs text-muted-foreground">{v.author} · {v.date}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default LabelDataDashboard;
