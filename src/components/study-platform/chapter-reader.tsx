"use client";
import { useState } from "react";
import Link from "next/link";
import { Bookmark, BookmarkCheck } from "lucide-react";
import { GlassCard } from "@/components/ui";
import { LangToggle } from "./ui";
import type { Chapter, Question } from "@/lib/study-platform/types";

export function ChapterReader({ chapter, related }: { chapter: Chapter; related: Question[] }) {
  const [lang, setLang] = useState<"bn" | "en" | "split">("bn");
  const [saved, setSaved] = useState(false);
  const [open, setOpen] = useState<string | null>(null);

  const show = (bn: string, en: string) => {
    if (lang === "bn") return bn;
    if (lang === "en") return en;
    return `${bn} / ${en}`;
  };

  const bookmark = async () => {
    try {
      await fetch("/api/study-platform/bookmarks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: "chapter", refId: chapter.id }),
      });
      setSaved(true);
    } catch { /* offline — local only */ setSaved(true); }
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
      <article className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <LangToggle lang={lang} onChange={setLang} />
          <button onClick={bookmark} className="glass inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-[12.5px] font-bold" aria-pressed={saved}>
            {saved ? <BookmarkCheck size={15} className="text-emerald-500" /> : <Bookmark size={15} />}
            {saved ? "সংরক্ষিত ✓" : "বুকমার্ক"}
          </button>
        </div>

        <GlassCard className="mt-3">
          <h2 className="text-lg font-black leading-8">{show(chapter.title.bn, chapter.title.en)}</h2>
          <p className="mt-2 text-[14px] leading-8 text-slate-600 dark:text-slate-300">{show(chapter.overview.bn, chapter.overview.en)}</p>
          <h3 className="mt-4 font-extrabold">🎯 {lang === "en" ? "Objectives" : "শেখার লক্ষ্য"}</h3>
          <ul className="mt-1.5 space-y-1.5">
            {chapter.objectives.map((o, i) => (
              <li key={i} className="text-[13.5px] leading-7 text-slate-600 dark:text-slate-300">• {show(o.bn, o.en)}</li>
            ))}
          </ul>
          {chapter.workedExamples.length > 0 && (
            <>
              <h3 className="mt-4 font-extrabold">📝 {lang === "en" ? "Worked examples" : "উদাহরণ"}</h3>
              {chapter.workedExamples.map((w, i) => (
                <div key={i} className="mt-2 rounded-xl bg-cyan-500/10 p-3.5 text-[13.5px] leading-7">
                  <p className="font-bold">{show(w.title.bn, w.title.en)}</p>
                  <p className="mt-1 text-slate-600 dark:text-slate-300">{show(w.body.bn, w.body.en)}</p>
                </div>
              ))}
            </>
          )}
          <h3 className="mt-4 font-extrabold">⚠️ {lang === "en" ? "Common traps" : "সাধারণ ভুল"}</h3>
          <ul className="mt-1.5 space-y-1.5">
            {chapter.commonTraps.map((t, i) => (
              <li key={i} className="text-[13.5px] leading-7 text-slate-600 dark:text-slate-300">• {show(t.bn, t.en)}</li>
            ))}
          </ul>
          <h3 className="mt-4 font-extrabold">⚡ {lang === "en" ? "Quick revision" : "দ্রুত রিভিশন"}</h3>
          <ul className="mt-1.5 space-y-1.5">
            {chapter.revisionNotes.map((t, i) => (
              <li key={i} className="rounded-xl bg-amber-500/10 p-3 text-[13.5px] leading-7">• {show(t.bn, t.en)}</li>
            ))}
          </ul>
          {chapter.resourceLinks.length > 0 && (
            <>
              <h3 className="mt-4 font-extrabold">🔗 {lang === "en" ? "Free resources" : "ফ্রি রিসোর্স"}</h3>
              <ul className="mt-1.5 space-y-1.5">
                {chapter.resourceLinks.map((r, i) => (
                  <li key={i}>
                    <a href={r.url} target="_blank" rel="noopener" className="text-[13.5px] font-bold text-cyan-700 underline dark:text-cyan-300">
                      {show(r.label.bn, r.label.en)} →
                    </a>
                  </li>
                ))}
              </ul>
            </>
          )}
        </GlassCard>

        {related.length > 0 && (
          <div className="mt-4">
            <h3 className="mb-2 font-extrabold">✍️ {lang === "en" ? "Quick checks" : "কুইক চেক"} ({related.length})</h3>
            <div className="grid gap-2">
              {related.slice(0, 6).map((qItem) => (
                <GlassCard key={qItem.id} className="p-4">
                  <p className="text-[13.5px] font-bold leading-7">{lang === "en" ? qItem.locale.en.stem : qItem.locale.bn.stem}</p>
                  <button onClick={() => setOpen(open === qItem.id ? null : qItem.id)} className="mt-2 rounded-full bg-slate-900 px-4 py-1.5 text-[12.5px] font-bold text-white dark:bg-white dark:text-slate-900" aria-expanded={open === qItem.id}>
                    {open === qItem.id ? (lang === "en" ? "Hide" : "লুকান") : (lang === "en" ? "Show answer" : "উত্তর দেখুন")}
                  </button>
                  {open === qItem.id && (
                    <div className="mt-2 text-[13px] leading-7 text-slate-600 dark:text-slate-300" aria-live="polite">
                      <p className="rounded-xl bg-emerald-500/10 p-2.5 font-bold text-emerald-800 dark:text-emerald-200">
                        {(lang === "en" ? qItem.locale.en.options : qItem.locale.bn.options)[qItem.options.findIndex((o) => o.id === qItem.key.optionId)] ?? ""}
                      </p>
                      <p className="mt-1.5">{lang === "en" ? qItem.locale.en.explanation : qItem.locale.bn.explanation}</p>
                      {qItem.key.status === "provisional" && <p className="mt-1 font-bold text-amber-600">⚠ Provisional key — যাচাই বাকি</p>}
                    </div>
                  )}
                </GlassCard>
              ))}
            </div>
            <Link href={`/study/practice?chapter=${chapter.slug}`} className="mt-3 inline-block rounded-full bg-gradient-to-r from-cyan-500 to-purple-600 px-6 py-2.5 text-sm font-bold text-white">
              {lang === "en" ? "Practice this chapter →" : "এই অধ্যায় অনুশীলন করুন →"}
            </Link>
          </div>
        )}
      </article>
      <aside className="min-w-0">
        <GlassCard>
          <h3 className="text-sm font-extrabold">📚 {lang === "en" ? "Chapter map" : "অধ্যায় মানচিত্র"}</h3>
          <ol className="mt-2 space-y-1.5 text-[13px]">
            <li className="rounded-lg bg-cyan-500/10 px-3 py-2 font-bold">● {show(chapter.title.bn, chapter.title.en)}</li>
            <li className="px-3 py-1 text-slate-500">↓ {lang === "en" ? "practice → timed exam → review" : "অনুশীলন → টাইমড পরীক্ষা → রিভিউ"}</li>
          </ol>
          <Link href="/study/progress" className="mt-3 block rounded-xl bg-amber-500/15 px-3 py-2.5 text-center text-[12.5px] font-bold text-amber-700 dark:text-amber-300">
            {lang === "en" ? "Track progress →" : "অগ্রগতি দেখুন →"}
          </Link>
        </GlassCard>
      </aside>
    </div>
  );
}
