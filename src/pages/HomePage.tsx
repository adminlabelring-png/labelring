import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ShieldCheck, Upload, ArrowRight, Calendar, CheckCircle, AlertTriangle, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";

const HomePage = () => {
  return (
    <div className="space-y-8">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl border bg-card p-8 text-center space-y-4"
      >
        <div className="mx-auto h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center">
          <ShieldCheck className="h-8 w-8 text-primary" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Make your product retail-ready</h1>
        <p className="text-muted-foreground max-w-lg mx-auto">
          Upload your product label and get instant compliance checks, risk assessments, and suggested fixes — before your label hits the shelf.
        </p>
        <div className="flex items-center justify-center gap-3 pt-2">
          <Link to="/upload">
            <Button size="lg" className="gap-2">
              <Upload className="h-4 w-4" />
              Check a Label Now
            </Button>
          </Link>
          <Link to="/compliance">
            <Button variant="outline" size="lg" className="gap-2">
              View Compliance
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </motion.div>

      {/* Value props */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { icon: CheckCircle, title: "Instant Compliance Score", desc: "Get a percentage score showing how retail-ready your label is" },
          { icon: AlertTriangle, title: "Risk Detection", desc: "Catch allergen, regulatory, and labelling issues before they become costly" },
          { icon: BarChart3, title: "Actionable Fixes", desc: "Auto-generated compliant versions so you can fix issues in minutes" },
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

      {/* CTA */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="rounded-xl border-2 border-primary/20 bg-primary/5 p-8 text-center space-y-4"
      >
        <Calendar className="h-8 w-8 text-primary mx-auto" />
        <h2 className="text-xl font-bold">Want a free label review?</h2>
        <p className="text-muted-foreground max-w-md mx-auto">
          Our compliance experts will review your labels and help you get retail-ready — no obligation.
        </p>
        <Button size="lg" className="gap-2">
          <Calendar className="h-4 w-4" />
          Book a Call
        </Button>
      </motion.div>
    </div>
  );
};

export default HomePage;
