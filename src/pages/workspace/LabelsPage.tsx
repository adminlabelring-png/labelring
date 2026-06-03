import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Search, Eye, Download, MoreHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useBrand } from "@/lib/brand-context";
import { fetchProducts, ProductRow } from "@/lib/workspace-queries";
import StatusPill from "@/components/workspace/StatusPill";

const TABS = ["all", "analog", "digital", "archived"] as const;

const LabelsPage = () => {
  const { brand } = useBrand();
  const [rows, setRows] = useState<ProductRow[]>([]);
  const [tab, setTab] = useState<(typeof TABS)[number]>("all");
  const [q, setQ] = useState("");

  useEffect(() => { if (brand) fetchProducts(brand.id).then(setRows); }, [brand]);

  const filtered = useMemo(() => {
    return rows.filter(r => {
      if (tab === "archived" && r.label_status !== "archived") return false;
      if (tab !== "all" && tab !== "archived" && !r.label_types.includes(tab)) return false;
      if (tab !== "archived" && r.label_status === "archived") return false;
      if (q && !`${r.name} ${r.sku}`.toLowerCase().includes(q.toLowerCase())) return false;
      return true;
    });
  }, [rows, tab, q]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-lg font-semibold">Label library</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{brand?.name} — {rows.length} labels</p>
        </div>
        <div className="relative">
          <Search className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={e => setQ(e.target.value)} placeholder="Search SKU or product" className="pl-8 h-8 w-64 text-sm" />
        </div>
      </div>

      <div className="rounded-lg border bg-card">
        <div className="flex items-center gap-1 p-3 border-b">
          {TABS.map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-3 py-1 rounded-md text-xs font-medium capitalize transition-colors ${
                tab === t ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-muted"
              }`}>{t}</button>
          ))}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[11px] uppercase tracking-wider text-muted-foreground bg-muted/50">
                <th className="text-left font-medium px-4 py-2.5">SKU / Product</th>
                <th className="text-left font-medium px-4 py-2.5">Type</th>
                <th className="text-left font-medium px-4 py-2.5">Status</th>
                <th className="text-left font-medium px-4 py-2.5">Version</th>
                <th className="text-left font-medium px-4 py-2.5">Updated</th>
                <th className="text-right font-medium px-4 py-2.5">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => (
                <tr key={p.id} className="border-t hover:bg-muted/30">
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2.5">
                      <div className="h-7 w-7 rounded-md bg-muted border flex items-center justify-center text-sm">{p.thumbnail ?? "📦"}</div>
                      <div>
                        <div className="text-[13px] font-medium">{p.name}</div>
                        <div className="text-[11px] text-muted-foreground">{p.sku}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-2.5 space-x-1">
                    {p.label_types.map(t => (
                      <span key={t} className="inline-block px-1.5 py-0.5 rounded text-[10px] font-medium bg-accent text-accent-foreground">{t}</span>
                    ))}
                  </td>
                  <td className="px-4 py-2.5"><StatusPill status={p.label_status} /></td>
                  <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">{p.label_version}</td>
                  <td className="px-4 py-2.5 text-xs text-muted-foreground">{new Date(p.updated_at).toLocaleDateString()}</td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center justify-end gap-1 text-muted-foreground">
                      <Link to={`/admin/products/${p.product_key}`} className="p-1 hover:text-foreground"><Eye className="h-4 w-4" /></Link>
                      <button className="p-1 hover:text-foreground"><Download className="h-4 w-4" /></button>
                      <button className="p-1 hover:text-foreground"><MoreHorizontal className="h-4 w-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-10 text-center text-sm text-muted-foreground">No labels match.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default LabelsPage;
