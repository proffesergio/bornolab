import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "../me/route";
import { readAudit } from "@/lib/users";

/** GET /api/admin/audit?limit= — recent admin/member activity (newest first). */
export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (auth instanceof NextResponse) return auth;
  const limit = Math.min(200, Math.max(10, Number(req.nextUrl.searchParams.get("limit")) || 100));
  return NextResponse.json({ entries: await readAudit(limit) });
}
