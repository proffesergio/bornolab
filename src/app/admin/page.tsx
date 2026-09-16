"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard, Wrench, Type, Package, Receipt, Megaphone, Search,
  Sparkles, Wallet, Settings as SettingsIcon, LogOut, Save, Loader2, Check,
} from "lucide-react";
import { GlassCard, SectionTitle } from "@/components/ui";
import { DEFAULT_CONFIG, type SiteConfig, type ToolKey } from "@/lib/site-config";
import { FONTS } from "@/lib/fonts-data";
import { SOFTWARE } from "@/lib/software-data";
import { cn } from "@/lib/cn";

type Tab = "overview" | "tools" | "fonts" | "software" | "orders" | "ads" | "seo" | "aiseo" | "payments" | "settings";

const TABS: { id: Tab; label: string; icon: typeof LayoutDashboard }[] = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "tools", label: "Tools", icon: Wrench },
  { id: "fonts", label: "Fonts", icon: Type },
  { id: "software", label: "Software", icon: Package },
  { id: "orders", label: "Orders", icon: Receipt },
  { id: "ads", label: "Ads", icon: Megaphone },
  { id: "seo", label: "SEO", icon: Search },
  { id: "aiseo", label: "AI SEO", icon: Sparkles },
  { id: "payments", label: "Payments", icon: Wallet },
  { id: "settings", label: "Settings", icon: SettingsIcon },
];

const TOOL_LABELS: Record<ToolKey, string> = {
  convert: "Unicode⇆Bijoy Converter",
  fonts: "Font Directory",
  styler: "Decorator & Styler",
  translate: "PDF⇆DOCX Translator",
  split: "PDF Splitter",
  software: "Software Store",
};

/* ---------- AI SEO helpers (client-side, no API key) ---------- */
const STOP = new Set(("the,a,an,and,or,of,to,in,on,for,with,from,by,as,at,is,are,was,were,be,been,this,that,these,those,it,its,you,your,we,our,they,their,he,she,his,her,not,but,all,can,will,has,have,had,more,most,than,then,there,what,which,who,when,where,how,একটি,এক,এবং,বা,এর,কে,তে,থেকে,দিয়ে,জন্য,সাথে,যে,যা,এই,সেই,টি,টা,গুলো,গুলি,হয়,হচ্ছে,করে,করা,করুন,আছে,ছিল,নয়,না,আর,ও,কি,কী,কেন,কীভাবে,যেমন,তাই,তবে,যদি,সব,অনেক,বেশি,কম,মধ্যে,উপর,নিচে,পরে,আগে,প্রতি".split(",")));

