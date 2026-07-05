import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Sparkles,
  CheckCircle2,
  ShieldCheck,
  Barcode,
  Gauge,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import ComparisonTable from "@/components/landing/ComparisonTable";
import RegulationCards from "@/components/landing/RegulationCards";
import EarlyAccessForm from "@/components/landing/EarlyAccessForm";
import LandingFooter from "@/components/landing/LandingFooter";

const audiences = [
  {
    emoji: "🍱",
    title: "Food & FMCG",
    body: "Allergen declarations, ingredient lists, nutritional data, HFSS classification — all managed in one place.",
  },
  {
    emoji: "💄",
    title: "Cosmetics & Wellness",
    body: "UK Cosmetics Regulation compliance, responsible person details, CMR substance checks, and claims verification.",
  },
  {
    emoji: "📦",
    title: "Importers & Distributors",
    body: "Selling into multiple regulatory environments simultaneously? Labelring maintains one verified product record that adapts per market.",
  },
];

const howItWorks = [
  {
    icon: Barcode,
    title: "1. Add your product",
    body: "Scan a barcode or upload existing artwork. We pull known data from GS1 and Open Food Facts.",
  },
  {
    icon: ShieldCheck,
    title: "2. Fill the gaps",
    body: "The dashboard shows exactly which fields are missing for your category and market.",
  },
  {
    icon: Gauge,
    title: "3. Publish & export",
    body: "Get a live compliance score, print-ready label, and one-click DPP export.",
  },
];

const LandingPage = () => {
  return (
    <div className="space-y-14 pb-4">
      {/* HERO */}
      <section className="relative overflow-hidden rounded-2xl border bg-card">
        <div
          className="absolute inset-0 opacity-60 pointer-events-none"
          style={{
            background:
              "radial-gradient(1200px 400px at 20% -10%, hsl(var(--accent)) 0%, transparent 60%), radial-gradient(800px 300px at 100% 0%, hsl(var(--muted)) 0%, transparent 55%)",
          }}
        />
        <div className="relative grid grid-cols-1 lg:grid-cols-5 gap-8 p-8 md:p-12">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-3 space-y-6"
          >
            <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border bg-background text-muted-foreground">
              <Sparkles className="h-3 w-3" /> Early access · UK 2026 regulation ready
            </span>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight leading-[1.05]">
              Your shortcut to compliant products.
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl leading-relaxed">
              Create digital labels, manage product data, and stay ahead of changing regulations — all in one place.
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link to="/generate">
                <Button size="lg" className="gap-2">
                  Create your digital label
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link to="/scan">
                <Button variant="outline" size="lg" className="gap-2">
                  Scan to check compliance
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <a href="#how-it-works">
                <Button variant="ghost" size="lg" className="gap-1">
                  See how it works <ArrowRight className="h-4 w-4" />
                </Button>
              </a>
            </div>

            <div className="flex flex-wrap gap-4 pt-2 text-xs text-muted-foreground">
              {["UK FIC ready", "EU DPP export", "EPR recycling labels", "HFSS classification"].map((t) => (
                <span key={t} className="inline-flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-[hsl(var(--risk-low))]" /> {t}
                </span>
              ))}
            </div>
          </motion.div>

          {/* Mock compliance card */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-2"
          >
            <div className="rounded-xl border bg-background/80 backdrop-blur p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="text-xs font-medium text-muted-foreground">Live compliance score</div>
                <span className="text-[10px] px-1.5 py-0.5 rounded font-mono bg-muted">SKU · 4820</span>
              </div>
              <div className="flex items-end gap-3">
                <div className="text-4xl font-semibold tabular-nums">86<span className="text-lg text-muted-foreground">%</span></div>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-[hsl(var(--risk-low-bg))] text-[hsl(var(--risk-low))] font-medium mb-1.5">
                  Retail ready
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                <div className="h-full bg-[hsl(var(--risk-low))]" style={{ width: "86%" }} />
              </div>
              <div className="space-y-2 pt-1">
                {[
                  { label: "Ingredients & allergens", ok: true },
                  { label: "Nutrition declaration", ok: true },
                  { label: "Net quantity (PRMA 2025)", ok: true },
                  { label: "EPR recycling label", ok: false },
                  { label: "DPP data record", ok: false },
                ].map((r) => (
                  <div key={r.label} className="flex items-center justify-between text-xs">
                    <span className="text-foreground/80">{r.label}</span>
                    <span
                      className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
                        r.ok
                          ? "bg-[hsl(var(--risk-low-bg))] text-[hsl(var(--risk-low))]"
                          : "bg-[hsl(var(--risk-medium-bg))] text-[hsl(var(--risk-medium))]"
                      }`}
                    >
                      {r.ok ? "Pass" : "Action"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* PROBLEM / COMPARISON */}
      <section className="space-y-5">
        <div className="max-w-2xl">
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
            Right now, UK labelling is broken. And it's getting more expensive to get wrong.
          </h2>
        </div>
        <ComparisonTable />
      </section>

      {/* WHO IT'S FOR */}
      <section className="space-y-5">
        <div className="max-w-2xl">
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
            Built for regulated consumer brands.
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {audiences.map((a, i) => (
            <motion.div
              key={a.title}
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="rounded-xl border bg-card p-6 space-y-3"
            >
              <div className="text-3xl">{a.emoji}</div>
              <h3 className="font-semibold text-base">{a.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{a.body}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* REGULATION WAVES */}
      <section className="space-y-5">
        <div className="max-w-2xl">
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
            Four regulatory waves. One platform built for all of them.
          </h2>
        </div>
        <RegulationCards />
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="space-y-5">
        <div className="max-w-2xl">
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">How Labelring works</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {howItWorks.map((s, i) => (
            <motion.div
              key={s.title}
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="rounded-xl border bg-card p-6 space-y-3"
            >
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <s.icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-semibold">{s.title}</h3>
              <p className="text-sm text-muted-foreground">{s.body}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* EARLY ACCESS */}
      <section id="early-access" className="space-y-5">
        <div className="max-w-2xl">
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
            Join the brands getting compliant before the deadline.
          </h2>
          <p className="text-muted-foreground mt-3 leading-relaxed">
            We're working with a small group of UK food, cosmetics, and import brands ahead of public launch. Early access includes free onboarding support and a compliance audit of your existing labels.
          </p>
        </div>
        <EarlyAccessForm />
      </section>

      <LandingFooter />
    </div>
  );
};

export default LandingPage;
