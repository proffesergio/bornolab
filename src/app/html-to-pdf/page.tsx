"use client";
import { useState } from "react";
import { Globe, Loader2, Printer, Download } from "lucide-react";
import { GlassCard, SectionTitle } from "@/components/ui";
import { downloadBlob } from "@/lib/doc-utils";
import { useSiteConfig } from "@/components/site-widgets";
import { pdfCaps } from "@/lib/site-config-shared";

async function logOp(op: { tool: string; files: number; pages: number; ms: number; ok: boolean; err?: string }) {
  try {
    await fetch("/api/pdf/log", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(op) });
  } catch { /* best-effort */ }
}

/** Strip scripts + event handlers before previewing fetched markup. */
function sanitizeHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script\s*>/gi, "")
    .replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(/javascript:/gi, "");
}

export default function HtmlToPdfPage() {
  const { config } = useSiteConfig();
  const caps = pdfCaps(config, "html");
  const [url, setUrl] = useState("");
  const [html, setHtml] = useState("<h1>Hello BornoLab</h1><p>Paste article HTML or fetch a URL, preview it, then Print → Save as PDF.</p>");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUrl = async () => {
    setError(null);
    let u = url.trim();
    if (!u) { setError("Paste a https:// URL first."); return; }
    if (!/^https?:\/\//i.test(u)) u = `https://${u}`;
    try {
      new URL(u);
    } catch { setError("That URL looks invalid."); return; }
    setBusy(true);
    const started = Date.now();
    try {
      // Many sites block CORS — the print path below always works as a fallback.
      const r = await fetch(u);
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const text = await r.text();
      if (text.length > caps.maxMB * 1024 * 1024) throw new Error(`Page exceeds the ${caps.maxMB} MB cap.`);
      setHtml(sanitizeHtml(text.slice(0, 500_000)));
      void logOp({ tool: "html", files: 1, pages: 1, ms: Date.now() - started, ok: true });
    } catch (e) {
      const msg = "Direct fetch blocked by the site (CORS). Open the URL in a new tab, then use your browser's Print → Save as PDF — or paste the article HTML below.";
      setError(msg);
      void logOp({ tool: "html", files: 1, pages: 0, ms: Date.now() - started, ok: false, err: String((e as Error).message) });
    } finally {
      setBusy(false);
    }
  };

  const printPdf = () => {
    const w = window.open("", "_blank", "width=900,height=700");
    if (!w) { setError("Popup blocked — allow popups to print the PDF."); return; }
    w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>BornoLab HTML to PDF</title><style>body{font-family:system-ui,sans-serif;max-width:700px;margin:2rem auto;padding:0 1rem;color:#111}img{max-width:100%}</style></head><body>${sanitizeHtml(html)}<script>onload=function(){setTimeout(function(){print()},300)}<\/script></body></html>`);
    w.document.close();
    void logOp({ tool: "html", files: 1, pages: 1, ms: 0, ok: true });
  };

  return (
    <div className="mx-auto max-w-3xl">
      <SectionTitle kicker="PDF Suite" title="HTML to PDF" desc="Snapshot any page: fetch a URL or paste HTML, preview, then print to PDF. 100% in-browser." />
      {error && <p role="alert" className="mb-3 rounded-xl bg-red-500/10 p-3 text-[13px] font-semibold text-red-600 dark:text-red-300">{error}</p>}
      <GlassCard>
        <label htmlFor="html-url" className="text-xs font-bold">Page URL</label>
        <div className="mt-1 flex gap-2">
          <input id="html-url" value={url} onChange={(e) => setUrl(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") void fetchUrl(); }} placeholder="https://example.com/article" className="focus-glow flex-1 rounded-xl bg-slate-100 p-3 text-sm outline-none dark:bg-black/30" />
          <button onClick={fetchUrl} disabled={busy} className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-sky-500 to-blue-600 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-40">
            {busy ? <Loader2 size={15} className="animate-spin" /> : <Globe size={15} />} Fetch
          </button>
        </div>
        <label htmlFor="html-src" className="mt-4 block text-xs font-bold">HTML source (editable)</label>
        <textarea id="html-src" rows={6} value={html} onChange={(e) => setHtml(e.target.value)} className="focus-glow mt-1 w-full rounded-xl bg-slate-100 p-3 font-mono text-[12px] outline-none dark:bg-black/30" />
        <div className="mt-3 flex flex-wrap gap-2">
          <button onClick={printPdf} className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 px-4 py-2.5 text-sm font-bold text-white">
            <Printer size={15} /> Print / Save as PDF
          </button>
          <button onClick={() => downloadBlob(new Blob([sanitizeHtml(html)], { type: "text/html" }), "page.html")} className="glass flex items-center gap-1.5 rounded-full px-4 py-2.5 text-sm font-bold">
            <Download size={15} /> Download .html
          </button>
        </div>
      </GlassCard>
      <GlassCard className="mt-4">
        <h3 className="text-sm font-bold">Preview</h3>
        <div className="mt-2 max-h-96 overflow-auto rounded-xl bg-white p-4 text-sm text-slate-900" dangerouslySetInnerHTML={{ __html: sanitizeHtml(html) }} />
      </GlassCard>
    </div>
  );
}
