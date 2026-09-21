import { NextRequest, NextResponse } from "next/server";

/** Local font files only — never fetch arbitrary upstream URLs (SSRF-safe). */
const ALLOWED_RE = /^\/fonts\/[A-Za-z0-9_.\-/]+\.(ttf|otf|woff2?)$/i;
const MAX_BYTES = 15 * 1024 * 1024; // 15 MB cap per font file

const MIME: Record<string, string> = {
  ttf: "font/ttf",
  otf: "font/otf",
  woff: "font/woff",
  woff2: "font/woff2",
};

/** GET /api/fonts?url=/fonts/…&name=… → streams a local font as attachment. */
export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url") ?? "";
  const rawName = req.nextUrl.searchParams.get("name") || "font";
  if (!ALLOWED_RE.test(url)) {
    return NextResponse.json({ error: "only /fonts/*.ttf|otf|woff served here" }, { status: 400 });
  }
  const name = rawName.replace(/["\r\n/\\]/g, "").slice(0, 80) || "font";
  try {
    const upstream = await fetch(new URL(url, req.nextUrl.origin));
    if (!upstream.ok) return NextResponse.json({ error: `font not found (${upstream.status})` }, { status: upstream.status === 404 ? 404 : 502 });
    const len = Number(upstream.headers.get("content-length") || 0);
    if (len > MAX_BYTES) return NextResponse.json({ error: "font too large" }, { status: 413 });
    const buf = await upstream.arrayBuffer();
    if (buf.byteLength === 0 || buf.byteLength > MAX_BYTES) {
      return NextResponse.json({ error: "font too large or empty" }, { status: 413 });
    }
    const ext = (url.split(".").pop() ?? "ttf").toLowerCase();
    return new NextResponse(buf, {
      headers: {
        "Content-Type": MIME[ext] ?? "font/ttf",
        "Content-Disposition": `attachment; filename="${name}.${ext}"`,
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
