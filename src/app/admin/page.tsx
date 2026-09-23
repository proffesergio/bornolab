"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard, Wrench, Receipt, Megaphone, Search,
  Sparkles, Wallet, Settings as SettingsIcon, LogOut, Save, Loader2, Check, FileText,
  Users, CreditCard, ShieldCheck, ClipboardList, KeyRound, Menu, X, Building2, Layers,
} from "lucide-react";
import { GlassCard, SectionTitle } from "@/components/ui";
import { DEFAULT_CONFIG, pdfCaps, type PdfOp, type PdfToolKey, type SiteConfig, type ToolKey } from "@/lib/site-config-shared";
import { PERMISSIONS, type AdUnit, type AuditEntry, type MemberUser, type PlanDef, type RoleDef } from "@/lib/members-shared";
import { FONTS, type BanglaFont, type FontCategory, type FontType } from "@/lib/fonts-data";
import { SOFTWARE, type Software } from "@/lib/software-data";
import { cn } from "@/lib/cn";

type Section =
  | "dashboard" | "users" | "subscriptions"
  | "tools" | "pdftools" | "catalog"
  | "orders" | "ads" | "payments" | "seo" | "aiseo"
  | "roles" | "plans" | "audit" | "access" | "settings";

const GROUPS: { title: string; items: { id: Section; label: string; icon: typeof LayoutDashboard }[] }[] = [
  {
    title: "Manage",
    items: [
      { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
      { id: "users", label: "Customers", icon: Users },
      { id: "subscriptions", label: "Subscriptions", icon: CreditCard },
    ],
  },
  {
    title: "Tools",
    items: [
      { id: "tools", label: "Site Tools", icon: Wrench },
      { id: "pdftools", label: "PDF Tools", icon: FileText },
      { id: "catalog", label: "Catalog", icon: Layers },
    ],
  },
  {
    title: "Grow",
    items: [
      { id: "orders", label: "Orders", icon: Receipt },
      { id: "ads", label: "Ads", icon: Megaphone },
      { id: "payments", label: "Payments", icon: Wallet },
      { id: "seo", label: "SEO", icon: Search },
      { id: "aiseo", label: "AI SEO", icon: Sparkles },
    ],
  },
  {
    title: "System",
    items: [
      { id: "roles", label: "Roles", icon: ShieldCheck },
      { id: "plans", label: "Plans", icon: ClipboardList },
      { id: "audit", label: "Audit Log", icon: Building2 },
      { id: "access", label: "Access", icon: KeyRound },
      { id: "settings", label: "Settings", icon: SettingsIcon },
    ],
  },
];

const SECTION_TITLE: Record<Section, { title: string; desc: string }> = {
  dashboard: { title: "Dashboard", desc: "Traffic, members and orders at a glance." },
  users: { title: "Customers", desc: "Everyone who logged in — roles, plans and status." },
  subscriptions: { title: "Subscriptions", desc: "Subscribed members and plan assignment." },
  tools: { title: "Site Tools", desc: "Module visibility for the storefront." },
  pdftools: { title: "PDF Tools", desc: "Availability, caps and usage telemetry." },
  catalog: { title: "Catalog", desc: "Font + software overrides." },
  orders: { title: "Orders", desc: "Manual-payment fulfillment." },
  ads: { title: "Ads", desc: "Slots + Google AdSense units." },
  payments: { title: "Payments", desc: "Processors and merchant accounts." },
  seo: { title: "SEO", desc: "Search + analytics integrations." },
  aiseo: { title: "AI SEO", desc: "Offline content analyzer." },
  roles: { title: "Roles", desc: "Who can do what in this panel." },
  plans: { title: "Plans", desc: "Subscription products members buy." },
  audit: { title: "Audit Log", desc: "Who changed what, newest first." },
  access: { title: "Access", desc: "Login methods: Google, Facebook, email code, magic link." },
  settings: { title: "Settings", desc: "Brand and announcement." },
};

const TOOL_LABELS: Record<ToolKey, string> = {
  convert: "Unicode⇆Bijoy Converter",
  fonts: "Font Directory",
  styler: "Decorator & Styler",
  translate: "PDF⇆DOCX Translator",
  split: "PDF Splitter",
  software: "Software Store",
};

const PDF_TOOL_LABELS: Record<PdfToolKey, string> = {
  merge: "Merge PDF",
  split: "Split PDF",
  translate: "PDF to DOCX",
  compress: "Compress PDF",
  images: "Images to PDF",
};

interface PdfStats {
  total: number;
  failures: number;
  failureRate: number;
  avgMs: number;
  perTool: Record<string, { jobs: number; files: number; pages: number; failures: number }>;
  recent: PdfOp[];
}

interface UserStats {
  total: number; new7d: number; active: number; suspended: number; subscribers: number;
  byProvider: Record<string, number>; byPlan: Record<string, number>;
}

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

/** Number input with a local draft — commits on blur/Enter so typing never PUT-storms. */
function CapsNumber({ value, min, max, label, className, onCommit }: {
  value: number; min: number; max: number; label: string; className?: string; onCommit: (n: number) => void;
}) {
  const [draft, setDraft] = useState<string | null>(null);
  const shown = draft ?? String(value);
  const commit = () => {
    if (draft == null) return;
    const n = Math.min(max, Math.max(min, Number(draft) || min));
    setDraft(null);
    if (n !== value) onCommit(n);
  };
  return (
    <input
      type="number" min={min} max={max} value={shown} aria-label={label}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
      className={className}
    />
  );
}

export default function AdminPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [section, setSection] = useState<Section>("dashboard");
  const [navOpen, setNavOpen] = useState(false);
  const [navQuery, setNavQuery] = useState("");
  const [config, setConfig] = useState<SiteConfig>(DEFAULT_CONFIG);
  const [analytics, setAnalytics] = useState<{ totalViews: number; weekViews: number; days: { date: string; views: number }[]; topPages: { path: string; views: number }[] } | null>(null);
  const [orders, setOrders] = useState<Array<{ id: string; at: number; itemName: string; amountBDT: number; method: string; sender: string; txn: string; note: string; status: string }>>([]);
  const [pdfStats, setPdfStats] = useState<PdfStats | null>(null);
  const [users, setUsers] = useState<MemberUser[]>([]);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [planNames, setPlanNames] = useState<Record<string, string>>({});
  const [plans, setPlans] = useState<PlanDef[]>([]);
  const [roles, setRoles] = useState<RoleDef[]>([]);
  const [audit, setAudit] = useState<AuditEntry[]>([]);
  const [saving, setSaving] = useState(false);
  const [savedTick, setSavedTick] = useState(false);
  const [userQuery, setUserQuery] = useState("");

  // AI SEO local state
  const [seoText, setSeoText] = useState("আমার সোনার বাংলা ফন্ট কনভার্টার দিয়ে Bijoy থেকে Unicode এ রূপান্তর করুন। BornoLab offers free Bangla fonts, PDF tools and premium software for creators.");
  const keywords = useMemo(() => extractKeywords(seoText), [seoText]);
  const meta = useMemo(() => makeMeta(seoText), [seoText]);
  const read = useMemo(() => readability(seoText), [seoText]);

  // New-unit / new-plan / new-role form state
  const [unitName, setUnitName] = useState("");
  const [unitSlot, setUnitSlot] = useState<AdUnit["slot"]>("inFeed");
  const [unitAdSlot, setUnitAdSlot] = useState("");
  const [unitSize, setUnitSize] = useState("responsive");
  const [planName, setPlanName] = useState("");
  const [planPrice, setPlanPrice] = useState("199");
  const [roleName, setRoleName] = useState("");

  // Add-font form state (direct link OR local upload)
  const [nfName, setNfName] = useState("");
  const [nfDesigner, setNfDesigner] = useState("");
  const [nfPremium, setNfPremium] = useState(false);
  const [nfPrice, setNfPrice] = useState("0");
  const [nfType, setNfType] = useState<FontType>("Unicode");
  const [nfCat, setNfCat] = useState<FontCategory>("Sans-Serif");
  const [nfBangla, setNfBangla] = useState(true);
  const [nfLink, setNfLink] = useState("");
  const [nfFallback, setNfFallback] = useState("");
  const [nfUploadedUrl, setNfUploadedUrl] = useState("");
  const [nfUploading, setNfUploading] = useState(false);
  const [nfError, setNfError] = useState("");

  // Add-software form state (direct link OR local upload)
  const [nsName, setNsName] = useState("");
  const [nsTagline, setNsTagline] = useState("");
  const [nsPlatform, setNsPlatform] = useState("Windows 10/11");
  const [nsVersion, setNsVersion] = useState("1.0.0");
  const [nsSize, setNsSize] = useState("");
  const [nsPrice, setNsPrice] = useState("0");
  const [nsLink, setNsLink] = useState("");
  const [nsFallback, setNsFallback] = useState("");
  const [nsUploadedUrl, setNsUploadedUrl] = useState("");
  const [nsUploading, setNsUploading] = useState(false);
  const [nsError, setNsError] = useState("");

  useEffect(() => {
    fetch("/api/admin/me").then(async (r) => {
      if (!r.ok) { router.push("/admin/login"); return; }
      setEmail((await r.json()).email);
    });
    fetch("/api/admin/config").then((r) => r.json()).then((c) => setConfig({ ...DEFAULT_CONFIG, ...c })).catch(() => {});
    fetch("/api/admin/analytics").then((r) => r.json()).then(setAnalytics).catch(() => {});
    fetch("/api/admin/orders").then((r) => r.json()).then((j) => setOrders(j.orders ?? [])).catch(() => {});
    fetch("/api/admin/pdf-stats").then((r) => r.json()).then(setPdfStats).catch(() => {});
    fetch("/api/admin/users").then((r) => r.json()).then((j) => { setUsers(j.users ?? []); setUserStats(j.stats ?? null); setPlanNames(j.planNames ?? {}); }).catch(() => {});
    fetch("/api/admin/plans").then((r) => r.json()).then((j) => setPlans(j.plans ?? [])).catch(() => {});
    fetch("/api/admin/roles").then((r) => r.json()).then((j) => setRoles(j.roles ?? [])).catch(() => {});
    fetch("/api/admin/audit").then((r) => r.json()).then((j) => setAudit(j.entries ?? [])).catch(() => {});
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

  const patchUser = async (id: string, patch: Partial<Pick<MemberUser, "role" | "planId" | "planStatus" | "status">>) => {
    const res = await fetch("/api/admin/users", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, ...patch }) });
    const j = await res.json();
    if (res.ok && j.user) setUsers((us) => us.map((u) => (u.id === id ? j.user : u)));
  };

  const createPlan = async () => {
    if (!planName.trim()) return;
    const res = await fetch("/api/admin/plans", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: planName, priceBDT: Number(planPrice) || 0 }) });
    const j = await res.json();
    if (res.ok && j.plan) { setPlans((p) => [...p, j.plan]); setPlanName(""); }
  };

  const togglePlan = async (id: string, enabled: boolean) => {
    const res = await fetch("/api/admin/plans", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, enabled }) });
    const j = await res.json();
    if (res.ok && j.plan) setPlans((ps) => ps.map((p) => (p.id === id ? j.plan : p)));
  };

  const deletePlan = async (id: string) => {
    const res = await fetch(`/api/admin/plans?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    if (res.ok) setPlans((ps) => ps.filter((p) => p.id !== id));
  };

  const createRole = async () => {
    if (!roleName.trim()) return;
    const res = await fetch("/api/admin/roles", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: roleName }) });
    const j = await res.json();
    if (res.ok && j.role) { setRoles((r) => [...r, j.role]); setRoleName(""); }
  };

  const toggleRolePerm = async (id: string, perm: string) => {
    const role = roles.find((r) => r.id === id);
    if (!role) return;
    const permissions = role.permissions.includes(perm) ? role.permissions.filter((p) => p !== perm) : [...role.permissions, perm];
    const res = await fetch("/api/admin/roles", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, permissions }) });
    const j = await res.json();
    if (res.ok && j.role) setRoles((rs) => rs.map((r) => (r.id === id ? j.role : r)));
  };

  const deleteRole = async (id: string) => {
    const res = await fetch(`/api/admin/roles?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    if (res.ok) setRoles((rs) => rs.filter((r) => r.id !== id));
  };

  const addUnit = () => {
    if (!unitName.trim() || !unitAdSlot.trim()) return;
    const unit: AdUnit = {
      id: `ad_${Date.now().toString(36)}`,
      name: unitName.trim(), slot: unitSlot, adSlotId: unitAdSlot.trim(), size: unitSize.trim() || "responsive", enabled: true,
    };
    void save({ ads: { ...config.ads, units: [...(config.ads.units ?? []), unit] } });
    setUnitName(""); setUnitAdSlot("");
  };

  /* ---------- Catalog: custom fonts + software (link or upload) ---------- */

  const slug = (s: string) =>
    s.toLowerCase().replace(/[^a-z0-9\u0980-\u09ff]+/gi, "-").replace(/^-+|-+$/g, "").slice(0, 40) || "item";

  const uploadCatalogFile = async (
    kind: "font" | "software",
    file: File,
    setBusy: (b: boolean) => void,
    setUrl: (u: string) => void,
    setErr: (e: string) => void
  ) => {
    setBusy(true); setErr("");
    try {
      const form = new FormData();
      form.append("kind", kind);
      form.append("file", file);
      const res = await fetch("/api/admin/uploads", { method: "POST", body: form });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Upload failed");
      setUrl(j.url);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const addCustomFont = () => {
    if (!nfName.trim()) { setNfError("Font name is required."); return; }
    const fileUrl = nfUploadedUrl || nfLink.trim() || "#";
    const item: BanglaFont = {
      id: `custom-${slug(nfName)}-${Date.now().toString(36)}`,
      name: nfName.trim(),
      designer: nfDesigner.trim() || "BornoLab Admin",
      license: nfPremium ? "Paid" : "Free",
      type: nfType,
      category: nfCat,
      bangla: nfBangla,
      fileUrl,
      fallbackUrl: nfFallback.trim() || "#",
      premium: nfPremium,
      priceBDT: nfPremium ? Number(nfPrice) || 0 : 0,
    };
    void save({ customFonts: [...(config.customFonts ?? []), item] });
    setNfName(""); setNfDesigner(""); setNfPremium(false); setNfPrice("0");
    setNfLink(""); setNfFallback(""); setNfUploadedUrl(""); setNfError("");
  };

  const deleteCustomFont = async (id: string) => {
    if (!confirm("Delete this font from the catalog?")) return;
    const target = (config.customFonts ?? []).find((f) => f.id === id);
    const restOverrides = { ...config.fontOverrides };
    delete restOverrides[id];
    void save({
      customFonts: (config.customFonts ?? []).filter((f) => f.id !== id),
      fontOverrides: restOverrides,
    });
    if (target?.fileUrl.startsWith("/uploads/")) {
      await fetch("/api/admin/uploads", {
        method: "DELETE", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: target.fileUrl }),
      }).catch(() => {});
    }
  };

  const addCustomSoftware = () => {
    if (!nsName.trim()) { setNsError("Software name is required."); return; }
    const price = Number(nsPrice) || 0;
    const item: Software = {
      id: `custom-${slug(nsName)}-${Date.now().toString(36)}`,
      name: nsName.trim(),
      tagline: nsTagline.trim() || "Added by admin",
      license: price > 0 ? "Paid" : "Free",
      priceBDT: price,
      platform: nsPlatform.trim() || "Windows 10/11",
      version: nsVersion.trim() || "1.0.0",
      size: nsSize.trim() || "—",
      downloads: "New",
      fileUrl: nsUploadedUrl || nsLink.trim() || "#",
      fallbackUrl: nsFallback.trim() || "#",
    };
    void save({ customSoftware: [...(config.customSoftware ?? []), item] });
    setNsName(""); setNsTagline(""); setNsPrice("0"); setNsSize("");
    setNsLink(""); setNsFallback(""); setNsUploadedUrl(""); setNsError("");
  };

  const deleteCustomSoftware = async (id: string) => {
    if (!confirm("Delete this software from the store?")) return;
    const target = (config.customSoftware ?? []).find((s) => s.id === id);
    const restOverrides = { ...config.softwareOverrides };
    delete restOverrides[id];
    void save({
      customSoftware: (config.customSoftware ?? []).filter((s) => s.id !== id),
      softwareOverrides: restOverrides,
    });
    if (target?.fileUrl.startsWith("/uploads/")) {
      await fetch("/api/admin/uploads", {
        method: "DELETE", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: target.fileUrl }),
      }).catch(() => {});
    }
  };

  const maxDay = Math.max(1, ...(analytics?.days.map((d) => d.views) ?? [1]));
  const pendingOrders = orders.filter((o) => o.status === "pending").length;
  const subscribers = users.filter((u) => u.planId !== "free" && (u.planStatus === "active" || u.planStatus === "trial"));
  const filteredUsers = users.filter((u) =>
    !userQuery.trim() || u.email.toLowerCase().includes(userQuery.toLowerCase()) || u.name.toLowerCase().includes(userQuery.toLowerCase())
  );
  const roleCounts = useMemo(() => {
    const m: Record<string, number> = {};
    for (const u of users) m[u.role] = (m[u.role] ?? 0) + 1;
    return m;
  }, [users]);

  const field = "focus-glow w-full rounded-xl bg-slate-100 p-2.5 text-sm outline-none dark:bg-black/30";
  const head = SECTION_TITLE[section];

  const nav = (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2.5 px-4 pb-3 pt-4">
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-cyan-400 to-purple-600 text-lg font-black text-white">ব</span>
        <span className="leading-tight">
          <span className="block text-[14px] font-extrabold tracking-tight text-white">BornoLab Admin</span>
          <span className="block max-w-[150px] truncate text-[11px] text-slate-400">{email || "…"}</span>
        </span>
      </div>
      <div className="px-3 pb-2">
        <div className="flex items-center gap-2 rounded-xl bg-white/5 px-3 py-2">
          <Search size={14} className="shrink-0 text-slate-400" />
          <input
            value={navQuery} onChange={(e) => setNavQuery(e.target.value)} placeholder="Search sections…"
            aria-label="Search admin sections"
            className="w-full bg-transparent text-[13px] text-slate-200 outline-none placeholder:text-slate-500"
          />
        </div>
      </div>
      <nav className="flex-1 overflow-y-auto px-2 pb-3" aria-label="Admin">
        {GROUPS.map((g) => {
          const items = g.items.filter((i) => !navQuery.trim() || i.label.toLowerCase().includes(navQuery.toLowerCase()));
          if (!items.length) return null;
          return (
            <div key={g.title} className="mt-2">
              <p className="px-3 pb-1 text-[10.5px] font-bold uppercase tracking-widest text-slate-500">{g.title}</p>
              {items.map(({ id, label, icon: Icon }) => (
                <button
                  key={id} onClick={() => { setSection(id); setNavOpen(false); }}
                  aria-current={section === id ? "page" : undefined}
                  className={cn("flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-[13.5px] font-semibold transition",
                    section === id ? "bg-gradient-to-r from-cyan-500/25 to-purple-600/25 text-white" : "text-slate-400 hover:bg-white/5 hover:text-slate-100")}
                >
                  <Icon size={15} className={section === id ? "text-cyan-300" : ""} />
                  <span className="flex-1 text-left">{label}</span>
                  {id === "orders" && pendingOrders > 0 && (
                    <span className="rounded-full bg-amber-400 px-1.5 text-[10px] font-black text-black">{pendingOrders}</span>
                  )}
                  {id === "users" && users.length > 0 && (
                    <span className="rounded-full bg-white/10 px-1.5 text-[10px] font-black text-slate-300">{users.length}</span>
                  )}
                </button>
              ))}
            </div>
          );
        })}
      </nav>
      <div className="border-t border-white/10 p-3">
        <button onClick={logout} className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-[13.5px] font-semibold text-slate-400 hover:bg-white/5 hover:text-white">
          <LogOut size={15} /> Logout
        </button>
      </div>
    </div>
  );

  return (
    <div className="admin-shell -m-4 sm:-m-6">
      {/* Mobile top bar */}
      <div className="flex items-center gap-2 border-b border-white/10 bg-[#0b1020] px-4 py-3 lg:hidden">
        <button onClick={() => setNavOpen((v) => !v)} aria-label="Toggle admin menu" className="rounded-xl bg-white/5 p-2 text-slate-200">
          {navOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
        <span className="text-[14px] font-extrabold text-white">BornoLab Admin</span>
        <span className="ml-auto text-[12px] text-slate-400">{head.title}</span>
      </div>

      <div className="flex min-h-[calc(100vh-120px)]">
        {/* Sidebar — dark, like the reference console */}
        <aside className="sticky top-0 hidden h-screen w-64 shrink-0 self-start overflow-hidden bg-[#0b1020] lg:block">
          {nav}
        </aside>
        {navOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div className="absolute inset-0 bg-black/60" onClick={() => setNavOpen(false)} />
            <aside className="absolute inset-y-0 left-0 w-72 bg-[#0b1020] shadow-2xl">{nav}</aside>
          </div>
        )}

        {/* Content */}
        <div className="min-w-0 flex-1 px-4 py-5 sm:px-6">
          <div className="mb-5">
            <SectionTitle kicker="Backend" title={head.title} desc={email ? `${head.desc} Signed in as ${email}.` : "Loading…"} />
          </div>

          {section === "dashboard" && (
            <div className="grid gap-4 lg:grid-cols-3">
              <GlassCard><p className="text-xs font-bold uppercase tracking-wider text-slate-500">Total views</p><p className="mt-1 text-3xl font-black">{analytics?.totalViews ?? "…"}</p></GlassCard>
              <GlassCard><p className="text-xs font-bold uppercase tracking-wider text-slate-500">Last 7 days</p><p className="mt-1 text-3xl font-black">{analytics?.weekViews ?? "…"}</p></GlassCard>
              <GlassCard><p className="text-xs font-bold uppercase tracking-wider text-slate-500">Pending orders</p><p className="mt-1 text-3xl font-black">{pendingOrders}</p></GlassCard>
              <GlassCard><p className="text-xs font-bold uppercase tracking-wider text-slate-500">Members</p><p className="mt-1 text-3xl font-black">{userStats?.total ?? "…"}</p><p className="mt-1 text-[12px] text-slate-500">+{userStats?.new7d ?? 0} this week • {userStats?.subscribers ?? 0} subscribed</p></GlassCard>
              <GlassCard><p className="text-xs font-bold uppercase tracking-wider text-slate-500">PDF jobs</p><p className="mt-1 text-3xl font-black">{pdfStats?.total ?? "…"}</p><p className="mt-1 text-[12px] text-slate-500">{pdfStats ? `${pdfStats.failureRate}% failed` : ""}</p></GlassCard>
              <GlassCard><p className="text-xs font-bold uppercase tracking-wider text-slate-500">Logins by provider</p><p className="mt-1 text-[13px]">{userStats && Object.keys(userStats.byProvider).length > 0 ? Object.entries(userStats.byProvider).map(([p, n]) => <span key={p} className="mr-2 rounded-full bg-cyan-500/15 px-2.5 py-1 font-bold text-cyan-700 dark:text-cyan-200">{p} ×{n}</span>) : "—"}</p></GlassCard>
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

          {section === "users" && (
            <div className="grid gap-4">
              <div className="grid gap-4 sm:grid-cols-4">
                <GlassCard><p className="text-xs font-bold uppercase tracking-wider text-slate-500">Total members</p><p className="mt-1 text-3xl font-black">{userStats?.total ?? "…"}</p></GlassCard>
                <GlassCard><p className="text-xs font-bold uppercase tracking-wider text-slate-500">New (7d)</p><p className="mt-1 text-3xl font-black">{userStats?.new7d ?? "…"}</p></GlassCard>
                <GlassCard><p className="text-xs font-bold uppercase tracking-wider text-slate-500">Subscribed</p><p className="mt-1 text-3xl font-black">{userStats?.subscribers ?? "…"}</p></GlassCard>
                <GlassCard><p className="text-xs font-bold uppercase tracking-wider text-slate-500">Suspended</p><p className="mt-1 text-3xl font-black">{userStats?.suspended ?? "…"}</p></GlassCard>
              </div>
              <GlassCard>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-sm font-bold">Customers ({filteredUsers.length})</h3>
                  <input value={userQuery} onChange={(e) => setUserQuery(e.target.value)} placeholder="Search name or email…" aria-label="Search customers" className={cn(field, "sm:w-64")} />
                </div>
                <div className="mt-3 space-y-2">
                  {filteredUsers.map((u) => (
                    <div key={u.id} className="grid items-center gap-2 rounded-xl bg-slate-900/[.04] p-3 text-[13px] dark:bg-white/5 lg:grid-cols-[1fr_auto_auto_auto_auto]">
                      <span className="min-w-0">
                        <b className="block truncate">{u.name} <span className="font-normal text-slate-500">{u.email}</span></b>
                        <span className="text-[11.5px] text-slate-500">
                          {u.providers.join("+")} • joined {new Date(u.createdAt).toLocaleDateString()} • last login {new Date(u.lastLoginAt).toLocaleDateString()}
                        </span>
                      </span>
                      <select aria-label={`Role for ${u.email}`} value={u.role} onChange={(e) => patchUser(u.id, { role: e.target.value })} className={cn(field, "lg:w-32")}>
                        {roles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                      </select>
                      <select aria-label={`Plan for ${u.email}`} value={u.planId} onChange={(e) => patchUser(u.id, { planId: e.target.value, planStatus: e.target.value === "free" ? "none" : "active" })} className={cn(field, "lg:w-32")}>
                        {plans.map((p) => <option key={p.id} value={p.id}>{p.name} (৳{p.priceBDT})</option>)}
                      </select>
                      <select aria-label={`Subscription status for ${u.email}`} value={u.planStatus} onChange={(e) => patchUser(u.id, { planStatus: e.target.value as MemberUser["planStatus"] })} className={cn(field, "lg:w-32")}>
                        {["active", "trial", "past_due", "cancelled", "none"].map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                      <button
                        onClick={() => patchUser(u.id, { status: u.status === "active" ? "suspended" : "active" })}
                        className={cn("rounded-full px-3 py-2 text-[12px] font-bold", u.status === "active" ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-300" : "bg-red-500/15 text-red-500")}
                      >
                        {u.status === "active" ? "Active" : "Suspended"}
                      </button>
                    </div>
                  ))}
                  {filteredUsers.length === 0 && <p className="text-[13px] text-slate-500">No members yet — share /login to get the first signup.</p>}
                </div>
              </GlassCard>
            </div>
          )}

          {section === "subscriptions" && (
            <div className="grid gap-4">
              <div className="grid gap-4 sm:grid-cols-3">
                <GlassCard><p className="text-xs font-bold uppercase tracking-wider text-slate-500">Active subscribers</p><p className="mt-1 text-3xl font-black">{subscribers.length}</p></GlassCard>
                <GlassCard><p className="text-xs font-bold uppercase tracking-wider text-slate-500">MRR (est.)</p><p className="mt-1 text-3xl font-black">৳{subscribers.reduce((s, u) => s + (plans.find((p) => p.id === u.planId)?.priceBDT ?? 0), 0)}</p></GlassCard>
                <GlassCard><p className="text-xs font-bold uppercase tracking-wider text-slate-500">Plans live</p><p className="mt-1 text-3xl font-black">{plans.filter((p) => p.enabled).length}/{plans.length}</p></GlassCard>
              </div>
              <GlassCard>
                <h3 className="text-sm font-bold">Subscribed members ({subscribers.length})</h3>
                <div className="mt-3 space-y-2">
                  {subscribers.map((u) => (
                    <div key={u.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-slate-900/[.04] p-3 text-[13px] dark:bg-white/5">
                      <span><b>{u.name}</b> <span className="text-slate-500">{u.email}</span> • <b>{planNames[u.planId] ?? u.planId}</b> • <span className={u.planStatus === "past_due" ? "font-bold text-red-500" : "text-emerald-600 dark:text-emerald-300"}>{u.planStatus}</span></span>
                      <select aria-label={`Subscription status for ${u.email}`} value={u.planStatus} onChange={(e) => patchUser(u.id, { planStatus: e.target.value as MemberUser["planStatus"] })} className={cn(field, "sm:w-36")}>
                        {["active", "trial", "past_due", "cancelled", "none"].map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                  ))}
                  {subscribers.length === 0 && <p className="text-[13px] text-slate-500">No paid subscribers yet — assign a plan from Customers, or publish Plans below.</p>}
                </div>
              </GlassCard>
            </div>
          )}

          {section === "tools" && (
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

          {section === "pdftools" && (
            <div className="grid gap-4">
              <GlassCard>
                <h3 className="text-sm font-bold">PDF tool availability & caps</h3>
                <p className="mt-1 text-[12.5px] text-slate-600 dark:text-slate-400">Toggles apply live to the nav, PDF Tools page and tool pages. Caps are enforced in-browser before processing.</p>
                <div className="mt-3 grid gap-2">
                  {(Object.keys(PDF_TOOL_LABELS) as PdfToolKey[]).map((k) => {
                    const caps = pdfCaps(config, k);
                    return (
                      <div key={k} className="grid items-center gap-2 rounded-xl bg-slate-900/[.04] p-3 text-[13px] sm:grid-cols-[1fr_auto_auto_auto] dark:bg-white/5">
                        <span><b>{PDF_TOOL_LABELS[k]}</b></span>
                        <label className="flex items-center gap-1.5">Enabled <input type="checkbox" checked={caps.enabled} onChange={() => save({ pdfTools: { ...config.pdfTools, [k]: { ...caps, enabled: !caps.enabled } } })} className="h-4 w-4 accent-cyan-500" aria-label={`Enable ${PDF_TOOL_LABELS[k]}`} /></label>
                        <label className="flex items-center gap-1.5">Max MB <CapsNumber value={caps.maxMB} min={1} max={200} label={`Max MB for ${PDF_TOOL_LABELS[k]}`} className={cn(field, "w-20")} onCommit={(n) => save({ pdfTools: { ...config.pdfTools, [k]: { ...caps, maxMB: n } } })} /></label>
                        <label className="flex items-center gap-1.5">Max files <CapsNumber value={caps.maxFiles} min={1} max={100} label={`Max files for ${PDF_TOOL_LABELS[k]}`} className={cn(field, "w-20")} onCommit={(n) => save({ pdfTools: { ...config.pdfTools, [k]: { ...caps, maxFiles: n } } })} /></label>
                      </div>
                    );
                  })}
                </div>
                {saving ? <p className="mt-2 text-xs text-slate-500"><Loader2 size={12} className="inline animate-spin" /> Saving…</p> : savedTick ? <p className="mt-2 text-xs text-emerald-500"><Check size={12} className="inline" /> Saved</p> : null}
              </GlassCard>

              <div className="grid gap-4 sm:grid-cols-3">
                <GlassCard><p className="text-xs font-bold uppercase tracking-wider text-slate-500">PDF jobs</p><p className="mt-1 text-3xl font-black">{pdfStats?.total ?? "…"}</p></GlassCard>
                <GlassCard><p className="text-xs font-bold uppercase tracking-wider text-slate-500">Failure rate</p><p className="mt-1 text-3xl font-black">{pdfStats ? `${pdfStats.failureRate}% (${pdfStats.failures})` : "…"}</p></GlassCard>
                <GlassCard><p className="text-xs font-bold uppercase tracking-wider text-slate-500">Avg job time</p><p className="mt-1 text-3xl font-black">{pdfStats ? `${pdfStats.avgMs} ms` : "…"}</p></GlassCard>
              </div>

              <GlassCard>
                <h3 className="text-sm font-bold">Per-tool usage</h3>
                <div className="mt-2 space-y-1.5 text-[13px]">
                  {pdfStats && Object.keys(pdfStats.perTool).length === 0 && <p className="text-slate-500">No jobs logged yet — merge a PDF to record the first op.</p>}
                  {pdfStats && Object.entries(pdfStats.perTool).map(([tool, s]) => (
                    <p key={tool} className="flex flex-wrap justify-between gap-2 rounded-lg bg-slate-900/[.04] px-3 py-2 dark:bg-white/5">
                      <b>{PDF_TOOL_LABELS[tool as PdfToolKey] ?? tool}</b>
                      <span>{s.jobs} jobs • {s.files} files • {s.pages} pages • {s.failures} failed</span>
                    </p>
                  ))}
                  {!pdfStats && <p className="text-slate-500">Loading…</p>}
                </div>
              </GlassCard>

              <GlassCard>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-sm font-bold">Recent operations</h3>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => {
                        const rows = [["at", "tool", "files", "pages", "ms", "ok", "err"], ...(pdfStats?.recent ?? []).map((o) => [new Date(o.at).toISOString(), o.tool, o.files, o.pages, o.ms, o.ok ? "ok" : "fail", o.err ?? ""])];
                        const csv = rows.map((r) => r.map((c) => `"${String(c).replaceAll('"', '""')}"`).join(",")).join("\n");
                        const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
                        const a = document.createElement("a");
                        a.href = url;
                        a.download = "bornolab-pdf-ops.csv";
                        document.body.appendChild(a);
                        a.click();
                        a.remove();
                        setTimeout(() => URL.revokeObjectURL(url), 4000);
                      }}
                      disabled={!pdfStats || pdfStats.recent.length === 0}
                      className="glass hover-glow rounded-full px-3 py-1.5 text-[12px] font-bold disabled:opacity-40"
                    >
                      Export CSV
                    </button>
                    <button
                      onClick={async () => {
                        if (!confirm("Clear all logged PDF operations?")) return;
                        await fetch("/api/pdf/log", { method: "DELETE" });
                        fetch("/api/admin/pdf-stats").then((r) => r.json()).then(setPdfStats).catch(() => {});
                      }}
                      disabled={!pdfStats || pdfStats.recent.length === 0}
                      className="rounded-full px-3 py-1.5 text-[12px] font-bold text-red-500 hover:bg-red-500/10 disabled:opacity-40"
                    >
                      Clear log
                    </button>
                  </div>
                </div>
                <div className="mt-2 space-y-1.5 font-mono text-[12px] text-slate-600 dark:text-slate-400">
                  {pdfStats?.recent.map((o, i) => (
                    <p key={`${o.at}-${i}`} className="flex flex-wrap justify-between gap-2 rounded-lg bg-slate-900/[.04] px-3 py-1.5 dark:bg-white/5">
                      <span>{new Date(o.at).toLocaleString()} • {PDF_TOOL_LABELS[o.tool as PdfToolKey] ?? o.tool} • {o.files}f/{o.pages}p • {o.ms}ms</span>
                      <span className={o.ok ? "text-emerald-500" : "text-red-500"}>{o.ok ? "ok" : `fail: ${o.err ?? "?"}`}</span>
                    </p>
                  ))}
                  {(!pdfStats || pdfStats.recent.length === 0) && <p>— idle —</p>}
                </div>
              </GlassCard>
            </div>
          )}

          {section === "catalog" && (
            <div className="grid gap-4">
              <GlassCard>
                <h3 className="text-sm font-bold">Add a font — link or upload</h3>
                <p className="mt-1 text-[12.5px] text-slate-600 dark:text-slate-400">
                  Paste a direct download link <b>or</b> upload from your computer (.ttf/.otf/.woff/.woff2/.zip, max 30 MB).
                  Premium fonts go through checkout; you deliver the file after verifying payment (Orders tab).
                </p>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  <input aria-label="New font name" value={nfName} onChange={(e) => setNfName(e.target.value)} placeholder="Font name *" className={field} />
                  <input aria-label="New font designer" value={nfDesigner} onChange={(e) => setNfDesigner(e.target.value)} placeholder="Designer (optional)" className={field} />
                  <select aria-label="New font encoding" value={nfType} onChange={(e) => setNfType(e.target.value as FontType)} className={field}>
                    <option value="Unicode">Unicode</option>
                    <option value="ANSI">ANSI (Bijoy)</option>
                    <option value="Dual">Dual</option>
                  </select>
                  <select aria-label="New font category" value={nfCat} onChange={(e) => setNfCat(e.target.value as FontCategory)} className={field}>
                    <option value="Serif">Serif</option>
                    <option value="Sans-Serif">Sans-Serif</option>
                    <option value="Display">Display</option>
                    <option value="Stylized">Stylized</option>
                  </select>
                  <input aria-label="New font download link" value={nfLink} onChange={(e) => setNfLink(e.target.value)} placeholder="Direct download link https://… (or upload below)" className={cn(field, "font-mono")} />
                  <input aria-label="New font fallback page" value={nfFallback} onChange={(e) => setNfFallback(e.target.value)} placeholder="Fallback/foundry page https://… (optional)" className={cn(field, "font-mono")} />
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-[13px]">
                  <label className="flex cursor-pointer items-center gap-1.5 rounded-xl bg-slate-900/[.04] px-3 py-2 font-semibold dark:bg-white/5">
                    <input type="checkbox" checked={nfBangla} onChange={(e) => setNfBangla(e.target.checked)} className="h-4 w-4 accent-cyan-500" /> বাংলা font
                  </label>
                  <label className="flex cursor-pointer items-center gap-1.5 rounded-xl bg-slate-900/[.04] px-3 py-2 font-semibold dark:bg-white/5">
                    <input type="checkbox" checked={nfPremium} onChange={(e) => setNfPremium(e.target.checked)} className="h-4 w-4 accent-purple-500" /> Premium
                  </label>
                  {nfPremium && (
                    <label className="flex items-center gap-1.5">৳ <input type="number" min={0} value={nfPrice} onChange={(e) => setNfPrice(e.target.value)} className={cn(field, "w-24")} aria-label="New font price" /></label>
                  )}
                  <label className="flex cursor-pointer items-center gap-1.5 rounded-xl bg-cyan-500/15 px-3 py-2 font-bold text-cyan-700 dark:text-cyan-200">
                    {nfUploading ? "Uploading…" : nfUploadedUrl ? "✓ File attached — replace?" : "⬆ Upload file"}
                    <input
                      type="file" accept=".ttf,.otf,.woff,.woff2,.zip" className="hidden"
                      disabled={nfUploading}
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        e.target.value = "";
                        if (f) void uploadCatalogFile("font", f, setNfUploading, setNfUploadedUrl, setNfError);
                      }}
                    />
                  </label>
                  {nfUploadedUrl && (
                    <span className="max-w-full truncate font-mono text-[11px] text-emerald-600 dark:text-emerald-300">{nfUploadedUrl}</span>
                  )}
                </div>
                {nfError && <p role="alert" className="mt-2 text-[12.5px] font-semibold text-rose-500">{nfError}</p>}
                <button onClick={addCustomFont} className="mt-3 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 px-4 py-2.5 text-[13px] font-bold text-white">+ Publish font</button>
              </GlassCard>

              {(config.customFonts ?? []).length > 0 && (
                <GlassCard>
                  <h3 className="text-sm font-bold">Your uploaded fonts ({(config.customFonts ?? []).length})</h3>
                  <div className="mt-3 space-y-2">
                    {(config.customFonts ?? []).map((f) => {
                      const ov = config.fontOverrides[f.id] ?? {};
                      const premium = ov.premium ?? f.premium ?? f.license === "Paid";
                      return (
                        <div key={f.id} className="grid items-center gap-2 rounded-xl bg-slate-900/[.04] p-3 text-[13px] sm:grid-cols-[1fr_auto_auto_auto_auto] dark:bg-white/5">
                          <span className="min-w-0"><b>{f.name}</b> <span className="text-slate-500">• {f.type} • {f.bangla ? "বাংলা" : "English"}</span>
                            <span className="block max-w-full truncate font-mono text-[11px] text-slate-500">{f.fileUrl}</span></span>
                          <label className="flex items-center gap-1.5">Premium <input type="checkbox" checked={premium} onChange={() => save({ fontOverrides: { ...config.fontOverrides, [f.id]: { ...ov, premium: !premium } } })} className="h-4 w-4 accent-purple-500" /></label>
                          <label className="flex items-center gap-1.5">৳ <input type="number" min={0} value={ov.priceBDT ?? f.priceBDT ?? 0} onChange={(e) => save({ fontOverrides: { ...config.fontOverrides, [f.id]: { ...ov, priceBDT: Number(e.target.value) } } })} className={cn(field, "w-24")} /></label>
                          <label className="flex items-center gap-1.5">Visible <input type="checkbox" checked={ov.enabled ?? true} onChange={() => save({ fontOverrides: { ...config.fontOverrides, [f.id]: { ...ov, enabled: !(ov.enabled ?? true) } } })} className="h-4 w-4 accent-cyan-500" /></label>
                          <button onClick={() => deleteCustomFont(f.id)} className="rounded-full px-3 py-1.5 text-[12px] font-bold text-red-500 hover:bg-red-500/10">Delete</button>
                        </div>
                      );
                    })}
                  </div>
                </GlassCard>
              )}

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
              <GlassCard>
                <h3 className="text-sm font-bold">Add software — link or upload</h3>
                <p className="mt-1 text-[12.5px] text-slate-600 dark:text-slate-400">
                  Paste a direct download link <b>or</b> upload from your computer (.zip/.exe/.msi/.dmg/.pkg/.apk, max 300 MB).
                  Price ৳0 = Free. Paid apps go through checkout; you deliver after verifying payment.
                </p>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  <input aria-label="New software name" value={nsName} onChange={(e) => setNsName(e.target.value)} placeholder="Software name *" className={field} />
                  <input aria-label="New software tagline" value={nsTagline} onChange={(e) => setNsTagline(e.target.value)} placeholder="Tagline (optional)" className={field} />
                  <input aria-label="New software platform" value={nsPlatform} onChange={(e) => setNsPlatform(e.target.value)} placeholder="Platform (e.g. Windows 10/11)" className={field} />
                  <input aria-label="New software version" value={nsVersion} onChange={(e) => setNsVersion(e.target.value)} placeholder="Version (e.g. 1.0.0)" className={cn(field, "font-mono")} />
                  <input aria-label="New software size" value={nsSize} onChange={(e) => setNsSize(e.target.value)} placeholder="Size (e.g. 48 MB)" className={field} />
                  <label className="flex items-center gap-1.5 text-[13px] font-semibold">৳ Price (0 = Free) <input type="number" min={0} value={nsPrice} onChange={(e) => setNsPrice(e.target.value)} className={cn(field, "w-28")} aria-label="New software price" /></label>
                  <input aria-label="New software download link" value={nsLink} onChange={(e) => setNsLink(e.target.value)} placeholder="Direct download link https://… (or upload below)" className={cn(field, "font-mono")} />
                  <input aria-label="New software fallback page" value={nsFallback} onChange={(e) => setNsFallback(e.target.value)} placeholder="Fallback/info page https://… (optional)" className={cn(field, "font-mono")} />
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-[13px]">
                  <label className="flex cursor-pointer items-center gap-1.5 rounded-xl bg-cyan-500/15 px-3 py-2 font-bold text-cyan-700 dark:text-cyan-200">
                    {nsUploading ? "Uploading…" : nsUploadedUrl ? "✓ File attached — replace?" : "⬆ Upload file"}
                    <input
                      type="file" accept=".zip,.exe,.msi,.dmg,.pkg,.apk" className="hidden"
                      disabled={nsUploading}
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        e.target.value = "";
                        if (f) void uploadCatalogFile("software", f, setNsUploading, setNsUploadedUrl, setNsError);
                      }}
                    />
                  </label>
                  {nsUploadedUrl && (
                    <span className="max-w-full truncate font-mono text-[11px] text-emerald-600 dark:text-emerald-300">{nsUploadedUrl}</span>
                  )}
                </div>
                {nsError && <p role="alert" className="mt-2 text-[12.5px] font-semibold text-rose-500">{nsError}</p>}
                <button onClick={addCustomSoftware} className="mt-3 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 px-4 py-2.5 text-[13px] font-bold text-white">+ Publish software</button>
              </GlassCard>

              {(config.customSoftware ?? []).length > 0 && (
                <GlassCard>
                  <h3 className="text-sm font-bold">Your uploaded software ({(config.customSoftware ?? []).length})</h3>
                  <div className="mt-3 space-y-2">
                    {(config.customSoftware ?? []).map((s) => {
                      const ov = config.softwareOverrides[s.id] ?? {};
                      return (
                        <div key={s.id} className="grid items-center gap-2 rounded-xl bg-slate-900/[.04] p-3 text-[13px] sm:grid-cols-[1fr_auto_auto_auto] dark:bg-white/5">
                          <span className="min-w-0"><b>{s.name}</b> <span className="text-slate-500">• {s.platform} • v{s.version}</span>
                            <span className="block max-w-full truncate font-mono text-[11px] text-slate-500">{s.fileUrl}</span></span>
                          <label className="flex items-center gap-1.5">৳ <input type="number" min={0} value={ov.priceBDT ?? s.priceBDT} onChange={(e) => save({ softwareOverrides: { ...config.softwareOverrides, [s.id]: { ...ov, priceBDT: Number(e.target.value) } } })} className={cn(field, "w-24")} /></label>
                          <label className="flex items-center gap-1.5">Visible <input type="checkbox" checked={ov.enabled ?? true} onChange={() => save({ softwareOverrides: { ...config.softwareOverrides, [s.id]: { ...ov, enabled: !(ov.enabled ?? true) } } })} className="h-4 w-4 accent-cyan-500" /></label>
                          <button onClick={() => deleteCustomSoftware(s.id)} className="rounded-full px-3 py-1.5 text-[12px] font-bold text-red-500 hover:bg-red-500/10">Delete</button>
                        </div>
                      );
                    })}
                  </div>
                </GlassCard>
              )}

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
            </div>
          )}

          {section === "orders" && (
            <GlassCard>
              <h3 className="text-sm font-bold">Manual-payment orders ({orders.length})</h3>
              <div className="mt-3 space-y-2">
                {orders.map((o) => (
                  <div key={o.id} className="grid gap-1 rounded-xl bg-slate-900/[.04] p-3 text-[13px] sm:grid-cols-[auto_1fr_auto] sm:items-center dark:bg-white/5">
                    <span className="font-mono font-black">{o.id}</span>
                    <span>{o.itemName} • ৳{o.amountBDT} • {o.method} • from <code>{o.sender}</code>{o.txn && <> • txn <code>{o.txn}</code></>} • {new Date(o.at).toLocaleString()}{o.note && <span className="block text-slate-500">Note: {o.note}</span>}<span className="block text-slate-500">Fulfill: verify payment in your {o.method} app, then deliver the download/license to the buyer.</span></span>
                    <select aria-label={`Status for ${o.id}`} value={o.status} onChange={(e) => setOrderStatus(o.id, e.target.value)} className={cn(field, "sm:w-36")}>
                      {["pending", "paid", "delivered", "cancelled"].map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                ))}
                {orders.length === 0 && <p className="text-[13px] text-slate-500">No orders yet.</p>}
              </div>
            </GlassCard>
          )}

          {section === "ads" && (
            <div className="grid gap-4">
              <GlassCard>
                <h3 className="text-sm font-bold">Google AdSense</h3>
                <p className="mt-1 text-[12.5px] text-slate-600 dark:text-slate-400">Publisher ID used by every ad unit below. Find it in AdSense → Account → Settings.</p>
                <label htmlFor="adsense-client" className="mt-2 block text-xs font-bold">AdSense client (ca-pub-…)</label>
                <input id="adsense-client" value={config.seo.adsenseClient} onChange={(e) => save({ seo: { ...config.seo, adsenseClient: e.target.value } })} className={cn(field, "mt-1 font-mono")} placeholder="ca-pub-XXXXXXXXXXXXXXXX" />
              </GlassCard>
              <GlassCard>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-sm font-bold">Ad units ({(config.ads.units ?? []).length})</h3>
                </div>
                <div className="mt-3 grid gap-2 rounded-xl bg-slate-900/[.04] p-3 dark:bg-white/5 sm:grid-cols-[1fr_140px_1fr_140px_auto]">
                  <input aria-label="New unit name" value={unitName} onChange={(e) => setUnitName(e.target.value)} placeholder="In-feed Banner" className={field} />
                  <select aria-label="New unit placement" value={unitSlot} onChange={(e) => setUnitSlot(e.target.value as AdUnit["slot"])} className={field}>
                    <option value="header">header</option>
                    <option value="inFeed">inFeed</option>
                    <option value="footer">footer</option>
                  </select>
                  <input aria-label="New unit ad-slot ID" value={unitAdSlot} onChange={(e) => setUnitAdSlot(e.target.value)} placeholder="data-ad-slot (e.g. 1234567890)" className={cn(field, "font-mono")} />
                  <input aria-label="New unit size" value={unitSize} onChange={(e) => setUnitSize(e.target.value)} placeholder="responsive" list="ad-sizes" className={field} />
                  <button onClick={addUnit} className="rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 px-4 py-2.5 text-[13px] font-bold text-white">+ Add unit</button>
                </div>
                <datalist id="ad-sizes">
                  <option value="responsive" /><option value="728x90" /><option value="300x250" /><option value="336x280" /><option value="320x100" />
                </datalist>
                <div className="mt-3 space-y-2">
                  {(config.ads.units ?? []).map((u) => (
                    <div key={u.id} className="grid items-center gap-2 rounded-xl bg-slate-900/[.04] p-3 text-[13px] sm:grid-cols-[1fr_auto_auto_auto] dark:bg-white/5">
                      <span><b>{u.name}</b> <span className="font-mono text-slate-500">• {u.slot} • {u.size} • slot {u.adSlotId}</span></span>
                      <label className="flex items-center gap-1.5">Enabled <input type="checkbox" checked={u.enabled} onChange={() => save({ ads: { ...config.ads, units: (config.ads.units ?? []).map((x) => (x.id === u.id ? { ...x, enabled: !x.enabled } : x)) } })} className="h-4 w-4 accent-cyan-500" /></label>
                      <code className="hidden max-w-[260px] truncate text-[11px] text-slate-500 lg:block">{`<ins data-ad-client="${config.seo.adsenseClient || "ca-pub-…"}" data-ad-slot="${u.adSlotId}">`}</code>
                      <button onClick={() => save({ ads: { ...config.ads, units: (config.ads.units ?? []).filter((x) => x.id !== u.id) } })} className="rounded-full px-3 py-1.5 text-[12px] font-bold text-red-500 hover:bg-red-500/10">Delete</button>
                    </div>
                  ))}
                  {(config.ads.units ?? []).length === 0 && <p className="text-[13px] text-slate-500">No units yet — add your first AdSense unit above.</p>}
                </div>
              </GlassCard>
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

          {section === "payments" && (
            <div className="grid gap-4">
              <GlassCard>
                <h3 className="text-sm font-bold">Payment processors</h3>
                <p className="mt-1 text-[12.5px] text-slate-600 dark:text-slate-400">Disabled methods disappear from checkout instantly.</p>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {(["bkash", "nagad", "bank", "binance", "card"] as const).map((m) => (
                    <label key={m} className="flex cursor-pointer items-center justify-between gap-2 rounded-xl bg-slate-900/[.04] p-3 dark:bg-white/5">
                      <span className="text-[13.5px] font-semibold capitalize">{m === "card" ? "Card / Stripe (soon)" : m}</span>
                      <input
                        type="checkbox"
                        checked={config.payments.processors?.[m]?.enabled ?? (m !== "card")}
                        onChange={() => save({ payments: { ...config.payments, processors: { ...config.payments.processors, [m]: { enabled: !(config.payments.processors?.[m]?.enabled ?? m !== "card") } } } })}
                        className="h-5 w-5 accent-cyan-500"
                      />
                    </label>
                  ))}
                </div>
              </GlassCard>
              <GlassCard>
                <h3 className="text-sm font-bold">Merchant accounts (shown at checkout)</h3>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  {(["bkash", "nagad", "bank", "binance"] as const).map((m) => (
                    <div key={m}>
                      <label htmlFor={`pay-${m}`} className="text-xs font-bold capitalize">{m === "binance" ? "Binance Pay ID / UID" : m === "bank" ? "Bank account" : `${m} number`}</label>
                      <input id={`pay-${m}`} value={config.payments[m]} onChange={(e) => save({ payments: { ...config.payments, [m]: e.target.value } })} className={cn(field, "mt-1 font-mono")} />
                    </div>
                  ))}
                  <div>
                    <label htmlFor="pay-card" className="text-xs font-bold">Card publishable key (Stripe, optional)</label>
                    <input id="pay-card" value={config.payments.cardKey ?? ""} onChange={(e) => save({ payments: { ...config.payments, cardKey: e.target.value } })} className={cn(field, "mt-1 font-mono")} placeholder="pk_live_…" />
                  </div>
                </div>
              </GlassCard>
            </div>
          )}

          {section === "seo" && (
            <GlassCard>
              <h3 className="text-sm font-bold">SEO & analytics integrations</h3>
              <div className="mt-3 grid gap-3">
                {(["title", "description", "keywords", "gaId", "adsenseClient", "googleSiteVerification"] as const).map((k) => (
                  <div key={k}>
                    <label htmlFor={`seo-${k}`} className="text-xs font-bold">{k === "gaId" ? "Google ID — GTM-XXXXXXX or G-XXXXXXXX" : k === "adsenseClient" ? "AdSense client (ca-pub-…)" : k === "googleSiteVerification" ? "Google site-verification code" : k}</label>
                    {k === "description" ? (
                      <textarea id={`seo-${k}`} rows={2} value={config.seo[k] ?? ""} onChange={(e) => save({ seo: { ...config.seo, [k]: e.target.value } })} className={cn(field, "mt-1")} />
                    ) : (
                      <input id={`seo-${k}`} value={config.seo[k] ?? ""} onChange={(e) => save({ seo: { ...config.seo, [k]: e.target.value } })} className={cn(field, "mt-1")} placeholder={k === "googleSiteVerification" ? "googleXXXX… (Search Console → Settings)" : undefined} />
                    )}
                  </div>
                ))}
                <p className="text-[12px] text-slate-500">GA script + AdSense meta auto-inject on every page once saved. {saving ? "Saving…" : savedTick ? "✓ Saved" : ""}</p>
              </div>
            </GlassCard>
          )}

          {section === "aiseo" && (
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
                <p className="mt-2 text-[12px] text-slate-500">Tip: paste these into the SEO section ↑. Fully offline — Bangla + English stopwords filtered.</p>
              </GlassCard>
            </div>
          )}

          {section === "roles" && (
            <div className="grid gap-4">
              <GlassCard>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="flex-1 text-sm font-bold">Roles ({roles.length})</h3>
                  <input aria-label="New role name" value={roleName} onChange={(e) => setRoleName(e.target.value)} placeholder="New role name…" className={cn(field, "sm:w-56")} />
                  <button onClick={createRole} className="rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 px-4 py-2.5 text-[13px] font-bold text-white">+ Add role</button>
                </div>
                <div className="mt-3 space-y-2">
                  {roles.map((r) => (
                    <div key={r.id} className="rounded-xl bg-slate-900/[.04] p-3 dark:bg-white/5">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-[13.5px]"><b>{r.name}</b> <span className="text-slate-500">• {roleCounts[r.id] ?? 0} member{(roleCounts[r.id] ?? 0) === 1 ? "" : "s"}{r.system ? " • system" : ""}</span></span>
                        {!r.system && <button onClick={() => deleteRole(r.id)} className="rounded-full px-3 py-1.5 text-[12px] font-bold text-red-500 hover:bg-red-500/10">Delete</button>}
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {PERMISSIONS.map((p) => (
                          <label key={p} className={cn("flex cursor-pointer items-center gap-1.5 rounded-full px-2.5 py-1 text-[11.5px] font-semibold", r.permissions.includes(p) ? "bg-cyan-500/15 text-cyan-700 dark:text-cyan-200" : "bg-slate-900/[.05] text-slate-500 dark:bg-white/5")}>
                            <input type="checkbox" checked={r.permissions.includes(p)} onChange={() => toggleRolePerm(r.id, p)} className="h-3.5 w-3.5 accent-cyan-500" /> {p}
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </GlassCard>
            </div>
          )}

          {section === "plans" && (
            <GlassCard>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="flex-1 text-sm font-bold">Subscription plans ({plans.length})</h3>
                <input aria-label="New plan name" value={planName} onChange={(e) => setPlanName(e.target.value)} placeholder="New plan name…" className={cn(field, "sm:w-44")} />
                <input aria-label="New plan price BDT" type="number" min={0} value={planPrice} onChange={(e) => setPlanPrice(e.target.value)} placeholder="৳" className={cn(field, "sm:w-28")} />
                <button onClick={createPlan} className="rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 px-4 py-2.5 text-[13px] font-bold text-white">+ Add plan</button>
              </div>
              <div className="mt-3 space-y-2">
                {plans.map((p) => (
                  <div key={p.id} className="grid items-center gap-2 rounded-xl bg-slate-900/[.04] p-3 text-[13px] sm:grid-cols-[1fr_auto_auto_auto] dark:bg-white/5">
                    <span>
                      <b>{p.name}</b> <span className="text-slate-500">• ৳{p.priceBDT}/{p.interval} • {p.limits.pdfMB} MB • {p.limits.pdfFiles} files</span>
                      {p.features.length > 0 && <span className="block text-[12px] text-slate-500">{p.features.join(" • ")}</span>}
                    </span>
                    <label className="flex items-center gap-1.5">৳ <input type="number" min={0} value={p.priceBDT} onChange={async (e) => {
                      const res = await fetch("/api/admin/plans", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: p.id, priceBDT: Number(e.target.value) }) });
                      const j = await res.json();
                      if (res.ok && j.plan) setPlans((ps) => ps.map((x) => (x.id === p.id ? j.plan : x)));
                    }} className={cn(field, "w-24")} aria-label={`Price for ${p.name}`} /></label>
                    <label className="flex items-center gap-1.5">Live <input type="checkbox" checked={p.enabled} onChange={() => togglePlan(p.id, !p.enabled)} className="h-4 w-4 accent-cyan-500" aria-label={`Enable ${p.name}`} /></label>
                    {p.id !== "free"
                      ? <button onClick={() => deletePlan(p.id)} className="rounded-full px-3 py-1.5 text-[12px] font-bold text-red-500 hover:bg-red-500/10">Delete</button>
                      : <span className="text-[11px] text-slate-400">system</span>}
                  </div>
                ))}
              </div>
            </GlassCard>
          )}

          {section === "audit" && (
            <GlassCard>
              <h3 className="text-sm font-bold">Audit Log ({audit.length})</h3>
              <div className="mt-3 space-y-1.5 font-mono text-[12px] text-slate-600 dark:text-slate-400">
                {audit.map((a, i) => (
                  <p key={`${a.at}-${i}`} className="flex flex-wrap justify-between gap-2 rounded-lg bg-slate-900/[.04] px-3 py-1.5 dark:bg-white/5">
                    <span>{new Date(a.at).toLocaleString()} • <b>{a.action}</b> • {a.actor}{a.detail ? ` • ${a.detail}` : ""}</span>
                  </p>
                ))}
                {audit.length === 0 && <p>— no activity recorded yet —</p>}
              </div>
            </GlassCard>
          )}

          {section === "access" && (
            <div className="grid gap-4">
              <GlassCard>
                <h3 className="text-sm font-bold">Login methods</h3>
                <p className="mt-1 text-[12.5px] text-slate-600 dark:text-slate-400">Disabled methods disappear from /login instantly. OAuth secrets live in server env vars — never in the repo.</p>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {([
                    { key: "otpEnabled", label: "Email code (OTP)", desc: "6-digit code, 10-minute expiry" },
                    { key: "magicLinkEnabled", label: "Magic link", desc: "One-click /login/verify URL" },
                    { key: "googleEnabled", label: "Google", desc: "Needs Client ID + GOOGLE_CLIENT_SECRET" },
                    { key: "facebookEnabled", label: "Facebook", desc: "Needs App ID + FACEBOOK_APP_SECRET" },
                  ] as const).map((m) => (
                    <label key={m.key} className="flex cursor-pointer items-center justify-between gap-2 rounded-xl bg-slate-900/[.04] p-3 dark:bg-white/5">
                      <span><span className="block text-[13.5px] font-semibold">{m.label}</span><span className="block text-[11.5px] text-slate-500">{m.desc}</span></span>
                      <input type="checkbox" checked={config.auth[m.key]} onChange={() => save({ auth: { ...config.auth, [m.key]: !config.auth[m.key] } })} className="h-5 w-5 accent-cyan-500" />
                    </label>
                  ))}
                </div>
              </GlassCard>
              <GlassCard>
                <h3 className="text-sm font-bold">OAuth app IDs (public identifiers)</h3>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <div>
                    <label htmlFor="google-cid" className="text-xs font-bold">Google Client ID</label>
                    <input id="google-cid" value={config.auth.googleClientId} onChange={(e) => save({ auth: { ...config.auth, googleClientId: e.target.value } })} className={cn(field, "mt-1 font-mono")} placeholder="….apps.googleusercontent.com" />
                  </div>
                  <div>
                    <label htmlFor="fb-appid" className="text-xs font-bold">Facebook App ID</label>
                    <input id="fb-appid" value={config.auth.facebookAppId} onChange={(e) => save({ auth: { ...config.auth, facebookAppId: e.target.value } })} className={cn(field, "mt-1 font-mono")} placeholder="1234567890" />
                  </div>
                </div>
                <div className="mt-3 rounded-xl bg-slate-900/[.04] p-3 font-mono text-[12px] leading-6 dark:bg-white/5">
                  <p className="font-sans text-[12.5px] font-bold">Server env (Vercel → Settings → Environment Variables):</p>
                  <p>GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET</p>
                  <p>FACEBOOK_APP_ID / FACEBOOK_APP_SECRET</p>
                  <p>USER_JWT_SECRET (optional — falls back to ADMIN_JWT_SECRET)</p>
                  <p>SMTP_HOST (+ user/pass) to email real codes instead of dev-mode display</p>
                  <p className="font-sans text-[12px] text-slate-500">OAuth redirect URI to register: <code>/api/auth/oauth/callback?provider=google</code> (same pattern for facebook).</p>
                </div>
              </GlassCard>
            </div>
          )}

          {section === "settings" && (
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
      </div>
    </div>
  );
}
