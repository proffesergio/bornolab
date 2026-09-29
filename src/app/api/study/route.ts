import { NextRequest, NextResponse } from "next/server";
import { getSiteConfig } from "@/lib/site-config";
import { buildStudyCatalog, type StudyCategory, type StudyFileType } from "@/lib/study-data";

/** GET /api/study — public catalog of enabled study materials (read/share). */
export async function GET() {
  const config = await getSiteConfig();
  const catalog = buildStudyCatalog(config.studyOverrides ?? {}, config.customStudy ?? []);
  return NextResponse.json({
    materials: catalog.filter((m) => m.enabled),
    categories: ["admission", "ssc", "hsc", "bachelor", "masters"],
  });
}

/** POST /api/study — admin creates a study material (stored in site-config customStudy). */
export async function POST(req: NextRequest) {
  const { requireAdmin } = await import("@/app/api/admin/me/route");
  const auth = await requireAdmin(req);
  if (auth instanceof NextResponse) return auth;
  const body = (await req.json().catch(() => ({}))) as {
    title?: unknown; category?: unknown; subcategory?: unknown;
    description?: unknown; fileUrl?: unknown; fileType?: unknown;
    topics?: unknown; featured?: unknown;
  };
  const title = String(body.title ?? "").trim();
  const category = String(body.category ?? "") as StudyCategory;
  const fileUrl = String(body.fileUrl ?? "").trim();
  if (!title) return NextResponse.json({ error: "title is required" }, { status: 400 });
  if (!["admission", "ssc", "hsc", "bachelor", "masters"].includes(category)) {
    return NextResponse.json({ error: "invalid category" }, { status: 400 });
  }
  if (!fileUrl || (!fileUrl.startsWith("/uploads/study/") && !/^https:\/\//.test(fileUrl))) {
    return NextResponse.json({ error: "fileUrl must be /uploads/study/… or https://…" }, { status: 400 });
  }
  const rawType = String(body.fileType ?? "");
  const fileType: StudyFileType = (["pdf", "html", "link"] as const).includes(rawType as StudyFileType)
    ? (rawType as StudyFileType)
    : /\.pdf($|\?)/i.test(fileUrl) ? "pdf" : /\.html?($|\?)/i.test(fileUrl) ? "html" : "link";
  const { updateSiteConfig } = await import("@/lib/site-config");
  const config = await getSiteConfig();
  const item = {
    id: `study-${Date.now().toString(36)}${Math.floor(Math.random() * 0xffffff).toString(36)}`,
    title: title.slice(0, 160),
    category,
    subcategory: String(body.subcategory ?? "").trim().slice(0, 120) || undefined,
    description: String(body.description ?? "").trim().slice(0, 2000),
    fileUrl,
    fileType,
    topics: Array.isArray(body.topics) ? body.topics.filter((t) => typeof t === "string").slice(0, 12) : [],
    featured: body.featured === true,
    enabled: true,
    createdAt: Date.now(),
  };
  const next = await updateSiteConfig({ customStudy: [...(config.customStudy ?? []), item] });
  return NextResponse.json({ ok: true, item, count: next.customStudy.length });
}

/** DELETE /api/study?id=… — admin removes a custom study material. */
export async function DELETE(req: NextRequest) {
  const { requireAdmin } = await import("@/app/api/admin/me/route");
  const auth = await requireAdmin(req);
  if (auth instanceof NextResponse) return auth;
  const id = req.nextUrl.searchParams.get("id") ?? "";
  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });
  const { updateSiteConfig } = await import("@/lib/site-config");
  const config = await getSiteConfig();
  const target = (config.customStudy ?? []).find((m) => m.id === id);
  if (!target) return NextResponse.json({ error: "not found" }, { status: 404 });
  const overrides = { ...(config.studyOverrides ?? {}) };
  delete overrides[id];
  await updateSiteConfig({
    customStudy: (config.customStudy ?? []).filter((m) => m.id !== id),
    studyOverrides: overrides,
  });
  return NextResponse.json({ ok: true, removedFile: target.fileUrl.startsWith("/uploads/") ? target.fileUrl : null });
}
