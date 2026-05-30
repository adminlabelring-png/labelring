import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { getVersionHistory, type ProductVersion, type ChangeRequest } from "@/lib/version-lock";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Lock, Archive, CheckCircle2, XCircle, Clock } from "lucide-react";

interface TimelineItem {
  date: string;
  kind: "version" | "request";
  version?: ProductVersion;
  request?: ChangeRequest;
}

const ProductHistoryPage = () => {
  const { productKey } = useParams<{ productKey: string }>();
  const [versions, setVersions] = useState<ProductVersion[]>([]);
  const [requests, setRequests] = useState<ChangeRequest[]>([]);
  const [productName, setProductName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!productKey) return;
    const decoded = decodeURIComponent(productKey);
    (async () => {
      const h = await getVersionHistory(decoded);
      setVersions(h.versions);
      setRequests(h.requests);
      const { data: scan } = await supabase
        .from("scans" as any)
        .select("product_name")
        .eq("product_key", decoded)
        .limit(1)
        .maybeSingle();
      setProductName((scan as any)?.product_name ?? decoded);
      setLoading(false);
    })();
  }, [productKey]);

  const timeline: TimelineItem[] = [
    ...versions.map((v) => ({
      date: v.status === "archived" && v.archived_at ? v.archived_at : v.approved_at,
      kind: "version" as const,
      version: v,
    })),
    ...requests.map((r) => ({
      date: r.decided_at ?? r.created_at,
      kind: "request" as const,
      request: r,
    })),
  ].sort((a, b) => +new Date(b.date) - +new Date(a.date));

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <Link to="/admin/leads" className="text-sm text-muted-foreground inline-flex items-center gap-1 hover:text-foreground">
        <ArrowLeft className="h-3 w-3" /> Back to admin
      </Link>

      <div>
        <h1 className="text-2xl font-semibold">{productName}</h1>
        <p className="text-sm text-muted-foreground">Version history & approval audit trail</p>
      </div>

      {loading && <p className="text-sm text-muted-foreground">Loading history…</p>}

      {!loading && timeline.length === 0 && (
        <Card className="p-6 text-center text-sm text-muted-foreground">No history yet.</Card>
      )}

      <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-px before:bg-border">
        {timeline.map((item, i) => (
          <div key={i} className="relative">
            <div className="absolute -left-[18px] top-3 w-3 h-3 rounded-full bg-background border-2 border-primary" />
            {item.kind === "version" && item.version && (
              <Card className="p-4 space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  {item.version.status === "approved" ? (
                    <Badge className="gap-1"><Lock className="h-3 w-3" /> Approved v{item.version.version_number}</Badge>
                  ) : (
                    <Badge variant="secondary" className="gap-1"><Archive className="h-3 w-3" /> Archived v{item.version.version_number}</Badge>
                  )}
                  <span className="text-xs text-muted-foreground">{new Date(item.date).toLocaleString()}</span>
                </div>
                <p className="text-sm">
                  {item.version.status === "approved" ? "Locked as approved master" : "Archived"}
                  {item.version.approved_by_name && ` by ${item.version.approved_by_name}`}
                </p>
                {item.version.approved_note && (
                  <p className="text-xs text-muted-foreground italic">"{item.version.approved_note}"</p>
                )}
                {item.version.archived_reason && (
                  <p className="text-xs text-muted-foreground">{item.version.archived_reason}</p>
                )}
              </Card>
            )}
            {item.kind === "request" && item.request && (
              <Card className="p-4 space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  {item.request.status === "pending" && (
                    <Badge variant="outline" className="gap-1 border-[hsl(var(--risk-medium)/0.5)] text-[hsl(var(--risk-medium))]"><Clock className="h-3 w-3" /> Pending</Badge>
                  )}
                  {item.request.status === "approved" && (
                    <Badge variant="outline" className="gap-1 border-[hsl(var(--risk-low)/0.5)] text-[hsl(var(--risk-low))]"><CheckCircle2 className="h-3 w-3" /> Approved</Badge>
                  )}
                  {item.request.status === "rejected" && (
                    <Badge variant="outline" className="gap-1 border-[hsl(var(--risk-high)/0.5)] text-[hsl(var(--risk-high))]"><XCircle className="h-3 w-3" /> Rejected</Badge>
                  )}
                  <span className="text-xs text-muted-foreground">{new Date(item.date).toLocaleString()}</span>
                </div>
                <p className="text-sm">Change request {item.request.decided_by_name ? `decided by ${item.request.decided_by_name}` : "opened"}</p>
                {item.request.decision_note && (
                  <p className="text-xs text-muted-foreground italic">"{item.request.decision_note}"</p>
                )}
                {item.request.changes && (
                  <div className="text-xs text-muted-foreground space-y-0.5">
                    {item.request.changes.ingredientsAdded?.length > 0 && <p>+ {item.request.changes.ingredientsAdded.join(", ")}</p>}
                    {item.request.changes.ingredientsRemoved?.length > 0 && <p>− {item.request.changes.ingredientsRemoved.join(", ")}</p>}
                    {item.request.changes.manufacturerChanged && <p>Mfr: {item.request.changes.manufacturerChanged.from ?? "—"} → {item.request.changes.manufacturerChanged.to ?? "—"}</p>}
                  </div>
                )}
              </Card>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProductHistoryPage;
