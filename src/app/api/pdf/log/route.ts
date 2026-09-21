import { NextRequest, NextResponse } from "next/server";
import { readJson, writeJson } from "@/lib/store";
import type { PdfOp } from "@/lib/site-config-shared";

const MAX_OPS = 500;

/** POST /api/pdf/log — client beacon after each PDF job (no PII, counts only). */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body || typeof body.tool !== "string" || !body.tool.trim()) {
    return NextResponse.json({ error: "tool is required" }, { status: 400 });
  }
  const op: PdfOp = {
    at: Date.now(),
    tool: String(body.tool).slice(0, 32),
    files: Math.max(0, Math.floor(Number(body.files) || 0)),
    pages: Math.max(0, Math.floor(Number(body.pages) || 0)),
    ms: Math.max(0, Math.floor(Number(body.ms) || 0)),
    ok: body.ok !== false,
    err: typeof body.err === "string" ? body.err.slice(0, 300) : undefined,
  };
  const ops = await readJson<PdfOp[]>("pdf-ops.json", []);
  ops.push(op);
  await writeJson("pdf-ops.json", ops.slice(-MAX_OPS));
  return NextResponse.json({ ok: true });
}
