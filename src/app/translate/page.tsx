"use client";
import { useState } from "react";
import { FileUp, FileDown, Loader2, Printer } from "lucide-react";
import { GlassCard, SectionTitle } from "@/components/ui";
import { downloadBlob } from "@/lib/doc-utils";
import { useSiteConfig } from "@/components/site-widgets";
import { pdfCaps } from "@/lib/site-config-shared";
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from "docx";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

const PDFJS_WORKER = (version: string) =>
  `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${version}/pdf.worker.min.mjs`;

async function logOp(op: { tool: string; files: number; pages: number; ms: number; ok: boolean; err?: string }) {
  try {
    await fetch("/api/pdf/log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(op),
    });
  } catch {
    /* telemetry is best-effort */
  }
}

/** Strip scripts + event handlers from mammoth HTML before injecting into print window. */
function sanitizeHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script\s*>/gi, "")
    .replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(/javascript:/gi, "");
}

/** Plain-text fallback: HTML → text lines for direct PDF generation. */
function htmlToLines(html: string): string[] {
  const text = html
    .replace(/<\/(p|div|h[1-6]|li|tr|br)[^>]*>/gi, "\n")
    .replace(/<li[^>]*>/gi, "• ")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
  return text.split("\n").map((l) => l.replace(/\s+/g, " ").trim()).filter(Boolean);
}

