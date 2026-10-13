import { NextRequest, NextResponse } from "next/server";
import { listAudit } from "@/lib/study-platform/store";

/** GET /api/study-platform/audit — admin-only audit trail. */
export async function GET(req: NextRequest) {
  const { requireAdmin } = await import("@/app/api/admin/me/route");
  const auth = await requireAdmin(req);
  if (auth instanceof NextResponse) return auth;
  const entries = await listAudit(200).catch(() => []);
  return NextResponse.json({ entries });
}
