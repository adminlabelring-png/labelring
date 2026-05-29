import { createContext, useContext, useState, ReactNode } from "react";
import type { ScanChanges } from "./scan-diff";

export interface DetectedField {
  label: string;
  value: string | null;
  status: "found" | "needs_review" | "not_found";
  suggestedFix?: string | null;
}

export interface ScanResult {
  fileName: string;
  category: string;
  fields: DetectedField[];
  foundCount: number;
  totalCount: number;
  needsAttentionCount: number;
  isSeasonal?: boolean;
  seasonTag?: string | null;
  changes?: ScanChanges | null;
}

export interface ScanOptions {
  isSeasonal: boolean;
  seasonTag: string | null;
}

interface ScanContextType {
  file: File | null;
  setFile: (f: File | null) => void;
  options: ScanOptions;
  setOptions: (o: ScanOptions) => void;
  result: ScanResult | null;
  setResult: (r: ScanResult | null) => void;
  reset: () => void;
}

const defaultOptions: ScanOptions = { isSeasonal: false, seasonTag: null };

const ScanContext = createContext<ScanContextType | null>(null);

export const ScanProvider = ({ children }: { children: ReactNode }) => {
  const [file, setFile] = useState<File | null>(null);
  const [options, setOptions] = useState<ScanOptions>(defaultOptions);
  const [result, setResult] = useState<ScanResult | null>(null);

  const reset = () => {
    setFile(null);
    setResult(null);
    setOptions(defaultOptions);
  };

  return (
    <ScanContext.Provider value={{ file, setFile, options, setOptions, result, setResult, reset }}>
      {children}
    </ScanContext.Provider>
  );
};

export const useScan = () => {
  const ctx = useContext(ScanContext);
  if (!ctx) throw new Error("useScan must be used within ScanProvider");
  return ctx;
};

// Convert AI response into a ScanResult
export const buildScanResult = (
  fileName: string,
  aiData: { category: string; fields: DetectedField[] }
): ScanResult => {
  const fields = aiData.fields;
  const foundCount = fields.filter((f) => f.status === "found").length;
  const needsAttentionCount = fields.filter((f) => f.status !== "found").length;

  return {
    fileName,
    category: aiData.category,
    fields,
    foundCount,
    totalCount: fields.length,
    needsAttentionCount,
  };
};

// Fallback mock result if AI fails
export const generateMockResult = (fileName: string): ScanResult => {
  const fields: DetectedField[] = [
    { label: "Product Name", value: "Organic Rosehip Face Oil", status: "found" },
    { label: "Ingredients", value: "Rosa Canina Fruit Oil, Simmondsia Chinensis Seed Oil, Tocopherol", status: "found" },
    { label: "Warnings", value: "For external use only. Avoid contact with eyes.", status: "found" },
    { label: "Manufacturer / Responsible Person", value: null, status: "not_found", suggestedFix: "Add manufacturer name and address" },
    { label: "Country of Origin", value: "United Kingdom", status: "found" },
    { label: "Batch / Lot Number", value: "LOT 2026-03A", status: "found" },
    { label: "Expiry / Best Before", value: null, status: "needs_review", suggestedFix: "Add expiry date in DD/MM/YYYY format" },
    { label: "Allergens", value: "Limonene, Geraniol, Linalool", status: "found" },
    { label: "Net Quantity", value: "30ml / 1.0 fl oz", status: "found" },
    { label: "Storage Instructions", value: null, status: "not_found", suggestedFix: "Add: Store in a cool, dry place" },
  ];

  return {
    fileName,
    category: "Skincare",
    fields,
    foundCount: fields.filter((f) => f.status === "found").length,
    totalCount: fields.length,
    needsAttentionCount: fields.filter((f) => f.status !== "found").length,
  };
};
