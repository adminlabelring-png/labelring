import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ScanLine } from "lucide-react";
import { useScan, buildScanResult, generateMockResult } from "@/lib/scan-context";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const steps = [
  "Reading label image…",
  "Uploading to analysis engine…",
  "Extracting text (OCR)…",
  "Mapping fields…",
  "Detecting category…",
  "Preparing review…",
];

const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Strip the data:...;base64, prefix
      const base64 = result.split(",")[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

const ScanProcessingPage = () => {
  const { file, setResult } = useScan();
  const navigate = useNavigate();
  const [stepIndex, setStepIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const calledRef = useRef(false);

  useEffect(() => {
    if (!file) {
      navigate("/scan", { replace: true });
      return;
    }

    if (calledRef.current) return;
    calledRef.current = true;

    // Animate steps on a timer
    const stepTimer = setInterval(() => {
      setStepIndex((prev) => (prev < steps.length - 1 ? prev + 1 : prev));
    }, 3000);

    const progressTimer = setInterval(() => {
      setProgress((prev) => (prev >= 95 ? 95 : prev + 1));
    }, 200);

    const analyzeLabel = async () => {
      try {
        const imageBase64 = await fileToBase64(file);

        const { data, error } = await supabase.functions.invoke("analyze-label", {
          body: { imageBase64, fileName: file.name },
        });

        if (error) throw error;

        if (data?.error) {
          throw new Error(data.error);
        }

        const result = buildScanResult(file.name, data);
        setProgress(100);
        setStepIndex(steps.length - 1);

        // Persist scan (file + results) to Lovable Cloud — fire & forget so UX is never blocked
        (async () => {
          try {
            const ext = file.name.split(".").pop() ?? "bin";
            const path = `${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}.${ext}`;
            const { error: upErr } = await supabase.storage
              .from("scans")
              .upload(path, file, { contentType: file.type, upsert: false });
            if (upErr) console.warn("scan upload failed", upErr);

            const params = new URLSearchParams(window.location.search);
            await supabase.from("scans").insert({
              file_name: file.name,
              file_path: upErr ? null : path,
              mime_type: file.type,
              category: result.category,
              found_count: result.foundCount,
              total_count: result.totalCount,
              needs_attention_count: result.needsAttentionCount,
              fields: result.fields as any,
              lead_id: params.get("lead"),
              user_agent: navigator.userAgent,
              referrer: document.referrer || null,
            });
          } catch (e) {
            console.warn("scan persist failed", e);
          }
        })();

        // Brief pause so user sees 100%
        setTimeout(() => {
          setResult(result);
          navigate("/scan/results", { replace: true });
        }, 500);
      } catch (err) {
        console.error("Analysis failed, using fallback:", err);
        toast.error("AI analysis failed — showing demo results instead");

        const fallback = generateMockResult(file.name);
        setProgress(100);
        setTimeout(() => {
          setResult(fallback);
          navigate("/scan/results", { replace: true });
        }, 500);
      }
    };

    analyzeLabel();

    return () => {
      clearInterval(stepTimer);
      clearInterval(progressTimer);
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
