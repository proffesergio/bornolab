import { NextRequest, NextResponse } from "next/server";
import { getProgress, listQuestions, saveProgress } from "@/lib/study-platform/store";
import { getPublishedSeedQuestions, mergeQuestions } from "@/lib/study-platform/catalog";
import { dueQueue, gradeCard, newCard, summarize } from "@/lib/study-platform/sm2";
import { USER_COOKIE, sessionUser } from "@/lib/users";
import type { UserProgress } from "@/lib/study-platform/types";

async function requireUser(req: NextRequest): Promise<string | NextResponse> {
  try {
    const u = await sessionUser(req.cookies.get(USER_COOKIE)?.value ?? "");
    if (u) return u.id;
  } catch { /* anonymous */ }
  return NextResponse.json({ error: "login required" }, { status: 401 });
}

/** GET /api/study-platform/schedule — due SM-2 queue (login). */
export async function GET(req: NextRequest) {
  const uid = await requireUser(req);
  if (uid instanceof NextResponse) return uid;
  const stored = await listQuestions().catch(() => []);
  const all = mergeQuestions(getPublishedSeedQuestions(), stored).filter((q) => q.status === "published");
  const prog: UserProgress | null = await getProgress(uid).catch(() => null);
  const cards = prog?.srCards ?? {};
  const ids = all.map((q) => q.id);
  const now = Date.now();
  const queueIds = dueQueue(cards, ids, now, 30);
  const byId = new Map(all.map((q) => [q.id, q]));
  return NextResponse.json({
    queue: queueIds.map((id) => byId.get(id)).filter(Boolean),
    summary: summarize(cards, ids, now),
  });
}

/** POST /api/study-platform/schedule {questionId, grade 0|3|4|5} — record an SM-2 grade (login). */
export async function POST(req: NextRequest) {
  const uid = await requireUser(req);
  if (uid instanceof NextResponse) return uid;
  const body = (await req.json().catch(() => ({}))) as { questionId?: string; grade?: number };
  if (!body.questionId || ![0, 3, 4, 5].includes(Number(body.grade))) {
    return NextResponse.json({ error: "questionId + grade (0|3|4|5) required" }, { status: 400 });
  }
  const now = Date.now();
  const prog: UserProgress = (await getProgress(uid).catch(() => null)) ?? { userId: uid, chapterMastery: {}, wrongQueue: [], unansweredQueue: [], streakDays: 0 };
  const cards = { ...(prog.srCards ?? {}) };
  cards[body.questionId] = gradeCard(cards[body.questionId] ?? newCard(now), Number(body.grade), now);
  await saveProgress({ ...prog, srCards: cards });
  const stored = await listQuestions().catch(() => []);
  const ids = mergeQuestions(getPublishedSeedQuestions(), stored).filter((q) => q.status === "published").map((q) => q.id);
  return NextResponse.json({ ok: true, card: cards[body.questionId], summary: summarize(cards, ids, Date.now()) });
}
