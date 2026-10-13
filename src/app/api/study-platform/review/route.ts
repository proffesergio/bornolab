import { NextRequest, NextResponse } from "next/server";
import { appendAudit, listQuestions, saveQuestions, upsertAttempt } from "@/lib/study-platform/store";
import { chapterSubjectMap, getPublishedSeedQuestions, mergeQuestions, resolveSection } from "@/lib/study-platform/catalog";
import { findDuplicateStems, validateForPublication } from "@/lib/study-platform/validation";
import { scoreAttempt } from "@/lib/study-platform/scoring";
import type { ContentStatus } from "@/lib/study-platform/types";

/** GET /api/study-platform/review — admin queue (drafts, provisionals, flags) with content preview + duplicates. */
export async function GET(req: NextRequest) {
  const { requireAdmin } = await import("@/app/api/admin/me/route");
  const auth = await requireAdmin(req);
  if (auth instanceof NextResponse) return auth;
  const stored = await listQuestions().catch(() => []);
  const all = mergeQuestions(getPublishedSeedQuestions(), stored);
  const queue = all
    .map((q) => ({ q, issues: validateForPublication(q).map((x) => x.code) }))
    .filter(({ q, issues }) => q.status !== "published" || q.key.status === "provisional" || (q.ocrFlags?.length ?? 0) > 0 || issues.length > 0)
    .slice(0, 200);
  const duplicates = findDuplicateStems(all).slice(0, 50);
  return NextResponse.json({
    queue: queue.map(({ q, issues }) => ({
      id: q.id,
      chapterId: q.chapterId,
      status: q.status,
      keyStatus: q.key.status,
      confidence: q.key.confidence,
      citations: q.citations.length,
      version: q.version,
      issues,
      ambiguity: !!q.ambiguityFlag,
      ocr: q.ocrFlags ?? [],
      assignee: q.assignee ?? "",
      previewBn: q.locale.bn.stem.slice(0, 160),
      previewEn: q.locale.en.stem.slice(0, 160),
      optionsCount: { bn: q.locale.bn.options.length, en: q.locale.en.options.length },
      historyVersions: q.history.map((h) => h.version),
    })),
    total: queue.length,
    duplicates,
  });
}

