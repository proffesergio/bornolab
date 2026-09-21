import { NextRequest, NextResponse } from "next/server";
import { readJson, writeJson } from "@/lib/store";
import type { PdfOp } from "@/lib/site-config-shared";
import { requireAdmin } from "../../admin/me/route";

const MAX_OPS = 500;
/** Known client tools — anything else is rejected (typo/spam guard). */
const KNOWN_TOOLS = new Set(["merge", "split", "translate", "compress", "images"]);

/** In-memory per-IP throttle (best-effort; resets on cold start). */
const hits = new Map<string, number[]>();
function throttled(ip: string): boolean {
  const now = Date.now();
  const window = (hits.get(ip) ?? []).filter((t) => now - t < 60_000);
  window.push(now);
  hits.set(ip, window);
  return window.length > 120; // 120 beacons/min/IP
}

/** POST /api/pdf/log — client beacon after each PDF job (no PII, counts only). */
export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  if (throttled(ip)) return NextResponse.json({ error: "rate limited" }, { status: 429 });
  const body = await req.json().catch(() => null);
  const tool = typeof body?.tool === "string" ? body.tool.trim().slice(0, 32) : "";
  if (!KNOWN_TOOLS.has(tool)) {
    return NextResponse.json({ error: "unknown tool" }, { status: 400 });
  }
  const clamp = (n: unknown, max: number) => Math.min(max, Math.max(0, Math.floor(Number(n) || 0)));
  const op: PdfOp = {
    at: Date.now(),
    tool,
    files: clamp(body.files, 1000),
    pages: clamp(body.pages, 100000),
    ms: clamp(body.ms, 3600000),
    ok: body.ok !== false,
    err: typeof body.err === "string" ? body.err.slice(0, 300) : undefined,
  };
  const ops = await readJson<PdfOp[]>("pdf-ops.json", []);
  ops.push(op);
  await writeJson("pdf-ops.json", ops.slice(-MAX_OPS));
  return NextResponse.json({ ok: true });
}

/** DELETE /api/pdf/log — admin clears the ops log. */
export async function DELETE(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (auth instanceof NextResponse) return auth;
  await writeJson("pdf-ops.json", []);
  return NextResponse.json({ ok: true });
}
