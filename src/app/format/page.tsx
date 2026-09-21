"use client";
import { useEffect, useState } from "react";
import { FileUp, Loader2, Send, FlaskConical } from "lucide-react";
import { GlassCard, SectionTitle } from "@/components/ui";
import { N8N_JOBS, n8nJobStatus, type N8nJob } from "@/lib/n8n";
import { cn } from "@/lib/cn";

type JobType = "journal" | "book-en" | "book-bn";

/** /format — print-ready auto-formatting via your n8n workflow (mock plan until configured). */
export default function FormatPage() {
  const [jobType, setJobType] = useState<JobType>("book-bn");
  const [file, setFile] = useState<File | null>(null);
  const [params, setParams] = useState('{\n  "pageSize": "A4",\n  "font": "SolaimanLipi"\n}');
  const [live, setLive] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<unknown>(null);

  useEffect(() => {
    n8nJobStatus("formatDocx" as N8nJob).then(setLive).catch(() => setLive(false));
  }, []);

  const submit = async () => {
    setError(null);
    setResult(null);
    let parsed: unknown = {};
    try {
      parsed = params.trim() ? JSON.parse(params) : {};
    } catch {
      setError("Params is not valid JSON.");
      return;
    }
    setBusy(true);
    try {
      let res: Response;
      if (file) {
        const fd = new FormData();
        fd.set("file", file);
        fd.set("jobType", jobType);
        fd.set("params", JSON.stringify(parsed));
        res = await fetch(N8N_JOBS.formatDocx, { method: "POST", body: fd });
      } else {
        res = await fetch(N8N_JOBS.formatDocx, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ jobType, params: parsed }),
        });
      }
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error ?? `proxy ${res.status}`);
      setResult(j);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <SectionTitle
        kicker="n8n Automation"
        title="Auto-Format for Print"
        desc="Upload a messy .docx → get a print-ready Journal / Book back. Heavy lifting runs on your n8n workflow; without one you get a dry-run plan."
      />
      <GlassCard>
        <p className="flex items-center gap-2 text-[13px] font-bold">
          <FlaskConical size={15} className={live ? "text-emerald-500" : "text-amber-500"} />
          {live == null ? "Checking workflow…" : live ? "n8n workflow connected — jobs run live." : "n8n not connected — submissions return a dry-run plan."}
        </p>
        <div className="mt-3 flex gap-1.5" role="group" aria-label="Job type">
          {(["journal", "book-en", "book-bn"] as const).map((j) => (
            <button key={j} onClick={() => setJobType(j)} aria-pressed={jobType === j}
              className={cn("rounded-full px-4 py-2 text-[12.5px] font-bold", jobType === j ? "bg-gradient-to-r from-cyan-500 to-purple-600 text-white" : "glass hover-glow")}>
              {j}
            </button>
          ))}
        </div>
        <label className="mt-3 flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-cyan-500/50 p-4 text-sm hover:bg-cyan-500/5"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files?.[0]; if (f) setFile(f); }}
        >
          <FileUp size={18} className="text-cyan-600 dark:text-cyan-300" />
          <span className="truncate">{file?.name ?? "Drop / click to choose .docx (optional for dry-run)"}</span>
          <input type="file" accept=".docx" className="hidden" onChange={(e) => { setFile(e.target.files?.[0] ?? null); e.target.value = ""; }} />
        </label>
        <label htmlFor="format-params" className="mt-3 block text-xs font-bold">Params override (JSON)</label>
        <textarea id="format-params" rows={4} value={params} onChange={(e) => setParams(e.target.value)}
          className="focus-glow mt-1 w-full rounded-xl bg-slate-100 p-3 font-mono text-[13px] outline-none dark:bg-black/30" />
        <button onClick={submit} disabled={busy} className="mt-3 flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-cyan-500 to-purple-600 px-4 py-3 text-sm font-bold text-white disabled:opacity-40">
          {busy ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />} {file ? "Upload & Format" : "Dry-run plan"}
        </button>
        {error && <p role="alert" className="mt-2 text-[12.5px] font-semibold text-red-600 dark:text-red-300">{error}</p>}
      </GlassCard>
      {result != null && (
        <GlassCard className="mt-4">
          <h3 className="text-sm font-bold">Result</h3>
          <pre className="mt-2 max-h-96 overflow-auto rounded-xl bg-slate-900/[.04] p-3 font-mono text-[12px] dark:bg-white/5">{JSON.stringify(result, null, 2)}</pre>
        </GlassCard>
      )}
    </div>
  );
}
