"use client";
import { useRef, useState } from "react";
import { FileUp, Download, Loader2, X, Minimize2, Files } from "lucide-react";
import { GlassCard, SectionTitle } from "@/components/ui";
import { downloadBlob } from "@/lib/doc-utils";
import { useSiteConfig } from "@/components/site-widgets";
import { pdfCaps } from "@/lib/site-config-shared";
import { PDFDocument } from "pdf-lib";
import { cn } from "@/lib/cn";

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

type LevelKey = "extreme" | "recommended" | "less";

const PRESETS: Record<LevelKey, { label: string; desc: string; scale: number; quality: number }> = {
  extreme: { label: "Extreme", desc: "Maximum compression, smaller file, lower image quality.", scale: 1.0, quality: 0.35 },
  recommended: { label: "Recommended", desc: "Balanced size and quality — best for everyday sharing.", scale: 1.25, quality: 0.6 },
  less: { label: "Less compression", desc: "Keeps near-original quality, modest savings.", scale: 1.6, quality: 0.82 },
};

interface QueueFile {
  id: number;
  file: File;
  bytes: ArrayBuffer;
  pages: number;
  status: "queued" | "working" | "done" | "error";
  outBytes?: Uint8Array;
  outName?: string;
  err?: string;
  ms?: number;
}

