import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, XCircle, QrCode } from "lucide-react";
import { useBrand } from "@/lib/brand-context";
import { fetchProducts, fetchSuppliers, ProductRow, SupplierRow } from "@/lib/workspace-queries";

const DPPPage = () => {
  const { brand } = useBrand();
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [suppliers, setSuppliers] = useState<SupplierRow[]>([]);

  useEffect(() => {
    if (!brand) return;
    fetchProducts(brand.id).then(setProducts);
    fetchSuppliers(brand.id).then(setSuppliers);
  }, [brand]);

  const rows = useMemo(() => products.map(p => {
    const m = (p.material_data ?? {}) as Record<string, unknown>;
    const supplier = suppliers.find(s => s.id === p.supplier_id);
    const checks = [
      { label: "Material data", ok: Object.keys(m).length > 0 },
      { label: "Supplier verified", ok: !!supplier && supplier.verification_status !== "flagged" },
      { label: "Label approved", ok: p.label_status === "approved" },
      { label: "Hallmark declared", ok: brand?.vertical !== "jewelry" || (((m as { metal?: string }).metal ?? "").toLowerCase().includes("silver") || ((m as { metal?: string }).metal ?? "").toLowerCase().includes("gold")) },
    ];
    const score = Math.round((checks.filter(c => c.ok).length / checks.length) * 100);
    return { p, checks, score };
  }), [products, suppliers, brand]);

  const ready = rows.filter(r => r.score === 100).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold">Digital Product Passport</h1>
          <p className="text-sm text-muted-foreground mt-0.5">EU DPP readiness — {ready} of {rows.length} SKUs ready</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {rows.map(({ p, checks, score }) => (
          <div key={p.id} className="rounded-lg border bg-card p-4 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-md bg-muted border flex items-center justify-center text-base">{p.thumbnail ?? "📦"}</div>
                <div>
                  <p className="text-sm font-semibold">{p.name}</p>
                  <p className="text-[11px] text-muted-foreground">{p.sku}</p>
                </div>
              </div>
              <div className="text-right">
                <div className={`text-lg font-semibold ${score === 100 ? "text-[hsl(var(--risk-low))]" : score >= 50 ? "text-[hsl(var(--risk-medium))]" : "text-[hsl(var(--risk-high))]"}`}>{score}%</div>
                <div className="text-[10px] text-muted-foreground inline-flex items-center gap-1"><QrCode className="h-3 w-3" /> Passport</div>
              </div>
            </div>
            <ul className="space-y-1">
              {checks.map(c => (
                <li key={c.label} className="flex items-center gap-2 text-xs">
                  {c.ok ? <CheckCircle2 className="h-3.5 w-3.5 text-[hsl(var(--risk-low))]" /> : <XCircle className="h-3.5 w-3.5 text-[hsl(var(--risk-high))]" />}
                  <span className={c.ok ? "" : "text-muted-foreground"}>{c.label}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
        {rows.length === 0 && <p className="text-sm text-muted-foreground">No products yet.</p>}
      </div>
    </div>
  );
};

export default DPPPage;
