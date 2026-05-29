import { useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, FileImage, FileText, X, Camera, ImageIcon, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useScan } from "@/lib/scan-context";
import { useIsMobile } from "@/hooks/use-mobile";

const ACCEPTED = ".jpg,.jpeg,.png,.pdf";
const SEASON_TAGS = ["Christmas", "Diwali", "Easter", "Summer", "Promo Pack", "Limited Edition"];

const ScanUploadPage = () => {
  const { setFile, options, setOptions } = useScan();
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const isMobile = useIsMobile();
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const handleFile = useCallback((file: File) => {
    setSelectedFile(file);
    if (file.type.startsWith("image/")) {
      const url = URL.createObjectURL(file);
      setPreview(url);
    } else {
      setPreview(null);
    }
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }, [handleFile]);

  const onSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) handleFile(f);
  }, [handleFile]);

  const startScan = () => {
    if (!selectedFile) return;
    setFile(selectedFile);
    navigate("/scan/processing");
  };

  const clear = () => {
    setSelectedFile(null);
    setPreview(null);
    if (inputRef.current) inputRef.current.value = "";
    if (cameraRef.current) cameraRef.current.value = "";
  };

  const seasonalPanel = (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.08 }}
      className={`rounded-xl border p-4 transition-colors ${
        options.isSeasonal
          ? "border-[hsl(var(--risk-medium)/0.5)] bg-[hsl(var(--risk-medium-bg))]"
          : "bg-card"
      }`}
    >
      <div className="flex items-start gap-3">
        <Sparkles className={`h-5 w-5 mt-0.5 shrink-0 ${options.isSeasonal ? "text-[hsl(var(--risk-medium))]" : "text-muted-foreground"}`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium">Seasonal / Promo SKU</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Apply stricter checks for limited editions, promo packs, and seasonal launches.
              </p>
            </div>
            <Switch
              checked={options.isSeasonal}
              onCheckedChange={(v) => setOptions({ ...options, isSeasonal: v, seasonTag: v ? options.seasonTag : null })}
            />
          </div>
          <AnimatePresence>
            {options.isSeasonal && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-[hsl(var(--risk-medium)/0.3)]">
                  {SEASON_TAGS.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => setOptions({ ...options, seasonTag: options.seasonTag === tag ? null : tag })}
                      className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                        options.seasonTag === tag
                          ? "bg-[hsl(var(--risk-medium))] text-white"
                          : "bg-background border hover:bg-accent"
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );

  // Mobile layout: big action buttons first, no scrolling needed
  if (isMobile) {
    return (
      <div className="flex flex-col min-h-[80vh] px-2">
        <input ref={inputRef} type="file" accept={ACCEPTED} onChange={onSelect} className="hidden" />
        <input ref={cameraRef} type="file" accept="image/*" capture="environment" onChange={onSelect} className="hidden" />

        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="text-center pt-4 pb-6">
          <h1 className="text-xl font-semibold tracking-tight">Scan your label</h1>
          <p className="text-sm text-muted-foreground mt-1">Take a photo or upload an image to get started</p>
        </motion.div>

        {selectedFile ? (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex-1 flex flex-col items-center justify-center gap-4">
            {preview ? (
              <img src={preview} alt="Label preview" className="max-h-48 rounded-xl object-contain border" />
            ) : (
              <FileText className="h-20 w-20 text-primary" />
            )}
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium truncate max-w-[200px]">{selectedFile.name}</span>
              <button onClick={clear} className="text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="w-full max-w-xs">{seasonalPanel}</div>
            <Button onClick={startScan} size="lg" className="w-full max-w-xs gap-2 h-14 text-base">
              <FileImage className="h-5 w-5" />
              Scan Label
            </Button>
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="flex-1 flex flex-col gap-4 justify-center">
            <Button
              onClick={() => cameraRef.current?.click()}
              size="lg"
              className="w-full gap-3 h-16 text-base rounded-xl"
            >
              <Camera className="h-6 w-6" />
              Take Photo
            </Button>
            <Button
              onClick={() => inputRef.current?.click()}
              variant="outline"
              size="lg"
              className="w-full gap-3 h-16 text-base rounded-xl"
            >
              <ImageIcon className="h-6 w-6" />
              Upload Image
            </Button>
            <p className="text-xs text-muted-foreground text-center mt-2">Supports JPG, PNG, PDF</p>
          </motion.div>
        )}
      </div>
    );
  }

  // Desktop layout
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-semibold tracking-tight">Upload your label</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Drop an image or PDF of your product label to get started
        </p>
      </motion.div>

      {/* Drop zone */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        onClick={() => !selectedFile && inputRef.current?.click()}
        className={`relative rounded-xl border-2 border-dashed p-12 text-center cursor-pointer transition-colors ${
          dragOver ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
        }`}
      >
        <input ref={inputRef} type="file" accept={ACCEPTED} onChange={onSelect} className="hidden" />

        {selectedFile ? (
          <div className="space-y-4">
            {preview ? (
              <img src={preview} alt="Label preview" className="mx-auto max-h-48 rounded-lg object-contain" />
            ) : (
              <FileText className="h-16 w-16 text-primary mx-auto" />
            )}
            <div className="flex items-center justify-center gap-2">
              <span className="text-sm font-medium">{selectedFile.name}</span>
              <button onClick={(e) => { e.stopPropagation(); clear(); }} className="text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <Upload className="h-12 w-12 text-muted-foreground mx-auto" />
            <div>
              <p className="text-sm font-medium">Drop your label here or click to browse</p>
              <p className="text-xs text-muted-foreground mt-1">Supports JPG, PNG, PDF</p>
            </div>
          </div>
        )}
      </motion.div>

      {seasonalPanel}

      {/* Action buttons */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex flex-col sm:flex-row gap-3"
      >
        <Button onClick={startScan} disabled={!selectedFile} size="lg" className="flex-1 gap-2">
          <FileImage className="h-4 w-4" />
          Scan Label
        </Button>
        <Button
          variant="outline"
          size="lg"
          className="gap-2"
          onClick={() => inputRef.current?.click()}
        >
          <Camera className="h-4 w-4" />
          Take Photo
        </Button>
      </motion.div>
    </div>
  );
};

export default ScanUploadPage;
