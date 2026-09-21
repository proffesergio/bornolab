import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/n8n/split — secure proxy to n8n server-side split workflow (>100MB files).
 * Body: { fileName, ranges?, params? }
 * Env: N8N_SPLIT_WEBHOOK_URL, N8N_API_KEY
 * If no webhook configured → returns mock plan so UI works out-of-box.
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const url = process.env.N8N_SPLIT_WEBHOOK_URL;
  const key = process.env.N8N_API_KEY;

  if (!url) {
    return NextResponse.json({
      ok: true,
      mocked: true,
      message: "n8n not configured — returning execution plan (set N8N_SPLIT_WEBHOOK_URL to go live).",
      plan: {
        ranges: (body as { ranges?: unknown }).ranges ?? "1-3, 5",
        steps: ["ingest PDF", "validate ranges", "split server-side", "respond with part URLs"],
        params: (body as { params?: unknown }).params ?? {},
      },
      docs: "docs/plans.md",
    });
  }

  const r = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(key ? { "X-API-Key": key } : {}) },
    body: JSON.stringify({ source: "bornolab", ...body }),
  });
  const text = await r.text();
  try {
    return NextResponse.json(JSON.parse(text), { status: r.status });
  } catch {
    return new NextResponse(text, { status: r.status });
  }
}

/** GET /api/n8n/split — liveness for the client status badge. */
export async function GET() {
  return NextResponse.json({ configured: Boolean(process.env.N8N_SPLIT_WEBHOOK_URL) });
}
