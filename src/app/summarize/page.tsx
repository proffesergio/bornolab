"use client";
import { useState } from "react";
import { Sparkles, Loader2, Copy, Check, FileUp } from "lucide-react";
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

const STOP = new Set("the,a,an,and,or,of,to,in,on,for,with,from,by,as,at,is,are,was,were,be,been,this,that,these,those,it,its,you,your,we,our,they,their,he,she,his,her,not,but,all,can,will,has,have,had,more,most,than,then,there,what,which,who,when,where,how,একটি,এক,এবং,বা,এর,কে,তে,থেকে,দিয়ে,জন্য,সাথে,যে,যা,এই,সেই,টি,টা,গুলো,গুলি,হয়,হচ্ছে,করে,করা,করুন,আছে,ছিল,নয়,না,আর,ও,কি,কী,কেন,যেমন,তাই,তবে,যদি,সব,অনেক,বেশি,কম,মধ্যে,উপর,নিচে,পরে,আগে,প্রতি".split(","));

/** Offline extractive summary: score sentences by word frequency, keep top N in order. */
export function summarizeText(text: string, maxBullets = 5): string[] {
  const freq = new Map<string, number>();
  const words = text.toLowerCase().replace(/[।.,!?;:"“”‘’()[\]{}0-9০-৯]/g, " ").split(/\s+/);
  for (const w of words) {
    if (w.length < 3 || STOP.has(w)) continue;
    freq.set(w, (freq.get(w) ?? 0) + 1);
  }
  const sentences = text.replace(/\s+/g, " ").split(/(?<=[।.!?])\s+/).map((s) => s.trim()).filter((s) => s.length > 20);
  const scored = sentences.map((s, i) => {
    let score = 0;
    for (const w of s.toLowerCase().split(/\s+/)) score += freq.get(w) ?? 0;
    return { s, i, score: score / Math.max(8, s.split(/\s+/).length) };
  });
  return scored.sort((a, b) => b.score - a.score).slice(0, Math.min(maxBullets, sentences.length))
    .sort((a, b) => a.i - b.i).map((x) => x.s);
}

export default function SummarizePage() {
  const { config } = useSiteConfig();
  const caps = pdfCaps(config, "summarize");
  const [text, setText] = useState("");
  const [bullets, setBullets] = useState(5);
  const [out, setOut] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const fromPdf = async (f: File) => {
    setError(null);
    if (f.size > caps.maxMB * 1024 * 1024) { setError(`Exceeds the ${caps.maxMB} MB per-file cap.`); return; }
    setBusy(true);
    const started = Date.now();
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
      if (!full.trim()) throw new Error("No extractable text — scanned pages need OCR (see roadmap).");
      setText(full.trim().slice(0, 200_000));
      void logOp({ tool: "summarize", files: 1, pages: pdf.numPages, ms: Date.now() - started, ok: true });
    } catch (e) {
      setError(`Could not read PDF: ${(e as Error).message}`);
      void logOp({ tool: "summarize", files: 1, pages: 0, ms: Date.now() - started, ok: false, err: String((e as Error).message) });
    } finally {
      setBusy(false);
    }
  };

  const run = () => {
    setError(null);
    if (text.trim().split(/\s+/).length < 30) { setError("Paste at least ~30 words for a useful summary."); return; }
    const started = Date.now();
    setOut(summarizeText(text, bullets));
    void logOp({ tool: "summarize", files: 0, pages: 0, ms: Date.now() - started, ok: true });
  };

  return (
    <div className="mx-auto max-w-3xl">
      <SectionTitle kicker="PDF Suite" title="AI Summarizer" desc="Key points extracted offline in your browser — drop a PDF or paste text. Nothing is uploaded." />
      {error && <p role="alert" className="mb-3 rounded-xl bg-red-500/10 p-3 text-[13px] font-semibold text-red-600 dark:text-red-300">{error}</p>}
      <GlassCard>
        <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-slate-100 p-4 text-sm font-bold dark:bg-black/30">
          <FileUp size={16} /> {busy ? "Reading PDF…" : "Drop a PDF to extract text"}
          <input type="file" accept="application/pdf,.pdf" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) void fromPdf(f); e.target.value = ""; }} />
        </label>
        <label htmlFor="sum-text" className="mt-3 block text-xs font-bold">Document text</label>
        <textarea id="sum-text" rows={8} value={text} onChange={(e) => setText(e.target.value)} placeholder="Paste article, chapter or report text here…" className="focus-glow mt-1 w-full rounded-xl bg-slate-100 p-3 text-sm outline-none dark:bg-black/30" />
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-[13px] font-bold">Key points
            <input type="number" min={3} max={10} value={bullets} onChange={(e) => setBullets(Math.min(10, Math.max(3, Number(e.target.value) || 5)))} className="w-16 rounded-xl bg-slate-100 p-2 text-center dark:bg-black/30" />
          </label>
          <button onClick={run} disabled={busy} className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-purple-500 to-fuchsia-600 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-40">
            {busy ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />} Summarize
          </button>
        </div>
      </GlassCard>
      {out.length > 0 && (
        <GlassCard className="mt-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold">Summary ({out.length} points)</h3>
            <div className="flex gap-2">
              <button onClick={async () => { await navigator.clipboard.writeText(out.map((b) => `• ${b}`).join("\n")); setCopied(true); setTimeout(() => setCopied(false), 1500); }} className="glass flex items-center gap-1 rounded-full px-3 py-1.5 text-[12px] font-bold">
                {copied ? <Check size={13} /> : <Copy size={13} />} {copied ? "Copied" : "Copy"}
              </button>
              <button onClick={() => downloadBlob(new Blob([out.map((b) => `• ${b}`).join("\n")], { type: "text/plain" }), "summary.txt")} className="glass rounded-full px-3 py-1.5 text-[12px] font-bold">Download .txt</button>
            </div>
          </div>
          <ul className="mt-2 space-y-2 text-[13.5px] leading-7">
            {out.map((b, i) => <li key={i} className="rounded-xl bg-slate-900/[.04] p-3 dark:bg-white/5">• {b}</li>)}
          </ul>
        </GlassCard>
      )}
    </div>
  );
}
