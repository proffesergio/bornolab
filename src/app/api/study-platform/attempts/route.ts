import { NextRequest, NextResponse } from "next/server";
import { getAttempt, getProgress, listAttempts, listQuestions, removeAttempt, saveProgress, upsertAttempt } from "@/lib/study-platform/store";
import { chapterSubjectMap, getPublishedSeedQuestions, mergeQuestions, resolveSection, versionBySlug } from "@/lib/study-platform/catalog";
import { scoreAttempt, seededShuffle } from "@/lib/study-platform/scoring";
import { clientIp, throttle } from "@/lib/study-platform/ratelimit";
import { USER_COOKIE, sessionUser } from "@/lib/users";
import type { Attempt, Question, UserProgress } from "@/lib/study-platform/types";

async function allQuestions(): Promise<Question[]> {
  const stored = await listQuestions().catch(() => []);
  return mergeQuestions(getPublishedSeedQuestions(), stored);
}

function publicAttempt(a: Attempt, questions: Question[]) {
  // Privacy-safe: strip nothing sensitive, but never leak other users' data (checked by caller).
  return { ...a, questions };
}

function dayKey(ts: number): string {
  return new Date(ts).toISOString().slice(0, 10);
}

/** GET /api/study-platform/attempts?id=… — resume/result (own attempt or admin). */
export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id") ?? "";
  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });
  const a = await getAttempt(id);
  if (!a) return NextResponse.json({ error: "not found" }, { status: 404 });
  let userId: string | null = null;
  try {
    userId = (await sessionUser(req.cookies.get(USER_COOKIE)?.value ?? ""))?.id ?? null;
  } catch { /* anonymous */ }
  const admin = req.cookies.get("bornolab_admin")?.value ? true : false;
  if (!admin && a.userId && a.userId !== userId) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  const questions = (await allQuestions()).filter((q) => a.questionOrder.includes(q.id));
  return NextResponse.json({ attempt: publicAttempt(a, questions), now: Date.now(), remainingSec: Math.max(0, Math.round((a.deadline - Date.now()) / 1000)) });
}

