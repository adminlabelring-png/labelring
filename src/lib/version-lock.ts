import { supabase } from "@/integrations/supabase/client";
import type { ScanChanges } from "./scan-diff";

export interface ProductVersion {
  id: string;
  product_key: string;
  product_name: string | null;
  scan_id: string;
  version_number: number;
  status: "approved" | "archived";
  approved_by_name: string | null;
  approved_note: string | null;
  approved_at: string;
  archived_at: string | null;
  archived_reason: string | null;
  created_at: string;
}

export interface ChangeRequest {
  id: string;
  product_key: string;
  product_name: string | null;
  new_scan_id: string;
  locked_version_id: string | null;
  changes: ScanChanges | null;
  status: "pending" | "approved" | "rejected";
  decided_by_name: string | null;
  decision_note: string | null;
  decided_at: string | null;
  promote_to_locked: boolean | null;
  created_at: string;
}

const VERSIONS = "product_versions" as any;
const REQUESTS = "change_requests" as any;

export const getCurrentLockedVersion = async (
  productKey: string
): Promise<ProductVersion | null> => {
  const { data, error } = await supabase
    .from(VERSIONS)
    .select("*")
    .eq("product_key", productKey)
    .eq("status", "approved")
    .maybeSingle();
  if (error) {
    console.warn("getCurrentLockedVersion", error);
    return null;
  }
  return (data as ProductVersion | null) ?? null;
};

export const getNextVersionNumber = async (productKey: string): Promise<number> => {
  const { data } = await supabase
    .from(VERSIONS)
    .select("version_number")
    .eq("product_key", productKey)
    .order("version_number", { ascending: false })
    .limit(1);
  const last = (data as any[])?.[0]?.version_number ?? 0;
  return last + 1;
};

export const lockScanAsVersion = async (params: {
  productKey: string;
  productName: string | null;
  scanId: string;
  approvedBy: string;
  note: string | null;
  archiveReason?: string;
}): Promise<ProductVersion> => {
  // Archive existing approved version if any
  const current = await getCurrentLockedVersion(params.productKey);
  if (current) {
    await supabase
      .from(VERSIONS)
      .update({
        status: "archived",
        archived_at: new Date().toISOString(),
        archived_reason: params.archiveReason ?? "Superseded by new approved version",
      } as any)
      .eq("id", current.id);
  }

  const nextNumber = await getNextVersionNumber(params.productKey);

  const { data, error } = await supabase
    .from(VERSIONS)
    .insert({
      product_key: params.productKey,
      product_name: params.productName,
      scan_id: params.scanId,
      version_number: nextNumber,
      status: "approved",
      approved_by_name: params.approvedBy,
      approved_note: params.note,
      approved_at: new Date().toISOString(),
    } as any)
    .select()
    .single();

  if (error) throw error;
  return data as ProductVersion;
};

export const createChangeRequest = async (params: {
  productKey: string;
  productName: string | null;
  newScanId: string;
  lockedVersionId: string;
  changes: ScanChanges;
}): Promise<ChangeRequest | null> => {
  const { data, error } = await supabase
    .from(REQUESTS)
    .insert({
      product_key: params.productKey,
      product_name: params.productName,
      new_scan_id: params.newScanId,
      locked_version_id: params.lockedVersionId,
      changes: params.changes as any,
      status: "pending",
    } as any)
    .select()
    .single();
  if (error) {
    console.warn("createChangeRequest", error);
    return null;
  }
  return data as ChangeRequest;
};

export const decideChangeRequest = async (params: {
  requestId: string;
  decision: "approved" | "rejected";
  decidedBy: string;
  note: string | null;
  promoteToLocked: boolean;
  // when promoting
  productKey?: string;
  productName?: string | null;
  newScanId?: string;
}): Promise<void> => {
  if (params.decision === "approved" && params.promoteToLocked && params.productKey && params.newScanId) {
    await lockScanAsVersion({
      productKey: params.productKey,
      productName: params.productName ?? null,
      scanId: params.newScanId,
      approvedBy: params.decidedBy,
      note: params.note,
      archiveReason: "Superseded by approved change",
    });
  }

  await supabase
    .from(REQUESTS)
    .update({
      status: params.decision,
      decided_by_name: params.decidedBy,
      decision_note: params.note,
      decided_at: new Date().toISOString(),
      promote_to_locked: params.promoteToLocked,
    } as any)
    .eq("id", params.requestId);
};

export const getVersionHistory = async (productKey: string) => {
  const [versions, requests] = await Promise.all([
    supabase.from(VERSIONS).select("*").eq("product_key", productKey).order("created_at", { ascending: false }),
    supabase.from(REQUESTS).select("*").eq("product_key", productKey).order("created_at", { ascending: false }),
  ]);
  return {
    versions: (versions.data as ProductVersion[]) ?? [],
    requests: (requests.data as ChangeRequest[]) ?? [],
  };
};

export const getPendingRequests = async (): Promise<ChangeRequest[]> => {
  const { data } = await supabase
    .from(REQUESTS)
    .select("*")
    .eq("status", "pending")
    .order("created_at", { ascending: false });
  return (data as ChangeRequest[]) ?? [];
};

export const getLockedVersionByScan = async (scanId: string): Promise<ProductVersion | null> => {
  const { data } = await supabase
    .from(VERSIONS)
    .select("*")
    .eq("scan_id", scanId)
    .eq("status", "approved")
    .maybeSingle();
  return (data as ProductVersion | null) ?? null;
};
