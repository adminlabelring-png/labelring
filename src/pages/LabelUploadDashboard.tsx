import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, FileText, CheckCircle, AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

type ScanStep = "idle" | "uploading" | "extracting" | "scanning" | "complete";

const mockExtractedText = `Product Name: Vitamin C Brightening Serum
Ingredients: Aqua, Ascorbic Acid, Glycerin, Niacinamide, Hyaluronic Acid, Tocopherol, Phenoxyethanol, Parfum, Linalool, Limonene
Net Contents: 30ml
Manufacturer: NaturGlow Ltd, 42 Innovation Drive, London, EC2A 4BQ
Directions: Apply 2-3 drops to cleansed face morning and evening.
Warnings: For external use only. Avoid contact with eyes.
Batch: NG-VC-2026-03
Best Before: See base of bottle`;

const mockScanResults = [
  { status: "pass", text: "INCI ingredient listing present" },
  { status: "pass", text: "Net quantity declared" },
  { status: "pass", text: "Manufacturer details present" },
  { status: "warning", text: "'Anti-aging' claim detected — requires substantiation" },
  { status: "fail", text: "Linalool listed in parfum but not declared as individual allergen" },
  { status: "pass", text: "Batch code present" },
  { status: "warning", text: "UK Responsible Person not separately identified" },
];

const LabelUploadDashboard = () => {
  const [step, setStep] = useState<ScanStep>("idle");
  const [dragActive, setDragActive] = useState(false);

  const simulateScan = () => {
    setStep("uploading");
    setTimeout(() => setStep("extracting"), 1200);
    setTimeout(() => setStep("scanning"), 3000);
    setTimeout(() => setStep("complete"), 4500);
  };

  const reset = () => setStep("idle");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Upload & Scan</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Upload a label image or PDF to extract data and run compliance checks
        </p>
      </div>

      {/* Upload zone */}
      <AnimatePresence mode="wait">
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
              Supports PNG, JPG, PDF — max 10MB
            </p>
            <Button onClick={simulateScan}>Select File</Button>
          </motion.div>
        )}

        {(step === "uploading" || step === "extracting" || step === "scanning") && (
          <motion.div
            key="processing"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="rounded-lg border bg-card p-8 text-center"
          >
            <Loader2 className="h-8 w-8 mx-auto text-primary animate-spin mb-4" />
            <p className="text-base font-medium">
              {step === "uploading" && "Uploading label..."}
              {step === "extracting" && "Running OCR text extraction..."}
              {step === "scanning" && "Scanning for compliance issues..."}
            </p>
            <p className="text-sm text-muted-foreground mt-1">This may take a few seconds</p>
          </motion.div>
        )}

        {step === "complete" && (
          <motion.div
            key="results"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Extracted text */}
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

            {/* Scan results */}
            <div className="rounded-lg border bg-card">
              <div className="p-4 border-b">
                <h2 className="text-base font-semibold">Compliance Scan Results</h2>
              </div>
              <div className="divide-y">
                {mockScanResults.map((result, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-start gap-3 p-4"
                  >
                    {result.status === "pass" && <CheckCircle className="h-4 w-4 mt-0.5 text-risk-low shrink-0" />}
                    {result.status === "warning" && <AlertTriangle className="h-4 w-4 mt-0.5 text-risk-medium shrink-0" />}
                    {result.status === "fail" && <AlertTriangle className="h-4 w-4 mt-0.5 text-risk-high shrink-0" />}
                    <span className="text-sm">{result.text}</span>
                  </motion.div>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <Button onClick={reset} variant="outline">Upload Another</Button>
              <Button>Save to Product</Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LabelUploadDashboard;
