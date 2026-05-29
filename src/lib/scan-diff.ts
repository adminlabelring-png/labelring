import type { DetectedField } from "./scan-context";

export interface ScanChanges {
  comparedToScanId: string;
  comparedToDate: string;
  ingredientsAdded: string[];
  ingredientsRemoved: string[];
  allergensAdded: string[];
  allergensRemoved: string[];
  manufacturerChanged: { from: string | null; to: string | null } | null;
  originChanged: { from: string | null; to: string | null } | null;
  hasAnyChange: boolean;
}

const FIELD = {
  ingredients: "Ingredients",
  allergens: "Allergens",
  manufacturer: "Manufacturer / Responsible Person",
  origin: "Country of Origin",
};

const findValue = (fields: any[], label: string): string | null => {
  const f = fields?.find((x) => x?.label === label);
  return f?.value ?? null;
};

export const normalizeProductKey = (name: string | null | undefined): string | null => {
  if (!name) return null;
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim() || null;
};

const splitList = (value: string | null): string[] => {
  if (!value) return [];
  return value
    .split(/[,;]/)
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
};

const diffLists = (prev: string[], next: string[]) => {
  const prevSet = new Set(prev);
  const nextSet = new Set(next);
  return {
    added: next.filter((x) => !prevSet.has(x)),
    removed: prev.filter((x) => !nextSet.has(x)),
  };
};

export const computeScanDiff = (
  prevScan: { id: string; created_at: string; fields: any[] },
  currentFields: DetectedField[]
): ScanChanges => {
  const prev = prevScan.fields ?? [];
  const curr = currentFields as any[];

  const ing = diffLists(
    splitList(findValue(prev, FIELD.ingredients)),
    splitList(findValue(curr, FIELD.ingredients))
  );
  const all = diffLists(
    splitList(findValue(prev, FIELD.allergens)),
    splitList(findValue(curr, FIELD.allergens))
  );

  const prevMfr = findValue(prev, FIELD.manufacturer);
  const currMfr = findValue(curr, FIELD.manufacturer);
  const manufacturerChanged =
    (prevMfr ?? "").trim().toLowerCase() !== (currMfr ?? "").trim().toLowerCase()
      ? { from: prevMfr, to: currMfr }
      : null;

  const prevOrigin = findValue(prev, FIELD.origin);
  const currOrigin = findValue(curr, FIELD.origin);
  const originChanged =
    (prevOrigin ?? "").trim().toLowerCase() !== (currOrigin ?? "").trim().toLowerCase()
      ? { from: prevOrigin, to: currOrigin }
      : null;

  const hasAnyChange =
    ing.added.length > 0 ||
    ing.removed.length > 0 ||
    all.added.length > 0 ||
    all.removed.length > 0 ||
    !!manufacturerChanged ||
    !!originChanged;

  return {
    comparedToScanId: prevScan.id,
    comparedToDate: prevScan.created_at,
    ingredientsAdded: ing.added,
    ingredientsRemoved: ing.removed,
    allergensAdded: all.added,
    allergensRemoved: all.removed,
    manufacturerChanged,
    originChanged,
    hasAnyChange,
  };
};

export const extractProductName = (fields: DetectedField[]): string | null => {
  const f = fields.find((x) => x.label === "Product Name");
  return f?.value ?? null;
};
