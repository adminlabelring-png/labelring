import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Sparkles, Loader2, Download, QrCode, Share2, Copy } from "lucide-react";
import QRCode from "qrcode";
import jsPDF from "jspdf";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";

import { emptyLabel, evaluateLabel, type LabelFields } from "@/lib/label-rules";
import { generatePreview, suggestField } from "@/lib/generate-label";
import { supabase } from "@/integrations/supabase/client";
import { getLeadId } from "@/lib/lead-tracker";
import LivePreview from "@/components/generator/LivePreview";
import ComplianceCheck from "@/components/generator/ComplianceCheck";

const CATEGORIES = ["Skincare", "Food", "Beverage", "Supplement", "Household", "Other"];

const AI_FIELDS: (keyof LabelFields)[] = [
  "brandName",
  "productName",
  "ingredients",
  "allergens",
  "countryOfOrigin",
  "netQuantity",
  "batchNumber",
  "bestBefore",
  "responsiblePerson",
  "certifications",
];

const GenerateLabelPage = () => {
  const [fields, setFields] = useState<LabelFields>(emptyLabel);
  const [preview, setPreview] = useState("");
  const [previewLoading, setPreviewLoading] = useState(false);
  const [busyField, setBusyField] = useState<string | null>(null);
  const [qrOpen, setQrOpen] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [shareUrl, setShareUrl] = useState("");
  const [saving, setSaving] = useState(false);

  const set = <K extends keyof LabelFields>(k: K, v: string) =>
    setFields((f) => ({ ...f, [k]: v }));

  const { score, rules } = useMemo(() => evaluateLabel(fields), [fields]);

  const hasAnyData = useMemo(
    () => Object.values(fields).some((v) => v.trim().length > 0),
    [fields]
  );

  // Debounced preview generation
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!hasAnyData) {
      setPreview("");
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setPreviewLoading(true);
      try {
        const p = await generatePreview(fields);
        setPreview(p);
      } catch {
        // silent
      } finally {
        setPreviewLoading(false);
      }
    }, 900);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    fields.brandName,
    fields.productName,
    fields.category,
    fields.ingredients,
    fields.allergens,
    fields.countryOfOrigin,
    fields.netQuantity,
    fields.batchNumber,
    fields.bestBefore,
    fields.responsiblePerson,
    fields.certifications,
  ]);

  const handleSuggest = useCallback(
    async (field: keyof LabelFields) => {
      setBusyField(field);
      try {
        const value = await suggestField(field, fields);
        set(field, value);
      } catch (e) {
        const msg = e instanceof Error ? e.message : "";
        if (msg.includes("429")) toast.error("Rate limit — try again in a moment.");
        else if (msg.includes("402")) toast.error("AI credits exhausted.");
        else toast.error("Couldn't generate suggestion");
      } finally {
        setBusyField(null);
      }
    },
    [fields]
  );

  const scoreColor =
    score >= 80
      ? "text-[hsl(var(--risk-low))]"
      : score >= 50
      ? "text-[hsl(var(--risk-medium))]"
      : "text-[hsl(var(--risk-high))]";

  const saveLabel = async (): Promise<string> => {
    setSaving(true);
    try {
      const { data, error } = await supabase
        .from("generated_labels")
        .insert({
          brand_name: fields.brandName || null,
          product_name: fields.productName || null,
          category: fields.category || null,
          ingredients: fields.ingredients || null,
          allergens: fields.allergens || null,
          country_of_origin: fields.countryOfOrigin || null,
          net_quantity: fields.netQuantity || null,
          batch_number: fields.batchNumber || null,
          best_before: fields.bestBefore || null,
          responsible_person: fields.responsiblePerson || null,
          certifications: fields.certifications || null,
          preview_text: preview || null,
          compliance_score: score,
          lead_id: getLeadId(),
        })
        .select("id")
        .single();
      if (error) throw error;
      return `${window.location.origin}/label/${data.id}`;
    } finally {
      setSaving(false);
    }
  };

  const handleCopyQr = async () => {
    try {
      const url = await saveLabel();
      const dataUrl = await QRCode.toDataURL(url, { width: 240, margin: 1 });
      setShareUrl(url);
      setQrDataUrl(dataUrl);
      setQrOpen(true);
      await navigator.clipboard.writeText(url);
      toast.success("Link copied to clipboard");
    } catch {
      toast.error("Failed to generate QR link");
    }
  };

  const handleShare = async () => {
    try {
      const url = await saveLabel();
      if (navigator.share) {
        await navigator.share({
          title: fields.productName || "Product label",
          text: `Digital label for ${fields.productName || "product"}`,
          url,
        });
      } else {
        await navigator.clipboard.writeText(url);
        toast.success("Link copied to clipboard");
      }
    } catch {
      /* user cancelled or error */
    }
  };

  const handleExport = () => {
    const doc = new jsPDF();
    const w = doc.internal.pageSize.getWidth();
    doc.setFillColor(30, 64, 120);
    doc.rect(0, 0, w, 32, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("Digital Product Label", 14, 14);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(`Compliance score: ${score}%  ·  Generated ${new Date().toLocaleDateString("en-GB")}`, 14, 24);

    doc.setTextColor(40, 40, 40);
    doc.setFontSize(11);
    const body = preview || "(no preview yet)";
    const lines = doc.splitTextToSize(body, w - 28);
    doc.text(lines, 14, 44);

    let y = 44 + lines.length * 5 + 10;
    if (y > 250) { doc.addPage(); y = 20; }
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 64, 120);
    doc.text("Compliance check", 14, y);
    y += 6;
    doc.setDrawColor(30, 64, 120);
    doc.line(14, y, w - 14, y);
    y += 6;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(40, 40, 40);
    rules.forEach((r) => {
      const mark = r.status === "ok" ? "OK" : r.status === "review" ? "REVIEW" : "MISSING";
      doc.text(`• ${r.label} — ${mark}`, 16, y);
      y += 6;
    });

    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);
    doc.text(
      "Automated label draft. Verify against official regulations before print.",
      14,
      285
    );

    const filename = (fields.productName || "label").replace(/[^a-z0-9]+/gi, "-").toLowerCase();
    doc.save(`${filename}-label.pdf`);
  };

  // Field row with optional AI suggest button
  const withSuggest = (field: keyof LabelFields, node: React.ReactNode) => (
    <div className="space-y-1.5 min-w-0">
      <div className="flex items-center justify-between gap-2">
        <Label htmlFor={field} className="text-xs font-medium truncate min-w-0">
          {FIELD_LABELS[field]}
        </Label>
        {AI_FIELDS.includes(field) && (
          <button
            type="button"
            onClick={() => handleSuggest(field)}
            disabled={busyField === field}
            className="inline-flex shrink-0 whitespace-nowrap items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-medium text-primary hover:bg-primary/10 disabled:opacity-50"
          >
            {busyField === field ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Sparkles className="h-3 w-3" />
            )}
            Suggest
          </button>
        )}
      </div>
      {node}
    </div>
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 md:px-8 md:py-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between border-b pb-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Label Generator</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Build a retail-ready product label with AI help
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">Compliance score</span>
          <span className={`text-2xl font-bold ${scoreColor}`}>{score}%</span>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr,420px]">
        {/* LEFT: form */}
        <div className="space-y-6">
          <section className="rounded-lg border bg-card p-5">
            <h2 className="mb-4 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Product details
            </h2>
            <div className="space-y-4">
              {withSuggest(
                "brandName",
                <Input
                  id="brandName"
                  placeholder="e.g. Pura Naturals"
                  value={fields.brandName}
                  onChange={(e) => set("brandName", e.target.value)}
                />
              )}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {withSuggest(
                  "productName",
                  <Input
                    id="productName"
                    placeholder="e.g. Aloe Gel"
                    value={fields.productName}
                    onChange={(e) => set("productName", e.target.value)}
                  />
                )}
                <div className="space-y-1.5">
                  <Label htmlFor="category" className="text-xs font-medium">
                    Category
                  </Label>
                  <Select value={fields.category} onValueChange={(v) => set("category", v)}>
                    <SelectTrigger id="category">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-lg border bg-card p-5">
            <h2 className="mb-4 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Ingredients & allergens
            </h2>
            <div className="space-y-4">
              {withSuggest(
                "ingredients",
                <Textarea
                  id="ingredients"
                  rows={3}
                  placeholder="e.g. Aqua, Aloe Barbadensis Leaf Juice, Glycerin…"
                  value={fields.ingredients}
                  onChange={(e) => set("ingredients", e.target.value)}
                />
              )}
              {withSuggest(
                "allergens",
                <Input
                  id="allergens"
                  placeholder="e.g. Limonene, Linalool"
                  value={fields.allergens}
                  onChange={(e) => set("allergens", e.target.value)}
                />
              )}
            </div>
          </section>

          <section className="rounded-lg border bg-card p-5">
            <h2 className="mb-4 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Origin & compliance
            </h2>
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {withSuggest(
                  "countryOfOrigin",
                  <Input
                    id="countryOfOrigin"
                    placeholder="e.g. United Kingdom"
                    value={fields.countryOfOrigin}
                    onChange={(e) => set("countryOfOrigin", e.target.value)}
                  />
                )}
                {withSuggest(
                  "netQuantity",
                  <Input
                    id="netQuantity"
                    placeholder="e.g. 200ml"
                    value={fields.netQuantity}
                    onChange={(e) => set("netQuantity", e.target.value)}
                  />
                )}
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {withSuggest(
                  "batchNumber",
                  <Input
                    id="batchNumber"
                    placeholder="e.g. BT-2026-441"
                    value={fields.batchNumber}
                    onChange={(e) => set("batchNumber", e.target.value)}
                  />
                )}
                {withSuggest(
                  "bestBefore",
                  <Input
                    id="bestBefore"
                    placeholder="e.g. 06/2028"
                    value={fields.bestBefore}
                    onChange={(e) => set("bestBefore", e.target.value)}
                  />
                )}
              </div>
              {withSuggest(
                "responsiblePerson",
                <Input
                  id="responsiblePerson"
                  placeholder="e.g. Pura Ltd, London EC1A 1BB"
                  value={fields.responsiblePerson}
                  onChange={(e) => set("responsiblePerson", e.target.value)}
                />
              )}
              {withSuggest(
                "certifications",
                <Input
                  id="certifications"
                  placeholder="e.g. Organic, Cruelty Free, Vegan"
                  value={fields.certifications}
                  onChange={(e) => set("certifications", e.target.value)}
                />
              )}
            </div>
          </section>
        </div>

        {/* RIGHT: preview + compliance + actions */}
        <div className="space-y-6 lg:sticky lg:top-4 lg:self-start">
          <section>
            <h2 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Live digital label
            </h2>
            <LivePreview preview={preview} loading={previewLoading} hasData={hasAnyData} />
          </section>

          <section>
            <h2 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Compliance check
            </h2>
            <ComplianceCheck rules={rules} />
          </section>

          <div className="grid grid-cols-3 gap-2">
            <Button
              variant="outline"
              onClick={handleCopyQr}
              disabled={saving || !hasAnyData}
              className="h-auto flex-col gap-1 py-3"
            >
              <QrCode className="h-4 w-4" />
              <span className="text-[11px] leading-tight">Copy QR link</span>
            </Button>
            <Button
              variant="outline"
              onClick={handleExport}
              disabled={!hasAnyData}
              className="h-auto flex-col gap-1 py-3"
            >
              <Download className="h-4 w-4" />
              <span className="text-[11px] leading-tight">Export label</span>
            </Button>
            <Button
              variant="outline"
              onClick={handleShare}
              disabled={saving || !hasAnyData}
              className="h-auto flex-col gap-1 py-3"
            >
              <Share2 className="h-4 w-4" />
              <span className="text-[11px] leading-tight">Share</span>
            </Button>
          </div>

          <p className="text-[11px] text-muted-foreground">
            This is an AI-assisted draft. Verify against your official regulatory
            guidance before print.
          </p>
        </div>
      </div>

      <Dialog open={qrOpen} onOpenChange={setQrOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Share this label</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4">
            {qrDataUrl && (
              <img src={qrDataUrl} alt="QR code" className="rounded-md border" />
            )}
            <div className="flex w-full items-center gap-2">
              <Input readOnly value={shareUrl} className="text-xs" />
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  navigator.clipboard.writeText(shareUrl);
                  toast.success("Copied");
                }}
              >
                <Copy className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const FIELD_LABELS: Record<keyof LabelFields, string> = {
  brandName: "Brand name",
  productName: "Product name",
  category: "Category",
  ingredients: "Ingredients",
  allergens: "Allergens (comma separated)",
  countryOfOrigin: "Country of origin",
  netQuantity: "Net quantity",
  batchNumber: "Batch number",
  bestBefore: "Best before",
  responsiblePerson: "Responsible person (UK)",
  certifications: "Certifications (comma separated)",
};

export default GenerateLabelPage;
