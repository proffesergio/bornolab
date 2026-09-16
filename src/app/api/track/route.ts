import { NextRequest, NextResponse } from "next/server";
import { readJson, writeJson } from "@/lib/store";

export interface TrackEvent {
  t: number;
  path: string;
}

const MAX_EVENTS = 5000;

/** POST /api/track { path } — lightweight page-view beacon (no cookies/PII). */
export async function POST(req: NextRequest) {
  const { path } = (await req.json().catch(() => ({}))) as { path?: string };
  if (!path || typeof path !== "string" || path.length > 200) {
    return NextResponse.json({ error: "bad path" }, { status: 400 });
  }
  const events = await readJson<TrackEvent[]>("analytics.json", []);
  events.push({ t: Date.now(), path: path.split("?")[0] });
  await writeJson("analytics.json", events.slice(-MAX_EVENTS));
  return NextResponse.json({ ok: true });
}
