"use client";
import { useState } from "react";
import { GlassCard } from "@/components/ui";
import { BUILT_IN_STUDY_MATERIALS, STUDY_CATEGORIES, type StudyCategory, type StudyMaterial } from "@/lib/study-data";
import { CsvBulkTools, duplicateCustom } from "@/components/admin-bulk";
import type { SiteConfig } from "@/lib/site-config-shared";
import { cn } from "@/lib/cn";

/**
 * Admin → Study: publish PDF/HTML guides per category (upload or link),
 * toggle visibility (built-ins + customs), delete customs.
 * Files land in /public/uploads/study/ via /api/admin/uploads (kind "study").
 */
export function AdminStudy({ config, save }: {
  config: SiteConfig;
  save: (patch: Partial<SiteConfig>) => void | Promise<void>;
}) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<StudyCategory>("masters");
  const [subcategory, setSubcategory] = useState("BUET Post Graduate Admission");
  const [description, setDescription] = useState("");
  const [link, setLink] = useState("");
  const [access, setAccess] = useState<"free" | "paid">("free");
  const [price, setPrice] = useState("0");
  const [previewPages, setPreviewPages] = useState("3");
  const [uploadedUrl, setUploadedUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [featured, setFeatured] = useState(false);

  const field = "focus-glow w-full rounded-xl bg-slate-100 p-2.5 text-sm outline-none dark:bg-black/30";

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
    if (!title.trim()) { setError("Title is required."); return; }
    const fileUrl = uploadedUrl || link.trim();
    if (!fileUrl) { setError("Attach an uploaded file or paste a https:// link."); return; }
    if (!fileUrl.startsWith("/uploads/study/") && !/^https:\/\//.test(fileUrl)) {
      setError("Link must start with https:// (uploads are automatic).");
      return;
    }
    const item: StudyMaterial = {
      id: `study-${Date.now().toString(36)}${Math.floor(Math.random() * 0xffffff).toString(36)}`,
      title: title.trim().slice(0, 160),
      category,
      subcategory: subcategory.trim().slice(0, 120) || undefined,
      description: description.trim().slice(0, 2000),
      fileUrl,
      fileType: /\.pdf($|\?)/i.test(fileUrl) ? "pdf" : /\.html?($|\?)/i.test(fileUrl) ? "html" : "link",
      topics: [],
      featured,
      enabled: true,
      createdAt: Date.now(),
      access,
      priceBDT: access === "paid" ? Number(price) || 0 : 0,
      previewPages: Math.max(1, Math.min(20, Number(previewPages) || 3)),
    };
    void save({ customStudy: [...(config.customStudy ?? []), item] });
    setTitle(""); setDescription(""); setLink(""); setUploadedUrl(""); setFeatured(false); setError("");
    setAccess("free"); setPrice("0"); setPreviewPages("3");
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this study material?")) return;
    const target = (config.customStudy ?? []).find((m) => m.id === id);
    const overrides = { ...(config.studyOverrides ?? {}) };
    delete overrides[id];
    void save({
      customStudy: (config.customStudy ?? []).filter((m) => m.id !== id),
      studyOverrides: overrides,
    });
    if (target?.fileUrl.startsWith("/uploads/")) {
      await fetch("/api/admin/uploads", {
        method: "DELETE", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: target.fileUrl }),
      }).catch(() => {});
    }
  };

  const toggle = (id: string, enabled: boolean) =>
    save({ studyOverrides: { ...(config.studyOverrides ?? {}), [id]: { enabled } } });

  const customs = config.customStudy ?? [];

  return (
    <div className="grid gap-4">
      <GlassCard>
        <h3 className="text-sm font-bold">Publish a study file — upload or link</h3>
        <p className="mt-1 text-[12.5px] text-slate-600 dark:text-slate-400">
          Upload a PDF / HTML page (.pdf/.html/.zip, max 100 MB) <b>or</b> paste an https:// link.
          It appears instantly under its category. Reading & sharing are public; downloads require login.
        </p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <input aria-label="Material title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title * e.g. BUET M.Sc. Question Bank 2024" className={cn(field, "sm:col-span-2")} />
          <select aria-label="Material category" value={category} onChange={(e) => setCategory(e.target.value as StudyCategory)} className={field}>
            {STUDY_CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>{c.label} ({c.bangla})</option>
            ))}
          </select>
          <input aria-label="Material subcategory" value={subcategory} onChange={(e) => setSubcategory(e.target.value)} placeholder="Subcategory e.g. BUET Post Graduate Admission" className={field} />
          <textarea aria-label="Material description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Short description — what is inside, who is it for?" rows={2} className={cn(field, "sm:col-span-2")} />
          <input aria-label="External file link" value={link} onChange={(e) => setLink(e.target.value)} placeholder="https:// direct file link (or upload below)" className={cn(field, "font-mono sm:col-span-2")} />
          <div className="flex flex-wrap items-center gap-2">
            <select aria-label="Access" value={access} onChange={(e) => setAccess(e.target.value as "free" | "paid")} className={field}>
              <option value="free">Free — login to read/download</option>
              <option value="paid">Paid — buy first (bKash)</option>
            </select>
            {access === "paid" && (
              <label className="flex items-center gap-1.5 font-semibold">৳ <input type="number" min={0} value={price} onChange={(e) => setPrice(e.target.value)} className={cn(field, "w-24")} aria-label="Material price" /></label>
            )}
            <label className="flex items-center gap-1.5 font-semibold">Preview <input type="number" min={1} max={20} value={previewPages} onChange={(e) => setPreviewPages(e.target.value)} className={cn(field, "w-20")} aria-label="Free preview pages" /> pages</label>
          </div>
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-2 text-[13px]">
          <label className="flex cursor-pointer items-center gap-1.5 rounded-xl bg-cyan-500/15 px-3 py-2 font-bold text-cyan-700 dark:text-cyan-200">
            {uploading ? "Uploading…" : uploadedUrl ? "✓ File attached — replace?" : "⬆ Upload PDF / HTML"}
            <input
              type="file" accept=".pdf,.html,.htm,.zip" className="hidden"
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
            <input type="checkbox" checked={featured} onChange={(e) => setFeatured(e.target.checked)} className="h-4 w-4 accent-amber-500" /> Featured on hub
          </label>
        </div>
        {error && <p role="alert" className="mt-2 text-[12.5px] font-semibold text-rose-500">{error}</p>}
        <button onClick={publish} className="mt-3 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 px-4 py-2.5 text-[13px] font-bold text-white">+ Publish material</button>
      </GlassCard>

      {customs.length > 0 && (
        <GlassCard>
          <h3 className="text-sm font-bold">Your published materials ({customs.length})</h3>
          <CsvBulkTools
            kind="study"
            items={customs as unknown as Record<string, unknown>[]}
            onImport={(built) => void save({ customStudy: [...customs, ...(built as unknown as StudyMaterial[])] })}
          />
          <div className="mt-3 space-y-2">
            {customs.map((m) => {
              const enabled = config.studyOverrides?.[m.id]?.enabled ?? m.enabled ?? true;
              const paid = m.access === "paid";
              return (
                <div key={m.id} className="grid items-center gap-2 rounded-xl bg-slate-900/[.04] p-3 text-[13px] sm:grid-cols-[1fr_auto_auto_auto_auto] dark:bg-white/5">
                  <span className="min-w-0">
                    <b>{m.title}</b> <span className="text-slate-500">• {STUDY_CATEGORIES.find((c) => c.id === m.category)?.label}{m.subcategory ? ` • ${m.subcategory}` : ""}</span>
                    <span className="block max-w-full truncate font-mono text-[11px] text-slate-500">{m.fileUrl}</span></span>
                  <span className={paid ? "rounded-full bg-amber-400/20 px-2.5 py-1 text-[11px] font-black text-amber-700 dark:text-amber-300" : "rounded-full bg-emerald-500/15 px-2.5 py-1 text-[11px] font-black text-emerald-600 dark:text-emerald-300"}>
                    {paid ? `৳${m.priceBDT ?? 0}` : "FREE"}
                  </span>
                  <label className="flex items-center gap-1.5">Visible <input type="checkbox" checked={enabled} onChange={() => toggle(m.id, !enabled)} className="h-4 w-4 accent-cyan-500" /></label>
                  <button onClick={() => void save({ customStudy: [...customs, duplicateCustom("study", m)] })} className="rounded-full px-3 py-1.5 text-[12px] font-bold text-cyan-600 hover:bg-cyan-500/10 dark:text-cyan-300">Duplicate</button>
                  <button onClick={() => remove(m.id)} className="rounded-full px-3 py-1.5 text-[12px] font-bold text-red-500 hover:bg-red-500/10">Delete</button>
                </div>
              );
            })}
          </div>
        </GlassCard>
      )}

      <GlassCard>
        <h3 className="text-sm font-bold">Built-in reference materials</h3>
        <p className="mt-1 text-[12.5px] text-slate-600 dark:text-slate-400">Toggle visibility of the shipped BUET guides. The files live in /public/uploads/study/.</p>
        <div className="mt-3 space-y-2">
          {BUILT_IN_STUDY_MATERIALS.map((m) => {
            const enabled = config.studyOverrides?.[m.id]?.enabled ?? m.enabled ?? true;
            return (
              <div key={m.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-slate-900/[.04] p-3 text-[13px] dark:bg-white/5">
                <span><b>{m.title}</b> <span className="text-slate-500">• Masters • {m.subcategory}</span></span>
                <label className="flex items-center gap-1.5">Visible <input type="checkbox" checked={enabled} onChange={() => toggle(m.id, !enabled)} className="h-4 w-4 accent-cyan-500" /></label>
              </div>
            );
          })}
        </div>
      </GlassCard>
    </div>
  );
}
