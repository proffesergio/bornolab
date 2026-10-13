"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { BookOpenText, Search } from "lucide-react";
import { GlassCard } from "@/components/ui";
import { EmptyState } from "./ui";
import { searchPlatform } from "@/lib/study-platform/search";
import type { Chapter, Question, Subject } from "@/lib/study-platform/types";
import { cn } from "@/lib/cn";

/** Browsable notes index — BN/EN search (synonyms + aliases) + subject filter + cards. */
export function ChapterBrowser({
  chapters, subjects, questions, initialSubject = "",
}: {
  chapters: Chapter[];
  subjects: Subject[];
  questions: Question[];
  initialSubject?: string;
}) {
  const [q, setQ] = useState("");
  const [subject, setSubject] = useState(initialSubject);
  const countByChapter = useMemo(() => {
    const m = new Map<string, number>();
    for (const item of questions) m.set(item.chapterId, (m.get(item.chapterId) ?? 0) + 1);
    return m;
  }, [questions]);
  const subjectOf = useMemo(() => new Map(subjects.map((s) => [s.id, s])), [subjects]);

  const visible = useMemo(() => {
    const needle = q.trim();
    let ids: Set<string> | null = null;
    let subjectIds: Set<string> | null = null;
    if (needle) {
      const hits = searchPlatform(needle, 60);
      ids = new Set(hits.filter((h) => h.kind === "chapter").map((h) => h.id));
      subjectIds = new Set(hits.filter((h) => h.kind === "subject").map((h) => h.id));
    }
    return chapters.filter((c) => {
      if (subject && c.subjectId !== subject) return false;
      if (!needle || !ids) return true;
      return ids.has(c.id) || (subjectIds?.has(c.subjectId) ?? false);
    });
  }, [chapters, q, subject]);

  const grouped = useMemo(() => {
    const order = new Map(subjects.map((s, i) => [s.id, i]));
    return [...visible].sort((a, b) => (order.get(a.subjectId) ?? 99) - (order.get(b.subjectId) ?? 99) || a.order - b.order);
  }, [visible, subjects]);

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <label className="glass flex min-w-[220px] flex-1 items-center gap-2 rounded-full px-4 py-2.5">
          <Search size={15} className="shrink-0 text-slate-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="খুঁজুন: সাবনেট, subnet, SQL, বানান…"
            aria-label="Search chapters in Bangla or English"
            role="searchbox"
            className="w-full bg-transparent text-sm outline-none"
          />
        </label>
      </div>
      <div className="mt-2 flex gap-1.5 overflow-x-auto pb-1" role="tablist" aria-label="Filter by subject">
        <button
          role="tab" aria-selected={!subject} onClick={() => setSubject("")}
          className={cn("whitespace-nowrap rounded-full px-3.5 py-1.5 text-[12.5px] font-bold", !subject ? "bg-gradient-to-r from-cyan-500 to-purple-600 text-white" : "glass")}
        >
          সব ({chapters.length})
        </button>
        {subjects.map((s) => {
          const n = chapters.filter((c) => c.subjectId === s.id).length;
          if (!n) return null;
          return (
            <button
              key={s.id} role="tab" aria-selected={subject === s.id} onClick={() => setSubject(subject === s.id ? "" : s.id)}
              className={cn("whitespace-nowrap rounded-full px-3.5 py-1.5 text-[12.5px] font-bold", subject === s.id ? "bg-gradient-to-r from-amber-500 to-orange-600 text-white" : "glass")}
            >
              {s.title.bn} <span className="opacity-70">({n})</span>
            </button>
          );
        })}
      </div>

      {grouped.length === 0 && (
        <div className="mt-3"><EmptyState title="কোনো নোট মেলেনি" desc="বানান বদলে বা অন্য ভাষায় খুঁজুন — যেমন ‘network’ বা ‘নেটওয়ার্ক’।" /></div>
      )}
      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {grouped.map((c) => {
          const s = subjectOf.get(c.subjectId);
          const n = countByChapter.get(c.id) ?? 0;
          const deep = c.keyTerms.length > 0 && c.workedExamples.length > 0;
          return (
            <Link key={c.id} href={`/study/chapters/${c.slug}`}>
              <GlassCard className="group flex h-full flex-col p-5 transition hover:border-cyan-500/40">
                <p className="flex flex-wrap items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-cyan-700 dark:text-cyan-300">
                  <BookOpenText size={13} /> {s?.title.bn ?? ""}
                  {deep && <span className="rounded-full bg-amber-500/15 px-2 py-0.5 normal-case tracking-normal text-amber-700 dark:text-amber-300">✦ গভীর নোট</span>}
                </p>
                <h2 className="mt-1 font-extrabold leading-7">{c.title.bn}</h2>
                <p className="text-[12px] font-semibold text-slate-500">{c.title.en}</p>
                <p className="mt-1.5 line-clamp-2 flex-1 text-[13px] leading-6 text-slate-600 dark:text-slate-400">{c.overview.bn}</p>
                <span className="mt-2.5 inline-block text-[12.5px] font-bold text-slate-500 dark:text-slate-400">
                  {n > 0 ? `✍️ ${n}টি কুইক চেক • ` : ""}<span className="text-cyan-700 dark:text-cyan-300">পড়ুন + অনুশীলন →</span>
                </span>
              </GlassCard>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
