/** Publication blockers + OCR/duplicate/ambiguity detection. Pure functions. */
import type { Question } from "./types";

export interface ValidationIssue {
  code: string;
  messageBn: string;
  messageEn: string;
}

const BN_CORRUPT_RE = /[��\uFFFD]|\(cid:\d+\)|\?\?\?+/;
const BROKEN_MATH_RE = /\\[a-zA-Z]+\{[^}]*$|\$\$[^$]*$/;

export function normalizeUnicode(s: string): string {
  return (s ?? "").normalize("NFC").replace(/[\u200B-\u200D\uFEFF]/g, "").replace(/\s+/g, " ").trim();
}

export function validateForPublication(q: Question): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const locales = (["bn", "en"] as const).map((l) => ({ l, t: q.locale?.[l] }));
  for (const { l, t } of locales) {
    if (!t || !normalizeUnicode(t.stem)) {
      issues.push({ code: `missing-stem-${l}`, messageBn: `${l === "bn" ? "বাংলা" : "ইংরেজি"} প্রশ্নের stem নেই`, messageEn: `Missing ${l} stem` });
    }
    if (!t || t.options.length < 4) {
      issues.push({ code: `missing-options-${l}`, messageBn: `${l === "bn" ? "বাংলা" : "ইংরেজি"} অপশন অসম্পূর্ণ (কমপক্ষে ৪টি)`, messageEn: `Missing options for ${l} (need ≥4)` });
    }
    if (!t || !normalizeUnicode(t.explanation)) {
      issues.push({ code: `missing-explanation-${l}`, messageBn: `${l === "bn" ? "বাংলা" : "ইংরেজি"} ব্যাখ্যা নেই`, messageEn: `Missing ${l} explanation` });
    }
  }
  if (!q.key?.optionId) {
    issues.push({ code: "missing-key", messageBn: "উত্তর-কী নেই", messageEn: "Missing answer key" });
  }
  if (q.key?.status !== "approved") {
    issues.push({ code: "key-not-approved", messageBn: "উত্তর-কী অনুমোদিত নয় (provisional)", messageEn: "Answer key is provisional, not approved" });
  }
  if (!q.citations || q.citations.length === 0) {
    issues.push({ code: "missing-citation", messageBn: "সূত্র/সাইটেশন নেই", messageEn: "Missing source citation" });
  }
  if (!q.license || q.license.status === "pending" || q.license.status === "blocked") {
    issues.push({ code: "rights-unresolved", messageBn: "স্বত্ব/লাইসেন্স অমীমাংসিত", messageEn: "Unresolved rights/license status" });
  }
  if (q.ambiguityFlag) {
    issues.push({ code: "ambiguity", messageBn: "অস্পষ্টতা ফ্ল্যাগ রয়েছে — রিভিউ প্রয়োজন", messageEn: "Ambiguity flag is set — needs review" });
  }
  if (q.ocrFlags && q.ocrFlags.length > 0) {
    issues.push({ code: "ocr-unresolved", messageBn: `OCR সমস্যা অমীমাংসিত: ${q.ocrFlags.join(", ")}`, messageEn: `Unresolved OCR flags: ${q.ocrFlags.join(", ")}` });
  }
  return issues;
}

export function canPublish(q: Question): boolean {
  return validateForPublication(q).length === 0;
}

export function detectOcrFlags(stem: string, options: string[]): string[] {
  const flags: string[] = [];
  const all = [stem, ...options].join("\n");
  if (BN_CORRUPT_RE.test(all)) flags.push("garbled-bangla");
  if (BROKEN_MATH_RE.test(all)) flags.push("broken-formula");
  if (options.some((o) => !normalizeUnicode(o))) flags.push("missing-option");
  if (/\[diagram|\(fig\.|চিত্র\s*:/i.test(all)) flags.push("missing-diagram");
  return [...new Set(flags)];
}

/** Duplicate-stem detection (normalized, case-insensitive, punctuation-insensitive). */
export function stemKey(s: string): string {
  return normalizeUnicode(s).toLowerCase().replace(/[।.,!?;:"“”‘’()[\]{}-]/g, "").replace(/\s+/g, " ").slice(0, 160);
}

export function findDuplicateStems(questions: Pick<Question, "id" | "locale">[]): { key: string; ids: string[] }[] {
  const groups = new Map<string, string[]>();
  for (const q of questions) {
    for (const loc of ["bn", "en"] as const) {
      const stem = q.locale?.[loc]?.stem ?? "";
      if (!normalizeUnicode(stem)) continue;
      const k = `${loc}:${stemKey(stem)}`;
      groups.set(k, [...(groups.get(k) ?? []), q.id]);
    }
  }
  return [...groups.entries()].filter(([, ids]) => ids.length > 1).map(([key, ids]) => ({ key, ids }));
}
