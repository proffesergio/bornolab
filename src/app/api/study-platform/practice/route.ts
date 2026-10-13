import { NextRequest, NextResponse } from "next/server";
import { getPublishedSeedQuestions, mergeQuestions, versionBySlug } from "@/lib/study-platform/catalog";
import { getProgress, listBookmarks, listQuestions } from "@/lib/study-platform/store";
import { USER_COOKIE, sessionUser } from "@/lib/users";

/** POST /api/study-platform/practice — build an instant-feedback set from filters. */
export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as {
    version?: string; difficulty?: string; chapter?: string; subject?: string;
    lang?: string; qtype?: string; mode?: string; count?: number;
  };
  const stored = await listQuestions().catch(() => []);
  let pool = mergeQuestions(getPublishedSeedQuestions(), stored).filter((q) => q.status === "published");
  const v = versionBySlug(String(body.version ?? "demo-20q-15min-v1"));
  if (v) pool = pool.filter((q) => q.examVersionIds.includes(v.id) || q.postSlugs.some((p) => v.postSlugs.includes(p)));
  if (body.difficulty) pool = pool.filter((q) => q.difficulty === body.difficulty);
  if (body.chapter) {
    const { PLATFORM_CHAPTERS } = await import("@/lib/study-platform/curriculum");
    const ch = PLATFORM_CHAPTERS.find((c) => c.slug === body.chapter || c.id === body.chapter);
    if (ch) pool = pool.filter((q) => q.chapterId === ch.id);
  }
  if (body.qtype) pool = pool.filter((q) => q.type === body.qtype);

  // wrong/unanswered/bookmarked queues need login — anonymous gets full pool.
  let userId: string | null = null;
  try {
    userId = (await sessionUser(req.cookies.get(USER_COOKIE)?.value ?? ""))?.id ?? null;
  } catch { /* anonymous */ }
  if (userId && (body.mode === "wrong" || body.mode === "unanswered")) {
    const prog = await getProgress(userId).catch(() => null);
    const want = body.mode === "wrong" ? prog?.wrongQueue ?? [] : prog?.unansweredQueue ?? [];
    if (want.length > 0) pool = pool.filter((q) => want.includes(q.id));
  }
  if (userId && body.mode === "bookmarked") {
    const marks = await listBookmarks(userId).catch(() => []);
    const ids = new Set(marks.filter((m) => m.kind === "question").map((m) => m.refId));
    pool = pool.filter((q) => ids.has(q.id));
  }

  const count = Math.max(1, Math.min(20, Number(body.count ?? 10) || 10));
  return NextResponse.json({ items: pool.slice(0, count), total: pool.length });
}
