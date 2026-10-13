import { NextRequest, NextResponse } from "next/server";
import { appendAudit, listAttempts, listQuestions, upsertAttempt } from "@/lib/study-platform/store";
import { chapterSubjectMap, getPublishedSeedQuestions, mergeQuestions, resolveSection } from "@/lib/study-platform/catalog";
import { scoreAttempt } from "@/lib/study-platform/scoring";

/**
 * POST /api/study-platform/recalculate {questionId?, attemptId?, all?} — admin only.
 * Re-scores flagged attempts with current approved keys. Originals are preserved
 * in previousScores; the flag is cleared and an audit event is recorded.
 */
export async function POST(req: NextRequest) {
  const { requireAdmin } = await import("@/app/api/admin/me/route");
  const auth = await requireAdmin(req);
  if (auth instanceof NextResponse) return auth;
  const actor = String(auth);
  const body = (await req.json().catch(() => ({}))) as { questionId?: string; attemptId?: string; all?: boolean };
  if (!body.questionId && !body.attemptId && !body.all) {
    return NextResponse.json({ error: "questionId, attemptId or all required" }, { status: 400 });
  }
  const stored = await listQuestions().catch(() => []);
  const all = mergeQuestions(getPublishedSeedQuestions(), stored);
  const byId = new Map(all.map((q) => [q.id, q]));
  const subjMap = chapterSubjectMap();
  const { PLATFORM_VERSIONS } = await import("@/lib/study-platform/curriculum");
  const attempts = await listAttempts().catch(() => []);
  const done: string[] = [];
  for (const a of attempts) {
    if (!a.submittedAt || !a.score) continue;
    if (body.attemptId && a.id !== body.attemptId) continue;
    if (body.questionId && !a.questionOrder.includes(body.questionId)) continue;
    if (!body.attemptId && !a.needsRecalculation) continue;
    const version = PLATFORM_VERSIONS.find((x) => x.slug === a.examVersionId || x.id === a.examVersionId);
    if (!version) continue;
    const qs = all.filter((q) => a.questionOrder.includes(q.id));
    const rescored = scoreAttempt({
      version,
      questions: qs,
      answers: a.answers,
      startedAt: a.startedAt,
      submittedAt: a.submittedAt,
      sectionOf: (qid) => a.sectionOf?.[qid] ?? resolveSection(version, byId.get(qid)?.chapterId, subjMap),
    });
    await upsertAttempt({
      ...a,
      score: rescored,
      previousScores: [...(a.previousScores ?? []), { at: Date.now(), score: a.score, note: `re-scored by ${actor}` }].slice(-10),
      needsRecalculation: false,
      correctionNote: `Re-scored by ${actor} after key correction — original preserved in history.`,
      keySnapshot: rescored.keyStatus,
    });
    done.push(a.id);
    if (done.length >= 200) break;
  }
  await appendAudit({ id: `aud-${Date.now().toString(36)}`, at: Date.now(), actor, action: "study.recalculate", entity: "attempt", entityId: `${done.length}-attempts`, detail: body.questionId ?? body.attemptId ?? "all-flagged" });
  return NextResponse.json({ ok: true, rescored: done.length, ids: done });
}
