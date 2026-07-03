import { XCircle, CheckCircle2 } from "lucide-react";

const rows: [string, string][] = [
  [
    "Brand researches requirements across FSA, OPSS, and Trading Standards — no single source of truth.",
    "One dashboard. Every compliance requirement for your category, pre-mapped and kept current as regulations change.",
  ],
  [
    "Product data compiled manually across spreadsheets, supplier emails, and PDF certificates.",
    "Barcode lookup pulls known data from GS1 and Open Food Facts. You fill the gaps, not the whole form.",
  ],
  [
    "Brands discover non-compliance during Trading Standards inspections — or worse, a product recall.",
    "Live compliance score surfaces gaps before your label goes to print or gets pulled off a shelf.",
  ],
  [
    "EPR, DPP, HFSS, ESPR — four regulatory waves hitting simultaneously in 2026. Most brands aren't ready.",
    "Labelring is engineered around 2026 requirements from day one — DPP export, EPR recycling labels, HFSS classification, all built in.",
  ],
];

const ComparisonTable = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 rounded-xl border overflow-hidden">
    <div className="bg-[hsl(var(--risk-high-bg))] px-5 py-3 border-b md:border-b-0 md:border-r">
      <div className="flex items-center gap-2 text-sm font-semibold text-[hsl(var(--risk-high))]">
        <XCircle className="h-4 w-4" /> The current reality
      </div>
    </div>
    <div className="bg-[hsl(var(--risk-low-bg))] px-5 py-3 border-b md:border-b-0">
      <div className="flex items-center gap-2 text-sm font-semibold text-[hsl(var(--risk-low))]">
        <CheckCircle2 className="h-4 w-4" /> With Labelring
      </div>
    </div>
    {rows.map(([reality, us], i) => (
      <div key={i} className="contents">
        <div className={`bg-card px-5 py-4 text-sm text-foreground/80 border-t ${i % 2 ? "md:bg-muted/30" : ""} md:border-r`}>
          {reality}
        </div>
        <div className={`bg-card px-5 py-4 text-sm text-foreground border-t ${i % 2 ? "md:bg-muted/30" : ""}`}>
          {us}
        </div>
      </div>
    ))}
  </div>
);

export default ComparisonTable;
