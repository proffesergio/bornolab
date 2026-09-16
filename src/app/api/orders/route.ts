import { NextRequest, NextResponse } from "next/server";
import { readJson, writeJson } from "@/lib/store";

export type OrderStatus = "pending" | "paid" | "delivered" | "cancelled";

export interface Order {
  id: string;
  at: number;
  itemType: "font" | "software";
  itemId: string;
  itemName: string;
  amountBDT: number;
  method: "bkash" | "nagad" | "bank" | "binance";
  sender: string;
  txn: string;
  note: string;
  status: OrderStatus;
}

/** POST /api/orders — creates a manual-payment order (bKash/Nagad/Bank/Binance). */
export async function POST(req: NextRequest) {
  const b = (await req.json().catch(() => ({}))) as Partial<Order>;
  if (!b.itemName || !b.method || !b.sender) {
    return NextResponse.json({ error: "itemName, method and sender account are required" }, { status: 400 });
  }
  if (!["bkash", "nagad", "bank", "binance"].includes(b.method)) {
    return NextResponse.json({ error: "unknown method" }, { status: 400 });
  }
  const orders = await readJson<Order[]>("orders.json", []);
  const order: Order = {
    id: `BL-${Date.now().toString(36).toUpperCase()}${Math.floor(Math.random() * 90 + 10)}`,
    at: Date.now(),
    itemType: b.itemType === "software" ? "software" : "font",
    itemId: String(b.itemId ?? ""),
    itemName: String(b.itemName),
    amountBDT: Number(b.amountBDT ?? 0),
    method: b.method,
    sender: String(b.sender).slice(0, 80),
    txn: String(b.txn ?? "").slice(0, 80),
    note: String(b.note ?? "").slice(0, 300),
    status: "pending",
  };
  orders.push(order);
  await writeJson("orders.json", orders.slice(-1000));
  return NextResponse.json({ ok: true, orderId: order.id });
}
