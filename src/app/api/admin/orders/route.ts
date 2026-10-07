import { NextRequest, NextResponse } from "next/server";
import { readJson, writeJson } from "@/lib/store";
import type { Order, OrderStatus } from "../../orders/route";
import { logAudit } from "@/lib/users";
import { requireAdmin } from "../me/route";

/** GET /api/admin/orders — list manual-payment orders (newest first). */
export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (auth instanceof NextResponse) return auth;
  const orders = await readJson<Order[]>("orders.json", []);
  return NextResponse.json({ orders: [...orders].reverse() });
}

/** PATCH /api/admin/orders { id, status?, note?, delivery? } — status change appends to the verify trail + audit log. */
export async function PATCH(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (auth instanceof NextResponse) return auth;
  const { id, status, note, delivery } = (await req.json().catch(() => ({}))) as {
    id?: string; status?: OrderStatus; note?: string;
    delivery?: { label?: string; url?: string }[];
  };
  const orders = await readJson<Order[]>("orders.json", []);
  const o = orders.find((x) => x.id === id);
  if (!o) return NextResponse.json({ error: "not found" }, { status: 404 });
  if (Array.isArray(delivery)) {
    o.delivery = delivery
      .filter((d) => d && (d.label || d.url))
      .slice(0, 20)
      .map((d) => ({ label: String(d.label ?? "").slice(0, 120), url: String(d.url ?? "").slice(0, 500) }));
  }
  if (status && !["pending", "paid", "delivered", "cancelled"].includes(status)) {
    return NextResponse.json({ error: "bad status" }, { status: 400 });
  }
  if (status && status !== o.status) {
    const from = o.status;
    o.status = status as OrderStatus;
    const cleanNote = typeof note === "string" ? note.trim().slice(0, 300) : "";
    o.history = [...(o.history ?? []), {
      at: Date.now(),
      actor: typeof auth === "string" ? auth : "admin",
      from,
      to: o.status,
      ...(cleanNote ? { note: cleanNote } : {}),
    }].slice(-50);
    await logAudit(typeof auth === "string" ? auth : "admin", "order.status", `${o.id} ${from}→${o.status}${cleanNote ? ` • ${cleanNote}` : ""}`);
  }
  await writeJson("orders.json", orders);
  return NextResponse.json({ ok: true });
}
