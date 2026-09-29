import { NextRequest, NextResponse } from "next/server";
import { readJson, writeJson } from "@/lib/store";
import { USER_COOKIE, sessionUser } from "@/lib/users";

export interface TrackEvent {
  t: number;
  path: string;
  uid?: string; // signed-in member id (admin analytics only)
}

const MAX_EVENTS = 5000;

/** POST /api/track { path } — lightweight page-view beacon. Signed-in views link to the member id for admin analytics; logged-out views stay anonymous. */
export async function POST(req: NextRequest) {
  const { path } = (await req.json().catch(() => ({}))) as { path?: string };
  if (!path || typeof path !== "string" || path.length > 200) {
    return NextResponse.json({ error: "bad path" }, { status: 400 });
  }
  let uid: string | undefined;
  try {
    uid = (await sessionUser(req.cookies.get(USER_COOKIE)?.value ?? ""))?.id;
  } catch { /* anonymous */ }
  const events = await readJson<TrackEvent[]>("analytics.json", []);
  events.push({ t: Date.now(), path: path.split("?")[0], ...(uid ? { uid } : {}) });
  await writeJson("analytics.json", events.slice(-MAX_EVENTS));
  return NextResponse.json({ ok: true });
}
