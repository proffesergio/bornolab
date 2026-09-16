import { NextRequest, NextResponse } from "next/server";

/** GET /api/fonts?url=...&name=... → streams font as attachment (content-disposition) */
export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");
  const name = req.nextUrl.searchParams.get("name") || "font";
  if (!url) return NextResponse.json({ error: "missing url" }, { status: 400 });
  try {
    const upstream = await fetch(url);
    if (!upstream.ok) return NextResponse.json({ error: `upstream ${upstream.status}` }, { status: 502 });
    const buf = await upstream.arrayBuffer();
    return new NextResponse(buf, {
      headers: {
        "Content-Type": "font/ttf",
        "Content-Disposition": `attachment; filename="${name}.ttf"`,
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
