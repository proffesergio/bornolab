"use client";
import { useEffect, useState } from "react";
import { GlassCard } from "@/components/ui";

/**
 * Admin → Study Platform: flags, review queue, import, audit.
 * Reuses existing admin cookie auth (requireAdmin on APIs).
 */
export function AdminStudyPlatform() {
  const [flags, setFlags] = useState<{ enabled?: boolean } | null>(null);
  const [queue, setQueue] = useState<{ id: string; chapterId: string; status: string; keyStatus: string; issues: string[] }[]>([]);
  const [audit, setAudit] = useState<{ at: number; actor: string; action: string; entityId: string; detail?: string }[]>([]);
  const [importText, setImportText] = useState('[{"stemBn":"ডেমো প্রশ্ন?","stemEn":"Demo question?","optionsBn":["ক","খ","গ","ঘ"],"optionsEn":["A","B","C","D"],"answerIndex":0,"chapterId":"ch-net-ip"}]');
  const [msg, setMsg] = useState("");

  const load = () => {
    fetch("/api/study-platform/flags").then((r) => r.json()).then((j) => setFlags(j.studyPlatform ?? {})).catch(() => {});
    fetch("/api/study-platform/review").then((r) => r.json()).then((j) => setQueue(j.queue ?? [])).catch(() => {});
    fetch("/api/study-platform/audit").then((r) => r.json()).then((j) => setAudit(j.entries ?? [])).catch(() => {});
  };

  useEffect(() => {
    load();
  }, []);

  const togglePlatform = async () => {
    const next = !(flags?.enabled === true);
    await fetch("/api/study-platform/flags", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled: next, flags: { "study-platform": { enabled: next }, "exam-engine": { enabled: next } } }),
    }).catch(() => {});
    setMsg(next ? "Study platform ENABLED." : "Study platform disabled.");
    load();
  };

  const doImport = async () => {
    setMsg("");
    const res = await fetch("/api/study-platform/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ format: "json", text: importText, sourceUrl: "", sourceTitle: "admin-manual", licenseState: "pending" }),
    });
    const j = await res.json();
    setMsg(res.ok ? `Staged ${j.staged}, drafts ${j.drafts}. Raw evidence stays admin-only.` : `Import failed: ${j.error}`);
    load();
  };

  const review = async (id: string, to: string) => {
    const res = await fetch("/api/study-platform/review", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ questionId: id, to, note: `admin:${to}` }),
    });
    const j = await res.json();
    setMsg(res.ok ? `✓ ${id} → ${to}` : `Blocked: ${(j.issues ?? []).map((x: { code: string }) => x.code).join(", ") || j.error}`);
    load();
  };

  const field = "focus-glow w-full rounded-xl bg-slate-100 p-2.5 font-mono text-[12px] outline-none dark:bg-black/30";

  return (
    <div className="grid gap-4">
      <GlassCard>
        <h3 className="text-sm font-bold">🚀 Study Platform — feature flag + release</h3>
        <p className="mt-1 text-[12.5px] text-slate-600 dark:text-slate-400">
          Status: <b>{flags?.enabled ? "ENABLED" : "disabled/preview"}</b> • Old hub + task13/task21 behavior preserved either way.
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          <button onClick={togglePlatform} className="rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 px-4 py-2 text-[13px] font-bold text-white">
            {flags?.enabled ? "Disable platform" : "Enable platform"}
          </button>
          <button onClick={load} className="glass rounded-xl px-4 py-2 text-[13px] font-bold">Refresh</button>
          <a href="/api/study-platform/taxonomy" target="_blank" rel="noopener" className="glass rounded-xl px-4 py-2 text-[13px] font-bold">Public taxonomy JSON →</a>
        </div>
        {msg && <p role="status" className="mt-2 text-[12.5px] font-semibold text-emerald-600 dark:text-emerald-300">{msg}</p>}
      </GlassCard>

      <GlassCard>
        <h3 className="text-sm font-bold">📥 Import (JSON) → restricted staging + drafts</h3>
        <p className="mt-1 text-[12.5px] text-slate-600 dark:text-slate-400">Drafts only — publication needs review. License defaults to pending; paraphrase + independent solve required.</p>
        <textarea value={importText} onChange={(e) => setImportText(e.target.value)} rows={4} className={field} aria-label="Import JSON" />
        <button onClick={doImport} className="mt-2 rounded-xl bg-slate-900 px-4 py-2 text-[13px] font-bold text-white dark:bg-white dark:text-slate-900">Stage + create drafts</button>
      </GlassCard>

      <GlassCard>
        <h3 className="text-sm font-bold">🧑‍⚖️ Review queue ({queue.length}) — two-person approval</h3>
        {queue.length === 0 && <p className="mt-1 text-[12.5px] text-slate-500">Queue empty — all published items pass blockers. 🎉</p>}
        <div className="mt-2 space-y-2">
          {queue.slice(0, 20).map((qItem) => (
            <div key={qItem.id} className="rounded-xl bg-slate-900/[.04] p-3 text-[12.5px] dark:bg-white/5">
              <p><b className="font-mono">{qItem.id}</b> • {qItem.status} • key:{qItem.keyStatus} • {qItem.chapterId}</p>
              {qItem.issues.length > 0 && <p className="mt-0.5 text-amber-600 dark:text-amber-300">⛔ {qItem.issues.join(", ")}</p>}
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                <button onClick={() => review(qItem.id, "reviewer_approved")} className="rounded-full bg-cyan-500/15 px-3 py-1 font-bold text-cyan-700 dark:text-cyan-200">Approve</button>
                <button onClick={() => review(qItem.id, "published")} className="rounded-full bg-emerald-500/15 px-3 py-1 font-bold text-emerald-700 dark:text-emerald-200">Publish</button>
                <button onClick={() => review(qItem.id, "retired")} className="rounded-full bg-red-500/10 px-3 py-1 font-bold text-red-500">Retire</button>
              </div>
            </div>
          ))}
        </div>
      </GlassCard>

      <GlassCard>
        <h3 className="text-sm font-bold">📜 Audit (latest {audit.length})</h3>
        <div className="mt-2 max-h-56 space-y-1 overflow-y-auto font-mono text-[11.5px] text-slate-600 dark:text-slate-400">
          {audit.map((a, i) => (
            <p key={i} className="rounded-lg bg-slate-900/[.04] px-2.5 py-1.5 dark:bg-white/5">
              {new Date(a.at).toLocaleString()} • {a.actor} • {a.action} • {a.entityId}{a.detail ? ` • ${a.detail}` : ""}
            </p>
          ))}
          {audit.length === 0 && <p>No audit events yet.</p>}
        </div>
      </GlassCard>
    </div>
  );
}
