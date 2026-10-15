"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { BookOpen, Download, FileText, Search, Share2, Check, GraduationCap, Lock, Sparkles, Globe, Target, NotebookText, Timer, BarChart3, History, SlidersHorizontal } from "lucide-react";
import { GlassCard, SectionTitle } from "@/components/ui";
import { FadeUp, StaggerGrid, StaggerItem } from "@/components/study-motion";
import { StudyPractice } from "@/components/study-practice";
import { AdUnits } from "@/components/ads";
import { useLogin } from "@/components/use-login";
import { STUDY_CATEGORIES, STUDY_DEPARTMENTS, STUDY_SUBJECTS, isBuetOnlyMaterial, type StudyCategory, type StudyMaterial } from "@/lib/study-data";
import { QB_DEPARTMENTS } from "@/lib/question-bank-data";
import { PLATFORM_SUBJECTS, getChapters } from "@/lib/study-platform/catalog";
import { cn } from "@/lib/cn";

type CatFilter = "all" | StudyCategory;

/** Preparation modules — the card-view entry to the IT job-prep platform. */
const PREP_MODULES = [
  { href: "/study/posts", icon: Target, grad: "from-cyan-500 to-blue-600", bn: "লক্ষ্য-পদ", en: "Target posts", desc: "১২টি IT-পদ ও পরীক্ষা-প্যাটার্ন", stat: "১২টি পদ" },
  { href: "/study/chapters", icon: NotebookText, grad: "from-emerald-500 to-teal-600", bn: "স্টাডি নোট", en: "Notes", desc: "বিষয়ভিত্তিক নোট, পরিভাষা ও উদাহরণ", stat: "১২৫টি অধ্যায়" },
  { href: "/study/practice", icon: GraduationCap, grad: "from-amber-500 to-orange-600", bn: "অনুশীলন", en: "Practice", desc: "কাস্টম সেট, সঙ্গে সঙ্গে ফিডব্যাক", stat: "Practice now" },
  { href: "/study/review", icon: History, grad: "from-indigo-500 to-violet-600", bn: "ডিউ রিভিউ", en: "Spaced review", desc: "SM-2 সময়সূচিতে মনে রাখুন", stat: "প্রতিদিন" },
  { href: "/study/exams/demo-20q-15min-v1", icon: Timer, grad: "from-purple-500 to-pink-600", bn: "টাইমড পরীক্ষা", en: "Timed exams", desc: "সার্ভার-টাইমার, নেগেটিভ মার্কিংসহ", stat: "২০প্রশ্ন/১৫মিনিট" },
  { href: "/study/progress", icon: BarChart3, grad: "from-rose-500 to-red-600", bn: "অগ্রগতি", en: "Progress", desc: "ভুল-সারি, ইতিহাস ও নির্দেশনা", stat: "ট্র্যাক করুন" },
];

/** Compact progress rail for signed-in learners (neutral while checking). */
function ProgressRail() {
  const { loggedIn } = useLogin();
  const [data, setData] = useState<{ attempts: unknown[]; progress: { wrongQueue: string[] } } | null>(null);
  useEffect(() => {
    if (loggedIn !== true) return;
    fetch("/api/study-platform/progress").then((r) => (r.ok ? r.json() : null)).then((j) => j && setData(j)).catch(() => {});
  }, [loggedIn]);
  if (loggedIn !== true || !data) return null;
  return (
    <Link href="/study/progress" className="glass flex items-center gap-3 rounded-2xl px-4 py-3 transition hover:border-cyan-500/40">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-rose-500 to-red-600 text-white"><BarChart3 size={18} /></span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[13px] font-extrabold">আপনার অগ্রগতি</span>
        <span className="block text-[12px] text-slate-500 dark:text-slate-400">{(data.attempts ?? []).length}টি পরীক্ষা • {(data.progress?.wrongQueue ?? []).length}টি ভুল-সারিতে</span>
      </span>
      <span className="text-[12.5px] font-bold text-cyan-700 dark:text-cyan-300">দেখুন →</span>
    </Link>
  );
}

