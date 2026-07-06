// Shared product category list used by the landing early-access form,
// the lead-capture dialog, and the label generator. The value stored in
// the database matches the label (title case) so it also drives the
// generator's rule pack via getPack().

export const CATEGORIES = [
  "Food",
  "Beverage",
  "Supplement",
  "Skincare",
  "Household",
  "Other",
] as const;

export type CategoryValue = (typeof CATEGORIES)[number];
