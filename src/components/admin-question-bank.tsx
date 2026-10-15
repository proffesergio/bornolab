"use client";
import { useState } from "react";
import { GlassCard } from "@/components/ui";
import {
  QB_DEPARTMENTS,
  QB_SEED_DOCS,
  type QBDocument,
} from "@/lib/question-bank-data";
import type { SiteConfig } from "@/lib/site-config-shared";
import { cn } from "@/lib/cn";

/**
 * Admin → Study → Question Bank: attach a PDF/link to a specific
 * department → subject → chapter section. Files land in
 * /public/uploads/study/ via /api/admin/uploads (kind "study").
 */
export function AdminQuestionBank({
  config,
  save,
}: {
  config: SiteConfig;
  save: (patch: Partial<SiteConfig>) => void | Promise<void>;
}) {
  const [title, setTitle] = useState("");
  const [deptId, setDeptId] = useState(QB_DEPARTMENTS[0].id);
  const [subjectId, setSubjectId] = useState("");
  const [chapterId, setChapterId] = useState("");
  const [description, setDescription] = useState("");
  const [link, setLink] = useState("");
  const [questionCount, setQuestionCount] = useState("");
  const [access, setAccess] = useState<"free" | "paid">("free");
  const [price, setPrice] = useState("0");
  const [featured, setFeatured] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const field = "focus-glow w-full rounded-xl bg-slate-100 p-2.5 text-sm outline-none dark:bg-black/30";
  const dept = QB_DEPARTMENTS.find((d) => d.id === deptId) ?? QB_DEPARTMENTS[0];
  const subjects = dept.subjects;
  const chapters = subjects.find((s) => s.id === subjectId)?.chapters ?? [];

  const pickDept = (id: string) => {
    setDeptId(id);
    setSubjectId("");
    setChapterId("");
  };
  const pickSubject = (id: string) => {
    setSubjectId(id);
    setChapterId("");
  };

  const upload = async (file: File) => {
    setUploading(true);
    setError("");
    try {
      const form = new FormData();
      form.append("kind", "study");
      form.append("file", file);
      const res = await fetch("/api/admin/uploads", { method: "POST", body: form });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Upload failed");
      setUploadedUrl(j.url);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setUploading(false);
    }
  };

  const publish = () => {
    if (!title.trim()) {
      setError("Title is required.");
      return;
    }
    const fileUrl = uploadedUrl || link.trim();
    if (!fileUrl) {
      setError("Attach an uploaded PDF or paste an https:// link.");
      return;
    }
    if (!fileUrl.startsWith("/uploads/study/") && !/^https:\/\//.test(fileUrl)) {
      setError("Link must start with https:// (uploads are automatic).");
      return;
    }
    const item: QBDocument = {
      id: `qb-${Date.now().toString(36)}${Math.floor(Math.random() * 0xffffff).toString(36)}`,
      deptId,
      subjectId: subjectId || undefined,
      chapterId: chapterId || undefined,
      title: title.trim().slice(0, 160),
      description: description.trim().slice(0, 2000),
      fileUrl,
      fileType: /\.pdf($|\?)/i.test(fileUrl) ? "pdf" : /\.html?($|\?)/i.test(fileUrl) ? "html" : "link",
      questionCount: Number(questionCount) > 0 ? Math.floor(Number(questionCount)) : undefined,
      access,
      priceBDT: access === "paid" ? Number(price) || 0 : 0,
      featured,
      enabled: true,
      createdAt: Date.now(),
    };
    void save({ customQuestionBank: [...(config.customQuestionBank ?? []), item] });
    setTitle("");
    setDescription("");
    setLink("");
    setUploadedUrl("");
    setFeatured(false);
    setError("");
    setQuestionCount("");
    setAccess("free");
    setPrice("0");
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this question-bank document?")) return;
    const target = (config.customQuestionBank ?? []).find((d) => d.id === id);
    const overrides = { ...(config.qbOverrides ?? {}) };
    delete overrides[id];
    void save({
      customQuestionBank: (config.customQuestionBank ?? []).filter((d) => d.id !== id),
      qbOverrides: overrides,
    });
    if (target?.fileUrl.startsWith("/uploads/")) {
      await fetch("/api/admin/uploads", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: target.fileUrl }),
      }).catch(() => {});
    }
  };

  const toggle = (id: string, enabled: boolean) =>
    save({ qbOverrides: { ...(config.qbOverrides ?? {}), [id]: { enabled } } });

  const customs = config.customQuestionBank ?? [];
  const label = (d: QBDocument) => {
    const dp = QB_DEPARTMENTS.find((x) => x.id === d.deptId);
    const sb = dp?.subjects.find((x) => x.id === d.subjectId);
    const ch = sb?.chapters.find((x) => x.id === d.chapterId);
    return [dp?.title.en, sb?.title.bn, ch?.title.bn].filter(Boolean).join(" • ");
  };

  return (
    <div className="grid gap-4">
      <GlassCard>
        <h3 className="text-sm font-bold">Question Bank Solutions — upload a PDF to a section</h3>
        <p className="mt-1 text-[12.5px] text-slate-600 dark:text-slate-400">
          Pick department → subject → chapter, then upload the solution PDF (.pdf/.html/.zip, max 100 MB) or paste an https:// link.
          It appears instantly in that section on /study/question-bank.
        </p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <input aria-label="QB document title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title * e.g. Petrobangla GK — Bangladesh Affairs Solutions" className={cn(field, "sm:col-span-2")} />
          <select aria-label="QB department" value={deptId} onChange={(e) => pickDept(e.target.value)} className={field}>
            {QB_DEPARTMENTS.map((d) => (
              <option key={d.id} value={d.id}>{d.title.en} ({d.title.bn})</option>
            ))}
          </select>
          <select aria-label="QB subject" value={subjectId} onChange={(e) => pickSubject(e.target.value)} className={field}>
            <option value="">Whole department (no specific subject)</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>{s.title.bn} ({s.title.en})</option>
            ))}
          </select>
          <select aria-label="QB chapter" value={chapterId} onChange={(e) => setChapterId(e.target.value)} className={field} disabled={!subjectId}>
            <option value="">Whole subject (no specific chapter)</option>
            {chapters.map((c) => (
              <option key={c.id} value={c.id}>{c.title.bn} ({c.title.en})</option>
            ))}
          </select>
          <input aria-label="Question count" value={questionCount} onChange={(e) => setQuestionCount(e.target.value)} placeholder="Questions e.g. 150" inputMode="numeric" className={field} />
          <textarea aria-label="QB document description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Short description — source, year, what's solved, solution language?" rows={2} className={cn(field, "sm:col-span-2")} />
          <input aria-label="External file link" value={link} onChange={(e) => setLink(e.target.value)} placeholder="https:// direct file link (or upload below)" className={cn(field, "font-mono sm:col-span-2")} />
          <div className="flex flex-wrap items-center gap-2">
            <select aria-label="Access" value={access} onChange={(e) => setAccess(e.target.value as "free" | "paid")} className={field}>
              <option value="free">Free — login to read/download</option>
              <option value="paid">Paid — buy first (bKash)</option>
            </select>
            {access === "paid" && (
              <label className="flex items-center gap-1.5 font-semibold">৳ <input type="number" min={0} value={price} onChange={(e) => setPrice(e.target.value)} className={cn(field, "w-24")} aria-label="QB document price" /></label>
            )}
          </div>
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-2 text-[13px]">
          <label className="flex cursor-pointer items-center gap-1.5 rounded-xl bg-amber-500/15 px-3 py-2 font-bold text-amber-700 dark:text-amber-200">
            {uploading ? "Uploading…" : uploadedUrl ? "✓ PDF attached — replace?" : "⬆ Upload solution PDF"}
            <input
              type="file"
              accept=".pdf,.html,.htm,.zip"
              className="hidden"
              disabled={uploading}
              onChange={(e) => {
                const f = e.target.files?.[0];
                e.target.value = "";
                if (f) void upload(f);
              }}
            />
          </label>
          {uploadedUrl && <span className="max-w-full truncate font-mono text-[11px] text-emerald-600 dark:text-emerald-300">{uploadedUrl}</span>}
          <label className="flex cursor-pointer items-center gap-1.5 rounded-xl bg-slate-900/[.04] px-3 py-2 font-semibold dark:bg-white/5">
            <input type="checkbox" checked={featured} onChange={(e) => setFeatured(e.target.checked)} className="h-4 w-4 accent-amber-500" /> Featured
          </label>
        </div>
        {error && <p role="alert" className="mt-2 text-[12.5px] font-semibold text-rose-500">{error}</p>}
        <button onClick={publish} className="mt-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 px-4 py-2.5 text-[13px] font-bold text-white">+ Publish to section</button>
      </GlassCard>

      {customs.length > 0 && (
        <GlassCard>
          <h3 className="text-sm font-bold">Published solutions ({customs.length})</h3>
          <div className="mt-3 space-y-2">
            {customs.map((d) => {
              const enabled = config.qbOverrides?.[d.id]?.enabled ?? d.enabled ?? true;
              return (
                <div key={d.id} className="grid items-center gap-2 rounded-xl bg-slate-900/[.04] p-3 text-[13px] sm:grid-cols-[1fr_auto_auto_auto] dark:bg-white/5">
                  <span className="min-w-0">
                    <b>{d.title}</b> <span className="text-slate-500">• {label(d)}</span>
                    <span className="block max-w-full truncate font-mono text-[11px] text-slate-500">{d.fileUrl}</span>
                  </span>
                  <span className={d.access === "paid" ? "rounded-full bg-amber-400/20 px-2.5 py-1 text-[11px] font-black text-amber-700 dark:text-amber-300" : "rounded-full bg-emerald-500/15 px-2.5 py-1 text-[11px] font-black text-emerald-600 dark:text-emerald-300"}>
                    {d.access === "paid" ? `৳${d.priceBDT ?? 0}` : "FREE"}
                  </span>
                  <label className="flex items-center gap-1.5">Visible <input type="checkbox" checked={enabled} onChange={() => toggle(d.id, !enabled)} className="h-4 w-4 accent-cyan-500" /></label>
                  <button onClick={() => remove(d.id)} className="rounded-full px-3 py-1.5 text-[12px] font-bold text-red-500 hover:bg-red-500/10">Delete</button>
                </div>
              );
            })}
          </div>
        </GlassCard>
      )}

      <GlassCard>
        <h3 className="text-sm font-bold">Seed templates (Petrobangla + others)</h3>
        <p className="mt-1 text-[12.5px] text-slate-600 dark:text-slate-400">
          Structural placeholders shipped in code — toggle visibility until the real PDFs are uploaded above. Sources verified from Telegram Desktop (see file names).
        </p>
        <div className="mt-3 space-y-2">
          {QB_SEED_DOCS.map((d) => {
            const enabled = config.qbOverrides?.[d.id]?.enabled ?? d.enabled ?? true;
            const dp = QB_DEPARTMENTS.find((x) => x.id === d.deptId);
            return (
              <div key={d.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-slate-900/[.04] p-3 text-[13px] dark:bg-white/5">
                <span><b>{d.title}</b> <span className="text-slate-500">• {dp?.title.en}</span>
                  <span className="block font-mono text-[11px] text-slate-500">{d.sourcePdf} • awaiting upload</span>
                </span>
                <label className="flex items-center gap-1.5">Visible <input type="checkbox" checked={enabled} onChange={() => toggle(d.id, !enabled)} className="h-4 w-4 accent-cyan-500" /></label>
              </div>
            );
          })}
        </div>
      </GlassCard>
    </div>
  );
}
