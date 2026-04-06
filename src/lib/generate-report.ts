import jsPDF from "jspdf";
import { ScanResult } from "./scan-context";

export const generateComplianceReport = (result: ScanResult) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 20;

  const addText = (text: string, x: number, yPos: number, opts?: { fontSize?: number; fontStyle?: string; color?: [number, number, number]; maxWidth?: number }) => {
    doc.setFontSize(opts?.fontSize ?? 11);
    doc.setFont("helvetica", opts?.fontStyle ?? "normal");
    if (opts?.color) doc.setTextColor(...opts.color);
    else doc.setTextColor(40, 40, 40);
    if (opts?.maxWidth) {
      doc.text(text, x, yPos, { maxWidth: opts.maxWidth });
    } else {
      doc.text(text, x, yPos);
    }
  };

  // Header
  doc.setFillColor(30, 64, 120);
  doc.rect(0, 0, pageWidth, 40, "F");
  addText("Label Compliance Report", 14, 18, { fontSize: 20, fontStyle: "bold", color: [255, 255, 255] });
  addText(`Generated: ${new Date().toLocaleDateString("en-GB")}`, 14, 28, { fontSize: 10, color: [200, 210, 230] });
  y = 50;

  // Product info
  addText("Product Information", 14, y, { fontSize: 14, fontStyle: "bold", color: [30, 64, 120] });
  y += 8;
  doc.setDrawColor(30, 64, 120);
  doc.line(14, y, pageWidth - 14, y);
  y += 8;

  addText(`File: ${result.fileName}`, 14, y);
  y += 7;
  addText(`Category: ${result.category}`, 14, y);
  y += 7;

  const score = Math.round((result.foundCount / result.totalCount) * 100);
  addText(`Compliance Score: ${score}%`, 14, y, { fontStyle: "bold", color: score >= 80 ? [34, 139, 34] : score >= 50 ? [200, 150, 0] : [200, 50, 50] });
  y += 7;
  addText(`Fields Found: ${result.foundCount} / ${result.totalCount}`, 14, y);
  y += 7;
  addText(`Items Needing Attention: ${result.needsAttentionCount}`, 14, y);
  y += 14;

  // Detected fields
  addText("Detected Fields", 14, y, { fontSize: 14, fontStyle: "bold", color: [30, 64, 120] });
  y += 8;
  doc.line(14, y, pageWidth - 14, y);
  y += 8;

  const foundFields = result.fields.filter(f => f.status === "found");
  for (const field of foundFields) {
    if (y > 270) { doc.addPage(); y = 20; }
    addText(`✓ ${field.label}`, 14, y, { fontStyle: "bold" });
    y += 6;
    if (field.value) {
      const lines = doc.splitTextToSize(field.value, pageWidth - 34);
      addText(lines.join("\n"), 20, y, { fontSize: 10, color: [80, 80, 80], maxWidth: pageWidth - 34 });
      y += lines.length * 5 + 4;
    }
  }

  // Issues
  const issueFields = result.fields.filter(f => f.status !== "found");
  if (issueFields.length > 0) {
    y += 6;
    if (y > 250) { doc.addPage(); y = 20; }
    addText("Issues & Recommendations", 14, y, { fontSize: 14, fontStyle: "bold", color: [200, 50, 50] });
    y += 8;
    doc.setDrawColor(200, 50, 50);
    doc.line(14, y, pageWidth - 14, y);
    doc.setDrawColor(30, 64, 120);
    y += 8;

    for (const field of issueFields) {
      if (y > 260) { doc.addPage(); y = 20; }
      const icon = field.status === "not_found" ? "✗" : "⚠";
      addText(`${icon} ${field.label}`, 14, y, { fontStyle: "bold", color: field.status === "not_found" ? [200, 50, 50] : [200, 150, 0] });
      y += 6;
      const statusText = field.status === "not_found" ? "Not found on this label" : "Needs review";
      addText(`Status: ${statusText}`, 20, y, { fontSize: 10, color: [80, 80, 80] });
      y += 6;
      if (field.suggestedFix) {
        addText(`Suggested fix: ${field.suggestedFix}`, 20, y, { fontSize: 10, color: [34, 100, 34], maxWidth: pageWidth - 34 });
        const fixLines = doc.splitTextToSize(`Suggested fix: ${field.suggestedFix}`, pageWidth - 34);
        y += fixLines.length * 5 + 4;
      }
    }
  }

  // Disclaimer
  y += 10;
  if (y > 260) { doc.addPage(); y = 20; }
  doc.setFillColor(245, 245, 245);
  doc.rect(14, y - 4, pageWidth - 28, 20, "F");
  addText("This is an automated label review. Final compliance should be verified against official guidelines.", 16, y + 4, { fontSize: 8, color: [120, 120, 120], maxWidth: pageWidth - 36 });

  doc.save(`Label-Review-${result.fileName.replace(/\.[^.]+$/, "")}.pdf`);
};
