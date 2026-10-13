import { NextRequest, NextResponse } from "next/server";
import { getProgress, listAttempts, listBookmarks } from "@/lib/study-platform/store";
import { USER_COOKIE, sessionUser } from "@/lib/users";

/** GET /api/study-platform/progress — history, mastery, queues (login required). */
export async function GET(req: NextRequest) {
  let userId: string | null = null;
  try {
    userId = (await sessionUser(req.cookies.get(USER_COOKIE)?.value ?? ""))?.id ?? null;
  } catch { /* anonymous */ }
  if (!userId) return NextResponse.json({ error: "login required" }, { status: 401 });
  const [prog, attempts, bookmarks] = await Promise.all([
    getProgress(userId).catch(() => null),
    listAttempts().catch(() => []),
    listBookmarks(userId).catch(() => []),
  ]);
  const mine = attempts.filter((a) => a.userId === userId).sort((a, b) => b.startedAt - a.startedAt).slice(0, 50);
  return NextResponse.json({
    progress: prog ?? { userId, chapterMastery: {}, wrongQueue: [], unansweredQueue: [], streakDays: 0 },
    attempts: mine.map((a) => ({ id: a.id, version: a.examVersionId, startedAt: a.startedAt, submittedAt: a.submittedAt, score: a.score ?? null, needsRecalculation: a.needsRecalculation ?? false })),
    bookmarks,
    disclaimer: "Readiness and heatmaps are study guidance only — not a prediction of official exam results.",
  });
}
