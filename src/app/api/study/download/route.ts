import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { getSiteConfig } from "@/lib/site-config";
import { buildStudyCatalog } from "@/lib/study-data";
import { USER_COOKIE, sessionUser } from "@/lib/users";

export const runtime = "nodejs";

/** Only local study files are served here — never arbitrary paths (path-safe). */
const ALLOWED_RE = /^\/uploads\/study\/[A-Za-z0-9_.\-/%() ]+\.(pdf|html|zip)$/i;
const MAX_BYTES = 100 * 1024 * 1024;

const MIME: Record<string, string> = {
  pdf: "application/pdf",
  html: "text/html",
  zip: "application/zip",
};

/**
 * GET /api/study/download?id=… — login-gated download.
 * Reading/sharing stays public on /study; this endpoint (used by the
 * Download button) requires a signed-in user and forces an attachment.
 */
export async function GET(req: NextRequest) {
  const user = await sessionUser(req.cookies.get(USER_COOKIE)?.value ?? "");
  if (!user) {
    return NextResponse.json(
      { error: "Login required to download study files.", loginUrl: "/login" },
      { status: 401 }
    );
  }
  const id = req.nextUrl.searchParams.get("id") ?? "";
  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

  const config = await getSiteConfig();
  const material = buildStudyCatalog(config.studyOverrides ?? {}, config.customStudy ?? []).find(
    (m) => m.id === id && m.enabled
  );
  if (!material) return NextResponse.json({ error: "material not found" }, { status: 404 });
  const url = material.fileUrl;
  if (!ALLOWED_RE.test(url) || url.includes("..")) {
    return NextResponse.json({ error: "only local /uploads/study/… files are downloadable here" }, { status: 400 });
  }
  try {
    const filePath = path.join(process.cwd(), "public", decodeURIComponent(url));
    const stat = await fs.stat(filePath);
    if (!stat.isFile() || stat.size === 0 || stat.size > MAX_BYTES) {
      return NextResponse.json({ error: "file unavailable" }, { status: 404 });
    }
    const buf = await fs.readFile(filePath);
    const ext = (url.split(".").pop() ?? "pdf").toLowerCase();
    const safeTitle = material.title.replace(/["\r\n/\\]/g, "").trim().slice(0, 80) || "study-material";
    return new NextResponse(new Uint8Array(buf), {
      headers: {
        "Content-Type": MIME[ext] ?? "application/octet-stream",
        "Content-Disposition": `attachment; filename="${safeTitle}.${ext}"`,
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch {
    return NextResponse.json({ error: "file not found" }, { status: 404 });
  }
}
