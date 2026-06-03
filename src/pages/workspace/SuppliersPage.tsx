import { useEffect, useState } from "react";
import { useBrand } from "@/lib/brand-context";
import { fetchProducts, fetchSuppliers, ProductRow, SupplierRow } from "@/lib/workspace-queries";
import StatusPill from "@/components/workspace/StatusPill";

const barColor = (s: string) =>
  s === "verified" ? "hsl(var(--risk-low))" :
  s === "spec_change" ? "hsl(var(--risk-medium))" :
  "hsl(var(--risk-high))";

const statusToPill = (s: string) => s === "verified" ? "approved" : s === "spec_change" ? "in_review" : "flagged";

const SuppliersPage = () => {
  const { brand } = useBrand();
  const [suppliers, setSuppliers] = useState<SupplierRow[]>([]);
  const [products, setProducts] = useState<ProductRow[]>([]);

  useEffect(() => {
    if (!brand) return;
    fetchSuppliers(brand.id).then(setSuppliers);
    fetchProducts(brand.id).then(setProducts);
  }, [brand]);

  const productCount = (sid: string) => products.filter(p => p.supplier_id === sid).length;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold">Suppliers</h1>
        <p className="text-sm text-muted-foreground mt-0.5">{brand?.name} — {suppliers.length} suppliers monitored</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {suppliers.map(s => (
          <div key={s.id} className="rounded-lg border bg-card p-4 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold">{s.name}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">{productCount(s.id)} linked SKUs · last activity {new Date(s.last_activity_at).toLocaleDateString()}</p>
              </div>
              <StatusPill status={statusToPill(s.verification_status)} />
            </div>
            <div>
              <div className="flex items-center justify-between text-[11px] text-muted-foreground mb-1">
                <span>Verification score</span><span>{s.verification_score}%</span>
              </div>
              <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${s.verification_score}%`, background: barColor(s.verification_status) }} />
              </div>
            </div>
            {s.notes && <p className="text-[11px] text-muted-foreground italic">{s.notes}</p>}
          </div>
        ))}
      </div>
    </div>
  );
};

export default SuppliersPage;
