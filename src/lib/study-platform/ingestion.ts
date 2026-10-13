/** Ingestion: JSON/CSV/manual → restricted staging + editorial draft. Admin-only evidence. */
import { detectOcrFlags, normalizeUnicode, stemKey } from "./validation";
import type { ContentStatus, Question } from "./types";

export interface RawRow {
  stemBn?: string;
  stemEn?: string;
  optionsBn?: string[];
  optionsEn?: string[];
  answerIndex?: number;
  chapterId?: string;
  sourceUrl?: string;
  sourceTitle?: string;
  pageOrSection?: string;
}

export interface StagedItem {
  id: string;
  row: RawRow;
  sourceUrl: string;
  sourceTitle: string;
  pageOrSection?: string;
  retrievalDate: string;
  fileHash?: string;
  licenseState: string;
  ocrFlags: string[];
  duplicateOf?: string;
  createdAt: number;
}

export function stageRow(row: RawRow, meta: { sourceUrl: string; sourceTitle: string; licenseState?: string; fileHash?: string }): StagedItem {
  const bn = normalizeUnicode(row.stemBn ?? "");
  const en = normalizeUnicode(row.stemEn ?? "");
  const flags = detectOcrFlags(`${bn}\n${en}`, [...(row.optionsBn ?? []), ...(row.optionsEn ?? [])]);
  return {
    id: `ev-${Date.now().toString(36)}-${Math.floor(Math.random() * 0xffffff).toString(36)}`,
    row,
    sourceUrl: meta.sourceUrl,
    sourceTitle: meta.sourceTitle,
    pageOrSection: row.pageOrSection,
    retrievalDate: new Date().toISOString().slice(0, 10),
    fileHash: meta.fileHash,
    licenseState: meta.licenseState ?? "pending",
    ocrFlags: flags,
    createdAt: Date.now(),
  };
}

export function parseJsonImport(text: string): RawRow[] {
  const data = JSON.parse(text) as unknown;
  const arr = Array.isArray(data) ? data : [(data as Record<string, unknown>) ?? {}];
  return arr.map((r) => {
    const o = (r ?? {}) as Record<string, unknown>;
    const strArr = (v: unknown): string[] | undefined => (Array.isArray(v) ? v.map((x) => String(x)) : undefined);
    return {
      stemBn: typeof o.stemBn === "string" ? o.stemBn : typeof o.qBn === "string" ? o.qBn : undefined,
      stemEn: typeof o.stemEn === "string" ? o.stemEn : typeof o.q === "string" ? o.q : undefined,
      optionsBn: strArr(o.optionsBn) ?? strArr(o.options),
      optionsEn: strArr(o.optionsEn),
      answerIndex: typeof o.answerIndex === "number" ? o.answerIndex : undefined,
      chapterId: typeof o.chapterId === "string" ? o.chapterId : undefined,
      sourceUrl: typeof o.sourceUrl === "string" ? o.sourceUrl : undefined,
      sourceTitle: typeof o.sourceTitle === "string" ? o.sourceTitle : undefined,
      pageOrSection: typeof o.pageOrSection === "string" ? o.pageOrSection : undefined,
    };
  });
}

export function parseCsvImport(text: string): RawRow[] {
  // Minimal CSV: header row with stemBn,stemEn,optBn1..4,optEn1..4,answerIndex,chapterId
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];
  const head = splitCsv(lines[0]);
  return lines.slice(1).map((ln) => {
    const cells = splitCsv(ln);
    const get = (k: string): string | undefined => {
      const i = head.indexOf(k);
      return i >= 0 ? cells[i] : undefined;
    };
    return {
      stemBn: get("stemBn"),
      stemEn: get("stemEn"),
      optionsBn: [get("optBn1"), get("optBn2"), get("optBn3"), get("optBn4")].filter(Boolean) as string[],
      optionsEn: [get("optEn1"), get("optEn2"), get("optEn3"), get("optEn4")].filter(Boolean) as string[],
      answerIndex: get("answerIndex") ? Number(get("answerIndex")) : undefined,
      chapterId: get("chapterId"),
    };
  });
}

function splitCsv(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQ = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (ch === '"') {
      if (inQ && line[i + 1] === '"') { cur += '"'; i += 1; }
      else inQ = !inQ;
    } else if (ch === "," && !inQ) { out.push(cur.trim()); cur = ""; }
    else cur += ch;
  }
  out.push(cur.trim());
  return out;
}

/** Editorial draft: requires paraphrase + independent solve placeholders before publish. */
export function toDraftQuestion(staged: StagedItem, author: string): Omit<Question, "id" | "stableId" | "options" | "key"> & { answerIndex: number } {
  const now = Date.now();
  return {
    type: "mcq",
    difficulty: "medium",
    cognitive: "recall",
    chapterId: staged.row.chapterId ?? "ch-net-ip",
    postSlugs: [],
    examVersionIds: [],
    tags: ["imported"],
    locale: {
      bn: { stem: normalizeUnicode(staged.row.stemBn ?? ""), options: staged.row.optionsBn ?? [], explanation: "" },
      en: { stem: normalizeUnicode(staged.row.stemEn ?? ""), options: staged.row.optionsEn ?? [], explanation: "" },
    },
    citations: staged.sourceUrl ? [{ url: staged.sourceUrl, title: staged.sourceTitle, pageOrSection: staged.pageOrSection, retrievalDate: staged.retrievalDate, provenance: "staged-import", licenseOrPermission: staged.licenseState }] : [],
    license: { status: staged.licenseState === "original" ? "original" : "pending", note: `Staged by ${author}; paraphrase + independent solve required.` },
    status: "draft" as ContentStatus,
    version: 1,
    ocrFlags: staged.ocrFlags,
    history: [],
    createdAt: now,
    updatedAt: now,
    answerIndex: staged.row.answerIndex ?? 0,
  };
}

export function duplicateKeyFor(stemBn: string, stemEn: string): string[] {
  return [stemBn, stemEn].filter(Boolean).map((s) => stemKey(s));
}
