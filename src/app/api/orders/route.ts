import { NextRequest, NextResponse } from "next/server";
import { readJson, writeJson } from "@/lib/store";

export type OrderStatus = "pending" | "paid" | "delivered" | "cancelled";

export interface OrderHistoryEntry {
  at: number;
  actor: string; // admin email or "customer"
  from: OrderStatus;
  to: OrderStatus;
  note?: string; // e.g. bKash verification remark
}

export interface OrderLine {
  itemType: "font" | "software" | "study";
  itemId: string;
  itemName: string;
  amountBDT: number;
}

export interface OrderDelivery {
  label: string;
  url: string;
}

export interface Order {
  id: string;
  at: number;
  /** purchase = paid checkout; request = quote/free request (no payment yet). */
  kind: "purchase" | "request";
  itemType: "font" | "software" | "study";
  itemId: string;
  itemName: string;
  amountBDT: number;
  /** Signed-in buyer id (attached server-side) — links orders to entitlements. */
  buyerId?: string;
  /** Multi-item carts land here; legacy single-item fields mirror the summary. */
  items?: OrderLine[];
  /** Admin-recorded delivery links/licenses per fulfilled order. */
  delivery?: OrderDelivery[];
  method: "bkash" | "nagad" | "bank" | "binance";
  sender: string;
  txn: string;
  note: string;
  status: OrderStatus;
  /** bKash verification trail — appended on every admin status change. */
  history?: OrderHistoryEntry[];
}

/** POST /api/orders — creates a manual-payment order (purchase) or request (quote/free). */
export async function POST(req: NextRequest) {
  const b = (await req.json().catch(() => ({}))) as Partial<Order> & { items?: OrderLine[]; kind?: string };
  const coerceType = (t: unknown): "font" | "software" | "study" =>
    t === "software" ? "software" : t === "study" ? "study" : "font";
  const lines: OrderLine[] = Array.isArray(b.items)
    ? b.items
        .filter((l) => l && typeof l.itemName === "string")
        .slice(0, 50)
        .map((l) => ({
          itemType: coerceType(l.itemType),
          itemId: String(l.itemId ?? ""),
          itemName: String(l.itemName).slice(0, 160),
          amountBDT: Math.max(0, Number(l.amountBDT ?? 0) || 0),
        }))
    : [];
  const kind = b.kind === "request" ? "request" : "purchase";
  const total = lines.length > 0 ? lines.reduce((n, l) => n + l.amountBDT, 0) : Math.max(0, Number(b.amountBDT ?? 0) || 0);
  const itemName = lines.length > 0
    ? `${lines.length} item${lines.length === 1 ? "" : "s"}: ${lines.map((l) => l.itemName).join(", ").slice(0, 200)}`
    : String(b.itemName ?? "");
  if (!itemName || !b.method || !b.sender) {
    return NextResponse.json({ error: "itemName, method and sender account are required" }, { status: 400 });
  }
  if (!["bkash", "nagad", "bank", "binance"].includes(b.method)) {
    return NextResponse.json({ error: "unknown method" }, { status: 400 });
  }
  // Link signed-in buyers so paid orders unlock entitlements (study, etc.).
  let buyerId: string | undefined;
  try {
    const { USER_COOKIE, sessionUser } = await import("@/lib/users");
    buyerId = (await sessionUser(req.cookies.get(USER_COOKIE)?.value ?? ""))?.id;
  } catch { /* guest order */ }
  const orders = await readJson<Order[]>("orders.json", []);
  const order: Order = {
    id: `BL-${Date.now().toString(36).toUpperCase()}${Math.floor(Math.random() * 90 + 10)}`,
    at: Date.now(),
    kind,
    itemType: lines[0]?.itemType ?? coerceType(b.itemType),
    itemId: lines[0]?.itemId ?? String(b.itemId ?? ""),
    itemName,
    amountBDT: total,
    ...(lines.length > 0 ? { items: lines } : {}),
    ...(buyerId ? { buyerId } : {}),
    method: b.method,
    sender: String(b.sender).slice(0, 80),
    txn: String(b.txn ?? "").slice(0, 80),
    note: String(b.note ?? "").slice(0, 300),
    status: "pending",
  };
  orders.push(order);
  await writeJson("orders.json", orders.slice(-1000));
  try {
    const { pushNotification } = await import("@/lib/notifications");
    await pushNotification({
      type: "order.placed",
      title: `New order ${order.id}: ${order.itemName}`,
      detail: `৳${order.amountBDT} via ${order.method} — ${order.sender}`,
    });
  } catch {
    // Notifications must never break order creation.
  }
  return NextResponse.json({ ok: true, orderId: order.id });
}
