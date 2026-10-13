import Link from "next/link";
import { GlassCard, SectionTitle } from "@/components/ui";
import { StudyShell, StatusPill } from "@/components/study-platform/ui";
import { getPublishedSeedQuestions, mergeQuestions } from "@/lib/study-platform/catalog";
import { getAttempt, listQuestions } from "@/lib/study-platform/store";

/** /study/results/[attemptId] — score, breakdowns, review, citations, recalculation status. */
export default async function ResultPage({ params }: { params: Promise<{ attemptId: string }> }) {
  const { attemptId } = await params;
  const attempt = await getAttempt(attemptId).catch(() => null);
  if (!attempt || !attempt.submittedAt || !attempt.score) {
    return (
      <StudyShell>
        <GlassCard className="p-8 text-center">
          <p className="font-extrabold">ফলাফল এখনও তৈরি হয়নি।</p>
          <p className="mt-1 text-sm text-slate-500">Attempt জমা দিন বা লিংক যাচাই করুন।</p>
        </GlassCard>
      </StudyShell>
    );
  }
  const stored = await listQuestions().catch(() => []);
  const all = mergeQuestions(getPublishedSeedQuestions(), stored);
  const byId = new Map(all.map((q) => [q.id, q]));
  const s = attempt.score;
  return (
    <StudyShell>
      <SectionTitle kicker="Study • Result" title={`ফলাফল — ${s.net} / ${attempt.questionOrder.length}`} desc={`সঠিক ${s.correct} • ভুল ${s.incorrect} • অনুত্তরিত ${s.unanswered} • সময় ${Math.floor(s.timeUsedSec / 60)}:${String(s.timeUsedSec % 60).padStart(2, "0")}`} />
      <div className="flex flex-wrap gap-2">
        <StatusPill kind={s.keyStatus === "provisional" ? "provisional" : "approved"}>
          {s.keyStatus === "provisional" ? "⚠ Provisional key — কিছু উত্তর যাচাই বাকি" : "✓ Approved key"}
        </StatusPill>
        {attempt.needsRecalculation && <StatusPill kind="guidance">↻ সংশোধন বাকি — কী বদলেছে, পুনঃগণনা হবে</StatusPill>}
        {attempt.autoSubmitted && <StatusPill kind="demo">⏱ Auto-submitted at deadline</StatusPill>}
      </div>
      {attempt.correctionNote && <p className="mt-2 rounded-xl bg-amber-500/10 p-3 text-[13px]">📝 {attempt.correctionNote} (মূল ফলাফল সংরক্ষিত)</p>}
      <div className="mt-3 grid gap-2 sm:grid-cols-4">
        {[["Raw", s.raw], ["Penalty", `−${s.penalty}`], ["Net", s.net], ["%", `${s.pct}%`]].map(([k, v]) => (
          <GlassCard key={k} className="p-4 text-center"><p className="text-[11px] font-bold uppercase tracking-widest text-slate-500">{k}</p><p className="text-2xl font-black">{v}</p></GlassCard>
        ))}
      </div>
      <h2 className="mb-2 mt-6 font-black">🔍 প্রশ্ন-রিভিউ</h2>
      <div className="grid gap-2">
        {attempt.questionOrder.map((qid, i) => {
          const qItem = byId.get(qid);
          if (!qItem) return null;
          const ans = attempt.answers[qid]?.optionId ?? null;
          const ok = ans !== null && ans === qItem.key.optionId;
          return (
            <GlassCard key={qid} className="p-4">
              <p className="text-[13.5px] font-bold leading-7">Q{i + 1}. {qItem.locale.bn.stem}</p>
              <p className="mt-1 text-[12.5px] font-bold">{ans ? (ok ? "✓ সঠিক" : "✗ ভুল") : "○ অনুত্তরিত"} {qItem.key.status === "provisional" && <span className="ml-1 text-amber-600">⚠ provisional</span>}</p>
              <p className="mt-1.5 text-[13px] leading-7 text-slate-600 dark:text-slate-300">{qItem.locale.bn.explanation}</p>
              {qItem.citations.length > 0 && (
                <p className="mt-1 text-[12px]">📚 {qItem.citations.map((c) => c.title).join(" • ")}</p>
              )}
            </GlassCard>
          );
        })}
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <Link href="/study/practice?mode=wrong" className="rounded-full bg-gradient-to-r from-amber-500 to-orange-600 px-5 py-2.5 text-[13px] font-bold text-white">ভুলগুলো আবার করুন →</Link>
        <Link href="/study/progress" className="glass rounded-full px-5 py-2.5 text-[13px] font-bold">অগ্রগতি →</Link>
      </div>
    </StudyShell>
  );
}
