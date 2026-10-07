"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  FileUp, Loader2, ChevronLeft, ChevronRight, ZoomIn, ZoomOut,
  RotateCw, Maximize, Download, FileText,
} from "lucide-react";
import { GlassCard, SectionTitle } from "@/components/ui";
import { downloadBlob } from "@/lib/doc-utils";
import { useSiteConfig } from "@/components/site-widgets";
import { pdfCaps } from "@/lib/site-config-shared";
import { cn } from "@/lib/cn";

const PDFJS_WORKER = (version: string) =>
  `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${version}/pdf.worker.min.mjs`;

const MAX_THUMBS = 40;

interface LoadedDoc {
  // pdf.js document proxy (kept in a ref — never in state).
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  doc: any;
  bytes: ArrayBuffer;
  name: string;
  numPages: number;
}

export default function EditPdfPage() {
  const { config } = useSiteConfig();
  const caps = pdfCaps(config, "edit");
  const [loaded, setLoaded] = useState<LoadedDoc | null>(null);
  const [page, setPage] = useState(1);
  const [scale, setScale] = useState(1.25);
  const [rotation, setRotation] = useState(0);
  const [thumbs, setThumbs] = useState<string[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const renderId = useRef(0);

  const loadPdf = useCallback(async (f: File) => {
    setError(null);
    setThumbs([]);
    if (!f.type.includes("pdf") && !f.name.toLowerCase().endsWith(".pdf")) {
      setError("Please choose a PDF file.");
      return;
    }
    if (f.size > caps.maxMB * 1024 * 1024) {
      setError(`“${f.name}” exceeds the ${caps.maxMB} MB per-file cap (admin setting).`);
      return;
    }
    setBusy("Opening PDF…");
    try {
      const pdfjs = await import("pdfjs-dist");
      pdfjs.GlobalWorkerOptions.workerSrc = PDFJS_WORKER(pdfjs.version);
      const bytes = await f.arrayBuffer();
      const doc = await pdfjs.getDocument({ data: bytes.slice(0) }).promise;
      setLoaded({ doc, bytes, name: f.name, numPages: doc.numPages });
      setPage(1);
      setRotation(0);
      // Thumbnails (capped — huge documents render on demand in the main view).
      const out: string[] = [];
      const n = Math.min(doc.numPages, MAX_THUMBS);
      for (let p = 1; p <= n; p++) {
        const pg = await doc.getPage(p);
        const vp = pg.getViewport({ scale: 0.32 });
        const c = document.createElement("canvas");
        c.width = Math.ceil(vp.width);
        c.height = Math.ceil(vp.height);
        await pg.render({ canvas: c, viewport: vp }).promise;
        out.push(c.toDataURL());
      }
      setThumbs(out);
    } catch (e) {
      setError(`Could not open PDF: ${(e as Error).message}`);
    } finally {
      setBusy(null);
    }
  }, [caps.maxMB]);

  // Main page render — latest call wins (fast page flips can't interleave).
  useEffect(() => {
    if (!loaded) return;
    const my = ++renderId.current;
    (async () => {
      try {
        const pg = await loaded.doc.getPage(Math.min(Math.max(1, page), loaded.numPages));
        if (my !== renderId.current) return;
        const vp = pg.getViewport({ scale, rotation });
        const c = canvasRef.current;
        if (!c) return;
        c.width = Math.ceil(vp.width);
        c.height = Math.ceil(vp.height);
        await pg.render({ canvas: c, viewport: vp }).promise;
      } catch {
        /* superseded render — ignore */
      }
    })();
  }, [loaded, page, scale, rotation]);

  // Arrow-key page turning.
  useEffect(() => {
    if (!loaded) return;
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === "INPUT") return;
      if (e.key === "ArrowRight" || e.key === "PageDown") setPage((p) => Math.min(loaded.numPages, p + 1));
      if (e.key === "ArrowLeft" || e.key === "PageUp") setPage((p) => Math.max(1, p - 1));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [loaded]);

  const fitWidth = async () => {
    if (!loaded || !wrapRef.current) return;
    const pg = await loaded.doc.getPage(Math.min(Math.max(1, page), loaded.numPages));
    const vp = pg.getViewport({ scale: 1, rotation });
    const avail = wrapRef.current.clientWidth - 32;
    setScale(Math.min(3, Math.max(0.4, avail / vp.width)));
  };

  if (!caps.enabled) {
    return (
      <div>
        <SectionTitle kicker="PDF Suite" title="Edit PDF" desc="Read and annotate documents." />
        <GlassCard>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            The PDF Editor is currently disabled by the administrator. Try the{" "}
            <a className="font-bold text-cyan-700 underline dark:text-cyan-300" href="/pdf-tools">other PDF tools</a>.
          </p>
        </GlassCard>
      </div>
    );
  }

  return (
    <div>
      <SectionTitle kicker="PDF Suite" title="Edit PDF" desc="Open a PDF to read, zoom and flip pages — text, highlight, shapes and signing arrive in the next updates, right on this canvas." />
      {error && <p role="alert" className="mb-3 rounded-xl bg-red-500/10 p-3 text-[13px] font-semibold text-red-600 dark:text-red-300">{error}</p>}

      {!loaded ? (
        <GlassCard>
          <label
            className={cn("flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed p-10 text-center transition",
              dragActive ? "border-cyan-500 bg-cyan-500/10" : "border-cyan-500/50 hover:bg-cyan-500/5")}
            onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
            onDragLeave={() => setDragActive(false)}
            onDrop={(e) => { e.preventDefault(); setDragActive(false); const f = e.dataTransfer.files?.[0]; if (f) void loadPdf(f); }}
          >
            {busy ? <Loader2 size={28} className="animate-spin text-cyan-500" /> : <FileUp size={28} className="text-cyan-600 dark:text-cyan-300" />}
            <span className="text-sm font-bold">{busy ?? `Drop a PDF here or click to browse (max ${caps.maxMB} MB)`}</span>
            <span className="flex items-center gap-1.5 text-[12px] text-slate-500"><FileText size={13} /> 100% in-browser — nothing uploads</span>
            <input type="file" accept="application/pdf,.pdf" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) void loadPdf(f); e.target.value = ""; }} />
          </label>
        </GlassCard>
      ) : (
        <div>
          {/* Toolbar */}
          <GlassCard className="flex flex-wrap items-center gap-2 p-3">
            <span className="mr-auto min-w-0 max-w-[220px] truncate text-[13px] font-bold" title={loaded.name}>{loaded.name}</span>
            <span className="flex items-center gap-1">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} aria-label="Previous page" className="rounded-full p-2 hover:bg-white/10 disabled:opacity-40"><ChevronLeft size={16} /></button>
              <span className="flex items-center gap-1 text-[12.5px] font-bold">
                <input
                  aria-label="Page number" type="number" min={1} max={loaded.numPages} value={page}
                  onChange={(e) => { const n = Number(e.target.value); if (n >= 1 && n <= loaded.numPages) setPage(n); }}
                  className="w-14 rounded-lg bg-slate-100 p-1.5 text-center dark:bg-black/30"
                />
                / {loaded.numPages}
              </span>
              <button onClick={() => setPage((p) => Math.min(loaded.numPages, p + 1))} disabled={page >= loaded.numPages} aria-label="Next page" className="rounded-full p-2 hover:bg-white/10 disabled:opacity-40"><ChevronRight size={16} /></button>
            </span>
            <span className="flex items-center gap-1">
              <button onClick={() => setScale((s) => Math.max(0.4, +(s - 0.25).toFixed(2)))} aria-label="Zoom out" className="rounded-full p-2 hover:bg-white/10"><ZoomOut size={16} /></button>
              <span className="w-12 text-center text-[12.5px] font-bold">{Math.round(scale * 100)}%</span>
              <button onClick={() => setScale((s) => Math.min(3, +(s + 0.25).toFixed(2)))} aria-label="Zoom in" className="rounded-full p-2 hover:bg-white/10"><ZoomIn size={16} /></button>
              <button onClick={fitWidth} aria-label="Fit to width" title="Fit to width" className="rounded-full p-2 hover:bg-white/10"><Maximize size={15} /></button>
              <button onClick={() => setRotation((r) => (r + 90) % 360)} aria-label="Rotate view" title="Rotate view" className="rounded-full p-2 hover:bg-white/10"><RotateCw size={15} /></button>
            </span>
            <button onClick={() => downloadBlob(new Blob([loaded.bytes], { type: "application/pdf" }), loaded.name)} className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-cyan-500 to-purple-600 px-3.5 py-2 text-[12.5px] font-bold text-white">
              <Download size={14} /> Save
            </button>
            <button onClick={() => { setLoaded(null); setThumbs([]); }} className="glass rounded-full px-3.5 py-2 text-[12.5px] font-bold">Open another</button>
          </GlassCard>

          <div className="mt-4 flex flex-col gap-4 lg:flex-row">
            {/* Thumbnail rail */}
            <div className="glass flex max-h-28 gap-2 overflow-x-auto rounded-2xl p-2 lg:max-h-[70vh] lg:w-36 lg:flex-col lg:overflow-y-auto lg:overflow-x-hidden" aria-label="Page thumbnails">
              {thumbs.map((t, i) => (
                <button
                  key={i} onClick={() => setPage(i + 1)}
                  aria-label={`Go to page ${i + 1}`} aria-current={page === i + 1 ? "page" : undefined}
                  className={cn("shrink-0 overflow-hidden rounded-lg border-2 transition",
                    page === i + 1 ? "border-cyan-500" : "border-transparent opacity-70 hover:opacity-100")}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={t} alt="" className="h-20 w-auto lg:h-auto lg:w-full" draggable={false} />
                </button>
              ))}
              {loaded.numPages > thumbs.length && (
                <p className="shrink-0 self-center p-2 text-[11px] text-slate-500">+{loaded.numPages - thumbs.length} more — jump via page box</p>
              )}
            </div>
            {/* Main canvas */}
            <div ref={wrapRef} className="glass min-w-0 flex-1 overflow-auto rounded-2xl p-4">
              <canvas ref={canvasRef} className="mx-auto block max-w-none rounded-lg bg-white shadow-xl" />
              <p className="mt-2 text-center text-[11.5px] text-slate-500">Page {page} of {loaded.numPages} • ← → keys turn pages</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
