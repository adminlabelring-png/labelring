import { supabase } from "@/integrations/supabase/client";
import type { LabelFields } from "./label-rules";

export async function suggestField(
  field: keyof LabelFields,
  fields: LabelFields
): Promise<string> {
  const { data, error } = await supabase.functions.invoke("generate-label", {
    body: { mode: "field", field, fields },
  });
  if (error) throw error;
  const value = (data as { value?: string })?.value;
  if (!value) throw new Error("No suggestion returned");
  return value;
}

export async function generatePreview(fields: LabelFields): Promise<string> {
  const { data, error } = await supabase.functions.invoke("generate-label", {
    body: { mode: "preview", fields },
  });
  if (error) throw error;
  return (data as { preview?: string })?.preview ?? "";
}
