"use client";
import { useMemo, useState } from "react";
import { Copy, Check } from "lucide-react";
import { GlassCard, SectionTitle } from "@/components/ui";
import { getVariants } from "@/lib/styler";

export default function StylerPage() {
  const [text, setText] = useState("ভালোবাসা BornoLab ১২৩");
  const [copied, setCopied] = useState<string | null>(null);
  const variants = useMemo(() => getVariants(), []);

  const copy = async (id: string, value: string) => {
    await navigator.clipboard.writeText(value);
    setCopied(id);
    setTimeout(() => setCopied(null), 1200);
  };

  return (
    <div>
      <SectionTitle kicker="Module 03" title="Font Decorator & Design Styler" desc="Type once → get outline, neon, gradient, glitch + bracket/symbol frames and math transforms. One-click copy per line." />
      <GlassCard>
        <label htmlFor="style-input" className="text-xs font-bold">Your text (Bangla + English)</label>
        <input
          id="style-input"
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="focus-glow mt-1.5 w-full rounded-xl bg-slate-100 p-3.5 text-lg outline-none dark:bg-black/30"
          placeholder="Type here…"
        />
      </GlassCard>
      <div className="mt-4 grid gap-3">
        {variants.map((v) => {
          const out = v.transform(text || "…");
          // Neon/outline/glow styles are designed for dark — render on a dark chip in light mode
          const needsDark = ["outline", "neon", "gradient", "glitch", "shadow-pop"].includes(v.id);
          return (
            <div key={v.id} className="glass hover-glow flex items-center gap-3 rounded-2xl p-4 transition">
              <span className="hidden w-28 shrink-0 rounded-full bg-slate-900/5 px-2.5 py-1 text-center text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:bg-white/5 dark:text-slate-400 sm:block">{v.label}</span>
              <p className={needsDark ? "min-w-0 flex-1 break-words rounded-xl bg-slate-900 px-3 py-2 text-[17px] dark:bg-transparent dark:p-0" : "min-w-0 flex-1 break-words text-[17px] text-slate-900 dark:text-slate-100"} style={v.css}>{out}</p>
              <span className="hidden rounded bg-cyan-500/15 px-1.5 py-0.5 text-[10px] font-bold text-cyan-700 md:inline dark:text-cyan-200">{v.badge}</span>
              <button onClick={() => copy(v.id, out)} aria-label={`Copy ${v.label}`} className="glass hover-glow shrink-0 rounded-full p-2.5">
                {copied === v.id ? <Check size={15} className="text-emerald-500" /> : <Copy size={15} />}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
