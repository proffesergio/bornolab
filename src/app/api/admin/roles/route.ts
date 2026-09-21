import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "../me/route";
import { listRoles, logAudit, saveRoles } from "@/lib/users";
import { PERMISSIONS, type RoleDef } from "@/lib/members-shared";

/** GET /api/admin/roles — roles + permission catalog. */
export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (auth instanceof NextResponse) return auth;
  return NextResponse.json({ roles: await listRoles(), permissions: [...PERMISSIONS] });
}

/** POST /api/admin/roles — create a role { name, permissions }. */
export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (auth instanceof NextResponse) return auth;
  const body = (await req.json().catch(() => ({}))) as Partial<RoleDef>;
  if (!body.name?.trim()) return NextResponse.json({ error: "name required" }, { status: 400 });
  const valid = new Set<string>(PERMISSIONS);
  const roles = await listRoles();
  const role: RoleDef = {
    id: `role_${Date.now().toString(36)}`,
    name: body.name.trim(),
    permissions: Array.isArray(body.permissions) ? body.permissions.filter((p) => valid.has(p)).map(String) : [],
  };
  roles.push(role);
  await saveRoles(roles);
  await logAudit(String(auth), "role.create", role.name);
  return NextResponse.json({ ok: true, role });
}

/** PATCH /api/admin/roles { id, name?, permissions? } */
export async function PATCH(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (auth instanceof NextResponse) return auth;
  const body = (await req.json().catch(() => ({}))) as Partial<RoleDef> & { id?: string };
  if (!body.id) return NextResponse.json({ error: "id required" }, { status: 400 });
  const valid = new Set<string>(PERMISSIONS);
  const roles = await listRoles();
  const r = roles.find((x) => x.id === body.id);
  if (!r) return NextResponse.json({ error: "not found" }, { status: 404 });
  if (body.name !== undefined) r.name = body.name.trim() || r.name;
  if (Array.isArray(body.permissions)) r.permissions = body.permissions.filter((p) => valid.has(p)).map(String);
  await saveRoles(roles);
  await logAudit(String(auth), "role.update", r.name);
  return NextResponse.json({ ok: true, role: r });
}

/** DELETE /api/admin/roles?id= — delete a non-system role. */
export async function DELETE(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (auth instanceof NextResponse) return auth;
  const id = req.nextUrl.searchParams.get("id");
  const roles = await listRoles();
  const target = roles.find((x) => x.id === id);
  if (!target || target.system) return NextResponse.json({ error: "cannot delete this role" }, { status: 400 });
  await saveRoles(roles.filter((x) => x.id !== id));
  await logAudit(String(auth), "role.delete", target.name);
  return NextResponse.json({ ok: true });
}
