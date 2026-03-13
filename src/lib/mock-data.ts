export interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  status: "active" | "draft" | "archived";
  labelVersion: string;
  approvalStatus: "approved" | "pending" | "rejected";
  complianceScore: number;
  riskLevel: "low" | "medium" | "high";
  lastUpdated: string;
  issues: ComplianceIssue[];
}

export interface ComplianceIssue {
  id: string;
  type: string;
  severity: "low" | "medium" | "high";
  description: string;
  regulation: string;
  recommendation: string;
}

export interface LabelData {
  productName: string;
  ingredients: string;
  allergens: string[];
  nutritionTable: { nutrient: string; per100g: string; perServing: string }[];
  manufacturer: string;
  netQuantity: string;
  storageInstructions: string;
  useByFormat: string;
  barcode: string;
  countryOfOrigin: string;
}

export const mockProducts: Product[] = [
  {
    id: "1",
    name: "Organic Rosehip Face Oil",
    sku: "SKN-001",
    category: "Skincare",
    status: "active",
    labelVersion: "v3.2",
    approvalStatus: "approved",
    complianceScore: 94,
    riskLevel: "low",
    lastUpdated: "2026-03-10",
    issues: [
      {
        id: "i1",
        type: "Ingredient listing",
        severity: "low",
        description: "INCI names should be listed in descending order of concentration",
        regulation: "EC 1223/2009 Article 19",
        recommendation: "Reorder ingredients by concentration percentage",
      },
    ],
  },
  {
    id: "2",
    name: "Vitamin C Brightening Serum",
    sku: "SKN-002",
    category: "Skincare",
    status: "active",
    labelVersion: "v2.1",
    approvalStatus: "pending",
    complianceScore: 72,
    riskLevel: "medium",
    lastUpdated: "2026-03-08",
    issues: [
      {
        id: "i2",
        type: "Claims validation",
        severity: "medium",
        description: "'Anti-aging' claim requires substantiation under UK cosmetic regulations",
        regulation: "UK Cosmetic Products Regulation 2009",
        recommendation: "Remove or rephrase claim to 'helps reduce appearance of fine lines'",
      },
      {
        id: "i3",
        type: "Allergen declaration",
        severity: "high",
        description: "Linalool detected in fragrance but not listed separately on label",
        regulation: "EC 1223/2009 Annex III",
        recommendation: "Add Linalool to ingredients list as individual allergen",
      },
    ],
  },
  {
    id: "3",
    name: "Hydrating Body Lotion",
    sku: "SKN-003",
    category: "Skincare",
    status: "active",
    labelVersion: "v1.0",
    approvalStatus: "rejected",
    complianceScore: 45,
    riskLevel: "high",
    lastUpdated: "2026-03-05",
    issues: [
      {
        id: "i4",
        type: "Net quantity",
        severity: "high",
        description: "Net quantity not displayed in minimum font size (6mm for 200ml+)",
        regulation: "FIC Regulation (EU) 1169/2011",
        recommendation: "Increase net quantity font size to minimum 6mm",
      },
      {
        id: "i5",
        type: "Responsible Person",
        severity: "high",
        description: "UK Responsible Person details missing from label",
        regulation: "UK Cosmetic Products Regulation 2009 Article 6",
        recommendation: "Add UK RP name and address to label",
      },
      {
        id: "i6",
        type: "PAO Symbol",
        severity: "medium",
        description: "Period After Opening symbol not present",
        regulation: "EC 1223/2009 Article 19(1)(d)",
        recommendation: "Add PAO symbol with appropriate month duration",
      },
    ],
  },
  {
    id: "4",
    name: "Gentle Micellar Cleanser",
    sku: "SKN-004",
    category: "Skincare",
    status: "draft",
    labelVersion: "v1.0",
    approvalStatus: "pending",
    complianceScore: 88,
    riskLevel: "low",
    lastUpdated: "2026-03-12",
    issues: [
      {
        id: "i7",
        type: "Batch code",
        severity: "low",
        description: "Batch code location not clearly identifiable",
        regulation: "EC 1223/2009 Article 19(1)(a)",
        recommendation: "Ensure batch code is clearly visible and not obscured by packaging",
      },
    ],
  },
  {
    id: "5",
    name: "SPF 50 Daily Moisturiser",
    sku: "SKN-005",
    category: "Skincare",
    status: "active",
    labelVersion: "v4.0",
    approvalStatus: "approved",
    complianceScore: 97,
    riskLevel: "low",
    lastUpdated: "2026-03-11",
    issues: [],
  },
];

export const mockLabelData: LabelData = {
  productName: "Organic Rosehip Face Oil",
  ingredients: "Rosa Canina Fruit Oil, Simmondsia Chinensis Seed Oil, Tocopherol, Rosmarinus Officinalis Leaf Extract, Limonene, Geraniol, Linalool",
  allergens: ["Limonene", "Geraniol", "Linalool"],
  nutritionTable: [],
  manufacturer: "NaturGlow Ltd",
  netQuantity: "30ml / 1.0 fl oz",
  storageInstructions: "Store in a cool, dry place away from direct sunlight",
  useByFormat: "See base of bottle",
  barcode: "5060012345678",
  countryOfOrigin: "United Kingdom",
};

export const complianceRules = [
  { id: "r1", name: "INCI Ingredient Listing", category: "Ingredients", status: "active", severity: "high" },
  { id: "r2", name: "Allergen Declaration", category: "Allergens", status: "active", severity: "high" },
  { id: "r3", name: "Net Quantity Display", category: "Labelling", status: "active", severity: "medium" },
  { id: "r4", name: "Responsible Person Details", category: "Regulatory", status: "active", severity: "high" },
  { id: "r5", name: "PAO Symbol Requirement", category: "Labelling", status: "active", severity: "medium" },
  { id: "r6", name: "Claims Substantiation", category: "Claims", status: "active", severity: "high" },
  { id: "r7", name: "Batch Code Visibility", category: "Labelling", status: "active", severity: "low" },
  { id: "r8", name: "Country of Origin", category: "Regulatory", status: "active", severity: "medium" },
  { id: "r9", name: "UV Filter Declaration", category: "Ingredients", status: "active", severity: "high" },
  { id: "r10", name: "Prohibited Substances Check", category: "Safety", status: "active", severity: "high" },
];
