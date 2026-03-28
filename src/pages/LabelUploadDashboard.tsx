import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload,
  FileText,
  CheckCircle,
  AlertTriangle,
  Loader2,
  Download,
  Sparkles,
  XCircle,
  Calendar,
  Globe,
  ShieldAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/sonner";
import { appendSessionScanResult } from "@/lib/session-store";

type ScanStep = "idle" | "uploading" | "extracting" | "scanning" | "complete" | "compliant-version";
type Market = "uk" | "eu" | "aus";
type ProgressState = "pending" | "active" | "done";
type ScanResultStatus = "pass" | "warning" | "fail";
type ScanResult = {
  status: ScanResultStatus;
  text: string;
  fix: string | null;
  risk?: string;
};

type ProcessingStepStatus = {
  upload: ProgressState;
  extract: ProgressState;
  scan: ProgressState;
};

const marketLabels: Record<Market, string> = {
  uk: "🇬🇧 United Kingdom",
  eu: "🇪🇺 European Union",
  aus: "🇦🇺 Australia",
};

const processingStepMap: Record<ScanStep, ProcessingStepStatus> = {
  idle: { upload: "pending", extract: "pending", scan: "pending" },
  uploading: { upload: "active", extract: "pending", scan: "pending" },
  extracting: { upload: "done", extract: "active", scan: "pending" },
  scanning: { upload: "done", extract: "done", scan: "active" },
  complete: { upload: "done", extract: "done", scan: "done" },
  "compliant-version": { upload: "done", extract: "done", scan: "done" },
};

const mockExtractedText = `Product Name: Vitamin C Brightening Serum
Ingredients: Aqua, Ascorbic Acid, Glycerin, Niacinamide, Hyaluronic Acid, Tocopherol, Phenoxyethanol, Parfum, Linalool, Limonene
Net Contents: 30ml
Manufacturer: NaturGlow Ltd, 42 Innovation Drive, London, EC2A 4BQ
Directions: Apply 2-3 drops to cleansed face morning and evening.
Warnings: For external use only. Avoid contact with eyes.
Batch: NG-VC-2026-03
Best Before: See base of bottle`;

const scanResultsByMarket: Record<Market, ScanResult[]> = {
  uk: [
    { status: "pass", text: "INCI ingredient listing present", fix: null },
    { status: "pass", text: "Net quantity declared", fix: null },
    { status: "pass", text: "Manufacturer details present", fix: null },
    {
      status: "warning",
      text: "'Anti-aging' claim detected — requires substantiation",
      fix: "Rephrase to 'helps reduce appearance of fine lines' or provide clinical evidence",
      risk: "UK retailers may reject unsupported efficacy claims under CAP guidance",
    },
    {
      status: "fail",
      text: "Linalool listed in parfum but not declared as individual allergen",
      fix: "Add Linalool as a separate entry in the ingredients list per Annex III allergen rules",
      risk: "Non-compliance with allergen rules can trigger withdrawal requests and recall action",
    },
    { status: "pass", text: "Batch code present", fix: null },
    {
      status: "warning",
      text: "UK Responsible Person not separately identified",
      fix: "Add UK Responsible Person name and UK address on label (post-Brexit requirement)",
      risk: "Product cannot be legally sold in Great Britain without a designated UK Responsible Person",
    },
  ],
  eu: [
    { status: "pass", text: "INCI ingredient listing present", fix: null },
    { status: "pass", text: "Net quantity declared", fix: null },
    { status: "pass", text: "Manufacturer details present", fix: null },
    {
      status: "warning",
      text: "Claims language may imply medicinal effect",
      fix: "Rephrase to cosmetic-only performance claims and keep supporting evidence in PIF",
      risk: "Authorities can require claim withdrawal across EU member states for misleading wording",
    },
    {
      status: "fail",
      text: "EU Responsible Person not identified",
      fix: "Add EU Responsible Person name and EU address as required by Regulation (EC) No 1223/2009",
      risk: "Without an EU Responsible Person, the product may be blocked from EU distribution",
    },
    { status: "pass", text: "Batch code present", fix: null },
    {
      status: "warning",
      text: "PAO symbol missing for 30 ml leave-on serum",
      fix: "Add PAO symbol (e.g., 12M) near durability information",
      risk: "Missing mandatory symbols may lead to retailer non-acceptance during compliance onboarding",
    },
  ],
  aus: [
    { status: "pass", text: "INCI ingredient listing present", fix: null },
    { status: "pass", text: "Net quantity declared", fix: null },
    { status: "pass", text: "Manufacturer details present", fix: null },
    {
      status: "warning",
      text: "Marketing claim 'anti-aging' may be interpreted as therapeutic",
      fix: "Use cosmetic claim wording such as 'improves the look of skin texture'",
      risk: "Therapeutic-style claims can invite TGA scrutiny and delay product launch",
    },
    {
      status: "fail",
      text: "AUST L/AUST R medicine statement not verified for current claims profile",
      fix: "Remove therapeutic positioning or register/list with TGA before using medicine-style claims",
      risk: "Potential enforcement action for advertising an unapproved therapeutic good",
    },
    { status: "pass", text: "Batch code present", fix: null },
    {
      status: "warning",
      text: "Australian sponsor contact not shown",
      fix: "Add Australian sponsor name and physical Australian address for market traceability",
      risk: "Retailers may reject supply without a local Australian sponsor contact",
    },
  ],
};

