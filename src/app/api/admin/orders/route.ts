import { NextRequest, NextResponse } from "next/server";
import { readJson, writeJson } from "@/lib/store";
import type { Order, OrderStatus } from "../../orders/route";
import { requireAdmin } from "../me/route";

/** GET /api/admin/orders — list manual-payment orders (newest first). */
export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (auth instanceof NextResponse) return auth;
  const orders = await readJson<Order[]>("orders.json", []);
  return NextResponse.json({ orders: [...orders].reverse() });
}

/** PATCH /api/admin/orders { id, status } */
export async function PATCH(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (auth instanceof NextResponse) return auth;
  const { id, status } = (await req.json().catch(() => ({}))) as { id?: string; status?: OrderStatus };
  if (!id || !["pending", "paid", "delivered", "cancelled"].includes(status ?? "")) {
    return NextResponse.json({ error: "bad id/status" }, { status: 400 });
  }
  const orders = await readJson<Order[]>("orders.json", []);
  const o = orders.find((x) => x.id === id);
  if (!o) return NextResponse.json({ error: "not found" }, { status: 404 });
  o.status = status as OrderStatus;
  await writeJson("orders.json", orders);
  return NextResponse.json({ ok: true });
}
