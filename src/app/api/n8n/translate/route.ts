import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/n8n/translate — secure proxy to n8n OCR/translate workflow.
 * Body: { fileName, mode: 'pdf2docx-ocr' | 'ai-translate', params? }
 * Env: N8N_TRANSLATE_WEBHOOK_URL, N8N_API_KEY
 * If no webhook configured → returns mock plan so UI works out-of-box.
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const url = process.env.N8N_TRANSLATE_WEBHOOK_URL;
  const key = process.env.N8N_API_KEY;

  if (!url) {
    return NextResponse.json({
      ok: true,
      mocked: true,
      message: "n8n not configured — returning execution plan (set N8N_TRANSLATE_WEBHOOK_URL to go live).",
      plan: {
        mode: (body as { mode?: string }).mode ?? "pdf2docx-ocr",
        steps: ["ingest PDF", "Tesseract ben+eng OCR on scanned pages", "rebuild text flow", "optional AI translation", "export .docx"],
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

/** GET /api/n8n/translate — liveness for the client status badge. */
export async function GET() {
  return NextResponse.json({ configured: Boolean(process.env.N8N_TRANSLATE_WEBHOOK_URL) });
}
