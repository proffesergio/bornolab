import { notFound } from "next/navigation";
import { GlassCard } from "@/components/ui";
import { ExamEngine } from "@/components/study-platform/exam-engine";
import { StudyShell } from "@/components/study-platform/ui";
import { getPublishedSeedQuestions, mergeQuestions } from "@/lib/study-platform/catalog";
import { getAttempt, listQuestions } from "@/lib/study-platform/store";

/** /study/exams/[slug]/attempt/[attemptId] — timed engine (server renders with deadline). */
export default async function AttemptPage({ params }: { params: Promise<{ slug: string; attemptId: string }> }) {
  const { slug, attemptId } = await params;
  const attempt = await getAttempt(attemptId).catch(() => null);
  if (!attempt) return notFound();
  if (attempt.submittedAt) {
    return (
      <StudyShell>
        <GlassCard className="p-8 text-center">
          <p className="font-extrabold">এই attempt জমা হয়ে গেছে।</p>
          <a href={`/study/results/${attemptId}`} className="mt-3 inline-block rounded-full bg-gradient-to-r from-cyan-500 to-purple-600 px-6 py-2.5 text-sm font-bold text-white">ফলাফল দেখুন →</a>
        </GlassCard>
      </StudyShell>
    );
  }
  const { PLATFORM_VERSIONS } = await import("@/lib/study-platform/curriculum");
  const version = PLATFORM_VERSIONS.find((v) => v.slug === slug || v.id === attempt.examVersionId);
  if (!version) return notFound();
  const stored = await listQuestions().catch(() => []);
  const all = mergeQuestions(getPublishedSeedQuestions(), stored);
  const questions = attempt.questionOrder.map((id) => all.find((q) => q.id === id)).filter(Boolean) as typeof all;
  if (questions.length === 0) return notFound();
  return (
    <StudyShell>
      <p className="mb-2 text-[12px] font-bold text-slate-500">🔇 distraction-free মোড — টাইমার, প্রশ্ন, অপশন ও জমা প্রাধান্য পাচ্ছে।</p>
      <ExamEngine version={version} questions={questions} attemptId={attempt.id} deadline={attempt.deadline} lang="bn" />
    </StudyShell>
  );
}
