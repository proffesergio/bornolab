"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BookOpen, Download, FileText, Search, Share2, Check, GraduationCap, Lock } from "lucide-react";
import { GlassCard, SectionTitle } from "@/components/ui";
import { StudyPractice } from "@/components/study-practice";
import { STUDY_CATEGORIES, type StudyCategory, type StudyMaterial } from "@/lib/study-data";
import { cn } from "@/lib/cn";

type CatFilter = "all" | StudyCategory;

export default function StudyPage() {
  const router = useRouter();
  const [materials, setMaterials] = useState<StudyMaterial[]>([]);
  const [cat, setCat] = useState<CatFilter>("all");
  const [sub, setSub] = useState<string>("all");
  const [q, setQ] = useState("");
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null);
  const [dlBusy, setDlBusy] = useState<string | null>(null);
  const [dlError, setDlError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/study").then((r) => r.json()).then((j) => setMaterials(j.materials ?? [])).catch(() => {});
    fetch("/api/auth/me").then((r) => r.json()).then((j) => setLoggedIn(Boolean(j.user))).catch(() => setLoggedIn(false));
  }, []);

  const subs = useMemo(() => {
    const inCat = materials.filter((m) => cat === "all" || m.category === cat);
    return [...new Set(inCat.map((m) => m.subcategory).filter(Boolean))] as string[];
  }, [materials, cat]);

  const selectCat = (c: CatFilter) => {
    setCat(c);
    setSub("all");
  };

  const list = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return materials.filter(
      (m) =>
        (cat === "all" || m.category === cat) &&
        (sub === "all" || m.subcategory === sub) &&
        (!needle || `${m.title} ${m.description} ${m.subcategory ?? ""}`.toLowerCase().includes(needle))
    );
  }, [materials, cat, sub, q]);

  const featured = materials.find((m) => m.featured);

  const download = async (m: StudyMaterial) => {
    setDlError(null);
    if (!loggedIn) {
      router.push(`/login?next=${encodeURIComponent(`/study/${m.id}`)}`);
      return;
    }
    setDlBusy(m.id);
    try {
      const res = await fetch(`/api/study/download?id=${encodeURIComponent(m.id)}`);
      if (res.status === 401) {
        router.push(`/login?next=${encodeURIComponent(`/study/${m.id}`)}`);
        return;
      }
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || `Download failed (${res.status})`);
      const blob = await res.blob();
      const ext = m.fileType === "link" ? "pdf" : m.fileType;
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `${m.title.replace(/["\r\n/\\]/g, "").slice(0, 80)}.${ext}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    } catch (e) {
      setDlError((e as Error).message);
    } finally {
      setDlBusy(null);
    }
  };

  const share = async (m: StudyMaterial) => {
    const url = `${window.location.origin}/study/${m.id}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(m.id);
      setTimeout(() => setCopied(null), 1600);
    } catch {
      window.prompt("Copy this link to share:", url);
    }
  };

  const catMeta = (id: string) => STUDY_CATEGORIES.find((c) => c.id === id);

  return (
    <div>
      <SectionTitle
        kicker="Study Hub"
        title="Study Hub — Notes, Guides & Practice"
        desc="Read free in your browser, share with a link. Login is only needed to download PDFs."
      />

      {/* category tabs */}
      <div className="glass mt-4 flex gap-1 overflow-x-auto rounded-2xl p-1.5" role="tablist" aria-label="Study categories">
        <TabButton active={cat === "all"} onClick={() => selectCat("all")} label="All" />
        {STUDY_CATEGORIES.map((c) => (
          <TabButton key={c.id} active={cat === c.id} onClick={() => selectCat(c.id as CatFilter)} label={`${c.label}`} sub={c.bangla} />
        ))}
      </div>
      <p className="mt-2 text-[12.5px] text-slate-500 dark:text-slate-400">
        {(cat === "all" ? "Everything — pick a category to focus." : `${catMeta(cat)?.label} (${catMeta(cat)?.bangla}) — ${catMeta(cat)?.desc}`)}
      </p>

      {/* search + subcategory */}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <label className="glass flex min-w-[220px] flex-1 items-center gap-2 rounded-full px-4 py-2.5">
          <Search size={15} className="shrink-0 text-slate-400" />
          <input
            value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search guides, e.g. BUET, admission…"
            aria-label="Search study materials" className="w-full bg-transparent text-sm outline-none"
          />
        </label>
        {subs.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            <SubChip active={sub === "all"} onClick={() => setSub("all")} label="All topics" />
            {subs.map((s) => (
              <SubChip key={s} active={sub === s} onClick={() => setSub(s)} label={s} />
            ))}
          </div>
        )}
      </div>

      {/* featured */}
      {featured && cat === "all" && !q && (
        <Link href={`/study/${featured.id}`} className="mt-4 block">
          <GlassCard className="border-cyan-500/30 p-5">
            <p className="text-[11px] font-bold uppercase tracking-widest text-cyan-700 dark:text-cyan-300">★ Featured • Masters • BUET Post Graduate Admission</p>
            <h2 className="mt-1 text-lg font-black">{featured.title}</h2>
            <p className="mt-1 line-clamp-2 text-[13px] text-slate-600 dark:text-slate-400">{featured.description}</p>
            <span className="mt-2 inline-block text-[13px] font-bold text-cyan-700 dark:text-cyan-300">Open guide + practice →</span>
          </GlassCard>
        </Link>
      )}

      {/* materials */}
      <h2 className="mb-3 mt-6 flex items-center gap-1.5 text-lg font-black">
        <BookOpen size={19} /> Reference materials
        <span className="rounded-full bg-slate-900/5 px-2.5 py-0.5 text-[11px] font-bold text-slate-500 dark:bg-white/10 dark:text-slate-400">{list.length}</span>
      </h2>
      {list.length === 0 && (
        <GlassCard className="p-8 text-center text-sm text-slate-500">
          No materials here yet — {cat === "masters" ? "the BUET guides live under “BUET Post Graduate Admission”." : "try another category or search."}
        </GlassCard>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        {list.map((m) => (
          <GlassCard key={m.id} className="group flex flex-col p-5">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="rounded-full bg-gradient-to-r from-cyan-500 to-purple-600 px-2.5 py-1 text-[10.5px] font-bold text-white">
                {catMeta(m.category)?.label ?? m.category}
              </span>
              {m.subcategory && (
                <span className="rounded-full bg-amber-500/15 px-2.5 py-1 text-[10.5px] font-bold text-amber-700 dark:text-amber-300">
                  {m.subcategory}
                </span>
              )}
              <span className="rounded-full bg-slate-900/5 px-2.5 py-1 font-mono text-[10.5px] font-bold uppercase text-slate-500 dark:bg-white/10 dark:text-slate-400">
                {m.fileType}
              </span>
            </div>
            <h3 className="mt-2.5 font-extrabold leading-6">{m.title}</h3>
            <p className="mt-1 line-clamp-3 flex-1 text-[13px] leading-6 text-slate-600 dark:text-slate-400">{m.description}</p>
            {(m.topics?.length ?? 0) > 0 && (
              <p className="mt-2 text-[12px] font-semibold text-emerald-700 dark:text-emerald-300">
                + {m.topics!.length} practice topics • flashcards & exam mode included
              </p>
            )}
            <div className="mt-3 flex flex-wrap gap-2">
              <Link
                href={`/study/${m.id}`}
                className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-cyan-500 to-purple-600 px-4 py-2 text-[13px] font-bold text-white hover:brightness-110"
              >
                <FileText size={14} /> Read free
              </Link>
              <button
                onClick={() => download(m)}
                disabled={dlBusy === m.id}
                title={loggedIn ? "Download file" : "Login required to download"}
                className="glass hover-glow flex items-center gap-1.5 rounded-full px-4 py-2 text-[13px] font-bold"
              >
                {loggedIn ? <Download size={14} /> : <Lock size={14} />}
                {dlBusy === m.id ? "Preparing…" : loggedIn ? "Download" : "Login to download"}
              </button>
              <button
                onClick={() => share(m)}
                title="Copy shareable link"
                className="glass hover-glow flex items-center gap-1.5 rounded-full px-4 py-2 text-[13px] font-bold"
              >
                {copied === m.id ? <Check size={14} className="text-emerald-500" /> : <Share2 size={14} />}
                {copied === m.id ? "Copied!" : "Share"}
              </button>
            </div>
          </GlassCard>
        ))}
      </div>
      {dlError && <p role="alert" className="mt-3 text-[13px] font-semibold text-rose-500">{dlError}</p>}
      {loggedIn === false && (
        <p className="mt-3 text-[12.5px] text-slate-500 dark:text-slate-400">
          Tip: reading & sharing are free for everyone — <Link href="/login?next=/study" className="font-bold text-cyan-700 underline dark:text-cyan-300">login</Link> unlocks downloads.
        </p>
      )}

      {/* practice */}
      <h2 id="practice" className="mb-3 mt-10 flex scroll-mt-24 items-center gap-1.5 text-lg font-black">
        <GraduationCap size={19} /> Step-by-step practice
      </h2>
      <p className="-mt-1 mb-3 text-[13px] text-slate-600 dark:text-slate-400">
        Built from the BUET M.Sc. CSE Group-1 prep guide: follow the 3-day plan, flip the flashcards, then test yourself in exam mode.
      </p>
      <StudyPractice />
    </div>
  );
}

function TabButton({ active, onClick, label, sub }: { active: boolean; onClick: () => void; label: string; sub?: string }) {
  return (
    <button
      role="tab" aria-selected={active} onClick={onClick}
      className={cn(
        "whitespace-nowrap rounded-xl px-4 py-2 text-[13px] font-bold transition",
        active ? "bg-gradient-to-r from-cyan-500 to-purple-600 text-white shadow" : "text-slate-600 hover:bg-slate-900/5 dark:text-slate-300 dark:hover:bg-white/5"
      )}
    >
      {label}{sub ? <span className={cn("ml-1.5 text-[11px] font-semibold", active ? "text-white/80" : "text-slate-400")}>{sub}</span> : null}
    </button>
  );
}

function SubChip({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-full px-3 py-1.5 text-[12px] font-bold",
        active ? "bg-amber-500 text-white" : "glass"
      )}
    >
      {label}
    </button>
  );
}
