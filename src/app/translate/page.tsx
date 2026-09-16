"use client";
import { useState } from "react";
import { FileUp, FileDown, Loader2 } from "lucide-react";
import { GlassCard, SectionTitle } from "@/components/ui";
import { downloadBlob } from "@/lib/doc-utils";
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from "docx";

export default function TranslatePage() {
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [docxFile, setDocxFile] = useState<File | null>(null);
  const [busy, setBusy] = useState<"pdf2docx" | "docx2pdf" | null>(null);
  const [log, setLog] = useState<string[]>([]);
  const push = (s: string) => setLog((l) => [...l.slice(-8), `${new Date().toLocaleTimeString()} ${s}`]);

  /** PDF → DOCX: extract text nodes per page (pdfjs), build clean paragraphs (no textbox soup) */
  const pdfToDocx = async () => {
    if (!pdfFile) return;
    setBusy("pdf2docx"); push(`◷ parsing ${pdfFile.name}…`);
    try {
      const pdfjs = await import("pdfjs-dist");
      // Use CDN worker to avoid bundling worker file
      pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.mjs`;
      const buf = await pdfFile.arrayBuffer();
      const pdf = await pdfjs.getDocument({ data: buf }).promise;
      push(`◷ ${pdf.numPages} pages found, extracting text…`);
      const children: Paragraph[] = [];
      for (let p = 1; p <= pdf.numPages; p++) {
        const page = await pdf.getPage(p);
        const tc = await page.getTextContent();
        // Group items into lines by Y, preserve reading order
        const lines = new Map<number, string[]>();
        for (const it of tc.items as Array<{ str: string; transform: number[] }>) {
          const y = Math.round(it.transform[5]);
          if (!lines.has(y)) lines.set(y, []);
          lines.get(y)!.push(it.str);
        }
        const sortedY = [...lines.keys()].sort((a, b) => b - a);
        children.push(new Paragraph({ heading: HeadingLevel.HEADING_3, children: [new TextRun({ text: `— Page ${p} —`, color: "888888", size: 20 })] }));
        for (const y of sortedY) {
          const line = lines.get(y)!.join(" ").replace(/\s+/g, " ").trim();
          if (line) children.push(new Paragraph({ children: [new TextRun({ text: line, size: 24 })] }));
        }
        children.push(new Paragraph({ text: "" }));
      }
      const doc = new Document({ sections: [{ children }] });
      const blob = await Packer.toBlob(doc);
      downloadBlob(blob, pdfFile.name.replace(/\.pdf$/i, "") + ".converted.docx");
      push(`✔ DOCX saved — editable paragraphs, tables→lines (MVP).`);
    } catch (e) {
      push(`✘ failed: ${(e as Error).message}. Tip: scanned PDFs need OCR via n8n (see docs/plans.md).`);
    } finally { setBusy(null); }
  };

  /** DOCX → PDF: mammoth → clean HTML → print to PDF (preserves flow, fonts, spacing) */
  const docxToPdf = async () => {
    if (!docxFile) return;
    setBusy("docx2pdf"); push(`◷ reading ${docxFile.name}…`);
    try {
      const mammoth = (await import("mammoth")).default as unknown as {
        convertToHtml: (opts: { arrayBuffer: ArrayBuffer }) => Promise<{ value: string }>;
      };
      const buf = await docxFile.arrayBuffer();
      const { value: html } = await mammoth.convertToHtml({ arrayBuffer: buf });
      const w = window.open("", "_blank", "width=900,height=700");
      if (!w) throw new Error("popup blocked — allow popups to export PDF");
      w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${docxFile.name}</title>
        <style>body{font-family:'Noto Sans Bengali','SolaimanLipi',Arial,sans-serif;max-width:720px;margin:40px auto;line-height:1.9;padding:0 24px;color:#111}h1,h2{line-height:1.4}table{border-collapse:collapse;width:100%}td,th{border:1px solid #999;padding:6px 10px}</style>
        </head><body><h1 style="font-size:15px;color:#666">BornoLab DOCX → PDF • ${docxFile.name}</h1><hr/>${html}
        <script>onload=()=>{setTimeout(()=>{print()},400)}<\/script></body></html>`);
      w.document.close();
      push(`✔ print window opened — choose “Save as PDF” to keep fonts/spacing.`);
    } catch (e) {
      push(`✘ failed: ${(e as Error).message}`);
    } finally { setBusy(null); }
  };

  return (
    <div>
      <SectionTitle kicker="Module 04" title="PDF ⇆ DOCX Translator" desc="Strict layout parity: PDF text nodes → editable OOXML paragraphs (never absolute text-boxes). DOCX → high-fidelity print flow. Client-side for small files; large/scan jobs → n8n." />
      <div className="grid gap-4 lg:grid-cols-2">
        <GlassCard>
          <h2 className="font-extrabold">PDF → DOCX</h2>
          <p className="mt-1 text-[12px] text-slate-600 dark:text-slate-400">Parses text nodes + line flow per page. Embedded tables become line paragraphs in MVP; full grid rebuild is on the n8n roadmap.</p>
          <label className="mt-3 flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-cyan-500/50 p-4 text-sm hover:bg-cyan-500/5">
            <FileUp size={18} className="text-cyan-600 dark:text-cyan-300" />
            <span className="truncate">{pdfFile?.name ?? "Drop / click to choose .pdf"}</span>
            <input type="file" accept="application/pdf" className="hidden" onChange={(e) => setPdfFile(e.target.files?.[0] ?? null)} />
          </label>
          <button onClick={pdfToDocx} disabled={!pdfFile || !!busy} className="mt-3 flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-40">
            {busy === "pdf2docx" ? <Loader2 size={16} className="animate-spin" /> : <FileDown size={16} />} Convert & Download .docx
          </button>
        </GlassCard>
        <GlassCard>
          <h2 className="font-extrabold">DOCX → PDF</h2>
          <p className="mt-1 text-[12px] text-slate-600 dark:text-slate-400">Compiles paragraphs/styles/line-spacing into a clean print canvas. Uses system Bangla fonts; embed via n8n + LibreOffice for pixel-perfect publishing.</p>
          <label className="mt-3 flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-purple-500/50 p-4 text-sm hover:bg-purple-500/5">
            <FileUp size={18} className="text-purple-600 dark:text-purple-300" />
            <span className="truncate">{docxFile?.name ?? "Drop / click to choose .docx"}</span>
            <input type="file" accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document" className="hidden" onChange={(e) => setDocxFile(e.target.files?.[0] ?? null)} />
          </label>
          <button onClick={docxToPdf} disabled={!docxFile || !!busy} className="mt-3 flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-cyan-500 to-purple-600 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-40">
            {busy === "docx2pdf" ? <Loader2 size={16} className="animate-spin" /> : <FileDown size={16} />} Open Print-Ready PDF
          </button>
        </GlassCard>
      </div>
      <GlassCard className="mt-4">
        <h3 className="text-sm font-bold">Activity</h3>
        <ul className="mt-2 space-y-1 font-mono text-[12px] text-slate-600 dark:text-slate-400" aria-live="polite">
          {log.length === 0 && <li>— idle —</li>}
          {log.map((l, i) => <li key={i}>{l}</li>)}
        </ul>
      </GlassCard>
    </div>
  );
}
