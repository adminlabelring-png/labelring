import { createContext, useContext, useState, ReactNode } from "react";

export interface DetectedField {
  label: string;
  value: string | null;
  status: "found" | "needs_review" | "not_found";
}

export interface ScanResult {
  fileName: string;
  category: string;
  fields: DetectedField[];
  foundCount: number;
  totalCount: number;
  needsAttentionCount: number;
}

interface ScanContextType {
  file: File | null;
  setFile: (f: File | null) => void;
  result: ScanResult | null;
  setResult: (r: ScanResult | null) => void;
  reset: () => void;
}

const ScanContext = createContext<ScanContextType | null>(null);

export const ScanProvider = ({ children }: { children: ReactNode }) => {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<ScanResult | null>(null);

  const reset = () => {
    setFile(null);
    setResult(null);
  };

  return (
    <ScanContext.Provider value={{ file, setFile, result, setResult, reset }}>
      {children}
    </ScanContext.Provider>
  );
};

export const useScan = () => {
  const ctx = useContext(ScanContext);
  if (!ctx) throw new Error("useScan must be used within ScanProvider");
  return ctx;
};

// Mock OCR result generator
export const generateMockResult = (fileName: string): ScanResult => {
  const fields: DetectedField[] = [
    { label: "Product Name", value: "Organic Rosehip Face Oil", status: "found" },
    { label: "Ingredients", value: "Rosa Canina Fruit Oil, Simmondsia Chinensis Seed Oil, Tocopherol, Rosmarinus Officinalis Leaf Extract, Limonene, Geraniol, Linalool", status: "found" },
    { label: "Warnings", value: "For external use only. Avoid contact with eyes.", status: "found" },
    { label: "Manufacturer / Responsible Person", value: null, status: "not_found" },
    { label: "Country of Origin", value: "United Kingdom", status: "found" },
    { label: "Batch / Lot Number", value: "LOT 2026-03A", status: "found" },
    { label: "Expiry / Best Before", value: null, status: "needs_review" },
    { label: "Allergens", value: "Limonene, Geraniol, Linalool", status: "found" },
    { label: "Net Quantity", value: "30ml / 1.0 fl oz", status: "found" },
    { label: "Storage Instructions", value: null, status: "not_found" },
  ];

  const foundCount = fields.filter(f => f.status === "found").length;
  const needsAttentionCount = fields.filter(f => f.status !== "found").length;

  return {
    fileName,
    category: "Skincare",
    fields,
    foundCount,
    totalCount: fields.length,
    needsAttentionCount,
  };
};
