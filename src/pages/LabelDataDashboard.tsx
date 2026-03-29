import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Wand2, CheckCircle, Download } from "lucide-react";
import { mockLabelData } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";

const fields = [
  { label: "Product Name", value: mockLabelData.productName },
  { label: "Net Quantity", value: mockLabelData.netQuantity },
  { label: "Manufacturer", value: mockLabelData.manufacturer },
  { label: "Country of Origin", value: mockLabelData.countryOfOrigin },
  { label: "Barcode", value: mockLabelData.barcode, mono: true },
  { label: "Storage Instructions", value: mockLabelData.storageInstructions },
  { label: "Use By Format", value: mockLabelData.useByFormat },
];

const issuesFound = [
  { field: "Ingredients", problem: "INCI names not in descending concentration order", fixed: "Reordered by concentration: Rosa Canina Fruit Oil, Simmondsia Chinensis Seed Oil, Tocopherol, Rosmarinus Officinalis Leaf Extract, Linalool, Limonene, Geraniol" },
  { field: "Allergens", problem: "Allergens not bold in ingredient list", fixed: "Allergens highlighted in bold: **Limonene**, **Geraniol**, **Linalool**" },
  { field: "Responsible Person", problem: "UK Responsible Person not listed", fixed: "Added: NaturGlow Ltd, 12 Bloom Street, London EC2A 4NE, United Kingdom" },
];

const LabelDataDashboard = () => {
  const [showFixed, setShowFixed] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateCompliant = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      setShowFixed(true);
    }, 1500);
  };

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

          {/* Issues Found */}
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }} className="rounded-lg border border-[hsl(var(--risk-high)/0.3)] bg-card">
            <div className="p-4 border-b">
              <h2 className="text-base font-semibold">Issues Found ({issuesFound.length})</h2>
            </div>
            <div className="divide-y">
              {issuesFound.map((issue, i) => (
                <div key={i} className="p-4 space-y-1">
                  <p className="text-sm font-medium text-[hsl(var(--risk-high))]">{issue.field}</p>
                  <p className="text-sm text-muted-foreground">{issue.problem}</p>
                </div>
              ))}
            </div>
            <div className="p-4 border-t">
              <Button
                onClick={handleGenerateCompliant}
                disabled={isGenerating || showFixed}
                className="w-full gap-2"
              >
                {isGenerating ? (
                  <>
                    <Wand2 className="h-4 w-4 animate-spin" />
                    Generating compliant version…
                  </>
                ) : showFixed ? (
                  <>
                    <CheckCircle className="h-4 w-4" />
                    Compliant version generated
                  </>
                ) : (
                  <>
                    <Wand2 className="h-4 w-4" />
                    Generate Compliant Version
                  </>
                )}
              </Button>
            </div>
          </motion.div>

          {/* Fixed / Compliant version */}
          <AnimatePresence>
            {showFixed && (
              <motion.div
                initial={{ opacity: 0, y: 12, height: 0 }}
                animate={{ opacity: 1, y: 0, height: "auto" }}
                exit={{ opacity: 0, y: -8 }}
                className="rounded-lg border-2 border-[hsl(var(--risk-low)/0.4)] bg-[hsl(var(--risk-low-bg))] overflow-hidden"
              >
                <div className="p-4 border-b border-[hsl(var(--risk-low)/0.2)]">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-[hsl(var(--risk-low))]" />
                    <h2 className="text-base font-semibold text-[hsl(var(--risk-low))]">Compliant Version</h2>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">All issues have been auto-corrected</p>
                </div>
                <div className="divide-y divide-[hsl(var(--risk-low)/0.15)]">
                  {issuesFound.map((issue, i) => (
                    <div key={i} className="p-4 space-y-1">
                      <p className="text-sm font-medium">{issue.field}</p>
                      <p className="text-xs text-muted-foreground line-through">{issue.problem}</p>
                      <p className="text-sm text-[hsl(var(--risk-low))]">✓ {issue.fixed}</p>
                    </div>
                  ))}
                </div>
                <div className="p-4 border-t border-[hsl(var(--risk-low)/0.2)]">
                  <a href="/compliance-report.pdf" download="Labelring-Compliance-Report.pdf">
                    <Button variant="outline" className="w-full gap-2">
                      <Download className="h-4 w-4" />
                      Download Compliance Report
                    </Button>
                  </a>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Version History */}
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
