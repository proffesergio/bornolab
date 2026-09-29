import { NextRequest, NextResponse } from "next/server";
import { getUserActivity } from "@/lib/activity";
import { requireAdmin } from "../me/route";

/** GET /api/admin/user-activity?id=<userId> — per-member timeline for Admin → Customers. Admin-only. */
export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (auth instanceof NextResponse) return auth;
  const id = req.nextUrl.searchParams.get("id") ?? "";
  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });
  return NextResponse.json(await getUserActivity(id));
}
