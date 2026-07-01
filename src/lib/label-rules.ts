export interface LabelFields {
  brandName: string;
  productName: string;
  category: string;
  ingredients: string;
  allergens: string;
  countryOfOrigin: string;
  netQuantity: string;
  batchNumber: string;
  bestBefore: string;
  responsiblePerson: string;
  certifications: string;
}

export const emptyLabel: LabelFields = {
  brandName: "",
  productName: "",
  category: "",
  ingredients: "",
  allergens: "",
  countryOfOrigin: "",
  netQuantity: "",
  batchNumber: "",
  bestBefore: "",
  responsiblePerson: "",
  certifications: "",
};

export type CheckStatus = "ok" | "missing" | "review";

export interface RuleResult {
  key: string;
  label: string;
  status: CheckStatus;
}

const has = (v: string) => v.trim().length > 0;
const looksLikeAddress = (v: string) =>
  v.trim().length > 10 && /,/.test(v);
const hasUnit = (v: string) =>
  /\d/.test(v) && /(ml|l\b|g\b|kg|mg|oz|fl|cl|pcs|count)/i.test(v);

export function evaluateLabel(f: LabelFields): {
  score: number;
  rules: RuleResult[];
} {
  const rules: RuleResult[] = [
    {
      key: "identity",
      label: "Product identity",
      status: has(f.productName) && has(f.brandName) ? "ok" : "missing",
    },
    {
      key: "ingredients",
      label: "Ingredients declared",
      status: has(f.ingredients)
        ? f.ingredients.trim().length < 10
          ? "review"
          : "ok"
        : "missing",
    },
    {
      key: "allergens",
      label: "Allergens flagged",
      status: has(f.allergens) ? "ok" : "missing",
    },
    {
      key: "origin",
      label: "Country of origin",
      status: has(f.countryOfOrigin) ? "ok" : "missing",
    },
    {
      key: "quantity",
      label: "Quantity declared",
      status: has(f.netQuantity)
        ? hasUnit(f.netQuantity)
          ? "ok"
          : "review"
        : "missing",
    },
    {
      key: "responsible",
      label: "Responsible person",
      status: has(f.responsiblePerson)
        ? looksLikeAddress(f.responsiblePerson)
          ? "ok"
          : "review"
        : "missing",
    },
    {
      key: "batch",
      label: "Batch traceability",
      status: has(f.batchNumber) && has(f.bestBefore)
        ? "ok"
        : has(f.batchNumber) || has(f.bestBefore)
        ? "review"
        : "missing",
    },
  ];

  const passed = rules.filter((r) => r.status === "ok").length;
  const score = Math.round((passed / rules.length) * 100);
  return { score, rules };
}
