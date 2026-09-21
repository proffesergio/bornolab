"use client";
import { useEffect, useRef, useState } from "react";
import { FileUp, Download, Loader2, X, ArrowUp, ArrowDown, Image as ImageIcon } from "lucide-react";
import { GlassCard, SectionTitle } from "@/components/ui";
import { downloadBlob } from "@/lib/doc-utils";
import { useSiteConfig } from "@/components/site-widgets";
import { pdfCaps } from "@/lib/site-config-shared";
import { PDFDocument } from "pdf-lib";
import { cn } from "@/lib/cn";

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

type PageSize = "fit" | "a4" | "letter";
type Orientation = "auto" | "portrait" | "landscape";
type Margin = "none" | "narrow" | "wide";

const MARGIN_PT: Record<Margin, number> = { none: 0, narrow: 24, wide: 48 };
const PAGE_PT: Record<Exclude<PageSize, "fit">, [number, number]> = {
  a4: [595, 842],
  letter: [612, 792],
};

interface QueueImage {
  id: number;
  file: File;
  url: string;
  width: number;
  height: number;
}

function loadDims(file: File, url: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = () => reject(new Error(`could not decode “${file.name}”`));
    img.src = url;
  });
}

/** Normalize any raster (jpeg/png/webp/gif/bmp) to embeddable bytes. Keeps alpha via PNG, else JPEG. */
async function toEmbeddable(file: File): Promise<{ kind: "jpg" | "png"; bytes: Uint8Array }> {
  const buf = new Uint8Array(await file.arrayBuffer());
  const isJpg = buf[0] === 0xff && buf[1] === 0xd8;
  const isPng = buf[0] === 0x89 && buf[1] === 0x50;
  if (isJpg) return { kind: "jpg", bytes: buf.slice() };
  if (isPng) return { kind: "png", bytes: buf.slice() };
  // webp/gif/bmp/avif…: draw through canvas to a portable format
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new window.Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error(`could not decode “${file.name}”`));
      el.src = url;
    });
    const canvas = document.createElement("canvas");
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("canvas 2d unavailable");
    ctx.drawImage(img, 0, 0);
    const blob: Blob | null = await new Promise((res) => canvas.toBlob((b) => res(b), "image/png"));
    if (!blob) throw new Error(`could not convert “${file.name}”`);
    return { kind: "png", bytes: new Uint8Array(await blob.arrayBuffer()) };
  } finally {
    URL.revokeObjectURL(url);
  }
}

