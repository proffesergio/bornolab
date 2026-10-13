import { NextRequest, NextResponse } from "next/server";
import { getAttempt, getProgress, listQuestions, saveProgress, upsertAttempt } from "@/lib/study-platform/store";
import { getPublishedSeedQuestions, mergeQuestions, versionBySlug } from "@/lib/study-platform/catalog";
import { scoreAttempt, seededShuffle } from "@/lib/study-platform/scoring";
import { USER_COOKIE, sessionUser } from "@/lib/users";
import type { Attempt, Question } from "@/lib/study-platform/types";

async function allQuestions(): Promise<Question[]> {
  const stored = await listQuestions().catch(() => []);
  return mergeQuestions(getPublishedSeedQuestions(), stored);
}

function publicAttempt(a: Attempt, questions: Question[]) {
  // Privacy-safe: strip nothing sensitive, but never leak other users' data (checked by caller).
  return { ...a, questions };
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
    const questions = (await allQuestions()).filter((q) => a.questionOrder.includes(q.id));
    const now = Date.now();
    const score = scoreAttempt({ version, questions, answers: a.answers, startedAt: a.startedAt, submittedAt: now });
    const next: Attempt = { ...a, submittedAt: now, autoSubmitted: body.auto === true, score, keySnapshot: score.keyStatus };
    await upsertAttempt(next);
    // Update learner progress queues (best-effort, login only).
    try {
      const user = await sessionUser(req.cookies.get(USER_COOKIE)?.value ?? "");
      if (user) {
        const prog = (await getProgress(user.id).catch(() => null)) ?? { userId: user.id, chapterMastery: {}, wrongQueue: [], unansweredQueue: [], streakDays: 0 };
        const wrong = new Set(prog.wrongQueue);
        const un = new Set(prog.unansweredQueue);
        for (const qItem of questions) {
          const ans = next.answers[qItem.id]?.optionId ?? null;
          if (!ans) un.add(qItem.id);
          else if (ans !== qItem.key.optionId) { wrong.add(qItem.id); un.delete(qItem.id); }
          else { wrong.delete(qItem.id); un.delete(qItem.id); }
        }
        await saveProgress({ ...prog, wrongQueue: [...wrong].slice(-200), unansweredQueue: [...un].slice(-200) });
      }
    } catch { /* progress is advisory */ }
    return NextResponse.json({ ok: true, attempt: publicAttempt(next, questions) });
  }

  // create
  const slug = String(body.versionSlug ?? "demo-20q-15min-v1");
  const { PLATFORM_VERSIONS } = await import("@/lib/study-platform/curriculum");
  const version = PLATFORM_VERSIONS.find((x) => x.slug === slug || x.id === slug);
  if (!version) return NextResponse.json({ error: "unknown version" }, { status: 400 });
  let userId: string | null = null;
  try {
    userId = (await sessionUser(req.cookies.get(USER_COOKIE)?.value ?? ""))?.id ?? null;
  } catch { /* anonymous demo allowed */ }
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
