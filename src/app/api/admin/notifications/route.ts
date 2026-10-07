import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "../me/route";
import { listNotifications, markAllNotificationsRead, markNotificationsRead, unreadCount } from "@/lib/notifications";

/** GET /api/admin/notifications?unread=1&limit=50 — realtime feed for the admin bell. */
export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (auth instanceof NextResponse) return auth;
  const q = req.nextUrl.searchParams;
  const unreadOnly = q.get("unread") === "1";
  const limitRaw = Number(q.get("limit") ?? "50");
  const limit = Number.isFinite(limitRaw) ? Math.min(200, Math.max(1, Math.floor(limitRaw))) : 50;
  const [items, unread] = await Promise.all([
    listNotifications({ unreadOnly, limit }),
    unreadCount(),
  ]);
  return NextResponse.json({ items, unread });
}

/** PATCH /api/admin/notifications { ids: string[] } or { all: true } — mark read. */
export async function PATCH(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (auth instanceof NextResponse) return auth;
  const body = (await req.json().catch(() => ({}))) as { ids?: string[]; all?: boolean };
  if (body.all) {
    await markAllNotificationsRead();
    return NextResponse.json({ ok: true });
  }
  if (!Array.isArray(body.ids) || body.ids.length === 0) {
    return NextResponse.json({ error: "ids[] or { all: true } required" }, { status: 400 });
  }
  const items = await markNotificationsRead(body.ids.filter((x) => typeof x === "string").slice(0, 200));
  return NextResponse.json({ ok: true, items: items.slice(0, 50) });
}
