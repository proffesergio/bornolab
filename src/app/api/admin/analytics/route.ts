import { NextRequest, NextResponse } from "next/server";
import { readJson } from "@/lib/store";
import type { TrackEvent } from "../../track/route";
import { requireAdmin } from "../me/route";

function dayKey(t: number): string {
  const d = new Date(t);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** GET /api/admin/analytics — totals, last-14-day views, top pages. */
export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (auth instanceof NextResponse) return auth;
  const events = await readJson<TrackEvent[]>("analytics.json", []);
  const days: { date: string; views: number }[] = [];
  const now = new Date();
  for (let i = 13; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    days.push({
      date: `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`,
      views: 0,
    });
  }
  const keys = days.map((_, i) => {
    const d = new Date(now);
    d.setDate(now.getDate() - (13 - i));
    return dayKey(d.getTime());
  });
  const perPage = new Map<string, number>();
  for (const e of events) {
    const k = dayKey(e.t);
    const idx = keys.indexOf(k);
    if (idx >= 0) days[idx].views++;
    perPage.set(e.path, (perPage.get(e.path) ?? 0) + 1);
  }
  const topPages = [...perPage.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10).map(([path, views]) => ({ path, views }));
  return NextResponse.json({
    totalViews: events.length,
    weekViews: days.slice(-7).reduce((s, d) => s + d.views, 0),
    days,
    topPages,
  });
}
