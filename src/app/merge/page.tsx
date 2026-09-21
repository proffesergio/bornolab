"use client";
import { useRef, useState } from "react";
import { FileUp, Download, Loader2, ArrowUp, ArrowDown, X } from "lucide-react";
import { GlassCard, SectionTitle } from "@/components/ui";
import { downloadBlob } from "@/lib/doc-utils";
import { useSiteConfig } from "@/components/site-widgets";
import { pdfCaps } from "@/lib/site-config-shared";
import { PDFDocument } from "pdf-lib";

interface MergeFile {
  id: number;
  file: File;
  bytes: ArrayBuffer;
  pages: number;
}

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

export default function MergePage() {
  const { config } = useSiteConfig();
  const caps = pdfCaps(config, "merge");
  const [items, setItems] = useState<MergeFile[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [dragId, setDragId] = useState<number | null>(null);
  const idRef = useRef(0);

  const totalPages = items.reduce((s, i) => s + i.pages, 0);

  const addFiles = async (list: FileList | File[]) => {
    setError(null);
    const incoming = [...list].filter((f) => f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf"));
    if (items.length + incoming.length > caps.maxFiles) {
      setError(`Limit: max ${caps.maxFiles} files per merge (admin cap). Remove some first.`);
      return;
    }
    setBusy("Reading PDFs…");
    try {
      const next: MergeFile[] = [];
      const errs: string[] = [];
      for (const f of incoming) {
        if (f.size > caps.maxMB * 1024 * 1024) {
          errs.push(`“${f.name}” exceeds the ${caps.maxMB} MB per-file cap.`);
          void logOp({ tool: "merge", files: 1, pages: 0, ms: 0, ok: false, err: "maxMB exceeded" });
          continue;
        }
        try {
          const bytes = await f.arrayBuffer();
          const doc = await PDFDocument.load(bytes.slice(0), { ignoreEncryption: true });
          next.push({ id: ++idRef.current, file: f, bytes, pages: doc.getPageCount() });
        } catch (e) {
          const msg = (e as Error).message;
          errs.push(`Could not read “${f.name}”: ${msg}`);
          void logOp({ tool: "merge", files: 1, pages: 0, ms: 0, ok: false, err: String(msg) });
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

  const remove = (id: number) => setItems((prev) => prev.filter((x) => x.id !== id));

  /** Drag-reorder: drop a row onto another to reposition it. */
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

  const doMerge = async () => {
    if (items.length < 2) {
      setError("Add at least 2 PDFs to merge.");
      return;
    }
    setError(null);
    const started = Date.now();
    setBusy(`Merging ${items.length} files…`);
    try {
      const dst = await PDFDocument.create();
      for (const item of items) {
        // ignoreEncryption matches addFiles preview so listed files always merge
        const src = await PDFDocument.load(item.bytes.slice(0), { ignoreEncryption: true });
        const copied = await dst.copyPages(src, src.getPages().map((_, p) => p));
        copied.forEach((p) => dst.addPage(p));
      }
      const bytes = await dst.save();
      downloadBlob(new Blob([bytes.slice()], { type: "application/pdf" }), `bornolab-merged-${totalPages}p.pdf`);
      void logOp({ tool: "merge", files: items.length, pages: totalPages, ms: Date.now() - started, ok: true });
    } catch (e) {
      const msg = (e as Error).message;
      setError(`Merge failed: ${msg}`);
      void logOp({ tool: "merge", files: items.length, pages: 0, ms: Date.now() - started, ok: false, err: msg });
    } finally {
      setBusy(null);
    }
  };

  if (!caps.enabled) {
    return (
      <div>
        <SectionTitle kicker="PDF Suite" title="Merge PDF" desc="Combine multiple PDFs into one file, in your order." />
        <GlassCard>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Merge PDF is currently disabled by the administrator. Please check back later or try the{" "}
            <a className="font-bold text-cyan-700 underline dark:text-cyan-300" href="/split">PDF Splitter</a>.
          </p>
        </GlassCard>
      </div>
    );
  }

  return (
    <div>
      <SectionTitle
        kicker="PDF Suite"
        title="Merge PDF"
        desc={`Combine PDFs in the order you want — drag or arrow-reorder, then merge. Free, in-browser. Caps: ${caps.maxFiles} files • ${caps.maxMB} MB each.`}
      />
      <GlassCard>
        <label
          className={`flex cursor-pointer items-center justify-center gap-2 rounded-2xl border-2 border-dashed p-8 text-center transition ${dragActive ? "border-orange-500 bg-orange-500/10" : "border-orange-500/50 hover:bg-orange-500/5"}`}
          onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
          onDragLeave={() => setDragActive(false)}
          onDrop={(e) => { e.preventDefault(); setDragActive(false); if (e.dataTransfer.files?.length) void addFiles(e.dataTransfer.files); }}
        >
          <FileUp className="text-orange-600 dark:text-orange-300" />
          <span className="text-sm">Drop PDFs here or click to browse (multiple allowed)</span>
          <input
            type="file"
            accept="application/pdf"
            multiple
            className="hidden"
            onChange={(e) => { if (e.target.files?.length) void addFiles(e.target.files); e.target.value = ""; }}
          />
        </label>
        {busy && <p className="mt-2 flex items-center gap-2 text-[12px] text-orange-700 dark:text-orange-200"><Loader2 size={14} className="animate-spin" />{busy}</p>}
        {error && <p role="alert" className="mt-2 text-[12.5px] font-semibold text-red-600 dark:text-red-300">{error}</p>}
      </GlassCard>

      {items.length > 0 && (
        <>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <button
              onClick={doMerge}
              disabled={!!busy || items.length < 2}
              className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-orange-500 to-red-500 px-5 py-2.5 text-[13px] font-bold text-white disabled:opacity-40"
            >
              {busy ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
              Merge {items.length} files → {totalPages} pages
            </button>
            <button onClick={() => setItems([])} className="glass hover-glow rounded-full px-4 py-2.5 text-[12px] font-bold">Clear all</button>
          </div>
          <ol className="mt-4 space-y-2">
            {items.map((item, i) => (
              <li
                key={item.id}
                draggable
                onDragStart={() => setDragId(item.id)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => dropReorder(item.id)}
                onDragEnd={() => setDragId(null)}
                className={`glass flex items-center gap-2 rounded-2xl p-3 ${dragId === item.id ? "opacity-50" : ""}`}
                title="Drag to reorder, or use arrows"
              >
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-gradient-to-r from-orange-500 to-red-500 text-[12px] font-black text-white">
                  {i + 1}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13.5px] font-bold">{item.file.name}</span>
                  <span className="block text-[11.5px] text-slate-500">{item.pages} pages • {(item.file.size / 1024 / 1024).toFixed(1)} MB</span>
                </span>
                <button onClick={() => move(item.id, -1)} disabled={i === 0} aria-label={`Move ${item.file.name} up`} className="glass hover-glow rounded-full p-2 disabled:opacity-30"><ArrowUp size={14} /></button>
                <button onClick={() => move(item.id, 1)} disabled={i === items.length - 1} aria-label={`Move ${item.file.name} down`} className="glass hover-glow rounded-full p-2 disabled:opacity-30"><ArrowDown size={14} /></button>
                <button onClick={() => remove(item.id)} aria-label={`Remove ${item.file.name}`} className="glass hover-glow rounded-full p-2 text-red-500"><X size={14} /></button>
              </li>
            ))}
          </ol>
        </>
      )}
    </div>
  );
}
