import { useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Upload, FileImage, FileText, X, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useScan } from "@/lib/scan-context";

const ACCEPTED = ".jpg,.jpeg,.png,.pdf";

const ScanUploadPage = () => {
  const { setFile } = useScan();
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
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
  };

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
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED}
          onChange={onSelect}
          className="hidden"
        />

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
