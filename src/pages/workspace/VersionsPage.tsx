import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { History } from "lucide-react";
import { useBrand } from "@/lib/brand-context";
import { fetchProducts, ProductRow } from "@/lib/workspace-queries";
import { supabase } from "@/integrations/supabase/client";
import StatusPill from "@/components/workspace/StatusPill";

interface VersionRow { id: string; product_key: string; product_name: string | null; version_number: number; status: string; approved_at: string; approved_by_name: string | null; }
interface CRRow { id: string; product_key: string; status: string; created_at: string; }

const VersionsPage = () => {
  const { brand } = useBrand();
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [versions, setVersions] = useState<VersionRow[]>([]);
  const [pending, setPending] = useState<CRRow[]>([]);

  useEffect(() => {
    if (!brand) return;
    (async () => {
      const prods = await fetchProducts(brand.id);
      setProducts(prods);
      const keys = prods.map(p => p.product_key);
      if (keys.length === 0) { setVersions([]); setPending([]); return; }
      const [{ data: vs }, { data: crs }] = await Promise.all([
        supabase.from("product_versions").select("id,product_key,product_name,version_number,status,approved_at,approved_by_name").in("product_key", keys).order("approved_at", { ascending: false }),
        supabase.from("change_requests").select("id,product_key,status,created_at").in("product_key", keys).eq("status", "pending"),
      ]);
      setVersions((vs ?? []) as VersionRow[]);
      setPending((crs ?? []) as CRRow[]);
    })();
  }, [brand]);

  const productName = (key: string) => products.find(p => p.product_key === key)?.name ?? key;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold">Version history</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Approved master artwork and pending change requests</p>
      </div>

      {pending.length > 0 && (
        <div className="rounded-lg border bg-card">
          <div className="p-4 border-b flex items-center justify-between">
            <h2 className="text-sm font-semibold">Pending change requests</h2>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-[hsl(var(--risk-medium-bg))] text-[hsl(var(--risk-medium))] font-medium">{pending.length}</span>
          </div>
          <div className="divide-y">
            {pending.map(cr => (
              <Link key={cr.id} to={`/admin/products/${cr.product_key}`} className="flex items-center justify-between p-4 hover:bg-muted/30">
                <div>
                  <p className="text-[13px] font-medium">{productName(cr.product_key)}</p>
                  <p className="text-[11px] text-muted-foreground">Opened {new Date(cr.created_at).toLocaleDateString()}</p>
                </div>
                <StatusPill status="in_review" />
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-lg border bg-card">
        <div className="p-4 border-b flex items-center gap-1.5">
          <History className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold">All approved versions</h2>
        </div>
        <div className="divide-y">
          {versions.map(v => (
            <Link key={v.id} to={`/admin/products/${v.product_key}`} className="flex items-center justify-between p-4 hover:bg-muted/30">
              <div>
                <p className="text-[13px] font-medium">{v.product_name ?? productName(v.product_key)} <span className="font-mono text-xs text-muted-foreground">v{v.version_number}</span></p>
                <p className="text-[11px] text-muted-foreground">{v.status === "approved" ? "Locked" : "Archived"} {new Date(v.approved_at).toLocaleDateString()}{v.approved_by_name ? ` · ${v.approved_by_name}` : ""}</p>
              </div>
              <StatusPill status={v.status === "approved" ? "approved" : "archived"} />
            </Link>
          ))}
          {versions.length === 0 && <p className="p-8 text-center text-sm text-muted-foreground">No locked versions yet. Lock a scan in the admin dashboard.</p>}
        </div>
      </div>
    </div>
  );
};

export default VersionsPage;
