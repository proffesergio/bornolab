import { NextRequest, NextResponse } from "next/server";
import { getProgress, saveProgress } from "@/lib/study-platform/store";
import { USER_COOKIE, sessionUser } from "@/lib/users";
import type { UserProgress } from "@/lib/study-platform/types";

/** POST /api/study-platform/consent {optIn:boolean} — percentile cohort opt-in/out (login). */
export async function POST(req: NextRequest) {
  let uid: string | null = null;
  try {
    uid = (await sessionUser(req.cookies.get(USER_COOKIE)?.value ?? ""))?.id ?? null;
  } catch { /* anonymous */ }
  if (!uid) return NextResponse.json({ error: "login required" }, { status: 401 });
  const body = (await req.json().catch(() => ({}))) as { optIn?: boolean };
  const prog: UserProgress = (await getProgress(uid).catch(() => null)) ?? { userId: uid, chapterMastery: {}, wrongQueue: [], unansweredQueue: [], streakDays: 0 };
  await saveProgress({ ...prog, percentileOptIn: body.optIn === true });
  return NextResponse.json({ ok: true, optIn: body.optIn === true });
}
