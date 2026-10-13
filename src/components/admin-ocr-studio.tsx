"use client";
import { useRef, useState } from "react";
import { GlassCard } from "@/components/ui";
import { chunkEvidence, cleanupBengaliOcr } from "@/lib/study-platform/ocr";
import { detectOcrFlags } from "@/lib/study-platform/validation";

const PDFJS_WORKER = (version: string) =>
  `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${version}/pdf.worker.min.mjs`;

interface OcrPage {
  index: number;
  raw: string;
  clean: string;
  fixes: string[];
  flags: string[];
}

/**
 * Admin OCR studio: image/PDF → (pdfjs rasterize) → Tesseract ben+eng →
 * cleanup → flags → restricted evidence store. Raw evidence stays admin-only;
 * learner drafts are paraphrased afterwards via import/manual entry.
 */
export function OcrStudio() {
  const [pages, setPages] = useState<OcrPage[]>([]);
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [sourceTitle, setSourceTitle] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [msg, setMsg] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const runFile = async (file: File) => {
    setBusy(true);
    setMsg("");
    setPages([]);
    setProgress(0);
    try {
      const tess = await import("tesseract.js");
      const worker = await tess.createWorker(["ben", "eng"], undefined, {
        logger: (m: { status?: string; progress?: number }) => {
          if (typeof m.progress === "number") setProgress(Math.round(m.progress * 100));
          if (m.status) setStatus(m.status);
        },
      });
      const out: OcrPage[] = [];
      try {
        if (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) {
          const pdfjs = await import("pdfjs-dist");
          pdfjs.GlobalWorkerOptions.workerSrc = PDFJS_WORKER(pdfjs.version);
          const buf = await file.arrayBuffer();
          const pdf = await pdfjs.getDocument({ data: buf.slice(0) }).promise;
          const n = Math.min(pdf.numPages, 10);
          setStatus(`rasterizing ${n} page(s)…`);
          for (let i = 1; i <= n; i += 1) {
            const page = await pdf.getPage(i);
            const viewport = page.getViewport({ scale: 2 });
            const canvas = document.createElement("canvas");
            canvas.width = viewport.width;
            canvas.height = viewport.height;
            await page.render({ canvas, viewport }).promise;
            setStatus(`OCR page ${i}/${n}…`);
            const { data } = await worker.recognize(canvas);
            const { text, fixes } = cleanupBengaliOcr(data.text ?? "");
            out.push({ index: i, raw: data.text ?? "", clean: text, fixes, flags: detectOcrFlags(text, []) });
            setProgress(Math.round((100 * i) / n));
          }
        } else {
          setStatus("OCR image…");
          const url = URL.createObjectURL(file);
          try {
            const { data } = await worker.recognize(url);
            const { text, fixes } = cleanupBengaliOcr(data.text ?? "");
            out.push({ index: 1, raw: data.text ?? "", clean: text, fixes, flags: detectOcrFlags(text, []) });
          } finally {
            URL.revokeObjectURL(url);
          }
        }
      } finally {
        await worker.terminate().catch(() => {});
      }
      setPages(out);
      const chunks = out.reduce((acc, p) => acc + chunkEvidence(p.clean).length, 0);
      setMsg(`✓ ${out.length} page(s) OCR'd → ${chunks} evidence chunk(s). Review flags, then store as restricted evidence.`);
    } catch (e) {
      setMsg(`OCR failed: ${(e as Error).message} — check connection (language data loads from CDN) or paste text manually via import.`);
    } finally {
      setBusy(false);
      setStatus(null);
      setProgress(0);
    }
  };

  const storeEvidence = async () => {
    setMsg("");
    const res = await fetch("/api/study-platform/evidence", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sourceTitle: sourceTitle || "ocr-upload", sourceUrl, licenseState: "pending", pages }),
    });
    const j = await res.json();
    setMsg(res.ok ? `✓ Stored ${j.stored} page(s) as restricted evidence (admin-only).` : `Store failed: ${j.error}`);
    if (res.ok) setPages([]);
  };

  const field = "focus-glow w-full rounded-xl bg-slate-100 p-2.5 text-sm outline-none dark:bg-black/30";

  return (
    <GlassCard>
      <h3 className="text-sm font-bold">🔍 OCR Studio — scan → staging evidence (Tesseract ben+eng)</h3>
      <p className="mt-1 text-[12.5px] text-slate-600 dark:text-slate-400">
        Images OCR directly; PDFs rasterize (≤10 pages) then OCR in your browser. Language data loads from CDN at runtime.
        Nothing is published — output goes to the restricted evidence ledger for paraphrasing.
      </p>
      <div className="mt-2 grid gap-2 sm:grid-cols-2">
        <input aria-label="Source title" value={sourceTitle} onChange={(e) => setSourceTitle(e.target.value)} placeholder="Source title (book/scan name)" className={field} />
        <input aria-label="Source URL" value={sourceUrl} onChange={(e) => setSourceUrl(e.target.value)} placeholder="Source URL (provenance)" className={`${field} font-mono`} />
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <label className="cursor-pointer rounded-xl bg-cyan-500/15 px-4 py-2 text-[13px] font-bold text-cyan-700 dark:text-cyan-200">
          {busy ? "Working…" : "📄 Choose image / PDF"}
          <input
            ref={fileRef}
            type="file"
            accept="image/*,.pdf"
            className="hidden"
            disabled={busy}
            onChange={(e) => {
              const f = e.target.files?.[0];
              e.target.value = "";
              if (f) void runFile(f);
            }}
          />
        </label>
        {(busy || status) && (
          <p role="status" className="text-[12.5px] font-bold text-slate-500" aria-live="polite">
            {status ?? "starting…"} {busy && progress > 0 ? `${progress}%` : ""}
          </p>
        )}
      </div>
      {pages.length > 0 && (
        <div className="mt-3 grid gap-2">
          {pages.map((p) => (
            <div key={p.index} className="rounded-xl bg-slate-900/[.04] p-3 dark:bg-white/5">
              <p className="text-[12.5px] font-extrabold">Page {p.index} {p.fixes.length > 0 && <span className="font-semibold text-slate-500">• fixes: {p.fixes.join("; ")}</span>}</p>
              {p.flags.length > 0 && <p className="mt-0.5 text-[12px] font-bold text-amber-600 dark:text-amber-300">⚠ {p.flags.join(", ")}</p>}
              <div className="mt-1.5 grid gap-2 md:grid-cols-2">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Clean (review me)</p>
                  <pre className="mt-1 max-h-44 overflow-y-auto whitespace-pre-wrap break-words rounded-lg bg-emerald-500/10 p-2.5 font-mono text-[11.5px] leading-6">{p.clean || "(empty)"}</pre>
                </div>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Raw evidence (kept separate)</p>
                  <pre className="mt-1 max-h-44 overflow-y-auto whitespace-pre-wrap break-words rounded-lg bg-slate-900/[.06] p-2.5 font-mono text-[11.5px] leading-6 dark:bg-black/30">{p.raw.slice(0, 4000) || "(empty)"}</pre>
                </div>
              </div>
            </div>
          ))}
          <button onClick={storeEvidence} className="rounded-xl bg-slate-900 px-4 py-2.5 text-[13px] font-bold text-white dark:bg-white dark:text-slate-900">
            🔒 Store {pages.length} page(s) as restricted evidence
          </button>
        </div>
      )}
      {msg && <p role="status" className="mt-2 text-[12.5px] font-semibold text-emerald-600 dark:text-emerald-300">{msg}</p>}
    </GlassCard>
  );
}