function fmtMB(n: number): string {
  return n >= 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(2)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`;
}

/** Rasterize every page to JPEG at the given scale/quality, rebuild a compact PDF. */
async function compressBytes(input: ArrayBuffer, scale: number, quality: number): Promise<{ out: Uint8Array; pages: number }> {
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = PDFJS_WORKER(pdfjs.version);
  const pdf = await pdfjs.getDocument({ data: input.slice(0) }).promise;
  const dst = await PDFDocument.create();
  for (let p = 1; p <= pdf.numPages; p++) {
    const page = await pdf.getPage(p);
    const base = page.getViewport({ scale: 1 });
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement("canvas");
    canvas.width = Math.floor(viewport.width);
    canvas.height = Math.floor(viewport.height);
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("canvas 2d unavailable");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    await page.render({ canvas, viewport }).promise;
    const blob: Blob | null = await new Promise((res) => canvas.toBlob((b) => res(b), "image/jpeg", quality));
    if (!blob) throw new Error(`could not encode page ${p}`);
    const jpgBytes = new Uint8Array(await blob.arrayBuffer());
    const img = await dst.embedJpg(jpgBytes);
    const dstPage = dst.addPage([base.width, base.height]);
    dstPage.drawImage(img, { x: 0, y: 0, width: base.width, height: base.height });
  }
  const out = await dst.save({ useObjectStreams: true });
  return { out: out.slice(), pages: pdf.numPages };
}

export default function CompressPage() {
  const { config } = useSiteConfig();
  const caps = pdfCaps(config, "compress");
  const [items, setItems] = useState<QueueFile[]>([]);
  const [level, setLevel] = useState<LevelKey>("recommended");
  const [quality, setQuality] = useState<number>(60);
  const [custom, setCustom] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const idRef = useRef(0);

  const active = custom
    ? { label: "Custom", desc: "Your quality slider value.", scale: 1.25, quality: quality / 100 }
    : PRESETS[level];

  const done = items.filter((i) => i.status === "done");
  const totalIn = items.reduce((s, i) => s + i.file.size, 0);
  const totalOut = done.reduce((s, i) => s + (i.outBytes?.byteLength ?? 0), 0);

  const addFiles = async (list: FileList | File[]) => {
    setError(null);
    const incoming = [...list].filter((f) => f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf"));
    if (!incoming.length) { setError("Only PDF files are accepted."); return; }
    if (items.length + incoming.length > caps.maxFiles) {
      setError(`Limit: max ${caps.maxFiles} files per batch (admin cap). Remove some first.`);
      return;
    }
    setBusy("Reading PDFs…");
    try {
      const next: QueueFile[] = [];
      const errs: string[] = [];
      for (const f of incoming) {
        if (f.size > caps.maxMB * 1024 * 1024) {
          errs.push(`“${f.name}” exceeds the ${caps.maxMB} MB per-file cap.`);
          void logOp({ tool: "compress", files: 1, pages: 0, ms: 0, ok: false, err: "maxMB exceeded" });
          continue;
        }
        try {
          const bytes = await f.arrayBuffer();
          const { getDocument } = await import("pdfjs-dist");
          const { version, GlobalWorkerOptions } = await import("pdfjs-dist");
          GlobalWorkerOptions.workerSrc = PDFJS_WORKER(version);
          const pdf = await getDocument({ data: bytes.slice(0) }).promise;
          next.push({ id: ++idRef.current, file: f, bytes, pages: pdf.numPages, status: "queued" });
        } catch (e) {
          const msg = (e as Error).message;
          errs.push(`Could not read “${f.name}”: ${msg}`);
          void logOp({ tool: "compress", files: 1, pages: 0, ms: 0, ok: false, err: msg });
        }
      }
      if (errs.length) setError(errs.join(" • "));
      setItems((prev) => [...prev, ...next]);
    } finally {
      setBusy(null);
    }
  };

  const remove = (id: number) => setItems((prev) => prev.filter((x) => x.id !== id));

  const doCompress = async () => {
    if (!items.length) { setError("Add at least 1 PDF to compress."); return; }
    setError(null);
    const { scale, quality: q } = active;
    for (const item of items) {
      if (item.status === "done") continue;
      setItems((prev) => prev.map((x) => (x.id === item.id ? { ...x, status: "working" } : x)));
      setBusy(`Compressing ${item.file.name}…`);
      const started = Date.now();
      try {
        const { out, pages } = await compressBytes(item.bytes.slice(0), scale, q);
        const ms = Date.now() - started;
        setItems((prev) => prev.map((x) =>
          x.id === item.id
            ? { ...x, status: "done", outBytes: out, outName: item.file.name.replace(/\.pdf$/i, "") + ".compressed.pdf", ms }
            : x
        ));
        void logOp({ tool: "compress", files: 1, pages, ms, ok: true });
      } catch (e) {
        const msg = (e as Error).message;
        setItems((prev) => prev.map((x) => (x.id === item.id ? { ...x, status: "error", err: msg } : x)));
        void logOp({ tool: "compress", files: 1, pages: 0, ms: Date.now() - started, ok: false, err: msg });
      }
    }
    setBusy(null);
  };

  const downloadOne = (item: QueueFile) => {
    if (!item.outBytes || !item.outName) return;
    downloadBlob(new Blob([item.outBytes.slice()], { type: "application/pdf" }), item.outName);
  };

  const downloadAll = async () => {
    if (!done.length) return;
    if (done.length === 1) { downloadOne(done[0]); return; }
    const { default: JSZip } = await import("jszip");
    const zip = new JSZip();
    for (const d of done) if (d.outBytes && d.outName) zip.file(d.outName, d.outBytes);
    const blob = await zip.generateAsync({ type: "blob" });
    downloadBlob(blob, `bornolab-compressed-${done.length}-files.zip`);
  };

  if (!caps.enabled) {
    return (
      <div>
        <SectionTitle kicker="PDF Suite" title="Compress PDF" desc="Shrink PDF file size while keeping visual quality." />
        <GlassCard>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Compress PDF is currently disabled by the administrator. Please check back later or try the{" "}
            <a className="font-bold text-cyan-700 underline dark:text-cyan-300" href="/merge">PDF Merger</a>.
          </p>
        </GlassCard>
      </div>
    );
  }

  return (
    <div>
      <SectionTitle
        kicker="PDF Suite"
        title="Compress PDF"
        desc={`Shrink PDFs for email, forms and uploads — pick a level or tune quality yourself. Free, in-browser. Caps: ${caps.maxFiles} files • ${caps.maxMB} MB each.`}
      />

      <GlassCard>
        <label
          className={cn("flex cursor-pointer items-center justify-center gap-2 rounded-2xl border-2 border-dashed p-8 text-center transition", dragActive ? "border-lime-500 bg-lime-500/10" : "border-lime-500/50 hover:bg-lime-500/5")}
          onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
          onDragLeave={() => setDragActive(false)}
          onDrop={(e) => { e.preventDefault(); setDragActive(false); if (e.dataTransfer.files?.length) void addFiles(e.dataTransfer.files); }}
        >
          <FileUp className="text-lime-600 dark:text-lime-300" />
          <span className="text-sm">Drop PDFs here or click to browse (multiple allowed)</span>
          <input
            type="file"
            accept="application/pdf"
            multiple
            className="hidden"
            onChange={(e) => { if (e.target.files?.length) void addFiles(e.target.files); e.target.value = ""; }}
          />
        </label>
        {busy && <p className="mt-2 flex items-center gap-2 text-[12px] text-lime-700 dark:text-lime-200"><Loader2 size={14} className="animate-spin" />{busy}</p>}
        {error && <p role="alert" className="mt-2 text-[12.5px] font-semibold text-red-600 dark:text-red-300">{error}</p>}
      </GlassCard>

      <GlassCard className="mt-4">
        <h2 className="flex items-center gap-2 text-sm font-black"><Minimize2 size={15} /> Compression level</h2>
        <div className="mt-3 grid gap-2 sm:grid-cols-3" role="group" aria-label="Compression level">
          {(Object.keys(PRESETS) as LevelKey[]).map((k) => (
            <button
              key={k}
              onClick={() => { setLevel(k); setCustom(false); }}
              aria-pressed={!custom && level === k}
              className={cn(
                "rounded-2xl border-2 p-3 text-left transition",
                !custom && level === k
                  ? "border-lime-500 bg-lime-500/10"
                  : "border-slate-200 hover:border-lime-500/50 dark:border-white/10"
              )}
            >
              <span className="block text-[13.5px] font-extrabold">{PRESETS[k].label}</span>
              <span className="mt-0.5 block text-[12px] text-slate-500 dark:text-slate-400">{PRESETS[k].desc}</span>
              <span className="mt-1 block font-mono text-[11px] text-slate-500">scale {PRESETS[k].scale}× • JPEG {Math.round(PRESETS[k].quality * 100)}%</span>
            </button>
          ))}
        </div>
        <div className="mt-3 rounded-2xl bg-slate-900/[.04] p-3 dark:bg-white/5">
          <label className="flex items-center justify-between text-[12.5px] font-bold">
            <span>Custom quality: {quality}%</span>
            <input type="checkbox" checked={custom} onChange={(e) => setCustom(e.target.checked)} className="h-4 w-4 accent-lime-500" aria-label="Use custom quality" />
          </label>
          <input
            type="range"
            min={10}
            max={95}
            value={quality}
            disabled={!custom}
            onChange={(e) => setQuality(Number(e.target.value))}
            className="mt-2 w-full accent-lime-500 disabled:opacity-40"
            aria-label="JPEG quality percent"
          />
          <p className="mt-1 text-[11.5px] text-slate-500">Lower % = smaller file. Render scale fixed at 1.25× in custom mode.</p>
        </div>
      </GlassCard>

      {items.length > 0 && (
        <>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <button
              onClick={doCompress}
              disabled={!!busy}
              className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-lime-500 to-green-600 px-5 py-2.5 text-[13px] font-bold text-white disabled:opacity-40"
            >
              {busy ? <Loader2 size={14} className="animate-spin" /> : <Minimize2 size={14} />}
              Compress {items.length} file{items.length > 1 ? "s" : ""} ({active.label}{custom ? ` ${quality}%` : ""})
            </button>
            {done.length > 0 && (
              <button onClick={downloadAll} className="glass hover-glow flex items-center gap-1.5 rounded-full px-4 py-2.5 text-[12px] font-bold">
                <Files size={14} /> Download all ({done.length})
              </button>
            )}
            <button onClick={() => setItems([])} className="glass hover-glow rounded-full px-4 py-2.5 text-[12px] font-bold">Clear all</button>
            {done.length > 0 && totalOut > 0 && (
              <span className="text-[12px] font-bold text-emerald-600 dark:text-emerald-300">
                {fmtMB(totalIn)} → {fmtMB(totalOut)} ({Math.max(0, Math.round((1 - totalOut / totalIn) * 100))}% smaller)
              </span>
            )}
          </div>
          <ol className="mt-4 space-y-2">
            {items.map((item) => {
              const outSize = item.outBytes?.byteLength ?? 0;
              const ratio = item.status === "done" && item.file.size > 0 ? Math.max(0, Math.round((1 - outSize / item.file.size) * 100)) : 0;
              return (
                <li key={item.id} className="glass rounded-2xl p-3">
                  <div className="flex items-center gap-2">
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-gradient-to-r from-lime-500 to-green-600 text-[12px] font-black text-white">
                      {item.status === "done" ? "✓" : item.status === "error" ? "!" : "…"}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13.5px] font-bold">{item.file.name}</span>
                      <span className="block text-[11.5px] text-slate-500">
                        {item.pages} pages • {fmtMB(item.file.size)}
                        {item.status === "done" && <> → <b className="text-emerald-600 dark:text-emerald-300">{fmtMB(outSize)} (−{ratio}%)</b> • {item.ms}ms</>}
                        {item.status === "working" && " • compressing…"}
                        {item.status === "error" && <span className="text-red-500"> • {item.err}</span>}
                      </span>
                    </span>
                    {item.status === "done" && (
                      <button onClick={() => downloadOne(item)} aria-label={`Download ${item.file.name}`} className="flex items-center gap-1 rounded-full bg-gradient-to-r from-lime-500 to-green-600 px-3 py-2 text-[12px] font-bold text-white">
                        <Download size={13} /> Save
                      </button>
                    )}
                    <button onClick={() => remove(item.id)} aria-label={`Remove ${item.file.name}`} className="glass hover-glow rounded-full p-2 text-red-500"><X size={14} /></button>
                  </div>
                  {item.status === "done" && (
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-200 dark:bg-white/10" aria-hidden>
                      <div className="h-full rounded-full bg-gradient-to-r from-lime-500 to-green-600" style={{ width: `${item.file.size ? Math.min(100, Math.max(2, (outSize / item.file.size) * 100)) : 0}%` }} />
                    </div>
                  )}
                </li>
              );
            })}
          </ol>
        </>
      )}
    </div>
  );
}