/** POST /api/study-platform/attempts {action:create|submit} — server-authoritative deadlines, idempotent submit. */
export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as { action?: string; versionSlug?: string; attemptId?: string; auto?: boolean; lang?: string };
  if (body.action === "submit") {
    const a = body.attemptId ? await getAttempt(body.attemptId) : null;
    if (!a) return NextResponse.json({ error: "attempt not found" }, { status: 404 });
    if (a.submittedAt) {
      const questions = (await allQuestions()).filter((q) => a.questionOrder.includes(q.id));
      return NextResponse.json({ ok: true, idempotent: true, attempt: publicAttempt(a, questions) });
    }
    const v = versionBySlug(a.examVersionId) ?? versionBySlug(String(a.examVersionId));
    const version = v ?? (await import("@/lib/study-platform/curriculum")).PLATFORM_VERSIONS.find((x) => x.id === a.examVersionId || x.slug === a.examVersionId);
    if (!version) return NextResponse.json({ error: "version not found" }, { status: 400 });
    const all = await allQuestions();
    const questions = all.filter((q) => a.questionOrder.includes(q.id));
    const qById = new Map(all.map((q) => [q.id, q]));
    const subjMap = chapterSubjectMap();
    const now = Date.now();
    const score = scoreAttempt({
      version,
      questions,
      answers: a.answers,
      startedAt: a.startedAt,
      submittedAt: now,
      sectionOf: (qid) => a.sectionOf?.[qid] ?? resolveSection(version, qById.get(qid)?.chapterId, subjMap),
    });
    const next: Attempt = { ...a, submittedAt: now, autoSubmitted: body.auto === true, score, keySnapshot: score.keyStatus };
    await upsertAttempt(next);
    // Learner progress: wrong/unanswered queues + chapter mastery + streaks (best-effort).
    try {
      const user = await sessionUser(req.cookies.get(USER_COOKIE)?.value ?? "");
      if (user) {
        const prog: UserProgress = (await getProgress(user.id).catch(() => null)) ?? { userId: user.id, chapterMastery: {}, wrongQueue: [], unansweredQueue: [], streakDays: 0 };
        const wrong = new Set(prog.wrongQueue);
        const un = new Set(prog.unansweredQueue);
        const mastery = { ...prog.chapterMastery };
        for (const qItem of questions) {
          const ans = next.answers[qItem.id]?.optionId ?? null;
          const right = ans !== null && ans === qItem.key.optionId;
          if (!ans) un.add(qItem.id);
          else if (!right) { wrong.add(qItem.id); un.delete(qItem.id); }
          else { wrong.delete(qItem.id); un.delete(qItem.id); }
          const m = mastery[qItem.chapterId] ?? { seen: 0, correct: 0, total: 0, updatedAt: 0 };
          mastery[qItem.chapterId] = { seen: m.seen + 1, correct: m.correct + (right ? 1 : 0), total: m.total + 1, updatedAt: now };
        }
        const today = dayKey(now);
        const yesterday = dayKey(now - 86400000);
        const streakDays = prog.lastActiveDay === today ? prog.streakDays : prog.lastActiveDay === yesterday ? prog.streakDays + 1 : 1;
        await saveProgress({ ...prog, chapterMastery: mastery, wrongQueue: [...wrong].slice(-200), unansweredQueue: [...un].slice(-200), streakDays, lastActiveDay: today });
      }
    } catch { /* progress is advisory */ }
    return NextResponse.json({ ok: true, attempt: publicAttempt(next, questions) });
  }

  // create (rate-limited per IP; resumes an active attempt instead of duplicating).
  const rl = throttle(`att-create:${clientIp(req)}`, 20, 3600);
  if (!rl.ok) return NextResponse.json({ error: `too many attempts — retry in ${rl.retryAfterSec}s` }, { status: 429 });
  const slug = String(body.versionSlug ?? "demo-20q-15min-v1");
  const { PLATFORM_VERSIONS } = await import("@/lib/study-platform/curriculum");
  const version = PLATFORM_VERSIONS.find((x) => x.slug === slug || x.id === slug);
  if (!version) return NextResponse.json({ error: "unknown version" }, { status: 400 });
  let userId: string | null = null;
  try {
    userId = (await sessionUser(req.cookies.get(USER_COOKIE)?.value ?? ""))?.id ?? null;
  } catch { /* anonymous demo allowed */ }
  if (userId) {
    const mine = (await listAttempts().catch(() => [])).filter(
      (a) => a.userId === userId && (a.examVersionId === version.slug || a.examVersionId === version.id)
    );
    const active = mine.find((a) => !a.submittedAt && a.deadline > Date.now());
    if (active) {
      return NextResponse.json({ ok: true, resumed: true, attemptId: active.id, deadline: active.deadline, count: active.questionOrder.length });
    }
    if (version.attemptLimit && mine.length >= version.attemptLimit) {
      return NextResponse.json({ error: `attempt limit reached (${version.attemptLimit})` }, { status: 429 });
    }
  }
  const pool = (await allQuestions()).filter(
    (q) => q.status === "published" && (q.examVersionIds.includes(version.id) || q.postSlugs.some((p) => version.postSlugs.includes(p)))
  );
  const seed = Math.floor(Math.random() * 0x7fffffff);
  const picked = (version.shuffleQuestions ? seededShuffle(pool, seed) : pool).slice(0, 20);
  const optionOrder: Record<string, string[]> = {};
  for (const qItem of picked) {
    const ids = qItem.options.map((o) => o.id);
    optionOrder[qItem.id] = version.shuffleOptions ? seededShuffle(ids, seed + qItem.id.length) : ids;
  }
  const subjMap = chapterSubjectMap();
  const sectionOf: Record<string, string> = {};
  for (const qItem of picked) sectionOf[qItem.id] = resolveSection(version, qItem.chapterId, subjMap);
  const now = Date.now();
  const attempt: Attempt = {
    id: `att-${now.toString(36)}-${Math.floor(Math.random() * 0xffffff).toString(36)}`,
    userId,
    examVersionId: version.slug,
    seed,
    questionOrder: picked.map((qItem) => qItem.id),
    optionOrder,
    answers: {},
    startedAt: now,
    deadline: now + version.durationSec * 1000,
    submittedAt: null,
    autoSubmitted: false,
    leavePolicy: version.leave,
    keySnapshot: picked.some((qItem) => qItem.key.status === "provisional") ? "provisional" : "approved",
    sectionOf,
  };
  await upsertAttempt(attempt);
  return NextResponse.json({ ok: true, attemptId: attempt.id, deadline: attempt.deadline, count: picked.length });
}

/** PATCH /api/study-platform/attempts — idempotent autosave (answer + flag). */
export async function PATCH(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as { attemptId?: string; questionId?: string; optionId?: string | null; markedForReview?: boolean };
  if (!body.attemptId || !body.questionId) return NextResponse.json({ error: "attemptId + questionId required" }, { status: 400 });
  const a = await getAttempt(body.attemptId);
  if (!a) return NextResponse.json({ error: "attempt not found" }, { status: 404 });
  if (a.submittedAt) return NextResponse.json({ error: "already submitted" }, { status: 409 });
  if (Date.now() > a.deadline + 5000) return NextResponse.json({ error: "deadline passed — will auto-submit" }, { status: 410 });
  const next: Attempt = {
    ...a,
    answers: {
      ...a.answers,
      [body.questionId]: { questionId: body.questionId, optionId: body.optionId ?? null, markedForReview: body.markedForReview === true, updatedAt: Date.now() },
    },
  };
  await upsertAttempt(next);
  return NextResponse.json({ ok: true, savedAt: Date.now() });
}

/** DELETE /api/study-platform/attempts {attemptId} — cancel an unsubmitted attempt (owner or admin). */
export async function DELETE(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as { attemptId?: string };
  if (!body.attemptId) return NextResponse.json({ error: "attemptId required" }, { status: 400 });
  const a = await getAttempt(body.attemptId);
  if (!a) return NextResponse.json({ error: "attempt not found" }, { status: 404 });
  if (a.submittedAt) return NextResponse.json({ error: "already submitted — cannot cancel" }, { status: 409 });
  let userId: string | null = null;
  try {
    userId = (await sessionUser(req.cookies.get(USER_COOKIE)?.value ?? ""))?.id ?? null;
  } catch { /* anonymous */ }
  const admin = req.cookies.get("bornolab_admin")?.value ? true : false;
  if (!admin && a.userId !== userId) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const removed = await removeAttempt(a.id);
  return NextResponse.json({ ok: removed });
}
