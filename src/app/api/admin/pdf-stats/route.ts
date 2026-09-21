import { NextRequest, NextResponse } from "next/server";
import { readJson } from "@/lib/store";
import type { PdfOp } from "@/lib/site-config-shared";
import { requireAdmin } from "../me/route";

/** GET /api/admin/pdf-stats[?days=N] — totals, per-tool counts, failure rate, recent ops. */
export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (auth instanceof NextResponse) return auth;
  const days = Math.min(90, Math.max(1, Number(req.nextUrl.searchParams.get("days")) || 30));
  const since = Date.now() - days * 86400_000;
  const ops = (await readJson<PdfOp[]>("pdf-ops.json", [])).filter((o) => o.at >= since);
  const perTool: Record<string, { jobs: number; files: number; pages: number; failures: number }> = {};
  let failures = 0;
  let totalMs = 0;
  let timed = 0;
  for (const o of ops) {
    const t = (perTool[o.tool] ??= { jobs: 0, files: 0, pages: 0, failures: 0 });
    t.jobs++;
    t.files += o.files;
    t.pages += o.pages;
    if (o.ok && o.ms > 0) { totalMs += o.ms; timed++; }
    if (!o.ok) {
      t.failures++;
      failures++;
    }
  }
  const total = ops.length;
  return NextResponse.json({
    total,
    failures,
    failureRate: total ? Math.round((failures / total) * 1000) / 10 : 0,
    avgMs: timed ? Math.round(totalMs / timed) : 0,
    perTool,
    recent: ops.slice(-20).reverse(),
  });
}
