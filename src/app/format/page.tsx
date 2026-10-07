"use client";
import { useState } from "react";
import { FileUp, Loader2, Download, Sparkles } from "lucide-react";
import { GlassCard, SectionTitle } from "@/components/ui";
import { downloadBlob } from "@/lib/doc-utils";
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from "docx";
import { cn } from "@/lib/cn";

type JobType = "journal" | "book-en" | "book-bn";

/** Page sizes in twips (1/1440 inch). */
const PAGE_SIZES = {
  A4: { label: "A4 (210 × 297 mm)", width: 11906, height: 16838 },
  "6x9": { label: "Book 6×9 in", width: 8640, height: 12960 },
  letter: { label: "Letter (8.5 × 11 in)", width: 12240, height: 15840 },
} as const;

type PageSizeKey = keyof typeof PAGE_SIZES;

const PRESETS: Record<JobType, { page: PageSizeKey; enFont: string; bnFont: string; baseSize: number; blurb: string }> = {
  journal: { page: "A4", enFont: "Times New Roman", bnFont: "SolaimanLipi", baseSize: 24, blurb: "A4, 1-inch margins, justified body, styled headings." },
  "book-en": { page: "6x9", enFont: "Georgia", bnFont: "SolaimanLipi", baseSize: 24, blurb: "6×9-inch book block, comfortable margins, serif body." },
  "book-bn": { page: "A4", enFont: "SolaimanLipi", bnFont: "SolaimanLipi", baseSize: 26, blurb: "Bangla-first: SolaimanLipi everywhere, generous line spacing." },
};

const BN_RE = /[\u0980-\u09FF]/;

/** Strip scripts + event handlers from mammoth HTML. */
function sanitizeHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script\s*>/gi, "")
    .replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(/javascript:/gi, "");
}

/** Split text into Bangla / non-Bangla runs so each gets the right font. */
function splitRuns(text: string): { t: string; bn: boolean }[] {
  const out: { t: string; bn: boolean }[] = [];
  let cur = "";
  let curBn: boolean | null = null;
  for (const ch of text) {
    const isBn = BN_RE.test(ch);
    if (curBn === null) curBn = isBn;
    if (isBn !== curBn && cur) { out.push({ t: cur, bn: curBn }); cur = ""; curBn = isBn; }
    cur += ch;
  }
  if (cur) out.push({ t: cur, bn: curBn ?? false });
  return out;
}

