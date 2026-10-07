/**
 * Plugin-ready catalog registry — one declarative definition per catalog
 * type (fonts / software / study). New product types plug in by adding a
 * definition here: duplication, CSV export/import and overview counts
 * then work with no further UI code.
 *
 * Client-safe (types + pure functions only). Custom/admin-added items only —
 * built-in entries are code, not data.
 */
import type { BanglaFont, FontCategory, FontType } from "./fonts-data";
import type { Software } from "./software-data";
import type { StudyCategory, StudyMaterial } from "./study-data";
import type { SiteConfig } from "./site-config-shared";

export type CatalogKind = "font" | "software" | "study";

export interface CatalogColumn {
  key: string;
  label: string;
  /** Convert the raw CSV cell to the stored value. */
  parse: (raw: string) => string | number | boolean | undefined;
}

const str = (raw: string) => {
  const t = raw.trim();
  return t ? t : undefined;
};
const num = (raw: string) => {
  const t = raw.trim();
  if (!t) return undefined;
  const n = Number(t);
  return Number.isFinite(n) ? n : undefined;
};
const bool = (raw: string) => {
  const t = raw.trim().toLowerCase();
  if (["1", "true", "yes", "y"].includes(t)) return true;
  if (["0", "false", "no", "n"].includes(t)) return false;
  return undefined;
};

export interface CatalogDef {
  kind: CatalogKind;
  label: string;
  singular: string;
  /** Custom items of this kind in the config. */
  customs: (config: SiteConfig) => { id: string; name: string }[];
  /** CSV columns (id is auto-generated on import). */
  columns: CatalogColumn[];
  /** Build a custom item from a parsed CSV row (without id). */
  build: (row: Record<string, string | number | boolean | undefined>) => object;
  /** Clone a custom item with a fresh id for duplication. */
  clone: (item: never, newId: (base: string) => string) => object;
}

function newCustomId(base: string): string {
  const slug =
    base.toLowerCase().replace(/[^a-z0-9\u0980-\u09ff]+/gi, "-").replace(/^-+|-+$/g, "").slice(0, 40) || "item";
  return `custom-${slug}-${Date.now().toString(36)}`;
}

const FONT_COLUMNS: CatalogColumn[] = [
  { key: "name", label: "name*", parse: str },
  { key: "designer", label: "designer", parse: str },
  { key: "license", label: "license (Free/Paid)", parse: str },
  { key: "type", label: "type (Unicode/ANSI/Dual)", parse: str },
  { key: "category", label: "category", parse: str },
  { key: "bangla", label: "bangla (yes/no)", parse: bool },
  { key: "fileUrl", label: "fileUrl", parse: str },
  { key: "fallbackUrl", label: "fallbackUrl", parse: str },
  { key: "premium", label: "premium (yes/no)", parse: bool },
  { key: "priceBDT", label: "priceBDT", parse: num },
];

const SOFTWARE_COLUMNS: CatalogColumn[] = [
  { key: "name", label: "name*", parse: str },
  { key: "tagline", label: "tagline", parse: str },
  { key: "platform", label: "platform", parse: str },
  { key: "version", label: "version", parse: str },
  { key: "size", label: "size", parse: str },
  { key: "fileUrl", label: "fileUrl", parse: str },
  { key: "fallbackUrl", label: "fallbackUrl", parse: str },
  { key: "priceBDT", label: "priceBDT (0 = free)", parse: num },
];

const STUDY_COLUMNS: CatalogColumn[] = [
  { key: "title", label: "title*", parse: str },
  { key: "category", label: "category*", parse: str },
  { key: "subcategory", label: "subcategory", parse: str },
  { key: "description", label: "description", parse: str },
  { key: "fileUrl", label: "fileUrl*", parse: str },
  { key: "featured", label: "featured (yes/no)", parse: bool },
  { key: "access", label: "access (free/paid)", parse: str },
  { key: "priceBDT", label: "priceBDT", parse: num },
  { key: "previewPages", label: "previewPages", parse: num },
];

const VALID_FONT_TYPES = ["Unicode", "ANSI", "Dual"];
const VALID_STUDY_CATS = ["admission", "ssc", "hsc", "bachelor", "masters"];

