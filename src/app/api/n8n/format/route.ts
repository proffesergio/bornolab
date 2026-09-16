import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/n8n/format — secure proxy to n8n auto-format workflow.
 * Body: { fileName, jobType: 'journal'|'book-en'|'book-bn', params?, referenceUrl?, webhookUrl? }
 * Env: N8N_FORMAT_WEBHOOK_URL, N8N_API_KEY
 * If no webhook configured → returns mock plan so UI works out-of-box.
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const url = process.env.N8N_FORMAT_WEBHOOK_URL;
  const key = process.env.N8N_API_KEY;

  if (!url) {
    return NextResponse.json({
      ok: true,
      mocked: true,
      message: "n8n not configured — returning execution plan (set N8N_FORMAT_WEBHOOK_URL to go live).",
      plan: {
        jobType: body.jobType ?? "book-bn",
        steps: ["ingest .docx", "parse reference .dotx", "apply EN/BN font rules", "page size + margins", "headings + spacings", "tables: borders + merges", "export .docx + print PDF"],
        params: body.params ?? {},
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
