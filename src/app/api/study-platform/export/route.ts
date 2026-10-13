import { NextRequest, NextResponse } from "next/server";
import { getPublishedSeedQuestions, mergeQuestions } from "@/lib/study-platform/catalog";
import { listAttempts, listQuestions } from "@/lib/study-platform/store";

function csvCell(v: unknown): string {
  const s = String(v ?? "");
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** GET /api/study-platform/export?kind=questions|attempts&format=json|csv — admin only. */
export async function GET(req: NextRequest) {
  const { requireAdmin } = await import("@/app/api/admin/me/route");
  const auth = await requireAdmin(req);
  if (auth instanceof NextResponse) return auth;
  const kind = req.nextUrl.searchParams.get("kind") ?? "questions";
  const format = req.nextUrl.searchParams.get("format") ?? "json";

  if (kind === "attempts") {
    const attempts = await listAttempts().catch(() => []);
    const rows = attempts.map((a) => ({
      id: a.id,
      userId: a.userId ?? "anon",
      version: a.examVersionId,
      startedAt: new Date(a.startedAt).toISOString(),
      submittedAt: a.submittedAt ? new Date(a.submittedAt).toISOString() : "",
      net: a.score?.net ?? "",
      pct: a.score?.pct ?? "",
      correct: a.score?.correct ?? "",
      incorrect: a.score?.incorrect ?? "",
      unanswered: a.score?.unanswered ?? "",
      needsRecalculation: a.needsRecalculation === true,
    }));
    if (format === "csv") {
      const head = ["id", "userId", "version", "startedAt", "submittedAt", "net", "pct", "correct", "incorrect", "unanswered", "needsRecalculation"];
      const body = [head.join(","), ...rows.map((r) => head.map((h) => csvCell((r as Record<string, unknown>)[h])).join(","))].join("\n");
      return new NextResponse(body, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": "attachment; filename=study-attempts.csv" } });
    }
    return NextResponse.json({ attempts: rows, count: rows.length });
  }

  const stored = await listQuestions().catch(() => []);
  const all = mergeQuestions(getPublishedSeedQuestions(), stored);
  if (format === "csv") {
    const head = ["id", "chapterId", "difficulty", "status", "keyStatus", "confidence", "stemBn", "stemEn"];
    const body = [
      head.join(","),
      ...all.map((q) => [q.id, q.chapterId, q.difficulty, q.status, q.key.status, q.key.confidence, q.locale.bn.stem, q.locale.en.stem].map(csvCell).join(",")),
    ].join("\n");
    return new NextResponse(body, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": "attachment; filename=study-questions.csv" } });
  }
  return NextResponse.json({ questions: all, count: all.length });
}
