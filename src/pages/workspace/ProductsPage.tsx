import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useBrand } from "@/lib/brand-context";
import { fetchProducts, fetchSuppliers, ProductRow, SupplierRow } from "@/lib/workspace-queries";
import StatusPill from "@/components/workspace/StatusPill";

const ProductsPage = () => {
  const { brand } = useBrand();
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [suppliers, setSuppliers] = useState<SupplierRow[]>([]);

  useEffect(() => {
    if (!brand) return;
    fetchProducts(brand.id).then(setProducts);
    fetchSuppliers(brand.id).then(setSuppliers);
  }, [brand]);

  const supplierName = (id: string | null) => suppliers.find(s => s.id === id)?.name ?? "—";
  const isJewelry = brand?.vertical === "jewelry";

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold">Product data</h1>
        <p className="text-sm text-muted-foreground mt-0.5">{brand?.name} — {products.length} SKUs</p>
      </div>

      <div className="rounded-lg border bg-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-[11px] uppercase tracking-wider text-muted-foreground bg-muted/50">
              <th className="text-left font-medium px-4 py-2.5">SKU / Product</th>
              <th className="text-left font-medium px-4 py-2.5">Category</th>
              <th className="text-left font-medium px-4 py-2.5">Supplier</th>
              {isJewelry && <th className="text-left font-medium px-4 py-2.5">Material</th>}
              {isJewelry && <th className="text-left font-medium px-4 py-2.5">Nickel ppm</th>}
              <th className="text-left font-medium px-4 py-2.5">Status</th>
            </tr>
          </thead>
          <tbody>
            {products.map(p => {
              const m = (p.material_data ?? {}) as { metal?: string; nickel_ppm?: number };
              const highNickel = isJewelry && (m.nickel_ppm ?? 0) > 500;
              return (
                <tr key={p.id} className="border-t hover:bg-muted/30">
                  <td className="px-4 py-2.5">
                    <Link to={`/admin/products/${p.product_key}`} className="flex items-center gap-2.5">
                      <div className="h-7 w-7 rounded-md bg-muted border flex items-center justify-center text-sm">{p.thumbnail ?? "📦"}</div>
                      <div>
                        <div className="text-[13px] font-medium">{p.name}</div>
                        <div className="text-[11px] text-muted-foreground">{p.sku}</div>
                      </div>
                    </Link>
                  </td>
                  <td className="px-4 py-2.5 text-xs text-muted-foreground">{p.category}</td>
                  <td className="px-4 py-2.5 text-xs">{supplierName(p.supplier_id)}</td>
                  {isJewelry && <td className="px-4 py-2.5 text-xs">{m.metal ?? "—"}</td>}
                  {isJewelry && (
                    <td className="px-4 py-2.5 text-xs">
                      <span className={highNickel ? "text-[hsl(var(--risk-high))] font-semibold" : ""}>
                        {m.nickel_ppm ?? "—"}
                      </span>
                    </td>
                  )}
                  <td className="px-4 py-2.5"><StatusPill status={p.label_status} /></td>
                </tr>
              );
            })}
            {products.length === 0 && (
              <tr><td colSpan={isJewelry ? 6 : 4} className="px-4 py-10 text-center text-sm text-muted-foreground">No products yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ProductsPage;