/** /format — client-side DOCX auto-formatter: messy manuscript in, clean print-ready file out. */
export default function FormatPage() {
  const [jobType, setJobType] = useState<JobType>("book-bn");
  const [file, setFile] = useState<File | null>(null);
  const [pageKey, setPageKey] = useState<PageSizeKey>("A4");
  const [enFont, setEnFont] = useState(PRESETS["book-bn"].enFont);
  const [bnFont, setBnFont] = useState(PRESETS["book-bn"].bnFont);
  const [baseSize, setBaseSize] = useState(PRESETS["book-bn"].baseSize);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<string | null>(null);

  const pickPreset = (j: JobType) => {
    setJobType(j);
    setPageKey(PRESETS[j].page);
    setEnFont(PRESETS[j].enFont);
    setBnFont(PRESETS[j].bnFont);
    setBaseSize(PRESETS[j].baseSize);
  };

  const format = async () => {
    setError(null); setStats(null);
    if (!file) { setError("Choose a .docx manuscript first."); return; }
    if (file.size > 25 * 1024 * 1024) { setError("File exceeds the 25 MB cap."); return; }
    if (!enFont.trim() || !bnFont.trim()) { setError("Both font names are required."); return; }
    setBusy(true);
    try {
      const mammoth = (await import("mammoth")).default as unknown as {
        convertToHtml: (opts: { arrayBuffer: ArrayBuffer }) => Promise<{ value: string }>;
      };
      const { value } = await mammoth.convertToHtml({ arrayBuffer: await file.arrayBuffer() });
      const doc = new DOMParser().parseFromString(sanitizeHtml(value), "text/html");
      const size = PAGE_SIZES[pageKey];
      const children: Paragraph[] = [];
      let headings = 0;
      let paras = 0;
      let words = 0;

      const bodyRun = (text: string, opts?: { bold?: boolean; size?: number }) =>
        splitRuns(text).map((seg) => new TextRun({
          text: seg.t,
          bold: opts?.bold,
          size: opts?.size ?? baseSize,
          font: { ascii: enFont.trim(), hAnsi: enFont.trim(), cs: bnFont.trim() },
        }));

      const pushPara = (text: string) => {
        const t = text.replace(/\s+/g, " ").trim();
        if (!t) return;
        paras++;
        words += t.split(" ").length;
        children.push(new Paragraph({
          children: bodyRun(t),
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 160, line: 276 },
        }));
      };

      for (const el of Array.from(doc.body.children)) {
        const tag = el.tagName.toLowerCase();
        const text = el.textContent ?? "";
        if (tag === "h1" || tag === "h2" || tag === "h3") {
          const t = text.replace(/\s+/g, " ").trim();
          if (!t) continue;
          headings++;
          words += t.split(" ").length;
          children.push(new Paragraph({
            heading: tag === "h1" ? HeadingLevel.HEADING_1 : tag === "h2" ? HeadingLevel.HEADING_2 : HeadingLevel.HEADING_3,
            children: bodyRun(t, { bold: true, size: tag === "h1" ? baseSize + 12 : tag === "h2" ? baseSize + 6 : baseSize + 2 }),
            spacing: { before: 240, after: 120 },
          }));
        } else if (tag === "ul" || tag === "ol") {
          for (const li of Array.from(el.querySelectorAll("li"))) pushPara(`• ${li.textContent ?? ""}`);
        } else if (tag === "table") {
          for (const tr of Array.from(el.querySelectorAll("tr"))) {
            const cells = Array.from(tr.querySelectorAll("th,td")).map((c) => (c.textContent ?? "").replace(/\s+/g, " ").trim());
            pushPara(cells.join(" | "));
          }
        } else {
          pushPara(text);
        }
      }

      if (children.length === 0) throw new Error("No text found in this .docx (images-only?).");
      const out = new Document({
        sections: [{
          properties: {
            page: {
              size: { width: size.width, height: size.height },
              margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
            },
          },
          children,
        }],
      });
      const blob = await Packer.toBlob(out);
      downloadBlob(blob, file.name.replace(/\.docx$/i, "") + ".formatted.docx");
      setStats(`Done — ${paras} paragraphs, ${headings} headings, ~${words} words → ${size.label}, ${enFont.trim()} + ${bnFont.trim()}.`);
    } catch (e) {
      setError(`Formatting failed: ${(e as Error).message}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <SectionTitle
        kicker="Document Toolkit"
        title="Auto-Format for Print"
        desc="Upload a messy .docx → download a clean Journal / Book file. Page size, heading styles and separate EN/BN fonts — all in your browser."
      />
      <GlassCard>
        <div className="flex gap-1.5" role="group" aria-label="Job type">
          {(["journal", "book-en", "book-bn"] as const).map((j) => (
            <button key={j} onClick={() => pickPreset(j)} aria-pressed={jobType === j}
              className={cn("rounded-full px-4 py-2 text-[12.5px] font-bold", jobType === j ? "bg-gradient-to-r from-cyan-500 to-purple-600 text-white" : "glass hover-glow")}>
              {j}
            </button>
          ))}
        </div>
        <p className="mt-2 text-[12.5px] text-slate-500">{PRESETS[jobType].blurb}</p>
        <label className="mt-3 flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-cyan-500/50 p-4 text-sm hover:bg-cyan-500/5"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files?.[0]; if (f) setFile(f); }}
        >
          <FileUp size={18} className="text-cyan-600 dark:text-cyan-300" />
          <span className="truncate">{file?.name ?? "Drop / click to choose .docx manuscript (max 25 MB)"}</span>
          <input type="file" accept=".docx" className="hidden" onChange={(e) => { setFile(e.target.files?.[0] ?? null); e.target.value = ""; }} />
        </label>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="fmt-page" className="text-xs font-bold">Page size</label>
            <select id="fmt-page" value={pageKey} onChange={(e) => setPageKey(e.target.value as PageSizeKey)} className="focus-glow mt-1 w-full rounded-xl bg-slate-100 p-2.5 text-sm outline-none dark:bg-black/30">
              {(Object.keys(PAGE_SIZES) as PageSizeKey[]).map((k) => <option key={k} value={k}>{PAGE_SIZES[k].label}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="fmt-size" className="text-xs font-bold">Body size (half-points, 24 = 12pt)</label>
            <input id="fmt-size" type="number" min={16} max={36} value={baseSize} onChange={(e) => setBaseSize(Math.min(36, Math.max(16, Number(e.target.value) || 24)))} className="focus-glow mt-1 w-full rounded-xl bg-slate-100 p-2.5 text-sm outline-none dark:bg-black/30" />
          </div>
          <div>
            <label htmlFor="fmt-en" className="text-xs font-bold">English font</label>
            <input id="fmt-en" value={enFont} onChange={(e) => setEnFont(e.target.value)} className="focus-glow mt-1 w-full rounded-xl bg-slate-100 p-2.5 text-sm outline-none dark:bg-black/30" />
          </div>
          <div>
            <label htmlFor="fmt-bn" className="text-xs font-bold">Bangla font</label>
            <input id="fmt-bn" value={bnFont} onChange={(e) => setBnFont(e.target.value)} className="focus-glow mt-1 w-full rounded-xl bg-slate-100 p-2.5 text-sm outline-none dark:bg-black/30" />
          </div>
        </div>
        <button onClick={format} disabled={busy} className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-cyan-500 to-purple-600 px-4 py-3 text-sm font-bold text-white disabled:opacity-40">
          {busy ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />} Format & Download
        </button>
        {error && <p role="alert" className="mt-2 text-[12.5px] font-semibold text-red-600 dark:text-red-300">{error}</p>}
        {stats && <p className="mt-2 flex items-center gap-1.5 text-[12.5px] font-semibold text-emerald-600 dark:text-emerald-300"><Download size={13} />{stats}</p>}
      </GlassCard>
    </div>
  );
}
