import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Calendar } from "lucide-react";
import { useBrand } from "@/lib/brand-context";
import { fetchProducts, ProductRow } from "@/lib/workspace-queries";
import StatusPill from "@/components/workspace/StatusPill";

const SeasonalPage = () => {
  const { brand } = useBrand();
  const [products, setProducts] = useState<ProductRow[]>([]);
  useEffect(() => { if (brand) fetchProducts(brand.id).then(rs => setProducts(rs.filter(p => p.is_seasonal))); }, [brand]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold">Seasonal SKUs</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Limited-run products with stricter compliance checks</p>
      </div>

      {products.length === 0 ? (
        <div className="rounded-lg border bg-card p-10 text-center text-sm text-muted-foreground">No seasonal SKUs for {brand?.name}.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {products.map(p => {
            const days = p.launch_date ? Math.round((+new Date(p.launch_date) - Date.now()) / 86400000) : null;
            return (
              <Link key={p.id} to={`/admin/products/${p.product_key}`} className="rounded-lg border bg-card p-4 hover:bg-muted/30 transition-colors">
                <div className="flex items-start gap-3">
                  <div className="h-9 w-9 rounded-md bg-muted border flex items-center justify-center text-base">{p.thumbnail ?? "📦"}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold truncate">{p.name}</p>
                      <StatusPill status={p.label_status} />
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{p.sku} · {p.season_tag}</p>
                    {p.launch_date && (
                      <p className="text-[11px] mt-2 inline-flex items-center gap-1 text-muted-foreground">
                        <Calendar className="h-3 w-3" /> Launch {new Date(p.launch_date).toLocaleDateString()}
                        {days != null && days >= 0 && <span className="ml-1 text-[hsl(var(--risk-medium))]">· {days} days</span>}
                      </p>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SeasonalPage;
