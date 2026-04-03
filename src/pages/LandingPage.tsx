import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ScanLine, Upload, ArrowRight, CheckCircle, AlertTriangle, FileText, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";

const LandingPage = () => {
  return (
    <div className="space-y-8">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl border bg-card p-8 md:p-12 text-center space-y-5"
      >
        <div className="mx-auto h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center">
          <ScanLine className="h-8 w-8 text-primary" />
        </div>
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
          Scan your product label and get a quick review
        </h1>
        <p className="text-muted-foreground max-w-xl mx-auto text-base">
          Upload your label image or PDF and instantly see what's there, what's missing, and what needs attention — in under 2 minutes.
        </p>
        <div className="flex items-center justify-center gap-3 pt-2">
          <Link to="/scan">
            <Button size="lg" className="gap-2">
              <Upload className="h-4 w-4" />
              Upload / Scan
            </Button>
          </Link>
        </div>
      </motion.div>

      {/* How it works */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { icon: Upload, title: "1. Upload your label", desc: "Drop an image (JPG, PNG) or PDF of your product label" },
          { icon: ScanLine, title: "2. We scan it", desc: "Text is extracted and mapped to key label fields automatically" },
          { icon: FileText, title: "3. Get your review", desc: "See what's found, what's missing, and take action" },
        ].map((item, i) => (
          <motion.div
            key={item.title}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.05 }}
            className="rounded-lg border bg-card p-5 space-y-3"
          >
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <item.icon className="h-5 w-5 text-primary" />
            </div>
            <h3 className="font-semibold">{item.title}</h3>
            <p className="text-sm text-muted-foreground">{item.desc}</p>
          </motion.div>
        ))}
      </div>

      {/* Value props */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { icon: CheckCircle, title: "Identify what's there", desc: "Quickly see which key fields were detected on your label" },
          { icon: AlertTriangle, title: "Spot what's missing", desc: "Find gaps in allergens, responsible person details, expiry info and more" },
          { icon: ArrowRight, title: "Take next steps", desc: "Download a review report or book a call with our team" },
        ].map((item, i) => (
          <motion.div
            key={item.title}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 + i * 0.05 }}
            className="rounded-lg border bg-card p-5 space-y-3"
          >
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <item.icon className="h-5 w-5 text-primary" />
            </div>
            <h3 className="font-semibold">{item.title}</h3>
            <p className="text-sm text-muted-foreground">{item.desc}</p>
          </motion.div>
        ))}
      </div>

      {/* CTA */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="rounded-xl border-2 border-primary/20 bg-primary/5 p-8 text-center space-y-4"
      >
        <Calendar className="h-8 w-8 text-primary mx-auto" />
        <h2 className="text-xl font-bold">Want a free label review?</h2>
        <p className="text-muted-foreground max-w-md mx-auto">
          Our experts will review your labels and help you get retail-ready — no obligation.
        </p>
        <Button size="lg" className="gap-2">
          <Calendar className="h-4 w-4" />
          Book a Call
        </Button>
      </motion.div>
    </div>
  );
};

export default LandingPage;
