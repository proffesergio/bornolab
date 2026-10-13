"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { GlassCard, SectionTitle } from "@/components/ui";
import { EmptyState, StatusPill, StudyShell } from "@/components/study-platform/ui";

interface ProgressData {
  progress: { wrongQueue: string[]; unansweredQueue: string[]; streakDays: number };
  attempts: { id: string; version: string; startedAt: number; submittedAt: number | null; score: { net: number; pct: number; correct: number; incorrect: number; unanswered: number } | null; needsRecalculation?: boolean }[];
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
  return (
    <StudyShell>
      <SectionTitle kicker="Study • Progress" title="আপনার অগ্রগতি" desc="ইতিহাস, দুর্বল-টপিক সারি, বুকমার্ক ও নির্দেশনা।" />
      <StatusPill kind="guidance">📊 Readiness/heatmap = পড়ার নির্দেশনা — অফিসিয়াল সাফল্যের ভবিষ্যদ্বাণী নয়</StatusPill>
      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        <GlassCard><p className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Attempts</p><p className="text-3xl font-black">{data.attempts.length}</p></GlassCard>
        <GlassCard><p className="text-[11px] font-bold uppercase tracking-widest text-slate-500">ভুল-সারি</p><p className="text-3xl font-black">{data.progress.wrongQueue.length}</p><Link href="/study/practice?mode=wrong" className="text-[12.5px] font-bold text-amber-600 underline">ভুল অনুশীলন →</Link></GlassCard>
        <GlassCard><p className="text-[11px] font-bold uppercase tracking-widest text-slate-500">অনুত্তরিত</p><p className="text-3xl font-black">{data.progress.unansweredQueue.length}</p><Link href="/study/practice?mode=unanswered" className="text-[12.5px] font-bold text-cyan-700 underline">আবার চেষ্টা →</Link></GlassCard>
      </div>
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
