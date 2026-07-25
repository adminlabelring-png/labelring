import { FileText, Loader2 } from "lucide-react";
import { type Pack } from "@/lib/label-rules";
import { splitAllergenHighlights } from "@/lib/allergens";

interface Props {
  preview: string;
  loading: boolean;
  hasData: boolean;
  pack?: Pack;
}

const LivePreview = ({ preview, loading, hasData, pack }: Props) => {
  if (!hasData) {
    return (
      <div className="rounded-md border-2 border-dashed border-border bg-muted/30 p-8 text-center">
        <FileText className="mx-auto h-8 w-8 text-muted-foreground/60" />
        <p className="mt-2 text-sm text-muted-foreground">
          Fill in your product details<br />to generate a digital label
        </p>
      </div>
    );
  }

  const segments = pack === "food" ? splitAllergenHighlights(preview) : null;

  return (
    <div className="relative rounded-md border bg-card p-5 min-h-[240px]">
      {loading && (
        <div className="absolute right-3 top-3 flex items-center gap-1.5 text-xs text-muted-foreground">
          <Loader2 className="h-3 w-3 animate-spin" /> Composing…
        </div>
      )}
      <pre className="whitespace-pre-wrap font-sans text-[13px] leading-relaxed text-foreground">
        {segments
          ? segments.map((seg, i) =>
              seg.isAllergen ? (
                <strong key={i} className="font-bold underline">
                  {seg.text}
                </strong>
              ) : (
                <span key={i}>{seg.text}</span>
              )
            )
          : preview || "Waiting for AI…"}
      </pre>
    </div>
  );
};

export default LivePreview;
