import { motion } from "framer-motion";
import { Construction } from "lucide-react";

interface PlaceholderPageProps {
  title: string;
  description: string;
}

const PlaceholderPage = ({ title, description }: PlaceholderPageProps) => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        <p className="text-sm text-muted-foreground mt-1">{description}</p>
      </div>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-lg border bg-card p-12 text-center"
      >
        <Construction className="h-10 w-10 mx-auto text-muted-foreground mb-4" />
        <p className="text-base font-medium">Coming Soon</p>
        <p className="text-sm text-muted-foreground mt-1">
          This module is planned for a future release
        </p>
      </motion.div>
    </div>
  );
};

export default PlaceholderPage;