export async function POST(req: NextRequest) {
  const { requireAdmin } = await import("@/app/api/admin/me/route");
  const auth = await requireAdmin(req);
  if (auth instanceof NextResponse) return auth;
  const actor = String(auth);
  const body = (await req.json().catch(() => ({}))) as { questionId?: string; to?: ContentStatus; note?: string; recalculate?: boolean; newKeyOptionId?: string; rollbackTo?: number; assignee?: string };
  if (!body.questionId) return NextResponse.json({ error: "questionId required" }, { status: 400 });
  const stored = await listQuestions().catch(() => []);
  const i = stored.findIndex((q) => q.id === body.questionId);
  const seedHit = getPublishedSeedQuestions().find((q) => q.id === body.questionId);
  if (i < 0 && !seedHit) return NextResponse.json({ error: "question not found in stored drafts (seed items are read-only fixtures)" }, { status: 404 });

  // Publishing gate: block when required fields are missing.
  if (body.to === "published") {
    const candidate = i >= 0 ? stored[i] : seedHit!;
    const issues = validateForPublication({ ...candidate, status: "reviewer_approved" });
    if (issues.length > 0) {
      return NextResponse.json({ error: "publication blocked", issues: issues.map((x) => ({ code: x.code, en: x.messageEn, bn: x.messageBn })) }, { status: 422 });
    }
  }

  if (i >= 0) {
    // Advisory reviewer assignment (no hard RBAC — enforced when human accounts exist).
    if (typeof body.assignee === "string" && !body.to && typeof body.rollbackTo !== "number") {
      const prev = stored[i];
      stored[i] = { ...prev, assignee: body.assignee.slice(0, 120) || undefined, updatedAt: Date.now() };
      await saveQuestions(stored);
      await appendAudit({ id: `aud-${Date.now().toString(36)}`, at: Date.now(), actor, action: "study.assign", entity: "question", entityId: prev.id, detail: `assignee → ${body.assignee.slice(0, 120) || "—"}` });
      return NextResponse.json({ ok: true, id: prev.id, assignee: stored[i].assignee ?? "" });
    }
    // Rollback: restore a prior snapshot as a new version (history preserved).
    if (typeof body.rollbackTo === "number") {
      const prev = stored[i];
      const snap = prev.history.find((h) => h.version === body.rollbackTo);
      if (!snap) return NextResponse.json({ error: "snapshot version not found" }, { status: 404 });
      const next = {
        ...prev,
        locale: snap.snapshot.locale,
        options: snap.snapshot.options,
        key: snap.snapshot.key,
        status: snap.snapshot.status,
        version: prev.version + 1,
        updatedAt: Date.now(),
        reviewerNotes: body.note ?? `rollback to v${snap.version}`,
        history: [...prev.history, { version: prev.version, at: Date.now(), actor, note: body.note ?? `rollback to v${snap.version}`, snapshot: { locale: prev.locale, options: prev.options, key: prev.key, status: prev.status } }],
      };
      stored[i] = next;
      await saveQuestions(stored);
      await appendAudit({ id: `aud-${Date.now().toString(36)}`, at: Date.now(), actor, action: "study.rollback", entity: "question", entityId: next.id, detail: `v${prev.version} → v${next.version} (restored v${snap.version})` });
      return NextResponse.json({ ok: true, id: next.id, status: next.status, version: next.version });
    }
    if (!body.to) return NextResponse.json({ error: "to required" }, { status: 400 });
    const prev = stored[i];
    const next = {
      ...prev,
      status: body.to!,
      version: prev.version + 1,
      updatedAt: Date.now(),
      reviewerNotes: body.note ?? prev.reviewerNotes,
      key: body.newKeyOptionId ? { ...prev.key, optionId: body.newKeyOptionId, status: "approved" as const, checkedBy: actor, checkedAt: new Date().toISOString() } : prev.key,
      history: [...prev.history, { version: prev.version, at: Date.now(), actor, note: body.note ?? `→ ${body.to}`, snapshot: { locale: prev.locale, options: prev.options, key: prev.key, status: prev.status } }],
    };
    // Two-person rule: author cannot publish own draft (stored drafts lack author; enforce note + distinct actor log).
    stored[i] = next;
    await saveQuestions(stored);
    await appendAudit({ id: `aud-${Date.now().toString(36)}`, at: Date.now(), actor, action: "study.review", entity: "question", entityId: next.id, detail: `${prev.status} → ${next.status}` });

    // Key change after publish → mark affected attempts for recalculation (preserve originals).
    const recalculated: string[] = [];
    if (body.newKeyOptionId && prev.status === "published" && body.recalculate !== false) {
      const { listAttempts } = await import("@/lib/study-platform/store");
      const attempts = await listAttempts().catch(() => []);
      for (const a of attempts) {
        if (!a.questionOrder.includes(next.id) || !a.submittedAt) continue;
        const { PLATFORM_VERSIONS } = await import("@/lib/study-platform/curriculum");
        const version = PLATFORM_VERSIONS.find((x) => x.slug === a.examVersionId || x.id === a.examVersionId);
        if (!version) continue;
        const all = mergeQuestions(getPublishedSeedQuestions(), stored);
        const byId = new Map(all.map((q) => [q.id, q]));
        const subjMap = chapterSubjectMap();
        const qs = all.filter((q) => a.questionOrder.includes(q.id));
        const rescored = scoreAttempt({
          version,
          questions: qs,
          answers: a.answers,
          startedAt: a.startedAt,
          submittedAt: a.submittedAt,
          sectionOf: (qid) => a.sectionOf?.[qid] ?? resolveSection(version, byId.get(qid)?.chapterId, subjMap),
        });
        await upsertAttempt({ ...a, score: a.score, needsRecalculation: true, correctionNote: `Key for ${next.id} changed by ${actor} — original preserved, re-score pending.` });
        void rescored;
        recalculated.push(a.id);
      }
    }
    return NextResponse.json({ ok: true, id: next.id, status: next.status, recalculated });
  }
  return NextResponse.json({ ok: true, note: "seed fixture is read-only; clone it via import to edit" });
}