const scoreByMarket: Record<Market, number> = {
  uk: 64,
  eu: 71,
  aus: 58,
};

const compliantVersionByMarket: Record<Market, string> = {
  uk: `Product Name: Vitamin C Brightening Serum

Ingredients (INCI): Aqua, Ascorbic Acid, Glycerin, Niacinamide, Hyaluronic Acid, Tocopherol, Phenoxyethanol, Parfum, Linalool*, Limonene*
*Allergens declared individually per Annex III allergen requirements

Net Contents: 30 ml e

Manufacturer: NaturGlow Ltd, 42 Innovation Drive, London, EC2A 4BQ
UK Responsible Person: NaturGlow UK Ltd, 14 Bishopsgate, London, EC2N 3AR

Directions: Apply 2-3 drops to cleansed face morning and evening.
Warnings: For external use only. Avoid contact with eyes.

Claims: Helps reduce the appearance of fine lines (rephrased)

Batch: NG-VC-2026-03
Best Before: See base of bottle
PAO: 12M ⏳`,
  eu: `Product Name: Vitamin C Brightening Serum

Ingredients (INCI): Aqua, Ascorbic Acid, Glycerin, Niacinamide, Hyaluronic Acid, Tocopherol, Phenoxyethanol, Parfum, Linalool*, Limonene*
*Allergens declared individually per Regulation (EC) No 1223/2009 Annex III

Net Contents: 30 ml e

Manufacturer: NaturGlow Ltd, 42 Innovation Drive, London, EC2A 4BQ
EU Responsible Person: NaturGlow Europe GmbH, Friedrichstraße 68, 10117 Berlin, Germany

Directions: Apply 2-3 drops to cleansed face morning and evening.
Warnings: For external use only. Avoid contact with eyes.

Claims: Helps improve skin radiance and the appearance of fine lines

Batch: NG-VC-2026-03
Best Before: See base of bottle
PAO: 12M ⏳`,
  aus: `Product Name: Vitamin C Brightening Serum

Ingredients (INCI): Aqua, Ascorbic Acid, Glycerin, Niacinamide, Hyaluronic Acid, Tocopherol, Phenoxyethanol, Parfum, Linalool, Limonene

Net Contents: 30 ml

Manufacturer: NaturGlow Ltd, 42 Innovation Drive, London, EC2A 4BQ
Australian Sponsor: NaturGlow ANZ Pty Ltd, 120 Collins Street, Melbourne VIC 3000

Directions: Apply 2-3 drops to cleansed face morning and evening.
Warnings: For external use only. Avoid contact with eyes.

Claims: Helps improve the appearance of brighter, smoother-looking skin
Regulatory Note: No therapeutic claims made (not an AUST L/AUST R listed medicine)

Batch: NG-VC-2026-03
Best Before: See base of bottle
PAO: 12M ⏳`,
};

