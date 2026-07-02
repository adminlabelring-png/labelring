import { supabase } from "@/integrations/supabase/client";
import type { LabelFields, Pack } from "./label-rules";

export async function suggestField(
  field: keyof LabelFields | "nutrition",
  fields: LabelFields,
  pack: Pack
): Promise<string> {
  const { data, error } = await supabase.functions.invoke("generate-label", {
    body: { mode: "field", field, fields, pack },
  });
  if (error) throw error;
  const value = (data as { value?: string })?.value;
  if (!value) throw new Error("No suggestion returned");
  return value;
}

export async function generatePreview(
  fields: LabelFields,
  pack: Pack
): Promise<string> {
  const { data, error } = await supabase.functions.invoke("generate-label", {
    body: { mode: "preview", fields, pack },
  });
  if (error) throw error;
  return (data as { preview?: string })?.preview ?? "";
}
