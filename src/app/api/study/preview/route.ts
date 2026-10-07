import { NextRequest, NextResponse } from "next/server";
import { PDFDocument } from "pdf-lib";
import { getSiteConfig } from "@/lib/site-config";
import { buildStudyCatalog } from "@/lib/study-data";
import { loadStudyFile } from "@/lib/study-access";
import { DEFAULT_PREVIEW_PAGES } from "@/lib/study-data";

export const runtime = "nodejs";

/**
 * GET /api/study/preview?id=… — public free preview: first N pages of a PDF.
 * Anonymous users only ever receive these bytes; the full file requires
 * /api/study/read (login + entitlement). Non-PDF materials have no page
 * preview — the reader UI gates them instead.
 */
export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id") ?? "";
  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });
  const config = await getSiteConfig();
  const material = buildStudyCatalog(config.studyOverrides ?? {}, config.customStudy ?? []).find(
    (m) => m.id === id && m.enabled
  );
  if (!material) return NextResponse.json({ error: "material not found" }, { status: 404 });
  if (material.fileType !== "pdf") {
    return NextResponse.json({ error: "preview is available for PDF guides" }, { status: 400 });
  }
  const loaded = await loadStudyFile(material, req.nextUrl.origin);
  if (!loaded) return NextResponse.json({ error: "file not found" }, { status: 404 });
  try {
    const src = await PDFDocument.load(loaded.data, { ignoreEncryption: true });
    const total = src.getPageCount();
    const n = Math.max(1, Math.min(20, Number(material.previewPages ?? DEFAULT_PREVIEW_PAGES) || DEFAULT_PREVIEW_PAGES));
    if (total <= n) {
      return new NextResponse(loaded.data, {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": "inline",
          "Cache-Control": "public, max-age=3600",
          "X-Pdf-Pages": String(total),
          "X-Pdf-Preview": "full",
        },
      });
    }
    const out = await PDFDocument.create();
    const pages = await out.copyPages(src, Array.from({ length: n }, (_, i) => i));
    pages.forEach((p) => out.addPage(p));
    out.setTitle(`${material.title} — free preview (first ${n} of ${total} pages)`);
    const bytes = await out.save();
    return new NextResponse(bytes.buffer as ArrayBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": "inline",
        "Cache-Control": "public, max-age=3600",
        "X-Pdf-Pages": String(total),
        "X-Pdf-Preview": `${n}-of-${total}`,
      },
    });
  } catch {
    return NextResponse.json({ error: "could not build preview" }, { status: 500 });
  }
}
