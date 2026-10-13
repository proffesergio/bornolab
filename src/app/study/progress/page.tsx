"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { GlassCard, SectionTitle } from "@/components/ui";
import { EmptyState, StatusPill, StudyShell } from "@/components/study-platform/ui";
import { getChapters } from "@/lib/study-platform/catalog";
import { cn } from "@/lib/cn";

interface ProgressData {
  progress: {
    wrongQueue: string[];
    unansweredQueue: string[];
    streakDays: number;
    lastActiveDay?: string;
    chapterMastery: Record<string, { seen: number; correct: number; total: number; updatedAt: number }>;
  };
  attempts: { id: string; version: string; startedAt: number; submittedAt: number | null; score: { net: number; pct: number; correct: number; incorrect: number; unanswered: number } | null; needsRecalculation?: boolean }[];
  bookmarks: { kind: string; refId: string; createdAt: number }[];
  disclaimer: string;
}

/** /study/progress — history, mastery, queues, guidance (login required). */
export default function ProgressPage() {
  const [data, setData] = useState<ProgressData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/study-platform/progress").then(async (r) => {
      if (r.status === 401) { setError("login"); return; }
      setData(await r.json());
    }).catch(() => setError("load"));
  }, []);

  if (error === "login") {
    return (
      <StudyShell>
        <GlassCard className="p-8 text-center">
          <p className="font-extrabold">অগ্রগতি দেখতে লগইন করুন</p>
          <Link href="/login?next=/study/progress" className="mt-3 inline-block rounded-full bg-gradient-to-r from-cyan-500 to-purple-600 px-6 py-2.5 text-sm font-bold text-white">Continue with Google →</Link>
        </GlassCard>
      </StudyShell>
    );
  }
  if (error || !data) {
    return <StudyShell><GlassCard className="p-8 text-center text-sm text-slate-500">{error ? "লোড ব্যর্থ — আবার চেষ্টা করুন।" : "লোড হচ্ছে…"}</GlassCard></StudyShell>;
  }

  const heat = (pct: number) => (pct >= 80 ? "শক্তিশালী" : pct >= 50 ? "মাঝারি" : "দুর্বল");
  const chapters = useMemo(() => getChapters(), []);
  const chapterName = useMemo(() => new Map(chapters.map((c) => [c.id, c] as const)), [chapters]);
  const masteryRows = useMemo(() => {
    const m = data?.progress.chapterMastery ?? {};
    return Object.entries(m)
      .map(([id, v]) => ({ id, ...v, pct: v.total > 0 ? Math.round((100 * v.correct) / v.total) : 0 }))
      .sort((a, b) => a.pct - b.pct);
  }, [data]);
  // Spaced-review recommendations: weakest chapters first, then wrong queue, then stale (>7d) chapters.
  const recommendations = useMemo(() => {
    if (!data) return [];
    const recs: { label: string; href: string; why: string }[] = [];
    for (const r of masteryRows.slice(0, 3)) {
      if (r.pct < 70) {
        const c = chapterName.get(r.id);
        recs.push({
          label: `রিভিউ: ${c?.title.bn ?? r.id}`,
          href: c ? `/study/chapters/${c.slug}` : "/study/chapters",
          why: `${r.pct}% নির্ভুল — দুর্বলতম আগে`,
        });
      }
    }
    if (data.progress.wrongQueue.length > 0) {
      recs.push({ label: `ভুল-সারি (${data.progress.wrongQueue.length}টি)`, href: "/study/practice?mode=wrong", why: "ভুল প্রশ্ন ২৪ ঘণ্টার মধ্যে আবার করুন" });
    }
    const weekAgo = Date.now() - 7 * 86400000;
    const stale = masteryRows.filter((r) => r.updatedAt < weekAgo).slice(0, 2);
    for (const r of stale) {
      const c = chapterName.get(r.id);
      if (c) recs.push({ label: `ঝালিয়ে নিন: ${c.title.bn}`, href: `/study/chapters/${c.slug}`, why: "৭+ দিন আগে পড়া" });
    }
    return recs.slice(0, 5);
  }, [data, masteryRows, chapterName]);
  return (
    <StudyShell>
      <SectionTitle kicker="Study • Progress" title="আপনার অগ্রগতি" desc="ইতিহাস, দুর্বল-টপিক সারি, বুকমার্ক ও নির্দেশনা।" />
      <StatusPill kind="guidance">📊 Readiness/heatmap = পড়ার নির্দেশনা — অফিসিয়াল সাফল্যের ভবিষ্যদ্বাণী নয়</StatusPill>
      <div className="mt-3 grid gap-3 sm:grid-cols-4">
        <GlassCard><p className="text-[11px] font-bold uppercase tracking-widest text-slate-500">🔥 স্ট্রিক</p><p className="text-3xl font-black">{data.progress.streakDays}<span className="text-sm font-bold text-slate-500"> দিন</span></p></GlassCard>
        <GlassCard><p className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Attempts</p><p className="text-3xl font-black">{data.attempts.length}</p></GlassCard>
        <GlassCard><p className="text-[11px] font-bold uppercase tracking-widest text-slate-500">ভুল-সারি</p><p className="text-3xl font-black">{data.progress.wrongQueue.length}</p><Link href="/study/practice?mode=wrong" className="text-[12.5px] font-bold text-amber-600 underline">ভুল অনুশীলন →</Link></GlassCard>
        <GlassCard><p className="text-[11px] font-bold uppercase tracking-widest text-slate-500">অনুত্তরিত</p><p className="text-3xl font-black">{data.progress.unansweredQueue.length}</p><Link href="/study/practice?mode=unanswered" className="text-[12.5px] font-bold text-cyan-700 underline">আবার চেষ্টা →</Link></GlassCard>
      </div>
      {recommendations.length > 0 && (
        <>
          <h2 className="mb-2 mt-6 font-black">⏰ স্পেসড-রিভিউ পরামর্শ</h2>
          <div className="grid gap-2 sm:grid-cols-2">
            {recommendations.map((r) => (
              <Link key={r.label} href={r.href} className="glass flex items-center justify-between gap-2 rounded-2xl px-4 py-3 transition hover:border-amber-500/40">
                <span><span className="block text-[13.5px] font-extrabold">{r.label}</span><span className="block text-[12px] text-slate-500">{r.why}</span></span>
                <span className="text-[12.5px] font-bold text-amber-600">→</span>
              </Link>
            ))}
          </div>
        </>
      )}
      {masteryRows.length > 0 && (
        <>
          <h2 className="mb-2 mt-6 font-black">🗺️ অধ্যায়-দক্ষতা (heatmap)</h2>
          <GlassCard>
            <div className="grid gap-2.5">
              {masteryRows.map((r) => {
                const c = chapterName.get(r.id);
                return (
                  <div key={r.id}>
                    <div className="flex items-baseline justify-between gap-2 text-[12.5px]">
                      <span className="truncate font-bold">{c?.title.bn ?? r.id} <span className="font-semibold text-slate-500">({c?.title.en ?? ""})</span></span>
                      <span className="shrink-0 font-black">{r.pct}% • {heat(r.pct)}</span>
                    </div>
                    <div className="mt-1 h-2.5 overflow-hidden rounded-full bg-slate-900/10 dark:bg-white/10" role="img" aria-label={`${c?.title.bn ?? r.id}: ${r.pct} percent, ${heat(r.pct)}`}>
                      <div
                        className={cn("h-full rounded-full", r.pct >= 80 ? "bg-gradient-to-r from-emerald-500 to-teal-500" : r.pct >= 50 ? "bg-gradient-to-r from-amber-500 to-orange-500" : "bg-gradient-to-r from-rose-500 to-red-500")}
                        style={{ width: `${r.pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </GlassCard>
        </>
      )}
      {data.bookmarks.length > 0 && (
        <>
          <h2 className="mb-2 mt-6 font-black">🔖 বুকমার্ক ({data.bookmarks.length})</h2>
          <div className="grid gap-2 sm:grid-cols-2">
            {data.bookmarks.slice(0, 12).map((b, i) => {
              const c = b.kind === "chapter" ? chapterName.get(b.refId) : undefined;
              return (
                <Link key={`${b.kind}-${b.refId}-${i}`} href={c ? `/study/chapters/${c.slug}` : "/study/practice?mode=bookmarked"} className="glass rounded-2xl px-4 py-3 text-[13px] font-bold transition hover:border-cyan-500/40">
                  {b.kind === "chapter" ? `📖 ${c?.title.bn ?? b.refId}` : "✍️ সংরক্ষিত প্রশ্ন"} →
                </Link>
              );
            })}
          </div>
        </>
      )}
      <h2 className="mb-2 mt-6 font-black">🕘 ইতিহাস</h2>
      {data.attempts.length === 0 && <EmptyState title="এখনও কোনো attempt নেই" desc="প্রথমে practice, তারপর timed exam দিন।" action={<Link href="/study/practice" className="rounded-full bg-gradient-to-r from-cyan-500 to-purple-600 px-5 py-2.5 text-[13px] font-bold text-white">Practice now →</Link>} />}
      <div className="grid gap-2">
        {data.attempts.map((a) => (
          <Link key={a.id} href={a.submittedAt ? `/study/results/${a.id}` : "#"} className="glass flex flex-wrap items-center justify-between gap-2 rounded-2xl px-4 py-3">
            <span className="font-bold">{a.version} <span className="text-[11px] font-semibold text-slate-500">{new Date(a.startedAt).toLocaleString("bn-BD")}</span></span>
            <span className="text-[12.5px] font-bold">{a.score ? `${a.score.net} (${a.score.pct}%) • ${heat(a.score.pct)}` : "চলমান…"} {a.needsRecalculation ? "↻" : ""}</span>
          </Link>
        ))}
      </div>
      <p className="mt-3 text-[12px] text-slate-500">{data.disclaimer}</p>
    </StudyShell>
  );
}