export default function TranslatePage() {
  const { config } = useSiteConfig();
  const caps = pdfCaps(config, "translate");
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [docxFile, setDocxFile] = useState<File | null>(null);
  const [busy, setBusy] = useState<"pdf2docx" | "docx2pdf" | "docxPrint" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [log, setLog] = useState<string[]>([]);
  const push = (s: string) => setLog((l) => [...l.slice(-19), `${new Date().toLocaleTimeString()} ${s}`]);

  const overCap = (f: File) => f.size > caps.maxMB * 1024 * 1024;

  /** PDF → DOCX: extract text nodes per page (pdfjs), build clean paragraphs (no textbox soup) */
  const pdfToDocx = async () => {
    if (!pdfFile) return;
    if (overCap(pdfFile)) {
      setError(`“${pdfFile.name}” exceeds the ${caps.maxMB} MB per-file cap (admin setting).`);
      return;
    }
    setError(null);
    setBusy("pdf2docx"); push(`◷ parsing ${pdfFile.name}…`);
    const started = Date.now();
    try {
      const pdfjs = await import("pdfjs-dist");
      // Use CDN worker to avoid bundling worker file
      pdfjs.GlobalWorkerOptions.workerSrc = PDFJS_WORKER(pdfjs.version);
      const buf = await pdfFile.arrayBuffer();
      const pdf = await pdfjs.getDocument({ data: buf }).promise;
      push(`◷ ${pdf.numPages} pages found, extracting text…`);
      const children: Paragraph[] = [];
      let emptyPages = 0;
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
        let pageText = 0;
        for (const y of sortedY) {
          const line = lines.get(y)!.join(" ").replace(/\s+/g, " ").trim();
          if (line) { children.push(new Paragraph({ children: [new TextRun({ text: line, size: 24 })] })); pageText++; }
        }
        if (pageText === 0) emptyPages++;
        children.push(new Paragraph({ text: "" }));
      }
      const doc = new Document({ sections: [{ children }] });
      const blob = await Packer.toBlob(doc);
      downloadBlob(blob, pdfFile.name.replace(/\.pdf$/i, "") + ".converted.docx");
      push(`✔ DOCX saved — editable paragraphs, tables→lines (MVP).`);
      if (emptyPages > 0) push(`⚠ ${emptyPages} page(s) had no text (scanned?) — OCR via your n8n translate-doc workflow (docs/plans.md §2.3).`);
      void logOp({ tool: "translate", files: 1, pages: pdf.numPages, ms: Date.now() - started, ok: true });
    } catch (e) {
      const msg = (e as Error).message;
      push(`✘ failed: ${msg}. Tip: scanned PDFs need OCR via n8n (see docs/plans.md).`);
      setError(`Conversion failed: ${msg}`);
      void logOp({ tool: "translate", files: 1, pages: 0, ms: Date.now() - started, ok: false, err: msg });
    } finally { setBusy(null); }
  };

  /** DOCX → PDF (direct): mammoth → text lines → pdf-lib download. No popup. */
  const docxToPdf = async () => {
    if (!docxFile) return;
    if (overCap(docxFile)) {
      setError(`“${docxFile.name}” exceeds the ${caps.maxMB} MB per-file cap (admin setting).`);
      return;
    }
    setError(null);
    setBusy("docx2pdf"); push(`◷ reading ${docxFile.name}…`);
    const started = Date.now();
    try {
      const mammoth = (await import("mammoth")).default as unknown as {
        convertToHtml: (opts: { arrayBuffer: ArrayBuffer }) => Promise<{ value: string }>;
      };
      const buf = await docxFile.arrayBuffer();
      const { value: html } = await mammoth.convertToHtml({ arrayBuffer: buf });
      const lines = htmlToLines(sanitizeHtml(html));
      if (!lines.length) throw new Error("no readable text found in DOCX");

      const pdf = await PDFDocument.create();
      const font = await pdf.embedFont(StandardFonts.Helvetica);
      const MARGIN = 50;
      let page = pdf.addPage([595, 842]);
      let y = 800;
      for (const line of lines) {
        const size = 11;
        // naive wrap at ~90 chars (Helvetica metrics vary; keeps layout simple + robust)
        const chunks: string[] = [];
        for (let i = 0; i < line.length; i += 90) chunks.push(line.slice(i, i + 90));
        for (const chunk of chunks) {
          if (y < MARGIN + 20) { page = pdf.addPage([595, 842]); y = 800; }
          page.drawText(chunk, { x: MARGIN, y, size, font, color: rgb(0.1, 0.1, 0.1) });
          y -= 16;
        }
        y -= 6;
      }
      const bytes = await pdf.save();
      downloadBlob(new Blob([bytes.slice()], { type: "application/pdf" }), docxFile.name.replace(/\.docx$/i, "") + ".converted.pdf");
      push(`✔ PDF saved — direct download (${pdf.getPageCount()} page(s)). For pixel-perfect Bangla fonts use Print instead.`);
      void logOp({ tool: "translate", files: 1, pages: pdf.getPageCount(), ms: Date.now() - started, ok: true });
    } catch (e) {
      const msg = (e as Error).message;
      push(`✘ failed: ${msg}`);
      setError(`DOCX→PDF failed: ${msg}`);
      void logOp({ tool: "translate", files: 1, pages: 0, ms: Date.now() - started, ok: false, err: msg });
    } finally { setBusy(null); }
  };

  /** DOCX → print window (high-fidelity Bangla fonts, user picks Save-as-PDF). */
  const docxToPrint = async () => {
    if (!docxFile) return;
    if (overCap(docxFile)) {
      setError(`“${docxFile.name}” exceeds the ${caps.maxMB} MB per-file cap (admin setting).`);
      return;
    }
    setError(null);
    setBusy("docxPrint"); push(`◷ preparing print view for ${docxFile.name}…`);
    try {
      const mammoth = (await import("mammoth")).default as unknown as {
        convertToHtml: (opts: { arrayBuffer: ArrayBuffer }) => Promise<{ value: string }>;
      };
      const buf = await docxFile.arrayBuffer();
      const { value: raw } = await mammoth.convertToHtml({ arrayBuffer: buf });
      const html = sanitizeHtml(raw);
      const title = docxFile.name.replace(/[<>&"]/g, "");
      const w = window.open("", "_blank", "width=900,height=700");
      if (!w) throw new Error("popup blocked — allow popups to export PDF");
      w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${title}</title>
        <style>body{font-family:'Noto Sans Bengali','SolaimanLipi',Arial,sans-serif;max-width:720px;margin:40px auto;line-height:1.9;padding:0 24px;color:#111}h1,h2{line-height:1.4}table{border-collapse:collapse;width:100%}td,th{border:1px solid #999;padding:6px 10px}</style>
        </head><body><h1 style="font-size:15px;color:#666">BornoLab DOCX → PDF • ${title}</h1><hr/>${html}
        <script>onload=()=>{setTimeout(()=>{print()},400)}<\/script></body></html>`);
      w.document.close();
      push(`✔ print window opened — choose “Save as PDF” to keep fonts/spacing.`);
    } catch (e) {
      const msg = (e as Error).message;
      push(`✘ failed: ${msg}`);
      setError(msg);
    } finally { setBusy(null); }
  };

  if (!caps.enabled) {
    return (
      <div>
        <SectionTitle kicker="PDF Suite" title="PDF ⇆ DOCX Translator" desc="Editable Word documents from PDFs." />
        <GlassCard>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            PDF to DOCX is currently disabled by the administrator. Please check back later or try the{" "}
            <a className="font-bold text-cyan-700 underline dark:text-cyan-300" href="/merge">PDF Merger</a>.
          </p>
        </GlassCard>
      </div>
    );
  }

  return (
    <div>
      <SectionTitle kicker="Module 04" title="PDF ⇆ DOCX Translator" desc={`Strict layout parity: PDF text nodes → editable OOXML paragraphs (never absolute text-boxes). DOCX → direct PDF download + high-fidelity print. Client-side for small files; large/scan jobs → n8n. Cap: ${caps.maxMB} MB per file.`} />
      {error && <p role="alert" className="mb-3 rounded-xl bg-red-500/10 p-3 text-[12.5px] font-semibold text-red-600 dark:text-red-300">{error}</p>}
      <div className="grid gap-4 lg:grid-cols-2">
        <GlassCard>
          <h2 className="font-extrabold">PDF → DOCX</h2>
          <p className="mt-1 text-[12px] text-slate-600 dark:text-slate-400">Parses text nodes + line flow per page. Embedded tables become line paragraphs in MVP; full grid rebuild is on the n8n roadmap.</p>
          <label
            className="mt-3 flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-cyan-500/50 p-4 text-sm hover:bg-cyan-500/5"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files?.[0]; if (f) setPdfFile(f); }}
          >
            <FileUp size={18} className="text-cyan-600 dark:text-cyan-300" />
            <span className="truncate">{pdfFile?.name ?? "Drop / click to choose .pdf"}</span>
            <input type="file" accept="application/pdf" className="hidden" onChange={(e) => { setPdfFile(e.target.files?.[0] ?? null); e.target.value = ""; }} />
          </label>
          <button onClick={pdfToDocx} disabled={!pdfFile || !!busy} className="mt-3 flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-40">
            {busy === "pdf2docx" ? <Loader2 size={16} className="animate-spin" /> : <FileDown size={16} />} Convert & Download .docx
          </button>
        </GlassCard>
        <GlassCard>
          <h2 className="font-extrabold">DOCX → PDF</h2>
          <p className="mt-1 text-[12px] text-slate-600 dark:text-slate-400">Direct download for everyday use; Print keeps system Bangla fonts pixel-perfect. Embed via n8n + LibreOffice for publishing.</p>
          <label
            className="mt-3 flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-purple-500/50 p-4 text-sm hover:bg-purple-500/5"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files?.[0]; if (f) setDocxFile(f); }}
          >
            <FileUp size={18} className="text-purple-600 dark:text-purple-300" />
            <span className="truncate">{docxFile?.name ?? "Drop / click to choose .docx"}</span>
            <input type="file" accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document" className="hidden" onChange={(e) => { setDocxFile(e.target.files?.[0] ?? null); e.target.value = ""; }} />
          </label>
          <button onClick={docxToPdf} disabled={!docxFile || !!busy} className="mt-3 flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-cyan-500 to-purple-600 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-40">
            {busy === "docx2pdf" ? <Loader2 size={16} className="animate-spin" /> : <FileDown size={16} />} Download PDF directly
          </button>
          <button onClick={docxToPrint} disabled={!docxFile || !!busy} className="glass hover-glow mt-2 flex w-full items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-bold">
            {busy === "docxPrint" ? <Loader2 size={16} className="animate-spin" /> : <Printer size={16} />} High-fidelity Print (Bangla fonts)
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
