import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ScanLine } from "lucide-react";
import { useScan, generateMockResult } from "@/lib/scan-context";

const steps = [
  "Reading label image…",
  "Extracting text…",
  "Mapping fields…",
  "Detecting category…",
  "Preparing review…",
];

const ScanProcessingPage = () => {
  const { file, setResult } = useScan();
  const navigate = useNavigate();
  const [stepIndex, setStepIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!file) {
      navigate("/scan", { replace: true });
      return;
    }

    const totalDuration = 3000;
    const stepDuration = totalDuration / steps.length;

    const stepTimer = setInterval(() => {
      setStepIndex(prev => {
        if (prev < steps.length - 1) return prev + 1;
        return prev;
      });
    }, stepDuration);

    const progressTimer = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) return 100;
        return prev + 2;
      });
    }, totalDuration / 50);

    const finishTimer = setTimeout(() => {
      const result = generateMockResult(file.name);
      setResult(result);
      navigate("/scan/results", { replace: true });
    }, totalDuration);

    return () => {
      clearInterval(stepTimer);
      clearInterval(progressTimer);
      clearTimeout(finishTimer);
    };
  }, [file, navigate, setResult]);

  return (
    <div className="max-w-md mx-auto flex flex-col items-center justify-center min-h-[60vh] space-y-8">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
      >
        <ScanLine className="h-16 w-16 text-primary" />
      </motion.div>

      <div className="text-center space-y-2">
        <h2 className="text-xl font-semibold">Analysing your label…</h2>
        <motion.p
          key={stepIndex}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-sm text-muted-foreground"
        >
          {steps[stepIndex]}
        </motion.p>
      </div>

      {/* Progress bar */}
      <div className="w-full max-w-xs">
        <div className="relative h-2 w-full overflow-hidden rounded-full bg-secondary">
          <motion.div
            className="h-full bg-primary rounded-full"
            style={{ width: `${progress}%` }}
            transition={{ ease: "linear" }}
          />
        </div>
        <p className="text-xs text-muted-foreground text-center mt-2">{Math.min(progress, 100)}%</p>
      </div>

      {file && (
        <p className="text-xs text-muted-foreground">
          File: {file.name}
        </p>
      )}
    </div>
  );
};

export default ScanProcessingPage;
