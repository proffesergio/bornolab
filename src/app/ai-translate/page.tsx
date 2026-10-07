"use client";
import { useState } from "react";
import { Languages, Loader2, Copy, Check, FileUp } from "lucide-react";
import { GlassCard, SectionTitle } from "@/components/ui";
import { downloadBlob } from "@/lib/doc-utils";
import { useSiteConfig } from "@/components/site-widgets";
import { pdfCaps } from "@/lib/site-config-shared";

const PDFJS_WORKER = (version: string) =>
  `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${version}/pdf.worker.min.mjs`;

async function logOp(op: { tool: string; files: number; pages: number; ms: number; ok: boolean; err?: string }) {
  try {
    await fetch("/api/pdf/log", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(op) });
  } catch { /* best-effort */ }
}

const LANGS = [
  { id: "bn", label: "Bangla" },
  { id: "en", label: "English" },
  { id: "ar", label: "Arabic" },
  { id: "hi", label: "Hindi" },
  { id: "ur", label: "Urdu" },
] as const;

/** Translate text in your browser via the free MyMemory API, chunked to respect rate limits. */
async function translateChunk(text: string, from: string, to: string): Promise<string> {
  const r = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${from}|${to}`);
  if (!r.ok) throw new Error(`translation API HTTP ${r.status}`);
  const j = await r.json() as { responseData?: { translatedText?: string } };
  const out = j.responseData?.translatedText;
  if (!out) throw new Error("empty translation response");
  return out;
}

export default function AiTranslatePage() {
  const { config } = useSiteConfig();
  const caps = pdfCaps(config, "aitranslate");
  const [text, setText] = useState("");
  const [from, setFrom] = useState("en");
  const [to, setTo] = useState("bn");
  const [out, setOut] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const fromPdf = async (f: File) => {
    setError(null);
    if (f.size > caps.maxMB * 1024 * 1024) { setError(`Exceeds the ${caps.maxMB} MB per-file cap.`); return; }
    setBusy(true);
    try {
      const pdfjs = await import("pdfjs-dist");
      pdfjs.GlobalWorkerOptions.workerSrc = PDFJS_WORKER(pdfjs.version);
      const pdf = await pdfjs.getDocument({ data: await f.arrayBuffer() }).promise;
      let full = "";
      for (let p = 1; p <= pdf.numPages; p++) {
        const page = await pdf.getPage(p);
        const tc = await page.getTextContent();
        full += (tc.items as Array<{ str: string }>).map((it) => it.str).join(" ") + "\n";
      }
      setText(full.trim().slice(0, 50_000));
    } catch (e) {
      setError(`Could not read PDF: ${(e as Error).message}`);
    } finally {
      setBusy(false);
    }
  };

  const run = async () => {
    setError(null); setOut("");
    if (text.trim().length < 3) { setError("Paste or extract some text first."); return; }
    if (from === to) { setError("Source and target languages must differ."); return; }
    setBusy(true);
    const started = Date.now();
    try {
      // Chunk to respect free-API limits; layout order preserved by join.
      const chunks: string[] = [];
      const paras = text.split(/\n+/).map((s) => s.trim()).filter(Boolean);
      let cur = "";
      for (const p of paras) {
        if ((cur + "\n" + p).length > 450) { if (cur) chunks.push(cur); cur = p; }
        else cur = cur ? `${cur}\n${p}` : p;
      }
      if (cur) chunks.push(cur);
      const parts: string[] = [];
      for (const c of chunks.slice(0, 20)) {
        parts.push(await translateChunk(c, from, to));
      }
      setOut(parts.join("\n"));
      void logOp({ tool: "aitranslate", files: 0, pages: 0, ms: Date.now() - started, ok: true });
    } catch (e) {
      const msg = `Translation failed: ${(e as Error).message}. Check your connection and try shorter text.`;
      setError(msg);
      void logOp({ tool: "aitranslate", files: 0, pages: 0, ms: Date.now() - started, ok: false, err: String((e as Error).message) });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl">
      <SectionTitle kicker="PDF Suite" title="AI Translator" desc="Translate document text while keeping paragraph breaks — free, in your browser." />
      {error && <p role="alert" className="mb-3 rounded-xl bg-red-500/10 p-3 text-[13px] font-semibold text-red-600 dark:text-red-300">{error}</p>}
      <GlassCard>
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-[13px] font-bold">From
            <select value={from} onChange={(e) => setFrom(e.target.value)} className="rounded-xl bg-slate-100 p-2 dark:bg-black/30">
              {LANGS.map((l) => <option key={l.id} value={l.id}>{l.label}</option>)}
            </select>
          </label>
          <label className="flex items-center gap-2 text-[13px] font-bold">To
            <select value={to} onChange={(e) => setTo(e.target.value)} className="rounded-xl bg-slate-100 p-2 dark:bg-black/30">
              {LANGS.map((l) => <option key={l.id} value={l.id}>{l.label}</option>)}
            </select>
          </label>
          <span className="text-[11.5px] text-slate-500">Free translation API • max ~20 paragraphs per run</span>
          <label className="ml-auto flex cursor-pointer items-center gap-2 rounded-xl bg-slate-100 px-3 py-2 text-[12.5px] font-bold dark:bg-black/30">
            <FileUp size={14} /> PDF
            <input type="file" accept="application/pdf,.pdf" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) void fromPdf(f); e.target.value = ""; }} />
          </label>
        </div>
        <label htmlFor="ait-text" className="mt-3 block text-xs font-bold">Source text</label>
        <textarea id="ait-text" rows={7} value={text} onChange={(e) => setText(e.target.value)} placeholder="Paste text or extract from a PDF…" className="focus-glow mt-1 w-full rounded-xl bg-slate-100 p-3 text-sm outline-none dark:bg-black/30" />
        <button onClick={run} disabled={busy} className="mt-3 flex items-center gap-1.5 rounded-full bg-gradient-to-r from-cyan-500 to-sky-600 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-40">
          {busy ? <Loader2 size={15} className="animate-spin" /> : <Languages size={15} />} Translate
        </button>
      </GlassCard>
      {out && (
        <GlassCard className="mt-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold">Translation</h3>
            <div className="flex gap-2">
              <button onClick={async () => { await navigator.clipboard.writeText(out); setCopied(true); setTimeout(() => setCopied(false), 1500); }} className="glass flex items-center gap-1 rounded-full px-3 py-1.5 text-[12px] font-bold">
                {copied ? <Check size={13} /> : <Copy size={13} />} {copied ? "Copied" : "Copy"}
              </button>
              <button onClick={() => downloadBlob(new Blob([out], { type: "text/plain" }), "translation.txt")} className="glass rounded-full px-3 py-1.5 text-[12px] font-bold">Download .txt</button>
            </div>
          </div>
          <p className="mt-2 whitespace-pre-wrap text-[13.5px] leading-7">{out}</p>
        </GlassCard>
      )}
    </div>
  );
}
