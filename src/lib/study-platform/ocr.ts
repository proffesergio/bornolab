/** Bengali OCR cleanup: conservative NFC + control-char + whitespace rules. Never silently rewrites content. */
import { normalizeUnicode } from "./validation";

export interface CleanupResult {
  text: string;
  /** Human-readable fix counts, e.g. ["control-chars: 12", "whitespace: 40"]. */
  fixes: string[];
}

/** Format/control code points Tesseract inserts (escaped — no invisible literals). */
const STRIP_CLASS = "\\uFEFF\\u200B\\u200C\\u200D\\u200E\\u200F\\u00AD\\u2028\\u2029";

/**
 * Tesseract ben+eng output cleanup. Only mechanical normalizations; every
 * change class is counted and reported so editors can verify, never trust.
 */
export function cleanupBengaliOcr(raw: string): CleanupResult {
  const fixes: string[] = [];
  let t = raw ?? "";
  // 1. Strip spurious control/format characters Tesseract inserts (keep real newlines).
  const beforeCtrl = t.length;
  t = t.replace(new RegExp(`[${STRIP_CLASS}]`, "g"), "");
  if (t.length !== beforeCtrl) fixes.push(`control-chars: ${beforeCtrl - t.length}`);
  // 2. Normalize obvious ASCII confusions of the dari "।" (pipe between Bengali letters).
  const beforeDari = t.length;
  t = t.replace(/(?<=[\u0980-\u09FF])\|(?=[\u0980-\u09FF\s])/g, "।");
  if (t.length !== beforeDari) fixes.push("dari-pipe: normalized");
  // 3. Collapse repeated blank lines + trailing spaces, keep paragraph breaks.
  const lines = t.split("\n").map((l) => l.replace(/[ \t]+$/g, ""));
  const collapsed: string[] = [];
  let blanks = 0;
  for (const l of lines) {
    if (!l.trim()) {
      blanks += 1;
      if (blanks <= 1) collapsed.push("");
      continue;
    }
    blanks = 0;
    collapsed.push(l);
  }
  t = collapsed.join("\n").trim();
  // 4. Unicode NFC + Bengali-safe space collapse (inside lines only, paragraphs kept).
  const final = t
    .split("\n")
    .map((l) => normalizeUnicode(l))
    .join("\n");
  if (final !== t) fixes.push("unicode-nfc: normalized");
  return { text: final, fixes };
}

/** Split cleaned OCR text into page-agnostic evidence chunks (paragraph groups). */
export function chunkEvidence(text: string, maxChars = 2000): string[] {
  const paras = String(text ?? "").split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  const chunks: string[] = [];
  let cur = "";
  for (const p of paras) {
    if ((cur + "\n\n" + p).length > maxChars && cur) {
      chunks.push(cur);
      cur = p;
    } else {
      cur = cur ? `${cur}\n\n${p}` : p;
    }
  }
  if (cur) chunks.push(cur);
  return chunks;
}