const LabelUploadDashboard = () => {
  const [step, setStep] = useState<ScanStep>("idle");
  const [dragActive, setDragActive] = useState(false);
  const [market, setMarket] = useState<Market>("uk");
  const [generatedAt, setGeneratedAt] = useState<string | null>(null);

  const mockScanResults = scanResultsByMarket[market];
  const complianceScore = scoreByMarket[market];
  const mockCompliantVersion = compliantVersionByMarket[market];
  const passCount = mockScanResults.filter((r) => r.status === "pass").length;
  const warnCount = mockScanResults.filter((r) => r.status === "warning").length;
  const failCount = mockScanResults.filter((r) => r.status === "fail").length;
  const marketRiskTextByMarket: Record<Market, string> = {
    uk: "Unresolved UK issues may lead to retailer delisting or MHRA/Trading Standards escalation, especially where UK Responsible Person details are missing.",
    eu: "Unresolved EU issues can block placement on the EU market and trigger competent authority actions, particularly if no EU Responsible Person is listed.",
    aus: "Unresolved AU issues may cause retailer rejection and potential TGA follow-up where therapeutic-style claims appear without proper registration.",
  };
  const productName = "Vitamin C Brightening Serum";

  const simulateScan = () => {
    setStep("uploading");
    setTimeout(() => setStep("extracting"), 1200);
    setTimeout(() => setStep("scanning"), 3000);
    setTimeout(() => {
      setStep("complete");
      appendSessionScanResult({
        productName,
        market,
        score: complianceScore,
        issueCount: warnCount + failCount,
      });
    }, 4500);
  };

  const formatDateForFilename = (date: Date) => date.toISOString().slice(0, 10);
  const formatTimestamp = (date: Date) =>
    date.toLocaleString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      year: "numeric",
      month: "short",
      day: "numeric",
    });

  const changelogByMarket: Record<Market, string[]> = {
    uk: [
      "Declared fragrance allergens (Linalool/Limonene) separately",
      "Added UK Responsible Person details",
      "Rephrased efficacy claim to avoid unsupported medicinal framing",
    ],
    eu: [
      "Added EU Responsible Person details",
      "Adjusted claims to cosmetic-only language",
      "Included PAO metadata and allergen clarification",
    ],
    aus: [
      "Added Australian sponsor contact details",
      "Removed therapeutic-style positioning",
      "Added market-safe claims and PAO metadata",
    ],
  };

  const handleGenerateCompliantVersion = () => {
    const now = new Date();
    setGeneratedAt(formatTimestamp(now));
    setStep("compliant-version");
    toast.success("Compliant version generated", {
      description: `Mocked ${market.toUpperCase()} update created at ${formatTimestamp(now)}`,
    });
  };

  const handleDownloadReport = () => {
    const now = new Date();
    const issues = mockScanResults
      .filter((result) => result.status !== "pass")
      .map((result) => ({
        severity: result.status,
        issue: result.text,
        fix: result.fix,
        risk: result.risk ?? null,
      }));
    const payload = {
      score: complianceScore,
      issues,
      suggestedFixes: issues.map((issue) => issue.fix).filter(Boolean),
      market,
      timestamp: now.toISOString(),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const filename = `label-compliance-report-${market}-${formatDateForFilename(now)}.txt`;
    const downloadUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(downloadUrl);

    toast.success("Report downloaded", {
      description: `Saved mocked report as ${filename}`,
    });
  };

  const reset = () => {
    setGeneratedAt(null);
    setStep("idle");
  };
  const progressSteps = processingStepMap[step];
  const processingPhaseText =
    step === "uploading"
      ? "Uploading label..."
      : step === "extracting"
        ? "Extracting text with OCR..."
        : `Running ${marketLabels[market]} compliance checks...`;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Make Your Product Retail-Ready
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Upload a label image or PDF — we'll extract the data, check compliance, and show you exactly what to fix
        </p>
      </div>

      {/* Market selector */}
      <div className="flex items-center gap-3">
        <Globe className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Target market:</span>
        <div className="flex gap-2">
          {(Object.keys(marketLabels) as Market[]).map((m) => (
            <button
              key={m}
              onClick={() => setMarket(m)}
              className={`px-3 py-1.5 text-sm rounded-md border transition-colors ${
                market === m
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card text-foreground border-border hover:bg-accent"
              }`}
            >
              {marketLabels[m]}
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {/* Upload zone */}
        {step === "idle" && (
          <motion.div
            key="upload"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className={`rounded-lg border-2 border-dashed p-12 text-center transition-colors ${
              dragActive ? "border-primary bg-primary/5" : "border-border"
            }`}
            onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
            onDragLeave={() => setDragActive(false)}
            onDrop={(e) => { e.preventDefault(); setDragActive(false); simulateScan(); }}
          >
            <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-4" />
            <p className="text-base font-medium">Drop your label file here</p>
            <p className="text-sm text-muted-foreground mt-1 mb-4">
              Supports PNG, JPG, PDF — max 10 MB
            </p>
            <Button onClick={simulateScan}>Select File</Button>
          </motion.div>
        )}

        {/* Processing steps */}
        {(step === "uploading" || step === "extracting" || step === "scanning") && (
          <motion.div
            key="processing"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="rounded-lg border bg-card p-8"
          >
            <div className="flex items-center gap-6">
              <Loader2 className="h-8 w-8 text-primary animate-spin shrink-0" />
              <div className="flex-1">
                <p className="text-base font-medium">{processingPhaseText}</p>
                <p className="text-sm text-muted-foreground mt-1">This takes a few seconds</p>
                <p className="sr-only" aria-live="polite">
                  Processing phase: {processingPhaseText}
                </p>
              </div>
            </div>

            {/* Progress steps */}
            <div className="mt-6 flex gap-4">
              {[
                { key: "upload", label: "Upload" },
                { key: "extract", label: "Extract" },
                { key: "scan", label: "Scan" },
              ].map((s) => {
                const state = progressSteps[s.key as keyof ProcessingStepStatus];
                const dotClass =
                  state === "done"
                    ? "bg-success"
                    : state === "active"
                      ? "bg-primary animate-pulse"
                      : "bg-border";
                const labelClass =
                  state === "done"
                    ? "text-success font-medium"
                    : state === "active"
                      ? "text-primary font-medium"
                      : "text-muted-foreground";

                return (
                  <div key={s.key} className="flex items-center gap-2">
                    <div className={`h-2 w-2 rounded-full ${dotClass}`} />
                    <span className={`text-xs ${labelClass}`}>{s.label}</span>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Results */}
        {step === "complete" && (
          <motion.div
            key="results"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Score hero */}
            <div className="rounded-lg border bg-card p-6">
              <div className="flex items-center gap-6">
                <div className="relative">
                  <svg className="h-24 w-24 -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="42" fill="none" stroke="hsl(var(--border))" strokeWidth="8" />
                    <circle
                      cx="50" cy="50" r="42" fill="none"
                      stroke="hsl(var(--risk-medium))"
                      strokeWidth="8"
                      strokeDasharray={`${complianceScore * 2.64} 264`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-2xl font-bold">{complianceScore}%</span>
                  </div>
                </div>
                <div className="flex-1">
                  <h2 className="text-lg font-semibold">Label Compliance Score</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Checked against {marketLabels[market]} regulations
                  </p>
                  <div className="flex gap-4 mt-3">
                    <span className="flex items-center gap-1.5 text-sm text-success">
                      <CheckCircle className="h-3.5 w-3.5" /> {passCount} passed
                    </span>
                    <span className="flex items-center gap-1.5 text-sm text-warning">
                      <AlertTriangle className="h-3.5 w-3.5" /> {warnCount} warnings
                    </span>
                    <span className="flex items-center gap-1.5 text-sm text-destructive">
                      <XCircle className="h-3.5 w-3.5" /> {failCount} failed
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Risk context */}
            {(warnCount > 0 || failCount > 0) && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
                className="rounded-lg border border-destructive/30 bg-risk-high-bg p-4 flex items-start gap-3"
              >
                <ShieldAlert className="h-5 w-5 text-destructive mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-destructive">
                    {failCount} issue{failCount !== 1 ? "s" : ""} could lead to retailer rejection or regulatory action
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {marketRiskTextByMarket[market]}
                  </p>
                </div>
              </motion.div>
            )}

            {/* Detailed results */}
            <div className="rounded-lg border bg-card">
              <div className="p-4 border-b">
                <h2 className="text-base font-semibold">Compliance Check Results</h2>
              </div>
              <div className="divide-y">
                {mockScanResults.map((result, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="p-4"
                  >
                    <div className="flex items-start gap-3">
                      {result.status === "pass" && <CheckCircle className="h-4 w-4 mt-0.5 text-success shrink-0" />}
                      {result.status === "warning" && <AlertTriangle className="h-4 w-4 mt-0.5 text-warning shrink-0" />}
                      {result.status === "fail" && <XCircle className="h-4 w-4 mt-0.5 text-destructive shrink-0" />}
                      <div className="flex-1">
                        <span className="text-sm font-medium">{result.text}</span>
                        {result.fix && (
                          <div className="mt-2 space-y-1.5">
                            {result.risk && (
                              <p className="text-xs text-destructive/80">
                                <span className="font-semibold">⚠ Risk:</span> {result.risk}
                              </p>
                            )}
                            <p className="text-xs text-success">
                              <span className="font-semibold">✓ Fix:</span> {result.fix}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Extracted text (collapsed feel) */}
            <div className="rounded-lg border bg-card">
              <div className="p-4 border-b flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <h2 className="text-base font-semibold">Extracted Label Text</h2>
              </div>
              <div className="p-4">
                <pre className="text-sm font-mono whitespace-pre-wrap bg-muted p-4 rounded-md text-foreground leading-relaxed">
                  {mockExtractedText}
                </pre>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap gap-3">
              <Button onClick={handleGenerateCompliantVersion} className="gap-2">
                <Sparkles className="h-4 w-4" />
                Generate Compliant Version
              </Button>
              <Button variant="outline" className="gap-2" onClick={handleDownloadReport}>
                <Download className="h-4 w-4" />
                Download Report
              </Button>
              <Button variant="outline" onClick={reset}>
                Upload Another
              </Button>
            </div>

            {/* CTA */}
            <div className="rounded-lg border bg-primary/5 p-6 text-center">
              <p className="text-base font-semibold">Need help fixing your labels?</p>
              <p className="text-sm text-muted-foreground mt-1 mb-4">
                Get a free expert review from our compliance team
              </p>
              <Button variant="outline" className="gap-2">
                <Calendar className="h-4 w-4" />
                Book a Free Label Review
              </Button>
            </div>
          </motion.div>
        )}

        {/* Compliant version */}
        {step === "compliant-version" && (
          <motion.div
            key="compliant"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="rounded-lg border bg-card">
              <div className="p-4 border-b flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-success" />
                <h2 className="text-base font-semibold">Compliant Label Version</h2>
                <span className="ml-auto text-xs text-success font-medium risk-badge-low rounded-full px-2.5 py-0.5">
                  All issues resolved
                </span>
              </div>
              <div className="px-4 py-2 border-b text-xs text-muted-foreground flex items-center justify-between">
                <span>Generated at {generatedAt ?? "Not available"}</span>
                <span>{marketLabels[market]}</span>
              </div>
              <div className="p-4">
                <pre className="text-sm font-mono whitespace-pre-wrap bg-muted p-4 rounded-md text-foreground leading-relaxed">
                  {mockCompliantVersion}
                </pre>
              </div>
            </div>

            <div className="rounded-lg border border-success/30 bg-risk-low-bg p-4 flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-success mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-success">
                  This version addresses all detected compliance issues
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {market === "uk" &&
                    "Allergens declared individually · Claims rephrased · UK Responsible Person added · PAO symbol included"}
                  {market === "eu" &&
                    "EU Responsible Person added · Claims aligned to EU cosmetic framing · PAO symbol included"}
                  {market === "aus" &&
                    "Australian sponsor details added · Therapeutic-style claim risk removed · PAO symbol included"}
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  <span className="font-semibold text-foreground">Changelog:</span>{" "}
                  {changelogByMarket[market].join(" · ")}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button className="gap-2">
                <Download className="h-4 w-4" />
                Download Compliant Label
              </Button>
              <Button variant="outline" onClick={() => setStep("complete")}>
                Back to Results
              </Button>
              <Button variant="outline" onClick={reset}>
                Upload Another
              </Button>
            </div>

            {/* CTA */}
            <div className="rounded-lg border bg-primary/5 p-6 text-center">
              <p className="text-base font-semibold">Ready to go to market?</p>
              <p className="text-sm text-muted-foreground mt-1 mb-4">
                Let us review your final label before printing
              </p>
              <Button variant="outline" className="gap-2">
                <Calendar className="h-4 w-4" />
                Book a Free Label Review
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LabelUploadDashboard;
