"use client";
import { useState } from "react";
import {
  CATALOG_DEFS, catalogFromCsv, catalogToCsv, makeCustomId, validateStudyRow,
  type CatalogKind,
} from "@/lib/catalog-registry";
import type { BanglaFont, FontType, FontVariant } from "@/lib/fonts-data";
import type { Software, SoftwareVersion } from "@/lib/software-data";

/** Clone any custom catalog item with a fresh id + " (copy)" name. */
export function duplicateCustom<T extends { id: string }>(kind: CatalogKind, item: T): T {
  const rec = item as unknown as Record<string, unknown>;
  const base = String(rec.name ?? rec.title ?? "item");
  const cloned = CATALOG_DEFS[kind].clone(item as never, (b) => makeCustomId(b || base));
  return cloned as T;
}

/**
 * Export / template / import CSV for one catalog kind.
 * Imported rows are built + validated through the registry, then handed
 * to the caller (which persists via the usual config save).
 */
export function CsvBulkTools({ kind, items, onImport }: {
  kind: CatalogKind;
  items: Record<string, unknown>[];
  onImport: (built: Record<string, unknown>[]) => void;
}) {
  const def = CATALOG_DEFS[kind];
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  const download = (name: string, text: string) => {
    const url = URL.createObjectURL(new Blob([text], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  };

  const importFile = (f: File) => {
    setBusy(true);
    setMsg("");
    f.text().then((text) => {
      try {
        const { rows, errors } = catalogFromCsv(def, text);
        const built: Record<string, unknown>[] = [];
        const skipped: string[] = [];
        rows.forEach((row, i) => {
          const item = def.build(row) as Record<string, unknown>;
          if (kind === "study") {
            const err = validateStudyRow(item);
            if (err) {
              skipped.push(`row ${i + 2}: ${err}`);
              return;
            }
          }
          const titleKey = kind === "study" ? "title" : "name";
          if (!item[titleKey]) {
            skipped.push(`row ${i + 2}: missing ${titleKey}`);
            return;
          }
          built.push({ ...item, id: makeCustomId(String(item[titleKey])) });
        });
        if (built.length === 0) {
          setMsg(`Nothing imported. ${[...errors, ...skipped].join(" ") || "Check the template format."}`);
        } else {
          onImport(built);
          setMsg(`✓ Imported ${built.length}${skipped.length > 0 ? `, skipped ${skipped.length}` : ""}.${errors.length > 0 ? ` Note: ${errors.join(" ")}` : ""}${skipped.length > 0 ? ` Skipped: ${skipped.slice(0, 3).join(" ")}` : ""}`);
        }
      } catch (e) {
        setMsg(`Import failed: ${(e as Error).message}`);
      } finally {
        setBusy(false);
      }
    }).catch((e: Error) => {
      setMsg(`Import failed: ${e.message}`);
      setBusy(false);
    });
  };

  return (
    <div className="mt-2 flex flex-wrap items-center gap-2 text-[12.5px]">
      <button
        onClick={() => download(`bornolab-${kind}-template.csv`, def.columns.map((c) => c.label).join(",") + "\n")}
        className="glass hover-glow rounded-full px-3 py-1.5 font-bold"
      >
        ⬇ CSV template
      </button>
      <button
        onClick={() => download(`bornolab-${kind}-export.csv`, catalogToCsv(def, items))}
        disabled={items.length === 0}
        className="glass hover-glow rounded-full px-3 py-1.5 font-bold disabled:opacity-40"
      >
        ⬇ Export ({items.length})
      </button>
      <label className="glass hover-glow cursor-pointer rounded-full px-3 py-1.5 font-bold">
        {busy ? "Importing…" : "⬆ Import CSV"}
        <input
          type="file" accept=".csv,text/csv" className="hidden"
          disabled={busy}
          onChange={(e) => {
            const f = e.target.files?.[0];
            e.target.value = "";
            if (f) importFile(f);
          }}
        />
      </label>
      {msg && <span role="status" className="w-full text-[12px] font-semibold text-slate-600 dark:text-slate-300">{msg}</span>}
    </div>
  );
}

const FONT_ACCEPT = ".ttf,.otf,.woff,.woff2,.zip";

function prettyName(filename: string): string {
  return filename
    .replace(/\.[^.]*$/, "")
    .replace(/[_+]+/g, " ")
    .replace(/-+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .slice(0, 80) || "Untitled font";
}

/**
 * Per-family variant manager: add/remove weight/style files (link or
 * upload, incl. .zip bundles), each with optional price override.
 */
export function FontVariantsEditor({ font, onChange }: {
  font: Pick<BanglaFont, "name"> & { variants?: FontVariant[]; premium?: boolean; priceBDT?: number };
  onChange: (variants: FontVariant[]) => void;
}) {
  const variants = font.variants ?? [];
  const [label, setLabel] = useState("");
  const [link, setLink] = useState("");
  const [uploaded, setUploaded] = useState("");
  const [uploading, setUploading] = useState(false);
  const [premium, setPremium] = useState(false);
  const [price, setPrice] = useState("0");
  const [error, setError] = useState("");

  const add = () => {
    if (!label.trim()) { setError("Variant label is required (e.g. Bold)."); return; }
    const fileUrl = uploaded || link.trim();
    if (!fileUrl) { setError("Attach an uploaded file or paste a link."); return; }
    onChange([...variants, {
      id: `var-${Date.now().toString(36)}${Math.floor(Math.random() * 0xffffff).toString(36)}`,
      label: label.trim().slice(0, 60),
      fileUrl,
      premium,
      priceBDT: premium ? Number(price) || 0 : 0,
    }]);
    setLabel(""); setLink(""); setUploaded(""); setPremium(false); setPrice("0"); setError("");
  };

  return (
    <div className="mt-2 rounded-xl bg-slate-900/[.04] p-3 dark:bg-white/5">
      <p className="text-[12px] font-bold">Variants ({variants.length}) — weights/styles of {font.name}</p>
      {variants.length > 0 && (
        <div className="mt-2 space-y-1.5">
          {variants.map((v) => (
            <div key={v.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-slate-900/[.04] px-2.5 py-1.5 text-[12.5px] dark:bg-white/5">
              <span className="min-w-0"><b>{v.label}</b> <span className="font-mono text-[11px] text-slate-500">{v.fileUrl.length > 48 ? `…${v.fileUrl.slice(-48)}` : v.fileUrl}</span></span>
              <span className="flex items-center gap-2">
                <span className="text-[11.5px] text-slate-500">{(v.premium ?? font.premium) ? `৳${v.priceBDT ?? font.priceBDT ?? 0}` : "free"}</span>
                <button onClick={() => onChange(variants.filter((x) => x.id !== v.id))} className="rounded-full px-2 py-1 text-[11.5px] font-bold text-red-500 hover:bg-red-500/10">Remove</button>
              </span>
            </div>
          ))}
        </div>
      )}
      <div className="mt-2 grid gap-1.5 sm:grid-cols-[140px_1fr_auto]">
        <input aria-label="Variant label" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Bold *" className="focus-glow rounded-xl bg-slate-100 p-2 text-[12.5px] outline-none dark:bg-black/30" />
        <input aria-label="Variant file link" value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://… file link (or upload)" className="focus-glow rounded-xl bg-slate-100 p-2 font-mono text-[12px] outline-none dark:bg-black/30" />
        <label className="flex cursor-pointer items-center justify-center gap-1 rounded-xl bg-cyan-500/15 px-3 py-2 text-[12px] font-bold text-cyan-700 dark:text-cyan-200">
          {uploading ? "…" : uploaded ? "✓ File" : "⬆ File"}
          <input
            type="file" accept={FONT_ACCEPT} className="hidden" disabled={uploading}
            onChange={(e) => {
              const f = e.target.files?.[0];
              e.target.value = "";
              if (!f) return;
              setUploading(true);
              setError("");
              const form = new FormData();
              form.append("kind", "font");
              form.append("file", f);
              fetch("/api/admin/uploads", { method: "POST", body: form })
                .then(async (res) => {
                  const j = await res.json();
                  if (!res.ok) throw new Error(j.error || "Upload failed");
                  setUploaded(j.url);
                })
                .catch((err: Error) => setError(err.message))
                .finally(() => setUploading(false));
            }}
          />
        </label>
      </div>
      <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[12.5px]">
        <label className="flex items-center gap-1.5 font-semibold">
          <input type="checkbox" checked={premium} onChange={(e) => setPremium(e.target.checked)} className="h-4 w-4 accent-purple-500" /> Premium
        </label>
        {premium && (
          <label className="flex items-center gap-1">৳ <input type="number" min={0} value={price} onChange={(e) => setPrice(e.target.value)} className="focus-glow w-20 rounded-xl bg-slate-100 p-1.5 text-[12.5px] outline-none dark:bg-black/30" aria-label="Variant price" /></label>
        )}
        <button onClick={add} className="rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 px-3.5 py-1.5 text-[12px] font-bold text-white">+ Add variant</button>
      </div>
      {error && <p role="alert" className="mt-1.5 text-[12px] font-semibold text-rose-500">{error}</p>}
    </div>
  );
}

interface FontDraft {
  key: string;
  fileName: string;
  name: string;
  type: FontType;
  bangla: boolean;
  premium: boolean;
  price: string;
  fileUrl: string;
  status: "uploading" | "ready" | "error";
  error?: string;
}

/**
 * Bulk font importer: multi-select .ttf/.otf/.woff/.woff2/.zip → upload
 * queue with per-file progress → inline review → publish all at once.
 */
export function FontBulkImporter({ onPublish }: { onPublish: (fonts: BanglaFont[]) => void }) {
  const [drafts, setDrafts] = useState<FontDraft[]>([]);
  const [open, setOpen] = useState(false);

  const enqueue = (files: File[]) => {
    setOpen(true);
    const fresh: FontDraft[] = files.map((f) => ({
      key: `${Date.now().toString(36)}-${Math.floor(Math.random() * 0xffffff).toString(36)}-${f.name}`,
      fileName: f.name,
      name: prettyName(f.name),
      type: "Unicode",
      bangla: true,
      premium: false,
      price: "0",
      fileUrl: "",
      status: "uploading" as const,
    }));
    setDrafts((d) => [...d, ...fresh]);
    files.forEach((f, i) => {
      const form = new FormData();
      form.append("kind", "font");
      form.append("file", f);
      fetch("/api/admin/uploads", { method: "POST", body: form })
        .then(async (res) => {
          const j = await res.json();
          if (!res.ok) throw new Error(j.error || "Upload failed");
          setDrafts((ds) => ds.map((d) => (d.key === fresh[i].key ? { ...d, fileUrl: j.url, status: "ready" as const } : d)));
        })
        .catch((err: Error) => {
          setDrafts((ds) => ds.map((d) => (d.key === fresh[i].key ? { ...d, status: "error" as const, error: err.message } : d)));
        });
    });
  };

  const ready = drafts.filter((d) => d.status === "ready");
  const publish = () => {
    onPublish(ready.map((d) => ({
      id: makeCustomId(d.name),
      name: d.name.trim() || prettyName(d.fileName),
      designer: "BornoLab Admin",
      license: d.premium ? "Paid" : "Free",
      type: d.type,
      category: "Sans-Serif",
      bangla: d.bangla,
      fileUrl: d.fileUrl,
      fallbackUrl: "#",
      premium: d.premium,
      priceBDT: d.premium ? Number(d.price) || 0 : 0,
    })));
    setDrafts((ds) => ds.filter((d) => d.status !== "ready"));
  };

  return (
    <div className="mt-2">
      <label className="glass hover-glow inline-flex cursor-pointer items-center gap-1.5 rounded-full px-4 py-2 text-[13px] font-bold">
        ⬆ Bulk upload fonts (.ttf/.otf/.woff/.zip)
        <input
          type="file" accept={FONT_ACCEPT} multiple className="hidden"
          onChange={(e) => {
            const fs = [...(e.target.files ?? [])];
            e.target.value = "";
            if (fs.length > 0) enqueue(fs.slice(0, 50));
          }}
        />
      </label>
      {open && drafts.length > 0 && (
        <div className="mt-2 rounded-2xl bg-slate-900/[.04] p-3 dark:bg-white/5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-[13px] font-bold">Review queue ({ready.length}/{drafts.length} ready)</p>
            <span className="flex gap-2">
              <button onClick={() => { setDrafts([]); setOpen(false); }} className="rounded-full px-3 py-1.5 text-[12px] font-bold text-slate-500 hover:bg-slate-500/10">Clear</button>
              <button onClick={publish} disabled={ready.length === 0} className="rounded-full bg-gradient-to-r from-cyan-500 to-purple-600 px-4 py-1.5 text-[12px] font-bold text-white disabled:opacity-40">
                Publish {ready.length} font{ready.length === 1 ? "" : "s"}
              </button>
            </span>
          </div>
          <div className="mt-2 max-h-72 space-y-1.5 overflow-y-auto">
            {drafts.map((d) => (
              <div key={d.key} className="grid items-center gap-1.5 rounded-xl bg-slate-900/[.04] p-2.5 text-[12.5px] dark:bg-white/5 sm:grid-cols-[1fr_130px_auto_auto_auto]">
                <span className="min-w-0">
                  <input aria-label={`Name for ${d.fileName}`} value={d.name} onChange={(e) => setDrafts((ds) => ds.map((x) => (x.key === d.key ? { ...x, name: e.target.value } : x)))} className="focus-glow w-full rounded-lg bg-slate-100 p-1.5 font-bold outline-none dark:bg-black/30" />
                  <span className="block truncate font-mono text-[10.5px] text-slate-500">{d.fileName} • {d.status === "uploading" ? "uploading…" : d.status === "error" ? `failed: ${d.error}` : d.fileUrl}</span>
                </span>
                <select aria-label={`Encoding for ${d.fileName}`} value={d.type} onChange={(e) => setDrafts((ds) => ds.map((x) => (x.key === d.key ? { ...x, type: e.target.value as FontType } : x)))} className="focus-glow rounded-lg bg-slate-100 p-1.5 outline-none dark:bg-black/30">
                  <option value="Unicode">Unicode</option>
                  <option value="ANSI">ANSI</option>
                  <option value="Dual">Dual</option>
                </select>
                <label className="flex items-center gap-1 font-semibold">বাং <input type="checkbox" checked={d.bangla} onChange={(e) => setDrafts((ds) => ds.map((x) => (x.key === d.key ? { ...x, bangla: e.target.checked } : x)))} className="h-4 w-4 accent-cyan-500" /></label>
                <label className="flex items-center gap-1 font-semibold">৳ <input type="number" min={0} value={d.price} onChange={(e) => setDrafts((ds) => ds.map((x) => (x.key === d.key ? { ...x, price: e.target.value, premium: true } : x)))} className="focus-glow w-20 rounded-lg bg-slate-100 p-1.5 outline-none dark:bg-black/30" aria-label={`Price for ${d.fileName}`} /></label>
                <button onClick={() => setDrafts((ds) => ds.filter((x) => x.key !== d.key))} className="rounded-full px-2 py-1 text-[11.5px] font-bold text-red-500 hover:bg-red-500/10">✕</button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const SW_ACCEPT = ".zip,.exe,.msi,.dmg,.pkg,.apk";

async function uploadKindFile(kind: "font" | "software" | "study" | "media", file: File): Promise<string> {
  const form = new FormData();
  form.append("kind", kind);
  form.append("file", file);
  const res = await fetch("/api/admin/uploads", { method: "POST", body: form });
  const j = await res.json();
  if (!res.ok) throw new Error(j.error || "Upload failed");
  return j.url as string;
}

/**
 * Per-app version manager: older/alternate releases with size + changelog.
 * The main fileUrl stays the current release.
 */
export function SoftwareVersionsEditor({ app, onChange }: {
  app: Pick<Software, "name"> & { versions?: SoftwareVersion[] };
  onChange: (versions: SoftwareVersion[]) => void;
}) {
  const versions = app.versions ?? [];
  const [version, setVersion] = useState("");
  const [link, setLink] = useState("");
  const [uploaded, setUploaded] = useState("");
  const [uploading, setUploading] = useState(false);
  const [size, setSize] = useState("");
  const [changelog, setChangelog] = useState("");
  const [error, setError] = useState("");

  const add = () => {
    if (!version.trim()) { setError("Version is required (e.g. 2.0.1)."); return; }
    const fileUrl = uploaded || link.trim();
    if (!fileUrl) { setError("Attach an uploaded file or paste a link."); return; }
    onChange([...versions, {
      id: `ver-${Date.now().toString(36)}${Math.floor(Math.random() * 0xffffff).toString(36)}`,
      version: version.trim().slice(0, 40),
      fileUrl,
      size: size.trim().slice(0, 40) || undefined,
      changelog: changelog.trim().slice(0, 500) || undefined,
      createdAt: Date.now(),
    }]);
    setVersion(""); setLink(""); setUploaded(""); setSize(""); setChangelog(""); setError("");
  };

  return (
    <div className="mt-2 rounded-xl bg-slate-900/[.04] p-3 dark:bg-white/5">
      <p className="text-[12px] font-bold">Versions ({versions.length}) — older/alternate releases of {app.name}</p>
      {versions.length > 0 && (
        <div className="mt-2 space-y-1.5">
          {versions.map((v) => (
            <div key={v.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-slate-900/[.04] px-2.5 py-1.5 text-[12.5px] dark:bg-white/5">
              <span className="min-w-0"><b>v{v.version}</b> {v.size && <span className="text-slate-500">• {v.size}</span>}
                <span className="block truncate font-mono text-[11px] text-slate-500">{v.fileUrl}{v.changelog ? ` • ${v.changelog.slice(0, 80)}` : ""}</span></span>
              <button onClick={() => onChange(versions.filter((x) => x.id !== v.id))} className="rounded-full px-2 py-1 text-[11.5px] font-bold text-red-500 hover:bg-red-500/10">Remove</button>
            </div>
          ))}
        </div>
      )}
      <div className="mt-2 grid gap-1.5 sm:grid-cols-[110px_1fr_110px_auto]">
        <input aria-label="Release version" value={version} onChange={(e) => setVersion(e.target.value)} placeholder="2.0.1 *" className="focus-glow rounded-xl bg-slate-100 p-2 font-mono text-[12.5px] outline-none dark:bg-black/30" />
        <input aria-label="Release file link" value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://… file link (or upload)" className="focus-glow rounded-xl bg-slate-100 p-2 font-mono text-[12px] outline-none dark:bg-black/30" />
        <input aria-label="Release size" value={size} onChange={(e) => setSize(e.target.value)} placeholder="48 MB" className="focus-glow rounded-xl bg-slate-100 p-2 text-[12.5px] outline-none dark:bg-black/30" />
        <label className="flex cursor-pointer items-center justify-center gap-1 rounded-xl bg-cyan-500/15 px-3 py-2 text-[12px] font-bold text-cyan-700 dark:text-cyan-200">
          {uploading ? "…" : uploaded ? "✓ File" : "⬆ File"}
          <input
            type="file" accept={SW_ACCEPT} className="hidden" disabled={uploading}
            onChange={(e) => {
              const f = e.target.files?.[0];
              e.target.value = "";
              if (!f) return;
              setUploading(true);
              setError("");
              uploadKindFile("software", f)
                .then((url) => {
                  setUploaded(url);
                  if (!size) {
                    const mb = f.size / 1048576;
                    setSize(mb >= 1 ? `${Math.round(mb)} MB` : `${Math.max(1, Math.round(f.size / 1024))} KB`);
                  }
                })
                .catch((err: Error) => setError(err.message))
                .finally(() => setUploading(false));
            }}
          />
        </label>
      </div>
      <input aria-label="Release changelog" value={changelog} onChange={(e) => setChangelog(e.target.value)} placeholder="Changelog (optional, one line)" className="focus-glow mt-1.5 w-full rounded-xl bg-slate-100 p-2 text-[12.5px] outline-none dark:bg-black/30" />
      <button onClick={add} className="mt-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 px-3.5 py-1.5 text-[12px] font-bold text-white">+ Add version</button>
      {error && <p role="alert" className="mt-1.5 text-[12px] font-semibold text-rose-500">{error}</p>}
    </div>
  );
}

interface SoftwareDraft {
  key: string;
  fileName: string;
  name: string;
  version: string;
  platform: string;
  price: string;
  fileUrl: string;
  size: string;
  status: "uploading" | "ready" | "error";
  error?: string;
}

/**
 * Bulk software importer: multi-select .zip/.exe/… → upload queue with
 * version stamping → inline review → publish all at once.
 */
export function SoftwareBulkImporter({ onPublish }: { onPublish: (apps: Software[]) => void }) {
  const [drafts, setDrafts] = useState<SoftwareDraft[]>([]);
  const [open, setOpen] = useState(false);

  const enqueue = (files: File[]) => {
    setOpen(true);
    const fresh: SoftwareDraft[] = files.map((f) => {
      const mb = f.size / 1048576;
      return {
        key: `${Date.now().toString(36)}-${Math.floor(Math.random() * 0xffffff).toString(36)}-${f.name}`,
        fileName: f.name,
        name: prettyName(f.name),
        version: "1.0.0",
        platform: "Windows 10/11",
        price: "0",
        fileUrl: "",
        size: mb >= 1 ? `${Math.round(mb)} MB` : `${Math.max(1, Math.round(f.size / 1024))} KB`,
        status: "uploading" as const,
      };
    });
    setDrafts((d) => [...d, ...fresh]);
    files.forEach((f, i) => {
      uploadKindFile("software", f)
        .then((url) => {
          setDrafts((ds) => ds.map((d) => (d.key === fresh[i].key ? { ...d, fileUrl: url, status: "ready" as const } : d)));
        })
        .catch((err: Error) => {
          setDrafts((ds) => ds.map((d) => (d.key === fresh[i].key ? { ...d, status: "error" as const, error: err.message } : d)));
        });
    });
  };

  const ready = drafts.filter((d) => d.status === "ready");
  const publish = () => {
    onPublish(ready.map((d) => {
      const price = Number(d.price) || 0;
      return {
        id: makeCustomId(d.name),
        name: d.name.trim() || prettyName(d.fileName),
        tagline: "Added by admin",
        license: price > 0 ? "Paid" : "Free",
        priceBDT: price,
        platform: d.platform.trim() || "Windows 10/11",
        version: d.version.trim() || "1.0.0",
        size: d.size,
        downloads: "New",
        fileUrl: d.fileUrl,
        fallbackUrl: "#",
      } as Software;
    }));
    setDrafts((ds) => ds.filter((d) => d.status !== "ready"));
  };

  return (
    <div className="mt-2">
      <label className="glass hover-glow inline-flex cursor-pointer items-center gap-1.5 rounded-full px-4 py-2 text-[13px] font-bold">
        ⬆ Bulk upload software (.zip/.exe, 300 MB each)
        <input
          type="file" accept={SW_ACCEPT} multiple className="hidden"
          onChange={(e) => {
            const fs = [...(e.target.files ?? [])];
            e.target.value = "";
            if (fs.length > 0) enqueue(fs.slice(0, 20));
          }}
        />
      </label>
      {open && drafts.length > 0 && (
        <div className="mt-2 rounded-2xl bg-slate-900/[.04] p-3 dark:bg-white/5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-[13px] font-bold">Review queue ({ready.length}/{drafts.length} ready)</p>
            <span className="flex gap-2">
              <button onClick={() => { setDrafts([]); setOpen(false); }} className="rounded-full px-3 py-1.5 text-[12px] font-bold text-slate-500 hover:bg-slate-500/10">Clear</button>
              <button onClick={publish} disabled={ready.length === 0} className="rounded-full bg-gradient-to-r from-cyan-500 to-purple-600 px-4 py-1.5 text-[12px] font-bold text-white disabled:opacity-40">
                Publish {ready.length} app{ready.length === 1 ? "" : "s"}
              </button>
            </span>
          </div>
          <div className="mt-2 max-h-72 space-y-1.5 overflow-y-auto">
            {drafts.map((d) => (
              <div key={d.key} className="grid items-center gap-1.5 rounded-xl bg-slate-900/[.04] p-2.5 text-[12.5px] dark:bg-white/5 sm:grid-cols-[1fr_90px_130px_90px_auto]">
                <span className="min-w-0">
                  <input aria-label={`Name for ${d.fileName}`} value={d.name} onChange={(e) => setDrafts((ds) => ds.map((x) => (x.key === d.key ? { ...x, name: e.target.value } : x)))} className="focus-glow w-full rounded-lg bg-slate-100 p-1.5 font-bold outline-none dark:bg-black/30" />
                  <span className="block truncate font-mono text-[10.5px] text-slate-500">{d.fileName} • {d.size} • {d.status === "uploading" ? "uploading…" : d.status === "error" ? `failed: ${d.error}` : d.fileUrl}</span>
                </span>
                <input aria-label={`Version for ${d.fileName}`} value={d.version} onChange={(e) => setDrafts((ds) => ds.map((x) => (x.key === d.key ? { ...x, version: e.target.value } : x)))} className="focus-glow rounded-lg bg-slate-100 p-1.5 font-mono outline-none dark:bg-black/30" />
                <input aria-label={`Platform for ${d.fileName}`} value={d.platform} onChange={(e) => setDrafts((ds) => ds.map((x) => (x.key === d.key ? { ...x, platform: e.target.value } : x)))} className="focus-glow rounded-lg bg-slate-100 p-1.5 outline-none dark:bg-black/30" />
                <label className="flex items-center gap-1 font-semibold">৳ <input type="number" min={0} value={d.price} onChange={(e) => setDrafts((ds) => ds.map((x) => (x.key === d.key ? { ...x, price: e.target.value } : x)))} className="focus-glow w-20 rounded-lg bg-slate-100 p-1.5 outline-none dark:bg-black/30" aria-label={`Price for ${d.fileName}`} /></label>
                <button onClick={() => setDrafts((ds) => ds.filter((x) => x.key !== d.key))} className="rounded-full px-2 py-1 text-[11.5px] font-bold text-red-500 hover:bg-red-500/10">✕</button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
