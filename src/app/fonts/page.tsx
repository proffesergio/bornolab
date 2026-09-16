"use client";
import { useEffect, useMemo, useState } from "react";
import { Download, Copy, Check, Search, Crown, ShoppingCart } from "lucide-react";
import { GlassCard, SectionTitle } from "@/components/ui";
import { FONTS, DEFAULT_PREVIEW_TEXT, previewFamily, applyFontOverrides, type FontType, type FontCategory } from "@/lib/fonts-data";
import { DEFAULT_CONFIG } from "@/lib/site-config";
import { CheckoutModal } from "@/components/checkout-modal";
import { downloadBlob } from "@/lib/doc-utils";
import { cn } from "@/lib/cn";

const TYPES: ("All" | FontType)[] = ["All", "Unicode", "ANSI", "Dual"];
const CATS: ("All" | FontCategory)[] = ["All", "Serif", "Sans-Serif", "Display", "Stylized"];
const LANGS = ["All", "Bangla", "English"] as const;
type Lang = (typeof LANGS)[number];

type Font = ReturnType<typeof applyFontOverrides>[number];

export default function FontsPage() {
  const [q, setQ] = useState(DEFAULT_PREVIEW_TEXT);
  const [size, setSize] = useState(24);
  const [type, setType] = useState<(typeof TYPES)[number]>("All");
  const [cat, setCat] = useState<(typeof CATS)[number]>("All");
  const [lang, setLang] = useState<Lang>("All");
  const [copied, setCopied] = useState<string | null>(null);
  const [buy, setBuy] = useState<{ id: string; name: string; price: number } | null>(null);
  const [overrides, setOverrides] = useState<Record<string, { premium?: boolean; priceBDT?: number; enabled?: boolean }>>({});

  useEffect(() => {
    fetch("/api/site-config").then((r) => r.json()).then((c) => {
      setOverrides(c?.fontOverrides ?? {});
    }).catch(() => {});
  }, []);

  const catalog = useMemo(
    () => applyFontOverrides(FONTS, overrides ?? DEFAULT_CONFIG.fontOverrides).filter((f) => f.enabled),
    [overrides]
  );

  const list = useMemo(
    () => catalog.filter((f) =>
      (type === "All" || f.type === type) &&
      (cat === "All" || f.category === cat) &&
      (lang === "All" || (lang === "Bangla" ? f.bangla : !f.bangla))
    ),
    [catalog, type, cat, lang]
  );
  const premium = list.filter((f) => f.premium);
  const freeBangla = list.filter((f) => !f.premium && f.bangla);
  const freeGeneral = list.filter((f) => !f.premium && !f.bangla);

  const download = async (f: Font) => {
    if (f.premium) { setBuy({ id: f.id, name: f.name, price: f.priceBDT ?? 0 }); return; }
    if (!f.fileUrl || f.fileUrl === "#") {
      if (f.fallbackUrl && f.fallbackUrl !== "#") window.open(f.fallbackUrl, "_blank", "noopener");
      return;
    }
    try {
      const res = await fetch(f.fileUrl);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      downloadBlob(await res.blob(), `${f.name}.ttf`);
    } catch {
      const a = document.createElement("a");
      a.href = `/api/fonts?url=${encodeURIComponent(f.fileUrl)}&name=${encodeURIComponent(f.name)}`;
      a.download = `${f.name}.ttf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      if (f.fallbackUrl && f.fallbackUrl !== "#") setTimeout(() => window.open(f.fallbackUrl, "_blank", "noopener"), 2500);
    }
  };

  const Card = ({ f }: { f: Font }) => (
    <GlassCard className={cn(f.bangla && !f.premium && "ring-1 ring-cyan-400/30", f.premium && "ring-1 ring-amber-400/50 shadow-[0_0_30px_rgba(251,191,36,.15)]")}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="font-extrabold leading-tight">
            {f.name}{" "}
            {f.premium
              ? <span className="ml-1 inline-flex items-center gap-0.5 rounded-full bg-amber-400/20 px-2 py-0.5 text-[10px] text-amber-600 dark:text-amber-300"><Crown size={10} /> PREMIUM ৳{f.priceBDT}</span>
              : f.bangla && <span className="ml-1 rounded-full bg-cyan-500/15 px-2 py-0.5 text-[10px] text-cyan-700 dark:text-cyan-200">বাংলা</span>}
          </h3>
          <p className="mt-0.5 text-[11px] text-slate-500">{f.designer} • {f.license} • {f.type} • {f.category}</p>
        </div>
        <span className={cn("shrink-0 rounded-full px-2 py-1 text-[10px] font-bold", f.type === "Unicode" ? "bg-cyan-500/15 text-cyan-700 dark:text-cyan-200" : f.type === "ANSI" ? "bg-purple-500/15 text-purple-700 dark:text-purple-200" : "bg-emerald-500/15 text-emerald-700 dark:text-emerald-200")}>{f.type}</span>
      </div>
      <p style={{ fontSize: size, fontFamily: previewFamily(f.id) }} className="mt-3 min-h-[3.2rem] break-words leading-snug text-slate-900 dark:text-slate-100">{q || DEFAULT_PREVIEW_TEXT}</p>
      <div className="mt-3 flex gap-2">
        {f.premium ? (
          <button onClick={() => download(f)} className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-600 px-3 py-2 text-[12px] font-bold text-white hover:brightness-110">
            <ShoppingCart size={14} /> Buy ৳{f.priceBDT}
          </button>
        ) : (
          <button onClick={() => download(f)} className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-gradient-to-r from-cyan-500 to-purple-600 px-3 py-2 text-[12px] font-bold text-white hover:brightness-110">
            <Download size={14} /> Download
          </button>
        )}
        <button
          onClick={async () => { await navigator.clipboard.writeText(q); setCopied(f.id); setTimeout(() => setCopied(null), 1200); }}
          aria-label={`Copy preview for ${f.name}`}
          className="glass hover-glow rounded-full p-2.5"
        >{copied === f.id ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}</button>
      </div>
    </GlassCard>
  );

  const selectCls = "focus-glow rounded-full bg-slate-100 px-3.5 py-2 text-[12.5px] font-bold outline-none dark:bg-black/30";

  return (
    <div>
      <SectionTitle kicker="Module 02" title="Font Directory" desc="Live preview + size slider on every card. Filter by language, encoding and category. Premium faces unlock via bKash / Nagad / Bank / Binance." />

      <GlassCard className="mb-4">
        <label htmlFor="font-preview" className="text-xs font-bold">Universal test phrase</label>
        <div className="relative mt-1.5">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input id="font-preview" value={q} onChange={(e) => setQ(e.target.value)} className="focus-glow w-full rounded-xl bg-slate-100 py-2.5 pl-9 pr-3 text-[15px] outline-none dark:bg-black/30" placeholder="Type Bangla/English to preview…" />
        </div>
        <div className="mt-3 flex items-center gap-3">
          <label htmlFor="font-size" className="whitespace-nowrap text-xs text-slate-600 dark:text-slate-400">Size <b className="text-slate-900 dark:text-slate-200">{size}px</b></label>
          <input id="font-size" type="range" min={14} max={56} value={size} onChange={(e) => setSize(+e.target.value)} className="flex-1 accent-cyan-500" />
          <label htmlFor="lang-select" className="sr-only">Language</label>
          <select id="lang-select" value={lang} onChange={(e) => setLang(e.target.value as Lang)} className={selectCls} aria-label="Language filter">
            {LANGS.map((l) => (
              <option key={l} value={l}>{l === "All" ? "🌐 All languages" : l === "Bangla" ? "বাং Bangla" : "EN English"}</option>
            ))}
          </select>
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5" role="group" aria-label="Type filter">
          {TYPES.map((t) => (
            <button key={t} onClick={() => setType(t)} className={cn("rounded-full px-3 py-1.5 text-[12px] font-bold", type === t ? "bg-gradient-to-r from-cyan-500 to-purple-600 text-white" : "glass text-slate-700 hover-glow dark:text-slate-300")}>{t}</button>
          ))}
          <span className="mx-1 w-px bg-slate-300 dark:bg-white/10" />
          {CATS.map((c) => (
            <button key={c} onClick={() => setCat(c)} className={cn("rounded-full px-3 py-1.5 text-[12px] font-bold", cat === c ? "bg-slate-900 text-white dark:bg-white dark:text-black" : "glass text-slate-700 hover-glow dark:text-slate-300")}>{c}</button>
          ))}
        </div>
      </GlassCard>

      {premium.length > 0 && (
        <>
          <h2 className="mb-2 flex items-center gap-1.5 text-sm font-extrabold uppercase tracking-widest text-amber-600 dark:text-amber-300"><Crown size={15} /> Premium Fonts ({premium.length})</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {premium.map((f) => <Card key={f.id} f={f} />)}
          </div>
        </>
      )}

      {freeBangla.length > 0 && (
        <>
          <h2 className="mb-2 mt-6 text-sm font-extrabold uppercase tracking-widest text-cyan-700 dark:text-cyan-300">বাংলা Free Zone ({freeBangla.length})</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {freeBangla.map((f) => <Card key={f.id} f={f} />)}
          </div>
        </>
      )}
      {freeGeneral.length > 0 && (
        <>
          <h2 className="mb-2 mt-6 text-sm font-extrabold uppercase tracking-widest text-slate-500">English / General ({freeGeneral.length})</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {freeGeneral.map((f) => <Card key={f.id} f={f} />)}
          </div>
        </>
      )}
      {list.length === 0 && <GlassCard><p className="text-sm text-slate-500">No fonts match these filters.</p></GlassCard>}
      {buy && <CheckoutModal open onClose={() => setBuy(null)} itemType="font" itemId={buy.id} itemName={buy.name} amountBDT={buy.price} />}
    </div>
  );
}
