import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, AlertTriangle, XCircle, ChevronDown, Wand2, Download, Calendar, ScanLine, RotateCcw, Info, Sparkles, GitCompare, Plus, Minus, Building2, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useScan, DetectedField } from "@/lib/scan-context";
import { generateComplianceReport } from "@/lib/generate-report";

const statusIcon = (status: DetectedField["status"]) => {
  switch (status) {
    case "found": return <CheckCircle className="h-4 w-4 text-[hsl(var(--risk-low))]" />;
    case "needs_review": return <AlertTriangle className="h-4 w-4 text-[hsl(var(--risk-medium))]" />;
    case "not_found": return <XCircle className="h-4 w-4 text-[hsl(var(--risk-high))]" />;
  }
};

const statusLabel = (status: DetectedField["status"]) => {
  switch (status) {
    case "found": return "Found";
    case "needs_review": return "Needs review";
    case "not_found": return "Not visible in uploaded image";
  }
};

const ScanResultsPage = () => {
  const { result, reset } = useScan();
  const navigate = useNavigate();
  const [category, setCategory] = useState(result?.category ?? "Skincare");
  const [showCategorySelect, setShowCategorySelect] = useState(false);
  const [showCompliant, setShowCompliant] = useState(false);
  const [generating, setGenerating] = useState(false);

  if (!result) {
    navigate("/scan", { replace: true });
    return null;
  }

  const foundFields = result.fields.filter(f => f.status === "found");
  const issueFields = result.fields.filter(f => f.status !== "found");
  const isLowInfo = foundFields.length <= 2 || (foundFields.length / result.fields.length) < 0.3;

  const handleGenerate = () => {
    setGenerating(true);
    setTimeout(() => {
      setGenerating(false);
      setShowCompliant(true);
    }, 1500);
  };

  const handleNewScan = () => {
    reset();
    navigate("/scan");
  };

  const categories = ["Skincare", "Food", "Beverage", "Supplements", "Household"];

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-semibold tracking-tight">Label Review</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Results for: {result.fileName}
        </p>
      </motion.div>

      {/* Seasonal risk banner */}
      {result.isSeasonal && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-lg border-2 border-[hsl(var(--risk-medium)/0.5)] bg-[hsl(var(--risk-medium-bg))] p-4 flex gap-3"
        >
          <Sparkles className="h-5 w-5 text-[hsl(var(--risk-medium))] shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-[hsl(var(--risk-medium))]">
              Seasonal Risk Mode applied{result.seasonTag ? ` · ${result.seasonTag}` : ""}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Stricter checks were applied for promo claims, batch/lot codes, date markings, allergen carry-over, and net-quantity changes — common failure points for limited-run SKUs.
            </p>
          </div>
        </motion.div>
      )}

      {/* Supplier & Spec Change Detection */}
      {result.changes && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.04 }}
          className={`rounded-lg border-2 p-4 space-y-3 ${
            result.changes.hasAnyChange
              ? "border-[hsl(var(--risk-high)/0.4)] bg-[hsl(var(--risk-high-bg))]"
              : "border-[hsl(var(--risk-low)/0.4)] bg-[hsl(var(--risk-low-bg))]"
          }`}
        >
          <div className="flex items-start gap-3">
            <GitCompare className={`h-5 w-5 shrink-0 mt-0.5 ${result.changes.hasAnyChange ? "text-[hsl(var(--risk-high))]" : "text-[hsl(var(--risk-low))]"}`} />
            <div className="flex-1">
              <p className="text-sm font-semibold">
                {result.changes.hasAnyChange ? "Supplier / spec changes detected" : "No changes vs previous scan"}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Compared against scan from {new Date(result.changes.comparedToDate).toLocaleDateString()}
              </p>
            </div>
          </div>

          {result.changes.hasAnyChange && (
            <div className="space-y-2 pl-8">
              {result.changes.ingredientsAdded.length > 0 && (
                <div className="text-xs">
                  <span className="inline-flex items-center gap-1 font-medium text-[hsl(var(--risk-high))]">
                    <Plus className="h-3 w-3" /> Ingredients added:
                  </span>{" "}
                  <span className="text-muted-foreground">{result.changes.ingredientsAdded.join(", ")}</span>
                </div>
              )}
              {result.changes.ingredientsRemoved.length > 0 && (
                <div className="text-xs">
                  <span className="inline-flex items-center gap-1 font-medium text-[hsl(var(--risk-medium))]">
                    <Minus className="h-3 w-3" /> Ingredients removed:
                  </span>{" "}
                  <span className="text-muted-foreground">{result.changes.ingredientsRemoved.join(", ")}</span>
                </div>
              )}
              {(result.changes.allergensAdded.length > 0 || result.changes.allergensRemoved.length > 0) && (
                <div className="text-xs">
                  <span className="font-medium text-[hsl(var(--risk-high))]">⚠ Allergen change:</span>{" "}
                  {result.changes.allergensAdded.length > 0 && (
                    <span className="text-muted-foreground">added {result.changes.allergensAdded.join(", ")} </span>
                  )}
                  {result.changes.allergensRemoved.length > 0 && (
                    <span className="text-muted-foreground">removed {result.changes.allergensRemoved.join(", ")}</span>
                  )}
                </div>
              )}
              {result.changes.manufacturerChanged && (
                <div className="text-xs">
                  <span className="inline-flex items-center gap-1 font-medium text-[hsl(var(--risk-high))]">
                    <Building2 className="h-3 w-3" /> Manufacturer / RP changed:
                  </span>{" "}
                  <span className="text-muted-foreground">
                    {result.changes.manufacturerChanged.from ?? "—"} → {result.changes.manufacturerChanged.to ?? "—"}
                  </span>
                </div>
              )}
              {result.changes.originChanged && (
                <div className="text-xs">
                  <span className="inline-flex items-center gap-1 font-medium text-[hsl(var(--risk-medium))]">
                    <Globe className="h-3 w-3" /> Country of origin changed:
                  </span>{" "}
                  <span className="text-muted-foreground">
                    {result.changes.originChanged.from ?? "—"} → {result.changes.originChanged.to ?? "—"}
                  </span>
                </div>
              )}
              <p className="text-xs text-muted-foreground italic pt-1">
                Supplier or spec changes often don't make it onto the label — please verify before printing.
              </p>
            </div>
          )}
        </motion.div>
      )}

      {result.changes === null && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.04 }}
          className="rounded-lg border bg-card p-3 flex gap-3 items-start"
        >
          <GitCompare className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground">
            <strong className="text-foreground">Baseline saved.</strong> Future scans of this product will be automatically compared to detect supplier or ingredient changes.
          </p>
        </motion.div>
      )}

      {/* Low-info warning */}
      {isLowInfo && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.03 }}
          className="rounded-lg border border-[hsl(var(--risk-medium)/0.4)] bg-[hsl(var(--risk-medium-bg))] p-4 flex gap-3"
        >
          <Info className="h-5 w-5 text-[hsl(var(--risk-medium))] shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium">Limited information detected</p>
            <p className="text-xs text-muted-foreground mt-1">
              This may be due to incomplete label visibility or a front-of-pack image. Try uploading the outer packaging or back-of-pack for better results.
            </p>
          </div>
        </motion.div>
      )}

      {/* Category detection */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="rounded-lg border bg-card p-4"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ScanLine className="h-5 w-5 text-primary" />
            <span className="text-sm">
              We think this is: <strong>{category}</strong>
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowCategorySelect(!showCategorySelect)}
            className="gap-1"
          >
            Change <ChevronDown className="h-3 w-3" />
          </Button>
        </div>
        <AnimatePresence>
          {showCategorySelect && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t">
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => { setCategory(cat); setShowCategorySelect(false); }}
                    className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                      cat === category
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-secondary-foreground hover:bg-accent"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Summary */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 gap-4"
      >
        <div className="rounded-lg border bg-card p-5 text-center">
          <p className="text-3xl font-bold text-[hsl(var(--risk-low))]">{result.foundCount}</p>
          <p className="text-sm text-muted-foreground mt-1">of {result.totalCount} key fields found</p>
        </div>
        <div className="rounded-lg border bg-card p-5 text-center">
          <p className="text-3xl font-bold text-[hsl(var(--risk-high))]">{result.needsAttentionCount}</p>
          <p className="text-sm text-muted-foreground mt-1">items need attention</p>
        </div>
      </motion.div>

      {/* Detected Information */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="rounded-lg border bg-card"
      >
        <div className="p-4 border-b">
          <h2 className="text-base font-semibold">Detected Information</h2>
        </div>
        <div className="divide-y">
          {foundFields.map((field) => (
            <div key={field.label} className="flex items-start gap-3 p-4">
              {statusIcon(field.status)}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{field.label}</p>
                <p className="text-sm text-muted-foreground mt-0.5 break-words">{field.value}</p>
              </div>
              <span className="compliance-badge-high rounded-full px-2.5 py-0.5 text-xs font-medium shrink-0">
                {statusLabel(field.status)}
              </span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Needs Review / Not Detected */}
      {issueFields.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-lg border border-[hsl(var(--risk-high)/0.3)] bg-card"
        >
          <div className="p-4 border-b">
            <h2 className="text-base font-semibold">Needs Review / Not Found on This Label</h2>
          </div>
          <div className="divide-y">
            {issueFields.map((field) => (
              <div key={field.label} className="flex items-start gap-3 p-4">
                {statusIcon(field.status)}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{field.label}</p>
                  {field.value ? (
                    <p className="text-sm text-muted-foreground mt-0.5">{field.value}</p>
                  ) : (
                    <p className="text-sm text-muted-foreground mt-0.5 italic">Not found on this label</p>
                  )}
                </div>
                <span className={`${field.status === "not_found" ? "compliance-badge-low" : "compliance-badge-medium"} rounded-full px-2.5 py-0.5 text-xs font-medium shrink-0`}>
                  {statusLabel(field.status)}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Actions */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="rounded-lg border bg-card p-4 space-y-3"
      >
        <h2 className="text-base font-semibold">Actions</h2>
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            onClick={handleGenerate}
            disabled={generating || showCompliant}
            className="flex-1 gap-2"
          >
            {generating ? (
              <><Wand2 className="h-4 w-4 animate-spin" /> Generating…</>
            ) : showCompliant ? (
              <><CheckCircle className="h-4 w-4" /> Compliant version ready</>
            ) : (
              <><Wand2 className="h-4 w-4" /> Generate compliant version</>
            )}
          </Button>
          <Button variant="outline" className="w-full gap-2" onClick={() => generateComplianceReport(result)}>
              <Download className="h-4 w-4" /> Download report
          </Button>
          <Button variant="outline" className="gap-2">
            <Calendar className="h-4 w-4" /> Book a review call
          </Button>
        </div>
      </motion.div>

      {/* Compliant version */}
      <AnimatePresence>
        {showCompliant && (
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
              <p className="text-xs text-muted-foreground mt-1">Suggested corrections for missing or unclear fields</p>
            </div>
            <div className="divide-y divide-[hsl(var(--risk-low)/0.15)]">
              {issueFields.map((field) => (
                <div key={field.label} className="p-4 space-y-1">
                  <p className="text-sm font-medium">{field.label}</p>
                  <p className="text-xs text-muted-foreground line-through">
                    {field.status === "not_found" ? "Not found on this label" : "Unclear / needs review"}
                  </p>
                  <p className="text-sm text-[hsl(var(--risk-low))]">
                    ✓ {field.suggestedFix
                      ? field.suggestedFix
                      : field.label === "Manufacturer / Responsible Person"
                      ? "Add: NaturGlow Ltd, 12 Bloom Street, London EC2A 4NE"
                      : field.label === "Expiry / Best Before"
                      ? "Add: Best before see base of bottle, format DD/MM/YYYY"
                      : "Add: Store in a cool, dry place away from direct sunlight"}
                  </p>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Scan again */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="text-center"
      >
        <Button variant="ghost" onClick={handleNewScan} className="gap-2">
          <RotateCcw className="h-4 w-4" /> Scan another label
        </Button>
      </motion.div>

      {/* Disclaimer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.35 }}
        className="rounded-lg bg-muted p-4"
      >
        <p className="text-xs text-muted-foreground text-center">
          This is an automated label review to help identify missing or unclear information. Some products don't display full information on the primary packaging. For best results, upload outer packaging or back-of-pack. Final compliance should be verified against official guidelines.
        </p>
      </motion.div>

      {/* CTA */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="rounded-xl border-2 border-primary/20 bg-primary/5 p-8 text-center space-y-4"
      >
        <Calendar className="h-8 w-8 text-primary mx-auto" />
        <h2 className="text-xl font-bold">Want a free label review?</h2>
        <p className="text-muted-foreground max-w-md mx-auto">
          Our experts will review your labels and help you get retail-ready — no obligation.
        </p>
        <Button size="lg" className="gap-2">
          <Calendar className="h-4 w-4" /> Book a Call
        </Button>
      </motion.div>
    </div>
  );
};

export default ScanResultsPage;