export default function ImagesToPdfPage() {
  const { config } = useSiteConfig();
  const caps = pdfCaps(config, "images");
  const [items, setItems] = useState<QueueImage[]>([]);
  const [pageSize, setPageSize] = useState<PageSize>("a4");
  const [orientation, setOrientation] = useState<Orientation>("auto");
  const [margin, setMargin] = useState<Margin>("narrow");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [dragId, setDragId] = useState<number | null>(null);
  const idRef = useRef(0);

  // Revoke preview URLs on unmount
  useEffect(() => () => {
    setItems((prev) => {
      prev.forEach((i) => URL.revokeObjectURL(i.url));
      return prev;
    });
  }, []);

  const addFiles = async (list: FileList | File[]) => {
    setError(null);
    const incoming = [...list].filter((f) => f.type.startsWith("image/") || /\.(jpe?g|png|webp|gif|bmp|avif)$/i.test(f.name));
    if (!incoming.length) { setError("Only image files (JPG, PNG, WebP, GIF) are accepted."); return; }
    if (items.length + incoming.length > caps.maxFiles) {
      setError(`Limit: max ${caps.maxFiles} images per PDF (admin cap). Remove some first.`);
      return;
    }
    setBusy("Reading images…");
    try {
      const next: QueueImage[] = [];
      const errs: string[] = [];
      for (const f of incoming) {
        if (f.size > caps.maxMB * 1024 * 1024) {
          errs.push(`“${f.name}” exceeds the ${caps.maxMB} MB per-file cap.`);
          void logOp({ tool: "images", files: 1, pages: 0, ms: 0, ok: false, err: "maxMB exceeded" });
          continue;
        }
        const url = URL.createObjectURL(f);
        try {
          const { width, height } = await loadDims(f, url);
          next.push({ id: ++idRef.current, file: f, url, width, height });
        } catch (e) {
          URL.revokeObjectURL(url);
          const msg = (e as Error).message;
          errs.push(msg);
          void logOp({ tool: "images", files: 1, pages: 0, ms: 0, ok: false, err: msg });
        }
      }
      if (errs.length) setError(errs.join(" • "));
      setItems((prev) => [...prev, ...next]);
    } finally {
      setBusy(null);
    }
  };

  const move = (id: number, dir: -1 | 1) => {
    setItems((prev) => {
      const i = prev.findIndex((x) => x.id === id);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= prev.length) return prev;
      const copy = [...prev];
      [copy[i], copy[j]] = [copy[j], copy[i]];
      return copy;
    });
  };

  const dropReorder = (targetId: number) => {
    setDragId((from) => {
      if (from == null || from === targetId) return null;
      setItems((prev) => {
        const i = prev.findIndex((x) => x.id === from);
        const j = prev.findIndex((x) => x.id === targetId);
        if (i < 0 || j < 0) return prev;
        const copy = [...prev];
        const [moved] = copy.splice(i, 1);
        copy.splice(j, 0, moved);
        return copy;
      });
      return null;
    });
  };

  const remove = (id: number) =>
    setItems((prev) => {
      const target = prev.find((x) => x.id === id);
      if (target) URL.revokeObjectURL(target.url);
      return prev.filter((x) => x.id !== id);
    });

  const doBuild = async () => {
    if (!items.length) { setError("Add at least 1 image."); return; }
    setError(null);
    const started = Date.now();
    setBusy(`Building PDF from ${items.length} image${items.length > 1 ? "s" : ""}…`);
    try {
      const dst = await PDFDocument.create();
      for (const item of items) {
        const { kind, bytes } = await toEmbeddable(item.file);
        const img = kind === "jpg" ? await dst.embedJpg(bytes) : await dst.embedPng(bytes);
        const m = MARGIN_PT[margin];
        let pw: number; let ph: number;
        if (pageSize === "fit") {
          // One page exactly the image aspect (capped to A4-ish max for sanity)
          const scale = Math.min(1, 1200 / Math.max(item.width, item.height));
          pw = Math.max(72, item.width * scale * 0.75 + m * 2);
          ph = Math.max(72, item.height * scale * 0.75 + m * 2);
          if (orientation === "portrait" && pw > ph) [pw, ph] = [ph, pw];
          if (orientation === "landscape" && ph > pw) [pw, ph] = [ph, pw];
        } else {
          [pw, ph] = PAGE_PT[pageSize];
          const landscapeImg = item.width > item.height;
          const wantLandscape = orientation === "landscape" || (orientation === "auto" && landscapeImg);
          const wantPortrait = orientation === "portrait";
          if (wantLandscape && ph > pw) [pw, ph] = [ph, pw];
          if (wantPortrait && pw > ph) [pw, ph] = [ph, pw];
        }
        const page = dst.addPage([pw, ph]);
        const boxW = pw - m * 2;
        const boxH = ph - m * 2;
        const fit = Math.min(boxW / img.width, boxH / img.height);
        const dw = img.width * fit;
        const dh = img.height * fit;
        page.drawImage(img, { x: (pw - dw) / 2, y: (ph - dh) / 2, width: dw, height: dh });
      }
      const bytes = await dst.save({ useObjectStreams: true });
      downloadBlob(new Blob([bytes.slice()], { type: "application/pdf" }), `bornolab-images-${items.length}.pdf`);
      void logOp({ tool: "images", files: items.length, pages: items.length, ms: Date.now() - started, ok: true });
    } catch (e) {
      const msg = (e as Error).message;
      setError(`Build failed: ${msg}`);
      void logOp({ tool: "images", files: items.length, pages: 0, ms: Date.now() - started, ok: false, err: msg });
    } finally {
      setBusy(null);
    }
  };

  if (!caps.enabled) {
    return (
      <div>
        <SectionTitle kicker="PDF Suite" title="Images to PDF" desc="Turn JPG/PNG photos into one PDF." />
        <GlassCard>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Images to PDF is currently disabled by the administrator. Please check back later or try the{" "}
            <a className="font-bold text-cyan-700 underline dark:text-cyan-300" href="/merge">PDF Merger</a>.
          </p>
        </GlassCard>
      </div>
    );
  }

  const seg = "rounded-full px-3 py-2 text-[12px] font-bold transition";
  const segOn = "bg-gradient-to-r from-yellow-500 to-amber-600 text-white";
  const segOff = "glass text-slate-700 hover-glow dark:text-slate-300";

  return (
    <div>
      <SectionTitle
        kicker="PDF Suite"
        title="Images to PDF"
        desc={`JPG/PNG photos → one clean PDF. Reorder, pick page size and margins, then build. Free, in-browser. Caps: ${caps.maxFiles} images • ${caps.maxMB} MB each.`}
      />
      <GlassCard>
        <label
          className={cn("flex cursor-pointer items-center justify-center gap-2 rounded-2xl border-2 border-dashed p-8 text-center transition", dragActive ? "border-yellow-500 bg-yellow-500/10" : "border-yellow-500/50 hover:bg-yellow-500/5")}
          onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
          onDragLeave={() => setDragActive(false)}
          onDrop={(e) => { e.preventDefault(); setDragActive(false); if (e.dataTransfer.files?.length) void addFiles(e.dataTransfer.files); }}
        >
          <FileUp className="text-yellow-600 dark:text-yellow-300" />
          <span className="text-sm">Drop images here or click to browse (multiple allowed)</span>
          <input
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => { if (e.target.files?.length) void addFiles(e.target.files); e.target.value = ""; }}
          />
        </label>
        {busy && <p className="mt-2 flex items-center gap-2 text-[12px] text-yellow-700 dark:text-yellow-200"><Loader2 size={14} className="animate-spin" />{busy}</p>}
        {error && <p role="alert" className="mt-2 text-[12.5px] font-semibold text-red-600 dark:text-red-300">{error}</p>}
      </GlassCard>

      <GlassCard className="mt-4">
        <h2 className="flex items-center gap-2 text-sm font-black"><ImageIcon size={15} /> Layout</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <div>
            <p className="text-[11.5px] font-bold uppercase tracking-wider text-slate-500">Page size</p>
            <div className="mt-1 flex gap-1.5" role="group" aria-label="Page size">
              {(["fit", "a4", "letter"] as const).map((v) => (
                <button key={v} onClick={() => setPageSize(v)} aria-pressed={pageSize === v} className={cn(seg, pageSize === v ? segOn : segOff)}>{v === "fit" ? "Fit image" : v.toUpperCase()}</button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-[11.5px] font-bold uppercase tracking-wider text-slate-500">Orientation</p>
            <div className="mt-1 flex gap-1.5" role="group" aria-label="Orientation">
              {(["auto", "portrait", "landscape"] as const).map((v) => (
                <button key={v} onClick={() => setOrientation(v)} aria-pressed={orientation === v} className={cn(seg, orientation === v ? segOn : segOff, "capitalize")}>{v}</button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-[11.5px] font-bold uppercase tracking-wider text-slate-500">Margin</p>
            <div className="mt-1 flex gap-1.5" role="group" aria-label="Margin">
              {(["none", "narrow", "wide"] as const).map((v) => (
                <button key={v} onClick={() => setMargin(v)} aria-pressed={margin === v} className={cn(seg, margin === v ? segOn : segOff, "capitalize")}>{v}</button>
              ))}
            </div>
          </div>
        </div>
      </GlassCard>

      {items.length > 0 && (
        <>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <button
              onClick={doBuild}
              disabled={!!busy}
              className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-yellow-500 to-amber-600 px-5 py-2.5 text-[13px] font-bold text-white disabled:opacity-40"
            >
              {busy ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
              Build PDF ({items.length} image{items.length > 1 ? "s" : ""})
            </button>
            <button onClick={() => setItems((prev) => { prev.forEach((i) => URL.revokeObjectURL(i.url)); return []; })} className="glass hover-glow rounded-full px-4 py-2.5 text-[12px] font-bold">Clear all</button>
          </div>
          <ol className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {items.map((item, i) => (
              <li
                key={item.id}
                draggable
                onDragStart={() => setDragId(item.id)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => dropReorder(item.id)}
                onDragEnd={() => setDragId(null)}
                className={cn("glass overflow-hidden rounded-2xl", dragId === item.id && "opacity-50")}
                title="Drag to reorder, or use arrows"
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- previews are runtime object URLs, not optimizable */}
                <img src={item.url} alt={item.file.name} className="aspect-[3/4] w-full object-cover" loading="lazy" />
                <div className="p-2">
                  <p className="truncate text-[12px] font-bold">{i + 1}. {item.file.name}</p>
                  <p className="text-[11px] text-slate-500">{item.width}×{item.height}</p>
                  <div className="mt-1 flex gap-1">
                    <button onClick={() => move(item.id, -1)} disabled={i === 0} aria-label={`Move ${item.file.name} up`} className="glass hover-glow rounded-full p-1.5 disabled:opacity-30"><ArrowUp size={13} /></button>
                    <button onClick={() => move(item.id, 1)} disabled={i === items.length - 1} aria-label={`Move ${item.file.name} down`} className="glass hover-glow rounded-full p-1.5 disabled:opacity-30"><ArrowDown size={13} /></button>
                    <button onClick={() => remove(item.id)} aria-label={`Remove ${item.file.name}`} className="glass hover-glow rounded-full p-1.5 text-red-500"><X size={13} /></button>
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </>
      )}
    </div>
  );
}
