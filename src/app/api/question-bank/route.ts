import { NextRequest, NextResponse } from "next/server";
import { getSiteConfig } from "@/lib/site-config";
import {
  QB_DEPARTMENTS,
  buildQuestionBankCatalog,
  type QBDocument,
  type QBFileType,
} from "@/lib/question-bank-data";

const VALID_DEPTS = new Set(QB_DEPARTMENTS.map((d) => d.id));

/** GET /api/question-bank — public catalog of enabled QB documents + taxonomy. */
export async function GET() {
  const config = await getSiteConfig();
  const catalog = buildQuestionBankCatalog(
    config.qbOverrides ?? {},
    config.customQuestionBank ?? []
  );
  return NextResponse.json({
    docs: catalog.filter((d) => d.enabled),
    departments: QB_DEPARTMENTS,
  });
}

/** POST /api/question-bank — admin attaches a PDF/link to a dept/subject/chapter. */
export async function POST(req: NextRequest) {
  const { requireAdmin } = await import("@/app/api/admin/me/route");
  const auth = await requireAdmin(req);
  if (auth instanceof NextResponse) return auth;
  const body = (await req.json().catch(() => ({}))) as {
    title?: unknown;
    deptId?: unknown;
    subjectId?: unknown;
    chapterId?: unknown;
    description?: unknown;
    fileUrl?: unknown;
    fileType?: unknown;
    sourcePdf?: unknown;
    questionCount?: unknown;
    featured?: unknown;
    access?: unknown;
    priceBDT?: unknown;
  };
  const title = String(body.title ?? "").trim();
  const deptId = String(body.deptId ?? "").trim();
  const fileUrl = String(body.fileUrl ?? "").trim();
  if (!title) return NextResponse.json({ error: "title is required" }, { status: 400 });
  if (!VALID_DEPTS.has(deptId)) {
    return NextResponse.json({ error: "invalid deptId" }, { status: 400 });
  }
  if (!fileUrl || (!fileUrl.startsWith("/uploads/study/") && !/^https:\/\//.test(fileUrl))) {
    return NextResponse.json(
      { error: "fileUrl must be /uploads/study/… or https://…" },
      { status: 400 }
    );
  }
  const rawType = String(body.fileType ?? "");
  const fileType: QBFileType = (["pdf", "html", "link"] as const).includes(rawType as QBFileType)
    ? (rawType as QBFileType)
    : /\.pdf($|\?)/i.test(fileUrl)
      ? "pdf"
      : /\.html?($|\?)/i.test(fileUrl)
        ? "html"
        : "link";
  const access = body.access === "paid" ? "paid" : "free";
  const { updateSiteConfig } = await import("@/lib/site-config");
  const config = await getSiteConfig();
  const item: QBDocument = {
    id: `qb-${Date.now().toString(36)}${Math.floor(Math.random() * 0xffffff).toString(36)}`,
    deptId,
    subjectId: String(body.subjectId ?? "").trim() || undefined,
    chapterId: String(body.chapterId ?? "").trim() || undefined,
    title: title.slice(0, 160),
    description: String(body.description ?? "").trim().slice(0, 2000),
    fileUrl,
    fileType,
    sourcePdf: String(body.sourcePdf ?? "").trim().slice(0, 200) || undefined,
    questionCount: Number(body.questionCount) > 0 ? Math.floor(Number(body.questionCount)) : undefined,
    access,
    priceBDT: access === "paid" ? Number(body.priceBDT) || 0 : 0,
    featured: body.featured === true,
    enabled: true,
    createdAt: Date.now(),
  };
  const next = await updateSiteConfig({
    customQuestionBank: [...(config.customQuestionBank ?? []), item],
  });
  return NextResponse.json({ ok: true, item, count: next.customQuestionBank.length });
}

/** DELETE /api/question-bank?id=… — admin removes a custom QB document. */
export async function DELETE(req: NextRequest) {
  const { requireAdmin } = await import("@/app/api/admin/me/route");
  const auth = await requireAdmin(req);
  if (auth instanceof NextResponse) return auth;
  const id = req.nextUrl.searchParams.get("id") ?? "";
  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });
  const { updateSiteConfig } = await import("@/lib/site-config");
  const config = await getSiteConfig();
  const target = (config.customQuestionBank ?? []).find((d) => d.id === id);
  if (!target) return NextResponse.json({ error: "not found" }, { status: 404 });
  const overrides = { ...(config.qbOverrides ?? {}) };
  delete overrides[id];
  await updateSiteConfig({
    customQuestionBank: (config.customQuestionBank ?? []).filter((d) => d.id !== id),
    qbOverrides: overrides,
  });
  return NextResponse.json({
    ok: true,
    removedFile: target.fileUrl.startsWith("/uploads/") ? target.fileUrl : null,
  });
}
