import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "../me/route";
import { listPlans, listUsers, logAudit, updateUser, userStats } from "@/lib/users";

/** GET /api/admin/users — members + stats for the admin panel. */
export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (auth instanceof NextResponse) return auth;
  const [users, stats, plans] = await Promise.all([listUsers(), userStats(), listPlans()]);
  const planNames = Object.fromEntries(plans.map((p) => [p.id, p.name]));
  return NextResponse.json({
    users: [...users].sort((a, b) => b.createdAt - a.createdAt),
    stats, planNames,
  });
}

/** PATCH /api/admin/users { id, role?, planId?, planStatus?, status?, name? } */
export async function PATCH(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (auth instanceof NextResponse) return auth;
  const body = (await req.json().catch(() => ({}))) as {
    id?: string; role?: string; planId?: string; planStatus?: string; status?: string; name?: string;
  };
  if (!body.id) return NextResponse.json({ error: "id required" }, { status: 400 });
  if (body.planStatus && !["active", "trial", "past_due", "cancelled", "none"].includes(body.planStatus)) {
    return NextResponse.json({ error: "bad planStatus" }, { status: 400 });
  }
  if (body.status && !["active", "suspended"].includes(body.status)) {
    return NextResponse.json({ error: "bad status" }, { status: 400 });
  }
  const user = await updateUser(body.id, {
    role: body.role, planId: body.planId,
    planStatus: body.planStatus as "active" | "trial" | "past_due" | "cancelled" | "none" | undefined,
    status: body.status as "active" | "suspended" | undefined,
    name: body.name,
  });
  if (!user) return NextResponse.json({ error: "not found" }, { status: 404 });
  await logAudit(String(auth), "user.update", `${user.email} → ${JSON.stringify(body)}`);
  return NextResponse.json({ ok: true, user });
}