export default function StudyPage() {
  const router = useRouter();
  const [materials, setMaterials] = useState<StudyMaterial[]>([]);
  const [cat, setCat] = useState<CatFilter>("all");
  const [sub, setSub] = useState<string>("all");
  const [dept, setDept] = useState<string>("all");
  const [subject, setSubject] = useState<string>("all");
  const [q, setQ] = useState("");
  const { loggedIn, refresh } = useLogin();
  const [dlBusy, setDlBusy] = useState<string | null>(null);
  const [dlError, setDlError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/study").then((r) => r.json()).then((j) => setMaterials(j.materials ?? [])).catch(() => {});
  }, []);

  /** BUET PG guides are Masters-only — never listed on the root "All" view. */
  const showBuet = cat === "masters";

  const subs = useMemo(() => {
    const inCat = materials.filter((m) => cat === "all" || m.category === cat);
    const all = [...new Set(inCat.map((m) => m.subcategory).filter(Boolean))] as string[];
    return showBuet ? all : all.filter((s) => !materials.some((m) => m.subcategory === s && isBuetOnlyMaterial(m)));
  }, [materials, cat, showBuet]);

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
        (dept === "all" || (m.department ?? "general") === dept) &&
        (subject === "all" || (m.subject ?? "") === subject) &&
        (showBuet || !isBuetOnlyMaterial(m)) &&
        (!needle || `${m.title} ${m.description} ${m.subcategory ?? ""} ${m.subject ?? ""}`.toLowerCase().includes(needle))
    );
  }, [materials, cat, sub, dept, subject, showBuet, q]);

  /** Count of BUET-only guides hidden by the Masters gate (for the hint). */
  const hiddenBuetCount = useMemo(() => {
    if (showBuet) return 0;
    const needle = q.trim().toLowerCase();
    return materials.filter(
      (m) =>
        isBuetOnlyMaterial(m) &&
        (sub === "all" || m.subcategory === sub) &&
        (dept === "all" || (m.department ?? "general") === dept) &&
        (subject === "all" || (m.subject ?? "") === subject) &&
        (!needle || `${m.title} ${m.description} ${m.subcategory ?? ""}`.toLowerCase().includes(needle))
    ).length;
  }, [materials, showBuet, sub, dept, subject, q]);

  const featuredRail = useMemo(
    () => materials.filter((m) => m.featured && (showBuet || !isBuetOnlyMaterial(m))),
    [materials, showBuet]
  );
  const deptLabel = (id?: string) => STUDY_DEPARTMENTS.find((d) => d.id === (id ?? "general"))?.label ?? "General";

  const download = async (m: StudyMaterial) => {
    setDlError(null);
    // Recheck at click time: never bounce a signed-in user to /login
    // just because the initial session check was slow or failed once.
    const ok = loggedIn === true || (loggedIn === null && (await refresh()));
    if (!ok) {
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
  const filtersActive = cat !== "all" || sub !== "all" || dept !== "all" || subject !== "all" || q.trim() !== "";
  const resetFilters = () => { setCat("all"); setSub("all"); setDept("all"); setSubject("all"); setQ(""); };

  return (
    <div>
      <FadeUp>
        <SectionTitle
          kicker="Study Hub"
          title="Study Hub — Notes, Guides & Practice"
          desc="Preview every guide free. Login with Google to keep reading and download — paid guides unlock via bKash."
        />
      </FadeUp>

      {/* unified filter bar */}
      <FadeUp delay={0.05}>
        <div className="glass mt-4 rounded-2xl p-3">
          <div className="flex items-center gap-2 px-1 pb-2 text-[12px] font-bold uppercase tracking-widest text-slate-400">
            <SlidersHorizontal size={13} /> Filters
            {filtersActive && (
              <button onClick={resetFilters} className="ml-auto text-[12px] font-bold normal-case tracking-normal text-cyan-700 underline dark:text-cyan-300">
                Reset all
              </button>
            )}
          </div>
          <label className="flex items-center gap-2 rounded-full bg-slate-900/[.04] px-4 py-2.5 dark:bg-white/5">
            <Search size={15} className="shrink-0 text-slate-400" />
            <input
              value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search guides by title, subject, department…"
              aria-label="Search study materials" className="w-full bg-transparent text-sm outline-none"
            />
          </label>
          <div className="mt-2 flex gap-1 overflow-x-auto p-1" role="tablist" aria-label="Study categories">
            <TabButton active={cat === "all"} onClick={() => selectCat("all")} label="All" />
            {STUDY_CATEGORIES.map((c) => (
              <TabButton key={c.id} active={cat === c.id} onClick={() => selectCat(c.id as CatFilter)} label={`${c.label}`} sub={c.bangla} />
            ))}
          </div>
          <div className="mt-1.5 flex flex-wrap gap-1.5 px-1" aria-label="Filter by department">
            <SubChip active={dept === "all"} onClick={() => setDept("all")} label="All departments" />
            {STUDY_DEPARTMENTS.map((d) => (
              <SubChip key={d.id} active={dept === d.id} onClick={() => setDept(d.id)} label={`${d.label}`} />
            ))}
          </div>
          <div className="mt-1.5 flex flex-wrap gap-1.5 px-1" aria-label="Filter by subject">
            <SubChip active={subject === "all"} onClick={() => setSubject("all")} label="All subjects" />
            {STUDY_SUBJECTS.map((s) => (
              <SubChip key={s} active={subject === s} onClick={() => setSubject(s)} label={s} />
            ))}
          </div>
          {subs.length > 0 && (
            <div className="mt-1.5 flex flex-wrap gap-1.5 px-1">
              <SubChip active={sub === "all"} onClick={() => setSub("all")} label="All topics" />
              {subs.map((s) => (
                <SubChip key={s} active={sub === s} onClick={() => setSub(s)} label={s} />
              ))}
            </div>
          )}
          <p className="px-1 pt-2 text-[12.5px] text-slate-500 dark:text-slate-400">
            {(cat === "all" ? "Everything — pick a category to focus." : `${catMeta(cat)?.label} (${catMeta(cat)?.bangla}) — ${catMeta(cat)?.desc}`)}
            {" "}• {list.length} result{list.length === 1 ? "" : "s"}
          </p>
        </div>
      </FadeUp>

      {/* featured — generic rail (BUET-only guides appear here solely under Masters) */}
      {featuredRail.length > 0 && dept === "all" && subject === "all" && sub === "all" && !q && (
        <FadeUp>
          <section aria-label="Featured study materials">
            <h2 className="mb-3 mt-6 flex items-center gap-1.5 text-lg font-black">
              <Sparkles size={19} /> Featured study materials
              <span className="rounded-full bg-slate-900/5 px-2.5 py-0.5 text-[11px] font-bold text-slate-500 dark:bg-white/10 dark:text-slate-400">{featuredRail.length}</span>
            </h2>
            <StaggerGrid className="grid gap-4 sm:grid-cols-2">
              {featuredRail.map((f) => (
                <StaggerItem key={f.id}>
                  <Link href={`/study/${f.id}`} className="block">
                    <GlassCard className="border-cyan-500/30 p-5 transition hover:border-cyan-500/60">
                      <p className="text-[11px] font-bold uppercase tracking-widest text-cyan-700 dark:text-cyan-300">★ Featured • {deptLabel(f.department)}{f.subject ? ` • ${f.subject}` : ""}</p>
                      <h3 className="mt-1 text-lg font-black">{f.title}</h3>
                      <p className="mt-1 line-clamp-2 text-[13px] text-slate-600 dark:text-slate-400">{f.description}</p>
                      <span className="mt-2 inline-block text-[13px] font-bold text-cyan-700 dark:text-cyan-300">Open guide + practice →</span>
                    </GlassCard>
                  </Link>
                </StaggerItem>
              ))}
            </StaggerGrid>
          </section>
        </FadeUp>
      )}

      {/* materials — animated card view */}
      <FadeUp>
        <h2 className="mb-3 mt-6 flex items-center gap-1.5 text-lg font-black">
          <BookOpen size={19} /> Study materials
          <span className="rounded-full bg-slate-900/5 px-2.5 py-0.5 text-[11px] font-bold text-slate-500 dark:bg-white/10 dark:text-slate-400">{list.length}</span>
        </h2>
      </FadeUp>
      {list.length === 0 && (
        <GlassCard className="p-8 text-center text-sm text-slate-500">
          No materials match these filters — try another department, subject or search.
          {hiddenBuetCount > 0 && (
            <span className="mt-2 block">
              {hiddenBuetCount} BUET PG guide{hiddenBuetCount === 1 ? "" : "s"} {hiddenBuetCount === 1 ? "is" : "are"} Masters-only —{" "}
              <button onClick={() => selectCat("masters")} className="font-bold text-cyan-700 underline dark:text-cyan-300">open Masters</button> to view.
            </span>
          )}
        </GlassCard>
      )}
      <motion.div layout className="grid gap-4 sm:grid-cols-2">
        <AnimatePresence mode="popLayout">
          {list.map((m) => {
            const interactive = m.fileType !== "pdf" && m.fileType !== "link";
            const paid = m.access === "paid";
            const FormatIcon = m.fileType === "link" ? Globe : interactive ? Sparkles : FileText;
            const formatLabel = m.fileType === "link" ? "Resource link" : interactive ? "Interactive module" : "PDF guide";
            return (
            <motion.div
              key={m.id} layout
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
            >
            <GlassCard className="group flex h-full flex-col p-5 transition hover:border-cyan-500/40">
              <div className="flex items-center gap-2.5">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-cyan-500 to-purple-600 text-white">
                  <FormatIcon size={18} />
                </span>
                <div className="min-w-0 flex-1">
                  <h3 className="truncate font-extrabold leading-6">{m.title}</h3>
                  <p className="truncate text-[11.5px] font-semibold text-slate-500 dark:text-slate-400">
                    {formatLabel} • {deptLabel(m.department)}{m.subject ? ` • ${m.subject}` : ""} • {catMeta(m.category)?.label ?? m.category}{m.subcategory ? ` • ${m.subcategory}` : ""}
                  </p>
                </div>
                <span className={paid ? "shrink-0 rounded-full bg-amber-400/20 px-2.5 py-1 text-[10.5px] font-black text-amber-700 dark:text-amber-300" : "shrink-0 rounded-full bg-emerald-500/15 px-2.5 py-1 text-[10.5px] font-black text-emerald-600 dark:text-emerald-300"}>
                  {paid ? `৳${m.priceBDT ?? 0}` : "FREE"}
                </span>
              </div>
              <p className="mt-2.5 line-clamp-2 flex-1 text-[13px] leading-6 text-slate-600 dark:text-slate-400">{m.description}</p>
              {(m.topics?.length ?? 0) > 0 && (
                <p className="mt-2 text-[12px] font-semibold text-emerald-700 dark:text-emerald-300">
                  Flashcards & exam mode included
                </p>
              )}
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Link
                  href={`/study/${m.id}`}
                  className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-cyan-500 to-purple-600 px-5 py-2 text-[13px] font-bold text-white hover:brightness-110"
                >
                  <FormatIcon size={14} /> {paid ? "Preview" : interactive ? "Start" : m.fileType === "link" ? "Open" : "Read"}
                </Link>
                {!paid && m.fileType === "pdf" && (
                  <button
                    onClick={() => download(m)}
                    disabled={dlBusy === m.id}
                    title={loggedIn === false ? "Login required to download" : "Download PDF"}
                    className="glass hover-glow flex items-center gap-1.5 rounded-full px-4 py-2 text-[13px] font-bold"
                  >
                    {loggedIn === false ? <Lock size={14} /> : <Download size={14} />}
                    {dlBusy === m.id ? "Preparing…" : loggedIn === false ? "Login to download" : "Download"}
                  </button>
                )}
                <button
                  onClick={() => share(m)}
                  title="Copy shareable link"
                  aria-label={`Share ${m.title}`}
                  className="glass hover-glow grid h-9 w-9 place-items-center rounded-full"
                >
                  {copied === m.id ? <Check size={15} className="text-emerald-500" /> : <Share2 size={15} />}
                </button>
              </div>
            </GlassCard>
            </motion.div>
            );
          })}
        </AnimatePresence>
      </motion.div>
      {dlError && <p role="alert" className="mt-3 text-[13px] font-semibold text-rose-500">{dlError}</p>}
      {loggedIn === false && (
        <p className="mt-3 text-[12.5px] text-slate-500 dark:text-slate-400">
          Tip: reading & sharing are free for everyone — <Link href="/login?next=/study" className="font-bold text-cyan-700 underline dark:text-cyan-300">login</Link> unlocks downloads.
        </p>
      )}

      {/* question bank solutions — entry to the subject-wise module */}
      <FadeUp>
        <h2 className="mb-3 mt-10 flex items-center gap-1.5 text-lg font-black">
          <FileText size={19} /> Question Bank Solutions
        </h2>
      </FadeUp>
      <StaggerGrid className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4" role="list" ariaLabel="Question bank departments">
        {QB_DEPARTMENTS.map((d) => (
          <StaggerItem key={d.id} role="listitem">
            <Link href={`/study/question-bank/${d.slug}`}>
              <GlassCard className="group flex h-full items-center gap-3 p-4 transition hover:border-amber-500/40">
                <span className={cn("grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br text-white", d.grad)}>
                  <FileText size={20} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-extrabold leading-6">{d.title.bn}</span>
                  <span className="block truncate text-[12px] text-slate-500 dark:text-slate-400">{d.title.en} • {d.subjects.length} subjects</span>
                </span>
              </GlassCard>
            </Link>
          </StaggerItem>
        ))}
      </StaggerGrid>
      <Link href="/study/question-bank" className="mt-3 inline-block text-[13px] font-bold text-cyan-700 underline dark:text-cyan-300">
        Browse all question-bank solutions →
      </Link>

      {/* practice */}
      <AdUnits slot="inFeed" className="mt-8" />
      <FadeUp>
        <h2 className="mb-3 mt-6 flex items-center gap-1.5 text-lg font-black">
          <GraduationCap size={19} /> IT Job Preparation — নতুন প্ল্যাটফর্ম
        </h2>
      </FadeUp>
      {/* preparation modules — card view */}
      <StaggerGrid className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3" role="list" ariaLabel="Preparation modules">
        {PREP_MODULES.map((m) => (
          <StaggerItem key={m.href + m.bn} role="listitem">
            <Link href={m.href}>
              <GlassCard className="group flex h-full items-center gap-3 p-4 transition hover:border-cyan-500/40">
                <span className={cn("grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br text-white", m.grad)}>
                  <m.icon size={20} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-extrabold leading-6">{m.bn} <span className="font-semibold text-slate-500">({m.en})</span></span>
                  <span className="block truncate text-[12px] text-slate-500 dark:text-slate-400">{m.desc}</span>
                </span>
                <span className="shrink-0 rounded-full bg-slate-900/[.06] px-2.5 py-1 text-[10.5px] font-black text-slate-600 dark:bg-white/10 dark:text-slate-300">{m.stat}</span>
              </GlassCard>
            </Link>
          </StaggerItem>
        ))}
        <ProgressRail />
      </StaggerGrid>
      {/* subject rail — browse notes by subject */}
      <FadeUp>
        <h3 className="mb-2 mt-5 flex items-center gap-1.5 text-[15px] font-black">
          <BookOpen size={16} /> বিষয়ভিত্তিক নোট
        </h3>
      </FadeUp>
      <div className="flex gap-2 overflow-x-auto pb-2" role="list" aria-label="Subjects">
        {PLATFORM_SUBJECTS.map((s) => {
          const n = getChapters().filter((c) => c.subjectId === s.id).length;
          return (
            <Link
              key={s.id} href={`/study/chapters?subject=${s.slug}`} role="listitem"
              className="glass hover-glow w-40 shrink-0 rounded-2xl p-3.5 transition hover:border-emerald-500/40"
            >
              <span className="block truncate text-[13px] font-extrabold leading-6">{s.title.bn}</span>
              <span className="block truncate text-[11px] font-semibold text-slate-500">{s.title.en}</span>
              <span className="mt-1.5 inline-block rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10.5px] font-black text-emerald-700 dark:text-emerald-300">{n}টি অধ্যায়</span>
            </Link>
          );
        })}
      </div>
      <p className="mt-2 text-[12.5px] text-slate-500 dark:text-slate-400">
        দ্বিভাষিক (বাংলা/English) অধ্যায়, প্রশ্ন-ব্যাংক ও টাইমড পরীক্ষা — পুরোনো গাইড ও ডাউনলোড নিচে আগের মতোই আছে।
      </p>
      <FadeUp>
        <h2 id="practice" className="mb-3 mt-10 flex scroll-mt-24 items-center gap-1.5 text-lg font-black">
          <GraduationCap size={19} /> Step-by-step practice
        </h2>
      </FadeUp>
      <p className="-mt-1 mb-3 text-[13px] text-slate-600 dark:text-slate-400">
        Pick a department and subject above, follow the 3-day plan, flip the flashcards, then test yourself in exam mode.
      </p>
      <StudyPractice />
    </div>
  );
}

function TabButton({ active, onClick, label, sub }: { active: boolean; onClick: () => void; label: string; sub?: string }) {
  return (
    <motion.button
      whileTap={{ scale: 0.96 }}
      role="tab" aria-selected={active} onClick={onClick}
      className={cn(
        "whitespace-nowrap rounded-xl px-4 py-2 text-[13px] font-bold transition",
        active ? "bg-gradient-to-r from-cyan-500 to-purple-600 text-white shadow" : "text-slate-600 hover:bg-slate-900/5 dark:text-slate-300 dark:hover:bg-white/5"
      )}
    >
      {label}{sub ? <span className={cn("ml-1.5 text-[11px] font-semibold", active ? "text-white/80" : "text-slate-400")}>{sub}</span> : null}
    </motion.button>
  );
}

function SubChip({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <motion.button
      whileTap={{ scale: 0.94 }}
      onClick={onClick}
      className={cn(
        "rounded-full px-3 py-1.5 text-[12px] font-bold transition",
        active ? "bg-amber-500 text-white" : "glass"
      )}
    >
      {label}
    </motion.button>
  );
}
