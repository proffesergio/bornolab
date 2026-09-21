import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/n8n/format — secure proxy to n8n auto-format workflow.
 * JSON: { fileName, jobType: 'journal'|'book-en'|'book-bn', params?, referenceUrl? }
 * Multipart: file (.docx) + jobType + params (JSON string) — streamed to the webhook.
 * Env: N8N_FORMAT_WEBHOOK_URL, N8N_API_KEY
 * If no webhook configured → returns mock plan so UI works out-of-box.
 */
export async function POST(req: NextRequest) {
  const url = process.env.N8N_FORMAT_WEBHOOK_URL;
  const key = process.env.N8N_API_KEY;
  const isMultipart = (req.headers.get("content-type") ?? "").includes("multipart/form-data");

  if (!url) {
    let jobType = "book-bn";
    let params: unknown = {};
    let fileName = "";
    if (isMultipart) {
      const fd = await req.formData();
      jobType = String(fd.get("jobType") ?? "book-bn");
      fileName = (fd.get("file") as File | null)?.name ?? "";
      try { params = JSON.parse(String(fd.get("params") ?? "{}")); } catch { params = {}; }
    } else {
      const body = await req.json().catch(() => ({}));
      jobType = body.jobType ?? "book-bn";
      fileName = body.fileName ?? "";
      params = body.params ?? {};
    }
    return NextResponse.json({
      ok: true,
      mocked: true,
      message: "n8n not configured — returning execution plan (set N8N_FORMAT_WEBHOOK_URL to go live).",
      plan: {
        jobType,
        fileName,
        steps: ["ingest .docx", "parse reference .dotx", "apply EN/BN font rules", "page size + margins", "headings + spacings", "tables: borders + merges", "export .docx + print PDF"],
        params,
      },
      docs: "docs/plans.md",
    });
  }

  if (isMultipart) {
    // Stream the upload straight through (fetch sets its own boundary).
    const fd = await req.formData();
    fd.set("source", "bornolab");
    const r = await fetch(url, {
      method: "POST",
      headers: { ...(key ? { "X-API-Key": key } : {}) },
      body: fd,
    });
    const text = await r.text();
    try {
      return NextResponse.json(JSON.parse(text), { status: r.status });
    } catch {
      return new NextResponse(text, { status: r.status });
    }
  }

  const body = await req.json().catch(() => ({}));
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

/** GET /api/n8n/format — liveness for the client status badge. */
export async function GET() {
  return NextResponse.json({ configured: Boolean(process.env.N8N_FORMAT_WEBHOOK_URL) });
}
