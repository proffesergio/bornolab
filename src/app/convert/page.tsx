"use client";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, ArrowLeft, ArrowLeftRight, Copy, Eraser, Check, Download, Eye, Upload, FileDown } from "lucide-react";
import { GlassCard, SectionTitle } from "@/components/ui";
import { unicodeToBijoy, bijoyToUnicode, detectScript } from "@/lib/bijoy";
import { cn } from "@/lib/cn";

type Dir = "u2b" | "b2u";

/** Why Bijoy looks like Latin: Bijoy/ANSI fonts remap Latin slots to Bangla glyphs.
 *  The browser can only render it as Bangla if SutonnyMJ (or compatible) is installed.
 *  We detect that and offer a live Unicode "ghost preview" as the fix. */
function useBijoyFontAvailable(): boolean | null {
  const [ok, setOk] = useState<boolean | null>(null);
  // External system sync (FontFaceSet availability) — setState-in-effect is intended here
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    try {
      const fonts = (document as Document & { fonts?: FontFaceSet }).fonts;
      setOk(typeof fonts?.check === "function" ? fonts.check('16px "SutonnyMJ"') : false);
    } catch {
      setOk(false);
    }
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */
  return ok;
}

export default function ConvertPage() {
  const [left, setLeft] = useState("আমার সোনার বাংলা, আমি তোমায় ভালোবাসি\nকি কে কো কর্ম ১২৩");
  const [right, setRight] = useState("");
  const [dir, setDir] = useState<Dir>("u2b");
  const [active, setActive] = useState<"left" | "right" | null>(null);
  const [copied, setCopied] = useState<"left" | "right" | null>(null);
  const [showGhost, setShowGhost] = useState(true);
  const bijoyFont = useBijoyFontAvailable();

  const leftScript = useMemo(() => detectScript(left), [left]);
  const rightScript = useMemo(() => detectScript(right), [right]);
  const ghostPreview = useMemo(() => (right ? bijoyToUnicode(right) : ""), [right]);

  const onLeft = (v: string) => {
    setLeft(v); setActive("left");
    if (dir === "u2b") setRight(unicodeToBijoy(v));
  };
  const onRight = (v: string) => {
    setRight(v); setActive("right");
    if (dir === "b2u") setLeft(bijoyToUnicode(v));
  };
  const toBijoy = () => {
    setDir("u2b");
    setRight(unicodeToBijoy(left));
    setActive("right");
  };
  const toUnicode = () => {
    if (!right) return;
    setDir("b2u");
    setLeft(bijoyToUnicode(right));
    setActive("left");
  };
  /** Swap direction, keeping content: the output pane becomes the new source. */
  const swap = () => {
    if (dir === "u2b") {
      setDir("b2u");
      if (right) setLeft(bijoyToUnicode(right));
    } else {
      setDir("u2b");
      if (left) setRight(unicodeToBijoy(left));
    }
  };
  const downloadTxt = (which: "left" | "right") => {
    const text = which === "left" ? left : right;
    if (!text) return;
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = which === "left" ? "bornolab-unicode.txt" : "bornolab-bijoy.txt";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  };
  const uploadTxt = async (f: File | undefined) => {
    if (!f) return;
    const text = await f.text();
    if (dir === "u2b") onLeft(text);
    else onRight(text);
  };
  const [batchBusy, setBatchBusy] = useState(false);
  const [batchMsg, setBatchMsg] = useState<string | null>(null);
  /** Batch: convert whole .docx files (paragraph-preserving) and download one combined .docx. */
  const batchDocx = async (files: FileList | null) => {
    if (!files?.length) return;
    setBatchBusy(true);
    setBatchMsg(null);
    try {
      const { Document, Packer, Paragraph, HeadingLevel, TextRun } = await import("docx");
      const mammoth = (await import("mammoth")).default as unknown as {
        extractRawText: (opts: { arrayBuffer: ArrayBuffer }) => Promise<{ value: string }>;
      };
      const children: import("docx").Paragraph[] = [];
      for (const f of [...files].filter((x) => x.name.toLowerCase().endsWith(".docx"))) {
        const { value } = await mammoth.extractRawText({ arrayBuffer: await f.arrayBuffer() });
        children.push(new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun(f.name)] }));
        for (const line of value.split("\n")) {
          const t = line.trim();
          const out = dir === "u2b" ? unicodeToBijoy(t) : bijoyToUnicode(t);
          children.push(new Paragraph({ children: [new TextRun({ text: out || " ", size: 24 })] }));
        }
        children.push(new Paragraph({ text: "" }));
      }
      if (!children.length) { setBatchMsg("No .docx files found in the selection."); return; }
      const blob = await Packer.toBlob(new Document({ sections: [{ children }] }));
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = dir === "u2b" ? "bornolab-batch-unicode-to-bijoy.docx" : "bornolab-batch-bijoy-to-unicode.docx";
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 4000);
      setBatchMsg(`Converted ${[...files].length} file(s) — formatting is simplified to paragraphs; run-level fonts are not preserved.`);
    } catch (e) {
      setBatchMsg(`Batch failed: ${(e as Error).message}`);
    } finally {
      setBatchBusy(false);
    }
  };
  const copy = async (which: "left" | "right") => {
    await navigator.clipboard.writeText(which === "left" ? left : right);
    setCopied(which);
    setTimeout(() => setCopied(null), 1400);
  };

  // init right once (effect — never setState inside useMemo)
  useEffect(() => { if (!right && left) setRight(unicodeToBijoy(left)); }, []); // eslint-disable-line

  const cornerBtn = "hover-glow rounded-full bg-white/80 p-2 text-slate-700 shadow-md backdrop-blur dark:bg-black/50 dark:text-slate-200";

  return (
    <div>
      <SectionTitle kicker="Module 01" title="Unicode ⇆ Bijoy Converter" desc="Pick a direction button — conversion runs instantly. Side-by-side on desktop, stacked on mobile." />

      {/* Two explicit convert actions with animated icons */}
      <div className="glass mb-4 flex flex-col items-stretch justify-center gap-2.5 rounded-2xl p-3 sm:flex-row sm:items-center">
        <motion.button
          onClick={toBijoy} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
          className={cn("flex flex-1 items-center justify-center gap-2 rounded-2xl px-5 py-3.5 text-sm font-black text-white shadow-lg",
            dir === "u2b" ? "bg-gradient-to-r from-cyan-500 to-sky-600 shadow-cyan-500/30" : "bg-gradient-to-r from-cyan-600/70 to-sky-700/70")}
        >
          Unicode to Bijoy
          <motion.span animate={{ x: [0, 5, 0] }} transition={{ repeat: Infinity, duration: 1.4, ease: "easeInOut" }} className="inline-flex">
            <ArrowRight size={17} strokeWidth={2.75} />
          </motion.span>
        </motion.button>
        <motion.button
          onClick={toUnicode} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
          className={cn("flex flex-1 items-center justify-center gap-2 rounded-2xl px-5 py-3.5 text-sm font-black text-white shadow-lg",
            dir === "b2u" ? "bg-gradient-to-r from-purple-500 to-fuchsia-600 shadow-purple-500/30" : "bg-gradient-to-r from-purple-600/70 to-fuchsia-700/70")}
        >
          <motion.span animate={{ x: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 1.4, ease: "easeInOut" }} className="inline-flex">
            <ArrowLeft size={17} strokeWidth={2.75} />
          </motion.span>
          Bijoy to Unicode
        </motion.button>
        <motion.button
          onClick={swap} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
          aria-label="Swap direction"
          title="Swap direction (output becomes the new source)"
          className="glass hover-glow flex items-center justify-center gap-2 self-center rounded-full px-4 py-3 text-[13px] font-black text-slate-700 dark:text-slate-200"
        >
          <ArrowLeftRight size={16} /> Swap
        </motion.button>
        <span className="self-center whitespace-nowrap text-[11px] text-slate-500">L: {leftScript} • R: {rightScript}</span>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Unicode pane */}
        <GlassCard className={cn(active === "left" && "glow-border-active-unicode")}>
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-bold">Unicode <span className="font-normal text-slate-500">— web, mobile, database</span></h2>
            <button onClick={() => { setLeft(""); if (dir === "u2b") setRight(""); }} aria-label="Clear Unicode" className="glass hover-glow flex items-center gap-1 rounded-full px-3 py-1.5 text-[12px] font-bold text-slate-600 dark:text-slate-300"><Eraser size={13} /> Clear</button>
          </div>
          <div className="relative">
            <motion.textarea
              value={left}
              onChange={(e) => onLeft(e.target.value)}
              rows={10}
              spellCheck={false}
              placeholder="এখানে ইউনিকোড লিখুন…"
              className="focus-glow min-h-[280px] w-full resize-y rounded-xl bg-slate-100 p-4 pr-12 text-[16px] leading-8 outline-none dark:bg-black/30"
              style={{ fontFamily: '"Noto Sans Bengali","Hind Siliguri",sans-serif' }}
            />
            <button onClick={() => copy("left")} aria-label="Copy Unicode text"
              className={cn(cornerBtn, "absolute right-2.5 top-2.5")}>
              {copied === "left" ? <Check size={15} className="text-emerald-500" /> : <Copy size={15} />}
            </button>
          </div>
          <p className="mt-2 text-[11px] text-slate-500">{left.length} chars • কার, য-ফলা, রেফ preserved</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <label className="glass hover-glow flex cursor-pointer items-center gap-1 rounded-full px-3 py-1.5 text-[12px] font-bold">
              <Upload size={13} /> Open .txt
              <input type="file" accept=".txt,text/plain" className="hidden" onChange={(e) => { void uploadTxt(e.target.files?.[0]); e.target.value = ""; }} />
            </label>
            <button onClick={() => downloadTxt("left")} disabled={!left} className="glass hover-glow flex items-center gap-1 rounded-full px-3 py-1.5 text-[12px] font-bold disabled:opacity-40"><FileDown size={13} /> Save .txt</button>
          </div>
        </GlassCard>

        {/* Bijoy pane */}
        <GlassCard className={cn(active === "right" && "glow-border-active-bijoy")}>
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-bold">Bijoy (ANSI) <span className="font-normal text-slate-500">— SutonnyMJ, print & DTP</span></h2>
            <button onClick={() => { setRight(""); if (dir === "b2u") setLeft(""); }} aria-label="Clear Bijoy" className="glass hover-glow flex items-center gap-1 rounded-full px-3 py-1.5 text-[12px] font-bold text-slate-600 dark:text-slate-300"><Eraser size={13} /> Clear</button>
          </div>

          {bijoyFont === false && (
            <div className="mb-2.5 flex gap-2.5 rounded-xl border border-amber-400/40 bg-amber-400/10 p-3 text-[12.5px] leading-5">
              <Download size={18} className="mt-0.5 shrink-0 text-amber-500" />
              <p className="text-slate-700 dark:text-slate-300">
                <b>Why does Bijoy look like English letters?</b> Bijoy reuses Latin slots for Bangla glyphs, so it only renders as বাংলা with the{" "}
                <b>SutonnyMJ</b> font installed. <a className="font-bold text-cyan-600 underline dark:text-cyan-300" href="https://www.bijoyekushe.net" target="_blank" rel="noreferrer">Install SutonnyMJ</a>,
                or keep the live Bangla preview below ON — it auto-converts for reading.
              </p>
            </div>
          )}

          <div className="relative">
            <motion.textarea
              value={right}
              onChange={(e) => onRight(e.target.value)}
              rows={10}
              spellCheck={false}
              placeholder="Avwg m¤bvi evsjv…"
              className="focus-glow min-h-[280px] w-full resize-y rounded-xl bg-slate-100 p-4 pr-12 font-mono text-[16px] leading-8 outline-none dark:bg-black/30"
              style={{ fontFamily: '"SutonnyMJ","Boishakhi",ui-monospace,monospace' }}
            />
            <button onClick={() => copy("right")} aria-label="Copy Bijoy text"
              className={cn(cornerBtn, "absolute right-2.5 top-2.5")}>
              {copied === "right" ? <Check size={15} className="text-emerald-500" /> : <Copy size={15} />}
            </button>
          </div>

          {bijoyFont === false && showGhost && (
            <div className="mt-2.5 rounded-xl border border-cyan-400/30 bg-cyan-400/[.07] p-3">
              <p className="mb-1 flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-cyan-700 dark:text-cyan-300">
                <Eye size={12} /> Live Bangla preview (auto Unicode)
              </p>
              <p className="max-h-28 overflow-y-auto text-[16px] leading-7" style={{ fontFamily: '"Noto Sans Bengali","Hind Siliguri",sans-serif' }}>
                {ghostPreview || <span className="text-slate-500">—</span>}
              </p>
            </div>
          )}
          {bijoyFont === false && (
            <button onClick={() => setShowGhost((v) => !v)} className="mt-2 text-[12px] font-bold text-cyan-700 underline dark:text-cyan-300">
              {showGhost ? "Hide" : "Show"} live Bangla preview
            </button>
          )}
          <p className="mt-2 text-[11px] text-slate-500">{right.length} chars • paste into Word + set SutonnyMJ to print</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <button onClick={() => downloadTxt("right")} disabled={!right} className="glass hover-glow flex items-center gap-1 rounded-full px-3 py-1.5 text-[12px] font-bold disabled:opacity-40"><FileDown size={13} /> Save .txt</button>
          </div>
        </GlassCard>
      </div>

      <GlassCard className="mt-4">
        <h3 className="text-sm font-bold">Batch convert .docx files</h3>
        <p className="mt-1 text-[12.5px] text-slate-600 dark:text-slate-400">
          Converts every paragraph in the current direction ({dir === "u2b" ? "Unicode → Bijoy" : "Bijoy → Unicode"}) and downloads one combined .docx.
        </p>
        <label className="mt-2 flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-purple-500/50 p-4 text-sm hover:bg-purple-500/5">
          <Upload size={16} className="text-purple-600 dark:text-purple-300" />
          <span>{batchBusy ? "Converting…" : "Drop / click to choose .docx files (multiple allowed)"}</span>
          <input type="file" accept=".docx" multiple className="hidden" onChange={(e) => { void batchDocx(e.target.files); e.target.value = ""; }} />
        </label>
        {batchMsg && <p role="status" className="mt-2 text-[12.5px] text-slate-600 dark:text-slate-400">{batchMsg}</p>}
      </GlassCard>

      <GlassCard className="mt-4">
        <h3 className="text-sm font-bold text-cyan-700 dark:text-cyan-200">Engine notes</h3>
        <ul className="mt-1.5 list-disc pl-5 text-[12.5px] leading-6 text-slate-600 dark:text-slate-400">
          <li>Pre-kars (ি ে ৈ) reordered to visual order (<code>কি → wK</code>, <code>কে → †K</code>); <code>ো → ে+া</code>, <code>ৌ → ৈ+া</code> split then recombined.</li>
          <li>Reph (<code>র্+C → ©C</code>), ya-fala (<code>C+্য → C¨</code>), hasanta (<code>্ → &</code>), ligature <code>ক্ষ → ÿ</code>.</li>
          <li>English/URLs/numbers pass through byte-for-byte; greedy reverse tokenizer keeps it reversible.</li>
        </ul>
      </GlassCard>
    </div>
  );
}
