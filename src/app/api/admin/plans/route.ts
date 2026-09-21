import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "../me/route";
import { listPlans, logAudit, savePlans } from "@/lib/users";
import type { PlanDef } from "@/lib/members-shared";

/** GET /api/admin/plans — subscription plans. */
export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (auth instanceof NextResponse) return auth;
  return NextResponse.json({ plans: await listPlans() });
}

/** POST /api/admin/plans — create a plan { name, priceBDT, interval, features, limits }. */
export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (auth instanceof NextResponse) return auth;
  const body = (await req.json().catch(() => ({}))) as Partial<PlanDef>;
  if (!body.name?.trim()) return NextResponse.json({ error: "name required" }, { status: 400 });
  const plans = await listPlans();
  const plan: PlanDef = {
    id: `plan_${Date.now().toString(36)}`,
    name: body.name.trim(),
    priceBDT: Math.max(0, Number(body.priceBDT) || 0),
    interval: ["free", "monthly", "yearly", "lifetime"].includes(body.interval ?? "") ? body.interval as PlanDef["interval"] : "monthly",
    features: Array.isArray(body.features) ? body.features.map(String).slice(0, 20) : [],
    limits: {
      pdfMB: Math.max(1, Number(body.limits?.pdfMB) || 15),
      pdfFiles: Math.max(1, Number(body.limits?.pdfFiles) || 5),
    },
    enabled: body.enabled ?? true,
  };
  plans.push(plan);
  await savePlans(plans);
  await logAudit(String(auth), "plan.create", plan.name);
  return NextResponse.json({ ok: true, plan });
}

/** PATCH /api/admin/plans { id, ...fields } — update a plan. */
export async function PATCH(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (auth instanceof NextResponse) return auth;
  const body = (await req.json().catch(() => ({}))) as Partial<PlanDef> & { id?: string };
  if (!body.id) return NextResponse.json({ error: "id required" }, { status: 400 });
  const plans = await listPlans();
  const p = plans.find((x) => x.id === body.id);
  if (!p) return NextResponse.json({ error: "not found" }, { status: 404 });
  if (body.name !== undefined) p.name = body.name.trim() || p.name;
  if (body.priceBDT !== undefined) p.priceBDT = Math.max(0, Number(body.priceBDT) || 0);
  if (body.interval && ["free", "monthly", "yearly", "lifetime"].includes(body.interval)) p.interval = body.interval;
  if (Array.isArray(body.features)) p.features = body.features.map(String).slice(0, 20);
  if (body.limits) {
    if (body.limits.pdfMB !== undefined) p.limits.pdfMB = Math.max(1, Number(body.limits.pdfMB) || 1);
    if (body.limits.pdfFiles !== undefined) p.limits.pdfFiles = Math.max(1, Number(body.limits.pdfFiles) || 1);
  }
  if (body.enabled !== undefined) p.enabled = !!body.enabled;
  await savePlans(plans);
  await logAudit(String(auth), "plan.update", p.name);
  return NextResponse.json({ ok: true, plan: p });
}

/** DELETE /api/admin/plans?id= — delete a non-system plan. */
export async function DELETE(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (auth instanceof NextResponse) return auth;
  const id = req.nextUrl.searchParams.get("id");
  if (!id || id === "free") return NextResponse.json({ error: "cannot delete this plan" }, { status: 400 });
  const plans = (await listPlans()).filter((x) => x.id !== id);
  await savePlans(plans);
  await logAudit(String(auth), "plan.delete", id);
  return NextResponse.json({ ok: true });
}
