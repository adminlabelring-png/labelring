import { Scale, Recycle, QrCode, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";

const regulations = [
  {
    icon: Scale,
    pill: "In force Jan 2026",
    title: "Product Regulation & Metrology Act 2025",
    body: "Correct weights, volumes, and counts are now a legal requirement on all packaged goods. Labelring flags non-compliant fields before your label goes live.",
  },
  {
    icon: Recycle,
    pill: "From March 2026",
    title: "Extended Producer Responsibility (EPR)",
    body: "All packaging must carry a 'recycle' or 'do not recycle' label. 71% of producers know this is coming. Only 57% know how to apply it. Labelring tells you exactly which label your packaging needs.",
  },
  {
    icon: QrCode,
    pill: "Phasing in 2026–2030",
    title: "EU Digital Product Passport (DPP)",
    body: "Brands selling into the EU will need a machine-readable product record linked to the EU registry. Labelring is the infrastructure layer that makes this possible — and exportable in one click.",
  },
  {
    icon: AlertTriangle,
    pill: "Effective 2026",
    title: "HFSS & Cosmetics Regulation Changes",
    body: "HFSS product classification, CMR substance bans, and formaldehyde labelling requirements all take effect in 2026. Labelring tracks these automatically and flags affected SKUs.",
  },
];

const RegulationCards = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    {regulations.map((r, i) => (
      <motion.div
        key={r.title}
        initial={{ opacity: 0, y: 8 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: i * 0.05 }}
        className="rounded-xl border bg-card p-6 space-y-3 border-l-2 border-l-primary"
      >
        <div className="flex items-center justify-between">
          <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
            <r.icon className="h-4 w-4 text-primary" />
          </div>
          <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-accent text-accent-foreground">
            {r.pill}
          </span>
        </div>
        <h3 className="font-semibold text-base">{r.title}</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">{r.body}</p>
      </motion.div>
    ))}
  </div>
);

export default RegulationCards;
