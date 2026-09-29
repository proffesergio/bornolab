import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { getSiteConfig } from "@/lib/site-config";
import { buildStudyCatalog } from "@/lib/study-data";
import { USER_COOKIE, logAudit, sessionUser } from "@/lib/users";

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
    const safeTitle = material.title.replace(/["\r\n/\\]/g, "").trim().slice(0, 80) || "study-material";
    let data: ArrayBuffer | null = null;
    try {
      // Local/self-host: files live on disk.
      const filePath = path.join(process.cwd(), "public", decodeURIComponent(url));
      const stat = await fs.stat(filePath);
      if (stat.isFile() && stat.size > 0 && stat.size <= MAX_BYTES) {
        data = (await fs.readFile(filePath)).buffer as ArrayBuffer;
      }
    } catch { /* serverless FS — fall through to origin fetch */ }
    if (!data) {
      // Serverless (Vercel): public/ files are served from the CDN, not the
      // function filesystem — stream them through the origin instead.
      const upstream = await fetch(new URL(url, req.nextUrl.origin));
      if (!upstream.ok) return NextResponse.json({ error: "file not found" }, { status: 404 });
      const len = Number(upstream.headers.get("content-length") || 0);
      if (len > MAX_BYTES) return NextResponse.json({ error: "file too large" }, { status: 413 });
      const buf = await upstream.arrayBuffer();
      if (buf.byteLength === 0 || buf.byteLength > MAX_BYTES) {
        return NextResponse.json({ error: "file unavailable" }, { status: 404 });
      }
      data = buf;
    }
    const ext = (url.split(".").pop() ?? "pdf").toLowerCase();
    // Member download ledger for Admin → Customers → Activity.
    await logAudit(`user:${user.id}`, "study.download", `${material.id} • ${material.title.slice(0, 120)}`);
    return new NextResponse(data, {
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
