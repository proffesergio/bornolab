import { NextRequest, NextResponse } from "next/server";
import { appendEvidence, listEvidence } from "@/lib/study-platform/store";

/** GET /api/study-platform/evidence — admin-only raw evidence ledger. */
export async function GET(req: NextRequest) {
  const { requireAdmin } = await import("@/app/api/admin/me/route");
  const auth = await requireAdmin(req);
  if (auth instanceof NextResponse) return auth;
  const items = await listEvidence().catch(() => []);
  return NextResponse.json({ evidence: items.slice(-200).reverse(), count: items.length });
}

/** POST /api/study-platform/evidence — admin-only: store OCR pages as restricted evidence (never learner-visible). */
export async function POST(req: NextRequest) {
  const { requireAdmin } = await import("@/app/api/admin/me/route");
  const auth = await requireAdmin(req);
  if (auth instanceof NextResponse) return auth;
  const actor = String(auth);
  const body = (await req.json().catch(() => ({}))) as {
    sourceTitle?: string; sourceUrl?: string; licenseState?: string;
    pages?: { index: number; raw: string; clean: string; fixes: string[]; flags: string[] }[];
  };
  if (!Array.isArray(body.pages) || body.pages.length === 0) {
    return NextResponse.json({ error: "pages[] required" }, { status: 400 });
  }
  if (body.pages.length > 20) return NextResponse.json({ error: "max 20 pages per batch" }, { status: 400 });
  for (const p of body.pages.slice(0, 20)) {
    await appendEvidence({
      id: `ocr-${Date.now().toString(36)}-${p.index}-${Math.floor(Math.random() * 0xffff).toString(36)}`,
      kind: "ocr-page",
      actor,
      sourceTitle: String(body.sourceTitle ?? "ocr-upload").slice(0, 200),
      sourceUrl: String(body.sourceUrl ?? ""),
      licenseState: String(body.licenseState ?? "pending"),
      page: p.index,
      raw: String(p.raw ?? "").slice(0, 20000),
      clean: String(p.clean ?? "").slice(0, 20000),
      fixes: p.fixes ?? [],
      flags: p.flags ?? [],
      retrievalDate: new Date().toISOString().slice(0, 10),
      createdAt: Date.now(),
    } as unknown as Record<string, unknown>);
  }
  return NextResponse.json({ ok: true, stored: Math.min(body.pages.length, 20), note: "Evidence only — paraphrase via import/manual entry, then review." });
}
