"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { BookOpen, Download, FileText, Globe, Search, Sparkles } from "lucide-react";
import { GlassCard, SectionTitle } from "@/components/ui";
import {
  QB_DEPARTMENTS,
  type QBDocument,
} from "@/lib/question-bank-data";
import { cn } from "@/lib/cn";

/**
 * /study/question-bank — Question Bank Solutions hub.
 * Generic card view: department cards → subject filter chips → chapter-grouped
 * document cards. Featured solutions get their own rail.
 */
export default function QuestionBankHub() {
  const [docs, setDocs] = useState<QBDocument[]>([]);
  const [dept, setDept] = useState<string>("all");
  const [subject, setSubject] = useState<string>("all");
  const [q, setQ] = useState("");

  useEffect(() => {
    fetch("/api/question-bank")
      .then((r) => r.json())
      .then((j) => setDocs(j.docs ?? []))
      .catch(() => {});
  }, []);

  const deptMeta = (id: string) => QB_DEPARTMENTS.find((d) => d.id === id);

  const subjects = useMemo(() => {
    const ds = dept === "all" ? QB_DEPARTMENTS : QB_DEPARTMENTS.filter((d) => d.id === dept);
    return ds.flatMap((d) => d.subjects);
  }, [dept]);

  const list = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return docs.filter(
      (d) =>
        (dept === "all" || d.deptId === dept) &&
        (subject === "all" || d.subjectId === subject) &&
        (!needle || `${d.title} ${d.description}`.toLowerCase().includes(needle))
    );
  }, [docs, dept, subject, q]);

  const featured = useMemo(() => docs.filter((d) => d.featured), [docs]);

  const pickDept = (id: string) => {
    setDept(id);
    setSubject("all");
  };

  return (
    <div>
      <SectionTitle
        kicker="Study • Question Bank Solutions"
        title="প্রশ্ন-ব্যাংক সমাধান (বিষয়ভিত্তিক)"
        desc="Department → subject → chapter: every solution PDF lives in its own section. Preview free, download after login."
      />

      {/* department cards */}
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4" role="list" aria-label="Departments">
        <button onClick={() => pickDept("all")} role="listitem" aria-pressed={dept === "all"}>
          <GlassCard className={cn("flex h-full items-center gap-3 p-4 text-left transition", dept === "all" && "border-cyan-500/50")}>
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-slate-500 to-slate-700 text-white">
              <BookOpen size={20} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-extrabold">All departments</span>
              <span className="block text-[12px] text-slate-500 dark:text-slate-400">{docs.length} solution docs</span>
            </span>
          </GlassCard>
        </button>
        {QB_DEPARTMENTS.map((d) => {
          const n = docs.filter((x) => x.deptId === d.id).length;
          return (
            <Link key={d.id} href={`/study/question-bank/${d.slug}`} role="listitem">
              <GlassCard className={cn("flex h-full items-center gap-3 p-4 transition hover:border-cyan-500/40", dept === d.id && "border-cyan-500/50")}>
                <span className={cn("grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br text-white", d.grad)}>
                  <BookOpen size={20} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-extrabold">{d.title.bn} <span className="font-semibold text-slate-500">({d.title.en})</span></span>
                  <span className="block text-[12px] text-slate-500 dark:text-slate-400">{n} solution docs • {d.subjects.length} subjects</span>
                </span>
              </GlassCard>
            </Link>
          );
        })}
      </div>

      {/* dept tabs + subject chips + search */}
      <div className="glass mt-4 flex gap-1 overflow-x-auto rounded-2xl p-1.5" role="tablist" aria-label="Filter by department">
        <TabButton active={dept === "all"} onClick={() => pickDept("all")} label="All" />
        {QB_DEPARTMENTS.map((d) => (
          <TabButton key={d.id} active={dept === d.id} onClick={() => pickDept(d.id)} label={d.title.en} sub={d.title.bn} />
        ))}
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <label className="glass flex min-w-[220px] flex-1 items-center gap-2 rounded-full px-4 py-2.5">
          <Search size={15} className="shrink-0 text-slate-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search solutions, e.g. Petrobangla GK, math…"
            aria-label="Search question bank solutions"
            className="w-full bg-transparent text-sm outline-none"
          />
        </label>
        {subjects.length > 0 && (
          <div className="flex flex-wrap gap-1.5" aria-label="Filter by subject">
            <SubChip active={subject === "all"} onClick={() => setSubject("all")} label="All subjects" />
            {subjects.map((s) => (
              <SubChip key={s.id} active={subject === s.id} onClick={() => setSubject(s.id)} label={`${s.title.bn} (${s.title.en})`} />
            ))}
          </div>
        )}
      </div>

      {/* featured solutions rail */}
      {featured.length > 0 && dept === "all" && !q && (
        <section aria-label="Featured solutions">
          <h2 className="mb-3 mt-6 flex items-center gap-1.5 text-lg font-black">
            <Sparkles size={19} /> Featured solutions
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {featured.map((d) => (
              <DocCard key={d.id} doc={d} featured />
            ))}
          </div>
        </section>
      )}

      {/* solution docs */}
      <h2 className="mb-3 mt-6 flex items-center gap-1.5 text-lg font-black">
        <FileText size={19} /> Solution documents
        <span className="rounded-full bg-slate-900/5 px-2.5 py-0.5 text-[11px] font-bold text-slate-500 dark:bg-white/10 dark:text-slate-400">{list.length}</span>
      </h2>
      {list.length === 0 && (
        <GlassCard className="p-8 text-center text-sm text-slate-500">
          No solutions in this section yet — the admin can upload a PDF straight into this department / subject from Admin → Study → Question Bank.
        </GlassCard>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        {list.map((d) => (
          <DocCard key={d.id} doc={d} />
        ))}
      </div>
      <p className="mt-3 text-[12.5px] text-slate-500 dark:text-slate-400">
        Awaiting upload (<span className="font-mono">fileUrl “#”</span>) means the chapter template is ready and the source PDF is verified — upload it from the admin panel to go live.
      </p>
    </div>
  );
}

function DocCard({ doc, featured }: { doc: QBDocument; featured?: boolean }) {
  const dept = QB_DEPARTMENTS.find((d) => d.id === doc.deptId);
  const subj = dept?.subjects.find((s) => s.id === doc.subjectId);
  const awaiting = doc.fileUrl === "#";
  const FormatIcon = doc.fileType === "link" ? Globe : FileText;
  return (
    <GlassCard className={cn("group flex flex-col p-5", featured && "border-amber-500/40")}>
      <div className="flex items-center gap-2.5">
        <span className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br text-white", dept?.grad ?? "from-cyan-500 to-purple-600")}>
          <FormatIcon size={18} />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-extrabold leading-6">{doc.title}</h3>
          <p className="truncate text-[11.5px] font-semibold text-slate-500 dark:text-slate-400">
            {dept?.title.en ?? doc.deptId}{subj ? ` • ${subj.title.bn}` : ""}
            {doc.questionCount ? ` • ${doc.questionCount} Qs` : ""}
          </p>
        </div>
        {awaiting ? (
          <span className="shrink-0 rounded-full bg-slate-500/15 px-2.5 py-1 text-[10.5px] font-black text-slate-500">SOON</span>
        ) : doc.access === "paid" ? (
          <span className="shrink-0 rounded-full bg-amber-400/20 px-2.5 py-1 text-[10.5px] font-black text-amber-700 dark:text-amber-300">৳{doc.priceBDT ?? 0}</span>
        ) : (
          <span className="shrink-0 rounded-full bg-emerald-500/15 px-2.5 py-1 text-[10.5px] font-black text-emerald-600 dark:text-emerald-300">FREE</span>
        )}
      </div>
      <p className="mt-2.5 line-clamp-2 flex-1 text-[13px] leading-6 text-slate-600 dark:text-slate-400">{doc.description}</p>
      {doc.sourcePdf && (
        <p className="mt-1.5 truncate font-mono text-[11px] text-slate-400" title={doc.sourcePdf}>
          Source: {doc.sourcePdf}{doc.sourcePages ? ` • ${doc.sourcePages} pages` : ""}
        </p>
      )}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        {awaiting ? (
          <span className="rounded-full bg-slate-900/[.06] px-5 py-2 text-[13px] font-bold text-slate-500 dark:bg-white/10">
            Template ready — PDF upload pending
          </span>
        ) : (
          <>
            <Link
              href={doc.fileUrl}
              target={doc.fileUrl.startsWith("http") ? "_blank" : undefined}
              className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-cyan-500 to-purple-600 px-5 py-2 text-[13px] font-bold text-white hover:brightness-110"
            >
              <Download size={14} /> Open solution
            </Link>
            <Link
              href={`/study/question-bank/${dept?.slug ?? doc.deptId}`}
              className="glass hover-glow rounded-full px-4 py-2 text-[13px] font-bold"
            >
              {dept?.title.bn ?? "Department"} →
            </Link>
          </>
        )}
      </div>
    </GlassCard>
  );
}

function TabButton({ active, onClick, label, sub }: { active: boolean; onClick: () => void; label: string; sub?: string }) {
  return (
    <button
      role="tab"
      aria-selected={active}
      onClick={onClick}
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
      className={cn("rounded-full px-3 py-1.5 text-[12px] font-bold", active ? "bg-amber-500 text-white" : "glass")}
    >
      {label}
    </button>
  );
}