export const CATALOG_DEFS: Record<CatalogKind, CatalogDef> = {
  font: {
    kind: "font",
    label: "Fonts",
    singular: "font",
    customs: (c) => (c.customFonts ?? []).map((f) => ({ id: f.id, name: f.name })),
    columns: FONT_COLUMNS,
    build: (r) => {
      const premium = r.premium === true || String(r.license ?? "").toLowerCase() === "paid";
      const rawType = String(r.type ?? "");
      const type: FontType = (VALID_FONT_TYPES.includes(rawType) ? rawType : "Unicode") as FontType;
      return {
        name: String(r.name ?? "Untitled font").slice(0, 160),
        designer: String(r.designer ?? "BornoLab Admin").slice(0, 120),
        license: premium ? "Paid" : "Free",
        type,
        category: String(r.category ?? "Sans-Serif").slice(0, 40) as FontCategory,
        bangla: r.bangla !== false,
        fileUrl: String(r.fileUrl ?? "#"),
        fallbackUrl: String(r.fallbackUrl ?? "#"),
        premium,
        priceBDT: premium ? Number(r.priceBDT ?? 0) || 0 : 0,
      } satisfies Partial<BanglaFont> as object;
    },
    clone: (item, nid) => {
      const f = item as unknown as BanglaFont;
      return { ...f, id: nid(f.name), name: `${f.name} (copy)` };
    },
  },
  software: {
    kind: "software",
    label: "Software",
    singular: "app",
    customs: (c) => (c.customSoftware ?? []).map((s) => ({ id: s.id, name: s.name })),
    columns: SOFTWARE_COLUMNS,
    build: (r) => {
      const price = Number(r.priceBDT ?? 0) || 0;
      return {
        name: String(r.name ?? "Untitled app").slice(0, 160),
        tagline: String(r.tagline ?? "Added by admin").slice(0, 300),
        license: price > 0 ? "Paid" : "Free",
        priceBDT: price,
        platform: String(r.platform ?? "Windows 10/11").slice(0, 120),
        version: String(r.version ?? "1.0.0").slice(0, 40),
        size: String(r.size ?? "—").slice(0, 40),
        downloads: "New",
        fileUrl: String(r.fileUrl ?? "#"),
        fallbackUrl: String(r.fallbackUrl ?? "#"),
      } satisfies Partial<Software> as object;
    },
    clone: (item, nid) => {
      const s = item as unknown as Software;
      return { ...s, id: nid(s.name), name: `${s.name} (copy)` };
    },
  },
  study: {
    kind: "study",
    label: "Study materials",
    singular: "material",
    customs: (c) => (c.customStudy ?? []).map((m) => ({ id: m.id, name: m.title })),
    columns: STUDY_COLUMNS,
    build: (r) => {
      const rawCat = String(r.category ?? "");
      const category = (VALID_STUDY_CATS.includes(rawCat) ? rawCat : "masters") as StudyCategory;
      const fileUrl = String(r.fileUrl ?? "");
      const access = String(r.access ?? "free").toLowerCase() === "paid" ? "paid" : "free";
      return {
        title: String(r.title ?? "Untitled material").slice(0, 160),
        category,
        subcategory: String(r.subcategory ?? "").slice(0, 120) || undefined,
        description: String(r.description ?? "").slice(0, 2000),
        fileUrl,
        fileType: /\.pdf($|\?)/i.test(fileUrl) ? "pdf" : /\.html?($|\?)/i.test(fileUrl) ? "html" : "link",
        topics: [],
        featured: r.featured === true,
        enabled: true,
        createdAt: Date.now(),
        access,
        priceBDT: access === "paid" ? Number(r.priceBDT ?? 0) || 0 : 0,
        previewPages: Math.max(1, Math.min(20, Number(r.previewPages ?? 3) || 3)),
      } satisfies Partial<StudyMaterial> as object;
    },
    clone: (item, nid) => {
      const m = item as unknown as StudyMaterial;
      return { ...m, id: nid(m.title), title: `${m.title} (copy)`, createdAt: Date.now() };
    },
  },
};

export function makeCustomId(base: string): string {
  return newCustomId(base);
}

/* ---------------- CSV (RFC-4180 minimal: quotes + escaped quotes) ---------------- */

function esc(cell: unknown): string {
  const s = cell === null || cell === undefined ? "" : String(cell);
  return /[",\n]/.test(s) ? `"${s.replaceAll('"', '""')}"` : s;
}

export function catalogToCsv(def: CatalogDef, items: Record<string, unknown>[]): string {
  const head = def.columns.map((c) => esc(c.label)).join(",");
  const rows = items.map((it) =>
    def.columns.map((c) => esc((it as Record<string, unknown>)[c.key])).join(",")
  );
  return [head, ...rows].join("\n");
}

function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (quoted) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          quoted = false;
        }
      } else {
        cur += ch;
      }
    } else if (ch === '"') {
      quoted = true;
    } else if (ch === ",") {
      out.push(cur);
      cur = "";
    } else {
      cur += ch;
    }
  }
  out.push(cur);
  return out;
}

export interface CsvImportResult {
  rows: Record<string, string | number | boolean | undefined>[];
  errors: string[];
}

/** Parse CSV text into typed rows. Header must contain the required (*) columns. */
export function catalogFromCsv(def: CatalogDef, text: string): CsvImportResult {
  const errors: string[] = [];
  const rows: CsvImportResult["rows"] = [];
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length === 0) return { rows, errors: ["File is empty."] };
  const header = splitCsvLine(lines[0]).map((h) => h.trim().toLowerCase());
  const idx = def.columns.map((c) => header.indexOf(c.label.toLowerCase()));
  const required = def.columns.filter((c) => c.label.endsWith("*"));
  const missing = required.filter((c) => !header.includes(c.label.toLowerCase()));
  if (missing.length > 0) {
    return { rows, errors: [`Missing required column(s): ${missing.map((c) => c.label).join(", ")}`] };
  }
  lines.slice(1, 501).forEach((line, n) => {
    const cells = splitCsvLine(line);
    const row: Record<string, string | number | boolean | undefined> = {};
    def.columns.forEach((c, ci) => {
      const raw = cells[idx[ci]] ?? "";
      row[c.key] = c.parse(raw);
    });
    rows.push(row);
    if (n >= 500) errors.push("Only the first 500 rows were imported.");
  });
  return { rows, errors };
}

/** Validate a built study row the same way the API does. */
export function validateStudyRow(item: { fileUrl?: unknown; category?: unknown }): string | null {
  const fileUrl = String(item.fileUrl ?? "");
  if (!fileUrl || (!fileUrl.startsWith("/uploads/study/") && !/^https:\/\//.test(fileUrl))) {
    return "fileUrl must be /uploads/study/… or https://…";
  }
  if (!VALID_STUDY_CATS.includes(String(item.category ?? ""))) return "invalid category";
  return null;
}
