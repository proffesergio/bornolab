"use client";
import { useMemo, useRef, useState } from "react";
import { FileUp, Download, Loader2, Image as ImageIcon, FileText } from "lucide-react";
import { GlassCard, SectionTitle } from "@/components/ui";
import { parseRangePattern, downloadBlob } from "@/lib/doc-utils";
import { PDFDocument } from "pdf-lib";
import { Document, Packer, Paragraph, HeadingLevel, TextRun } from "docx";
import { cn } from "@/lib/cn";

interface Thumb { index: number; url: string; checked: boolean; }

export default function SplitPage() {
  const [file, setFile] = useState<File | null>(null);
  const [thumbs, setThumbs] = useState<Thumb[]>([]);
  const [range, setRange] = useState("1-3, 5");
  const [busy, setBusy] = useState<string | null>(null);
  const [exportFmt, setExportFmt] = useState<"pdf" | "png" | "jpg" | "docx">("pdf");
  const pdfBytes = useRef<ArrayBuffer | null>(null);

  const selected = useMemo(() => thumbs.filter((t) => t.checked).map((t) => t.index), [thumbs]);

  const loadPdf = async (f: File) => {
    setFile(f); setBusy("Rendering thumbnails…");
    try {
      const buf = await f.arrayBuffer();
      pdfBytes.current = buf.slice(0);
      const pdfjs = await import("pdfjs-dist");
      pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.mjs`;
      const pdf = await pdfjs.getDocument({ data: buf.slice(0) }).promise;
      const out: Thumb[] = [];
      for (let p = 1; p <= pdf.numPages; p++) {
        const page = await pdf.getPage(p);
        const viewport = page.getViewport({ scale: 0.45 });
        const canvas = document.createElement("canvas");
        canvas.width = viewport.width; canvas.height = viewport.height;
        await page.render({ canvas, viewport }).promise;
        out.push({ index: p - 1, url: canvas.toDataURL("image/jpeg", 0.7), checked: true });
      }
      setThumbs(out);
      setRange(`1-${Math.min(3, out.length)}`);
    } catch (e) {
      alert(`Could not render PDF: ${(e as Error).message}`);
    } finally { setBusy(null); }
  };

  const applyRange = () => {
    if (!thumbs.length) return;
    const picks = new Set(parseRangePattern(range, thumbs.length));
    setThumbs((ts) => ts.map((t) => ({ ...t, checked: picks.has(t.index) })));
  };

  const doExport = async (mode: "selected" | "all" | "range") => {
    if (!pdfBytes.current || !thumbs.length) return;
    const pages: number[] = mode === "all" ? thumbs.map((t) => t.index) : mode === "range" ? parseRangePattern(range, thumbs.length) : selected;
    if (!pages.length) { alert("No pages selected"); return; }
    setBusy(`Exporting ${pages.length} pages → ${exportFmt.toUpperCase()}…`);
    try {
      if (exportFmt === "pdf") {
        const src = await PDFDocument.load(pdfBytes.current.slice(0));
        const dst = await PDFDocument.create();
        const copied = await dst.copyPages(src, pages);
        copied.forEach((p) => dst.addPage(p));
        const bytes = await dst.save();
        downloadBlob(new Blob([bytes.buffer as ArrayBuffer], { type: "application/pdf" }), `bornolab-split-${pages.length}p.pdf`);
      } else if (exportFmt === "png" || exportFmt === "jpg") {
        const { default: JSZip } = await import("jszip");
        const pdfjs = await import("pdfjs-dist");
        pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.mjs`;
        const pdf = await pdfjs.getDocument({ data: pdfBytes.current.slice(0) }).promise;
        const zip = new JSZip();
        for (const pi of pages) {
          const page = await pdf.getPage(pi + 1);
          const viewport = page.getViewport({ scale: 2 });
          const canvas = document.createElement("canvas");
          canvas.width = viewport.width; canvas.height = viewport.height;
          await page.render({ canvas, viewport }).promise;
          const blob: Blob = await new Promise((res) => canvas.toBlob((b) => res(b!), `image/${exportFmt === "png" ? "png" : "jpeg"}`));
          zip.file(`page-${pi + 1}.${exportFmt}`, blob);
        }
        const zipBlob = await zip.generateAsync({ type: "blob" });
        downloadBlob(zipBlob, `bornolab-pages-${pages.length}.${exportFmt}.zip`);
      } else {
        // docx: extract text per page → paragraphs
        const pdfjs = await import("pdfjs-dist");
        pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.mjs`;
        const pdf = await pdfjs.getDocument({ data: pdfBytes.current.slice(0) }).promise;
        const children: Paragraph[] = [];
        for (const pi of pages) {
          const page = await pdf.getPage(pi + 1);
          const tc = await page.getTextContent();
          const text = (tc.items as Array<{ str: string }>).map((i) => i.str).join(" ").replace(/\s+/g, " ");
          children.push(new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun(`Page ${pi + 1}`)] }));
          children.push(new Paragraph({ children: [new TextRun({ text: text || "[no extractable text — scanned page; use OCR via n8n]", size: 24 })] }));
          children.push(new Paragraph({ text: "" }));
        }
        const blob = await Packer.toBlob(new Document({ sections: [{ children }] }));
        downloadBlob(blob, `bornolab-split-${pages.length}p.docx`);
      }
    } catch (e) {
      alert(`Export failed: ${(e as Error).message}`);
    } finally { setBusy(null); }
  };

  return (
    <div>
      <SectionTitle kicker="Module 05" title="Multi-Export PDF Splitter" desc="Drag & drop → paginated thumbnails with checkboxes → extract all / custom ranges (1-3, 5, 7-12) → export PDF, JPG/PNG zip, or DOCX." />
      <GlassCard>
        <label className="flex cursor-pointer items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-cyan-500/50 p-8 text-center hover:bg-cyan-500/5">
          <FileUp className="text-cyan-600 dark:text-cyan-300" />
          <span className="text-sm">{file?.name ?? "Drop a large PDF here or click to browse"}</span>
          <input type="file" accept="application/pdf" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) loadPdf(f); }} />
        </label>
        {busy && <p className="mt-2 flex items-center gap-2 text-[12px] text-cyan-700 dark:text-cyan-200"><Loader2 size={14} className="animate-spin" />{busy}</p>}
        {thumbs.length > 0 && (
          <div className="mt-4 flex flex-wrap items-end gap-2">
            <div className="min-w-[220px] flex-1">
              <label htmlFor="range" className="text-xs font-bold">Custom range (e.g. 1-3, 5, 7-12)</label>
              <input id="range" value={range} onChange={(e) => setRange(e.target.value)} className="focus-glow mt-1 w-full rounded-xl bg-slate-100 p-2.5 font-mono text-sm outline-none dark:bg-black/30" />
            </div>
            <button onClick={applyRange} className="glass hover-glow rounded-full px-4 py-2.5 text-[12px] font-bold">Apply Range</button>
            <button onClick={() => setThumbs((ts) => ts.map((t) => ({ ...t, checked: true })))} className="glass hover-glow rounded-full px-4 py-2.5 text-[12px] font-bold">Select All</button>
            <button onClick={() => setThumbs((ts) => ts.map((t) => ({ ...t, checked: false })))} className="glass hover-glow rounded-full px-4 py-2.5 text-[12px] font-bold">Clear</button>
            <div className="flex gap-1.5" role="group" aria-label="Export format">
              {(["pdf", "png", "jpg", "docx"] as const).map((f) => (
                <button key={f} onClick={() => setExportFmt(f)} className={cn("rounded-full px-3 py-2 text-[12px] font-bold uppercase", exportFmt === f ? "bg-gradient-to-r from-cyan-500 to-purple-600 text-white" : "glass text-slate-700 hover-glow dark:text-slate-300")}>{f}</button>
              ))}
            </div>
          </div>
        )}
      </GlassCard>

      {thumbs.length > 0 && (
        <>
          <div className="mt-4 flex flex-wrap gap-2">
            <button onClick={() => doExport("all")} className="flex items-center gap-1.5 rounded-full bg-slate-900 px-4 py-2.5 text-[12px] font-bold text-white dark:bg-white dark:text-black"><FileText size={14} /> Extract All ({thumbs.length})</button>
            <button onClick={() => doExport("range")} className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-cyan-500 to-purple-600 px-4 py-2.5 text-[12px] font-bold text-white"><Download size={14} /> Export Range</button>
            <button onClick={() => doExport("selected")} className="glass hover-glow flex items-center gap-1.5 rounded-full px-4 py-2.5 text-[12px] font-bold"><ImageIcon size={14} /> Export Checked ({selected.length}) → {exportFmt.toUpperCase()}</button>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {thumbs.map((t) => (
              <label key={t.index} className={cn("glass cursor-pointer overflow-hidden rounded-2xl transition", t.checked ? "glow-border" : "opacity-60")}>
                {/* eslint-disable-next-line @next/next/no-img-element -- thumbnails are runtime data-URL canvases, not optimizable */}
                <img src={t.url} alt={`Page ${t.index + 1}`} className="aspect-[3/4] w-full object-cover" loading="lazy" />
                <span className="flex items-center justify-between p-2 text-[12px] font-bold">
                  <span>Page {t.index + 1}</span>
                  <input type="checkbox" checked={t.checked} onChange={() => setThumbs((ts) => ts.map((x) => x.index === t.index ? { ...x, checked: !x.checked } : x))} className="h-4 w-4 accent-cyan-400" aria-label={`Select page ${t.index + 1}`} />
                </span>
              </label>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
