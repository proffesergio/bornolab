import { NextRequest, NextResponse } from "next/server";
import { appendAudit, appendEvidence, listAttempts, listQuestions, saveAttempts, saveQuestions, upsertAttempt } from "@/lib/study-platform/store";
import { parseCsvImport, parseJsonImport, stageRow } from "@/lib/study-platform/ingestion";
import { validateForPublication } from "@/lib/study-platform/validation";
import type { Question } from "@/lib/study-platform/types";

/** POST /api/study-platform/import — admin: JSON/CSV/manual → staging + draft creation. */
export async function POST(req: NextRequest) {
  const { requireAdmin } = await import("@/app/api/admin/me/route");
  const auth = await requireAdmin(req);
  if (auth instanceof NextResponse) return auth;
  const actor = String(auth);
  const body = (await req.json().catch(() => ({}))) as {
    format?: string; text?: string; rows?: unknown[];
    sourceUrl?: string; sourceTitle?: string; licenseState?: string;
    publish?: boolean;
  };
  let rows: ReturnType<typeof parseJsonImport> = [];
  try {
    if (Array.isArray(body.rows)) rows = parseJsonImport(JSON.stringify(body.rows));
    else if (body.format === "csv") rows = parseCsvImport(String(body.text ?? ""));
    else rows = parseJsonImport(String(body.text ?? "[]"));
  } catch (e) {
    return NextResponse.json({ error: `parse failed: ${(e as Error).message}` }, { status: 400 });
  }
  const staged = rows.map((r) =>
    stageRow(r, { sourceUrl: String(body.sourceUrl ?? r.sourceUrl ?? ""), sourceTitle: String(body.sourceTitle ?? r.sourceTitle ?? "staged import"), licenseState: String(body.licenseState ?? "pending") })
  );
  for (const s of staged) {
    await appendEvidence({ ...s, actor } as unknown as Record<string, unknown>);
  }
  // Create drafts only (never auto-publish); publication requires review API.
  const existing = await listQuestions().catch(() => [] as Question[]);
  const drafts: Question[] = staged.map((s, i) => {
    const now = Date.now();
    const id = `imp-${now.toString(36)}-${i}-${Math.floor(Math.random() * 0xffff).toString(36)}`;
    const bnOpts = s.row.optionsBn ?? [];
    const enOpts = s.row.optionsEn ?? [];
    const options = [0, 1, 2, 3].map((k) => ({
      id: `${id}-o${k + 1}`,
      order: k + 1,
      locale: { bn: bnOpts[k] ?? "", en: enOpts[k] ?? bnOpts[k] ?? "" } as Record<"bn" | "en", string>,
    }));
    const answerIdx = Math.max(0, Math.min(3, Number(s.row.answerIndex ?? 0) || 0));
    return {
      id, stableId: id, type: "mcq", difficulty: "medium", cognitive: "recall",
      chapterId: s.row.chapterId ?? "ch-net-ip", postSlugs: [], examVersionIds: [], tags: ["imported"],
      locale: {
        bn: { stem: s.row.stemBn ?? "", options: bnOpts, explanation: "" },
        en: { stem: s.row.stemEn ?? "", options: enOpts, explanation: "" },
      },
      options,
      key: { optionId: options[answerIdx].id, status: "provisional" as const, confidence: "low" as const },
      citations: s.sourceUrl ? [{ url: s.sourceUrl, title: s.sourceTitle, pageOrSection: s.pageOrSection, retrievalDate: s.retrievalDate, provenance: "staged-import", licenseOrPermission: s.licenseState }] : [],
      license: { status: "pending" as const, note: `Staged by ${actor}; paraphrase + independent solve required.` },
      status: "draft" as const, version: 1, ocrFlags: s.ocrFlags, history: [], createdAt: now, updatedAt: now,
    };
  });
  await saveQuestions([...existing, ...drafts]);
  await appendAudit({ id: `aud-${Date.now().toString(36)}`, at: Date.now(), actor, action: "study.import", entity: "question", entityId: `${drafts.length}-drafts`, detail: `${staged.length} rows staged` });
  const blocked = drafts.map((d) => ({ id: d.id, issues: validateForPublication(d).map((x) => x.code) }));
  return NextResponse.json({ ok: true, staged: staged.length, drafts: drafts.length, blocked, note: "Drafts only — use /review to approve. Raw evidence is admin-only." });
}

/** GET — method hint (POST only). */
export async function GET() {
  return NextResponse.json({ error: "POST only" }, { status: 405 });
}

// Recalculation lives in review route (single RBAC surface); keep helper here for reuse.
export async function recalculateForQuestion(questionId: string): Promise<string[]> {
  const attempts = await listAttempts().catch(() => []);
  const touched: string[] = [];
  for (const a of attempts) {
    if (!a.questionOrder.includes(questionId) || !a.submittedAt || !a.score) continue;
    await upsertAttempt({ ...a, needsRecalculation: true, correctionNote: `Key updated for ${questionId} — pending re-score.` });
    touched.push(a.id);
  }
  await saveAttempts(await listAttempts().catch(() => attempts));
  return touched;
}