function extractKeywords(text: string, n = 15): { word: string; count: number }[] {
  const freq = new Map<string, number>();
  for (const w of text.toLowerCase().replace(/[।.,!?;:"“”‘’()[\]{}0-9০-৯]/g, " ").split(/\s+/)) {
    if (w.length < 3 || STOP.has(w)) continue;
    freq.set(w, (freq.get(w) ?? 0) + 1);
  }
  return [...freq.entries()].sort((a, b) => b[1] - a[1]).slice(0, n).map(([word, count]) => ({ word, count }));
}

function makeMeta(text: string): string {
  const first = text.replace(/\s+/g, " ").trim().slice(0, 155);
  return first.length < 155 ? first : first.slice(0, 152) + "…";
}

function readability(text: string): { score: number; label: string } {
  const sentences = text.split(/[।.!?]+/).filter((s) => s.trim().length > 0).length || 1;
  const words = text.split(/\s+/).filter(Boolean).length || 1;
  const avg = words / sentences;
  const score = Math.max(0, Math.min(100, Math.round(100 - (avg - 12) * 4)));
  return { score, label: score >= 70 ? "Easy to read" : score >= 45 ? "Medium" : "Hard — shorten sentences" };
}

export default function AdminPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [tab, setTab] = useState<Tab>("overview");
  const [config, setConfig] = useState<SiteConfig>(DEFAULT_CONFIG);
  const [analytics, setAnalytics] = useState<{ totalViews: number; weekViews: number; days: { date: string; views: number }[]; topPages: { path: string; views: number }[] } | null>(null);
  const [orders, setOrders] = useState<Array<{ id: string; at: number; itemName: string; amountBDT: number; method: string; sender: string; txn: string; status: string }>>([]);
  const [saving, setSaving] = useState(false);
  const [savedTick, setSavedTick] = useState(false);

  // AI SEO local state
  const [seoText, setSeoText] = useState("আমার সোনার বাংলা ফন্ট কনভার্টার দিয়ে Bijoy থেকে Unicode এ রূপান্তর করুন। BornoLab offers free Bangla fonts, PDF tools and premium software for creators.");
  const keywords = useMemo(() => extractKeywords(seoText), [seoText]);
  const meta = useMemo(() => makeMeta(seoText), [seoText]);
  const read = useMemo(() => readability(seoText), [seoText]);

  useEffect(() => {
    fetch("/api/admin/me").then(async (r) => {
      if (!r.ok) { router.push("/admin/login"); return; }
      setEmail((await r.json()).email);
    });
    fetch("/api/admin/config").then((r) => r.json()).then((c) => setConfig({ ...DEFAULT_CONFIG, ...c })).catch(() => {});
    fetch("/api/admin/analytics").then((r) => r.json()).then(setAnalytics).catch(() => {});
    fetch("/api/admin/orders").then((r) => r.json()).then((j) => setOrders(j.orders ?? [])).catch(() => {});
  }, [router]);

  const save = async (patch: Partial<SiteConfig>) => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/config", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(patch) });
      const next = await res.json();
      setConfig({ ...DEFAULT_CONFIG, ...next });
      setSavedTick(true);
      setTimeout(() => setSavedTick(false), 1500);
    } finally {
      setSaving(false);
    }
  };

  const logout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
  };

  const setOrderStatus = async (id: string, status: string) => {
    await fetch("/api/admin/orders", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, status }) });
    setOrders((os) => os.map((o) => (o.id === id ? { ...o, status } : o)));
  };

  const maxDay = Math.max(1, ...(analytics?.days.map((d) => d.views) ?? [1]));
  const pendingOrders = orders.filter((o) => o.status === "pending").length;

  const field = "focus-glow w-full rounded-xl bg-slate-100 p-2.5 text-sm outline-none dark:bg-black/30";

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <SectionTitle kicker="Backend" title="Admin Dashboard" desc={email ? `Signed in as ${email} • everything below saves to the live site` : "Loading…"} />
        <button onClick={logout} className="glass hover-glow flex items-center gap-2 rounded-full px-4 py-2 text-[13px] font-bold text-slate-700 dark:text-slate-200">
          <LogOut size={15} /> Logout
        </button>
      </div>

      <div className="mb-4 flex gap-1.5 overflow-x-auto pb-1" role="tablist" aria-label="Admin sections">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button key={id} role="tab" aria-selected={tab === id} onClick={() => setTab(id)}
            className={cn("flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 py-2 text-[12.5px] font-bold",
              tab === id ? "bg-gradient-to-r from-cyan-500 to-purple-600 text-white" : "glass text-slate-700 hover-glow dark:text-slate-300")}>
            <Icon size={14} /> {label}
            {id === "orders" && pendingOrders > 0 && (
              <span className="rounded-full bg-amber-400 px-1.5 text-[10px] font-black text-black">{pendingOrders}</span>
            )}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <div className="grid gap-4 lg:grid-cols-3">
          <GlassCard><p className="text-xs font-bold uppercase tracking-wider text-slate-500">Total views</p><p className="mt-1 text-3xl font-black">{analytics?.totalViews ?? "…"}</p></GlassCard>
          <GlassCard><p className="text-xs font-bold uppercase tracking-wider text-slate-500">Last 7 days</p><p className="mt-1 text-3xl font-black">{analytics?.weekViews ?? "…"}</p></GlassCard>
          <GlassCard><p className="text-xs font-bold uppercase tracking-wider text-slate-500">Pending orders</p><p className="mt-1 text-3xl font-black">{pendingOrders}</p></GlassCard>
          <GlassCard className="lg:col-span-2">
            <h3 className="text-sm font-bold">Traffic — last 14 days</h3>
            <div className="mt-3 flex h-32 items-end gap-1.5" aria-hidden>
              {analytics?.days.map((d) => (
                <div key={d.date} className="flex flex-1 flex-col items-center gap-1" title={`${d.date}: ${d.views}`}>
                  <div className="w-full rounded-t-md bg-gradient-to-t from-cyan-500 to-purple-500" style={{ height: `${Math.max(4, (d.views / maxDay) * 100)}%` }} />
                  <span className="text-[9px] text-slate-500">{d.date.slice(0, 5)}</span>
                </div>
              )) ?? <p className="text-sm text-slate-500">Loading…</p>}
            </div>
          </GlassCard>
          <GlassCard>
            <h3 className="text-sm font-bold">Top pages</h3>
            <ul className="mt-2 space-y-1.5 text-[13px]">
              {(analytics?.topPages ?? []).map((p) => (
                <li key={p.path} className="flex justify-between gap-2"><code className="truncate">{p.path}</code><b>{p.views}</b></li>
              ))}
              {(!analytics || analytics.topPages.length === 0) && <li className="text-slate-500">No traffic yet — browse the site to record views.</li>}
            </ul>
          </GlassCard>
        </div>
      )}

      {tab === "tools" && (
        <GlassCard>
          <h3 className="text-sm font-bold">Module visibility</h3>
          <p className="mt-1 text-[12.5px] text-slate-600 dark:text-slate-400">Disabled tools disappear from the nav + homepage instantly.</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {(Object.keys(TOOL_LABELS) as ToolKey[]).map((k) => (
              <label key={k} className="flex cursor-pointer items-center justify-between gap-2 rounded-xl bg-slate-900/[.04] p-3 dark:bg-white/5">
                <span className="text-[13.5px] font-semibold">{TOOL_LABELS[k]}</span>
                <input type="checkbox" checked={config.tools[k]} onChange={() => save({ tools: { ...config.tools, [k]: !config.tools[k] } })} className="h-5 w-5 accent-cyan-500" />
              </label>
            ))}
          </div>
          {saving ? <p className="mt-2 text-xs text-slate-500"><Loader2 size={12} className="inline animate-spin" /> Saving…</p> : savedTick ? <p className="mt-2 text-xs text-emerald-500"><Check size={12} className="inline" /> Saved</p> : null}
        </GlassCard>
      )}

      {tab === "fonts" && (
        <GlassCard>
          <h3 className="text-sm font-bold">Font catalog overrides</h3>
          <p className="mt-1 text-[12.5px] text-slate-600 dark:text-slate-400">Toggle premium / set ৳ price / hide fonts. Applies on the Fonts page immediately.</p>
          <div className="mt-3 space-y-2">
            {FONTS.map((f) => {
              const ov = config.fontOverrides[f.id] ?? {};
              const premium = ov.premium ?? (f.license === "Paid");
              return (
                <div key={f.id} className="grid items-center gap-2 rounded-xl bg-slate-900/[.04] p-3 text-[13px] sm:grid-cols-[1fr_auto_auto_auto] dark:bg-white/5">
                  <span><b>{f.name}</b> <span className="text-slate-500">• {f.type} • {f.bangla ? "বাংলা" : "English"}</span></span>
                  <label className="flex items-center gap-1.5">Premium <input type="checkbox" checked={premium} onChange={() => save({ fontOverrides: { ...config.fontOverrides, [f.id]: { ...ov, premium: !premium } } })} className="h-4 w-4 accent-purple-500" /></label>
                  <label className="flex items-center gap-1.5">৳ <input type="number" min={0} value={ov.priceBDT ?? f.priceBDT ?? 0} onChange={(e) => save({ fontOverrides: { ...config.fontOverrides, [f.id]: { ...ov, priceBDT: Number(e.target.value) } } })} className={cn(field, "w-24")} /></label>
                  <label className="flex items-center gap-1.5">Visible <input type="checkbox" checked={ov.enabled ?? true} onChange={() => save({ fontOverrides: { ...config.fontOverrides, [f.id]: { ...ov, enabled: !(ov.enabled ?? true) } } })} className="h-4 w-4 accent-cyan-500" /></label>
                </div>
              );
            })}
          </div>
        </GlassCard>
      )}

      {tab === "software" && (
        <GlassCard>
          <h3 className="text-sm font-bold">Software store overrides</h3>
          <p className="mt-1 text-[12.5px] text-slate-600 dark:text-slate-400">Set ৳ prices (0 = Free) or hide items from the Software page.</p>
          <div className="mt-3 space-y-2">
            {SOFTWARE.map((s) => {
              const ov = config.softwareOverrides[s.id] ?? {};
              return (
                <div key={s.id} className="grid items-center gap-2 rounded-xl bg-slate-900/[.04] p-3 text-[13px] sm:grid-cols-[1fr_auto_auto] dark:bg-white/5">
                  <span><b>{s.name}</b> <span className="text-slate-500">• {s.platform} • v{s.version}</span></span>
                  <label className="flex items-center gap-1.5">৳ <input type="number" min={0} value={ov.priceBDT ?? s.priceBDT} onChange={(e) => save({ softwareOverrides: { ...config.softwareOverrides, [s.id]: { ...ov, priceBDT: Number(e.target.value) } } })} className={cn(field, "w-24")} /></label>
                  <label className="flex items-center gap-1.5">Visible <input type="checkbox" checked={ov.enabled ?? true} onChange={() => save({ softwareOverrides: { ...config.softwareOverrides, [s.id]: { ...ov, enabled: !(ov.enabled ?? true) } } })} className="h-4 w-4 accent-cyan-500" /></label>
                </div>
              );
            })}
          </div>
        </GlassCard>
      )}

      {tab === "orders" && (
        <GlassCard>
          <h3 className="text-sm font-bold">Manual-payment orders ({orders.length})</h3>
          <div className="mt-3 space-y-2">
            {orders.map((o) => (
              <div key={o.id} className="grid gap-1 rounded-xl bg-slate-900/[.04] p-3 text-[13px] sm:grid-cols-[auto_1fr_auto] sm:items-center dark:bg-white/5">
                <span className="font-mono font-black">{o.id}</span>
                <span>{o.itemName} • ৳{o.amountBDT} • {o.method} • from <code>{o.sender}</code>{o.txn && <> • txn <code>{o.txn}</code></>} • {new Date(o.at).toLocaleString()}</span>
                <select aria-label={`Status for ${o.id}`} value={o.status} onChange={(e) => setOrderStatus(o.id, e.target.value)} className={cn(field, "sm:w-36")}>
                  {["pending", "paid", "delivered", "cancelled"].map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            ))}
            {orders.length === 0 && <p className="text-[13px] text-slate-500">No orders yet.</p>}
          </div>
        </GlassCard>
      )}

      {tab === "ads" && (
        <div className="grid gap-4">
          {(["header", "inFeed", "footer"] as const).map((slot) => (
            <GlassCard key={slot}>
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold capitalize">{slot} ad slot</h3>
                <label className="flex items-center gap-2 text-[13px] font-semibold">Enabled
                  <input type="checkbox" checked={config.ads[slot].enabled} onChange={() => save({ ads: { ...config.ads, [slot]: { ...config.ads[slot], enabled: !config.ads[slot].enabled } } })} className="h-5 w-5 accent-cyan-500" />
                </label>
              </div>
              <div className="mt-2 grid gap-2 sm:grid-cols-[200px_1fr]">
                <input aria-label={`${slot} network`} value={config.ads[slot].network} onChange={(e) => save({ ads: { ...config.ads, [slot]: { ...config.ads[slot], network: e.target.value } } })} className={field} placeholder="AdSense" />
                <textarea aria-label={`${slot} code`} rows={3} value={config.ads[slot].code} onChange={(e) => save({ ads: { ...config.ads, [slot]: { ...config.ads[slot], code: e.target.value } } })} className={cn(field, "font-mono")} placeholder='<ins class="adsbygoogle" ...></ins>' />
              </div>
            </GlassCard>
          ))}
        </div>
      )}

      {tab === "seo" && (
        <GlassCard>
          <h3 className="text-sm font-bold">SEO & analytics integrations</h3>
          <div className="mt-3 grid gap-3">
            {(["title", "description", "keywords", "gaId", "adsenseClient"] as const).map((k) => (
              <div key={k}>
                <label htmlFor={`seo-${k}`} className="text-xs font-bold">{k === "gaId" ? "Google Analytics ID (G-…)" : k === "adsenseClient" ? "AdSense client (ca-pub-…)" : k}</label>
                {k === "description" ? (
                  <textarea id={`seo-${k}`} rows={2} value={config.seo[k]} onChange={(e) => save({ seo: { ...config.seo, [k]: e.target.value } })} className={cn(field, "mt-1")} />
                ) : (
                  <input id={`seo-${k}`} value={config.seo[k]} onChange={(e) => save({ seo: { ...config.seo, [k]: e.target.value } })} className={cn(field, "mt-1")} />
                )}
              </div>
            ))}
            <p className="text-[12px] text-slate-500">GA script + AdSense meta auto-inject on every page once saved. {saving ? "Saving…" : savedTick ? "✓ Saved" : ""}</p>
          </div>
        </GlassCard>
      )}

      {tab === "aiseo" && (
        <div className="grid gap-4 lg:grid-cols-2">
          <GlassCard>
            <h3 className="flex items-center gap-1.5 text-sm font-bold"><Sparkles size={15} className="text-purple-500" /> Content analyzer</h3>
            <textarea aria-label="Content to analyze" rows={8} value={seoText} onChange={(e) => setSeoText(e.target.value)} className={cn(field, "mt-2")} />
            <p className="mt-2 text-[12.5px]">Readability: <b>{read.score}/100</b> — {read.label}</p>
          </GlassCard>
          <GlassCard>
            <h3 className="text-sm font-bold">Keyword suggestions</h3>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {keywords.map((k) => <span key={k.word} className="rounded-full bg-cyan-500/15 px-2.5 py-1 text-[12px] font-semibold text-cyan-700 dark:text-cyan-200">{k.word} ×{k.count}</span>)}
            </div>
            <h3 className="mt-4 text-sm font-bold">Meta description ({meta.length}/160)</h3>
            <p className="mt-1 rounded-xl bg-slate-900/[.04] p-3 text-[13px] dark:bg-white/5">{meta}</p>
            <p className="mt-2 text-[12px] text-slate-500">Tip: paste these into the SEO tab ↑. Fully offline — Bangla + English stopwords filtered.</p>
          </GlassCard>
        </div>
      )}

      {tab === "payments" && (
        <GlassCard>
          <h3 className="text-sm font-bold">Merchant accounts (shown at checkout)</h3>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {(["bkash", "nagad", "bank", "binance"] as const).map((m) => (
              <div key={m}>
                <label htmlFor={`pay-${m}`} className="text-xs font-bold capitalize">{m === "binance" ? "Binance Pay ID / UID" : m === "bank" ? "Bank account" : `${m} number`}</label>
                <input id={`pay-${m}`} value={config.payments[m]} onChange={(e) => save({ payments: { ...config.payments, [m]: e.target.value } })} className={cn(field, "mt-1 font-mono")} />
              </div>
            ))}
          </div>
        </GlassCard>
      )}

      {tab === "settings" && (
        <GlassCard>
          <h3 className="text-sm font-bold">Brand & customization</h3>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="brand-name" className="text-xs font-bold">Brand name</label>
              <input id="brand-name" value={config.brand.name} onChange={(e) => save({ brand: { ...config.brand, name: e.target.value } })} className={cn(field, "mt-1")} />
            </div>
            <div>
              <label htmlFor="brand-tag" className="text-xs font-bold">Tagline</label>
              <input id="brand-tag" value={config.brand.tagline} onChange={(e) => save({ brand: { ...config.brand, tagline: e.target.value } })} className={cn(field, "mt-1")} />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <input id="ann-on" type="checkbox" checked={config.announcement.enabled} onChange={() => save({ announcement: { ...config.announcement, enabled: !config.announcement.enabled } })} className="h-5 w-5 accent-cyan-500" />
            <label htmlFor="ann-on" className="text-[13px] font-bold">Show announcement bar</label>
          </div>
          <input aria-label="Announcement text" value={config.announcement.text} onChange={(e) => save({ announcement: { ...config.announcement, text: e.target.value } })} className={cn(field, "mt-2")} />
          <p className="mt-3 flex items-center gap-1.5 text-[12px] text-slate-500"><Save size={12} /> All changes save instantly to the live site. {saving ? "Saving…" : savedTick ? "✓ Saved" : ""}</p>
        </GlassCard>
      )}
    </div>
  );
}
