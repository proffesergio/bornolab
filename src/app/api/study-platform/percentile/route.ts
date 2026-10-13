import { NextRequest, NextResponse } from "next/server";
import { getProgress, listAttempts } from "@/lib/study-platform/store";
import { BAND_COPY, bandFor, cohortBands } from "@/lib/study-platform/percentile";
import { USER_COOKIE, sessionUser } from "@/lib/users";

/**
 * GET /api/study-platform/percentile?version=slug — opt-in cohort band (login).
 * Returns only the caller's band + cohort size. Never peer scores, ids, or ranks.
 */
export async function GET(req: NextRequest) {
  let uid: string | null = null;
  try {
    uid = (await sessionUser(req.cookies.get(USER_COOKIE)?.value ?? ""))?.id ?? null;
  } catch { /* anonymous */ }
  if (!uid) return NextResponse.json({ error: "login required" }, { status: 401 });
  const version = req.nextUrl.searchParams.get("version") ?? "";
  const prog = await getProgress(uid).catch(() => null);
  if (!prog?.percentileOptIn) {
    return NextResponse.json({ available: false, optedIn: false, reason: "Opt in to cohort comparison to see your band." });
  }
  const attempts = await listAttempts().catch(() => []);
  const mine = attempts
    .filter((a) => a.userId === uid && (a.examVersionId === version) && a.submittedAt && a.score)
    .sort((a, b) => (b.submittedAt ?? 0) - (a.submittedAt ?? 0));
  if (mine.length === 0 || !mine[0].score) {
    return NextResponse.json({ available: false, optedIn: true, reason: "No submitted attempt for this version yet." });
  }
  // Cohort: submitted attempts by opted-in users only (anonymous + opted-out excluded).
  const cohort: number[] = [];
  for (const a of attempts) {
    if (!a.userId || !a.submittedAt || !a.score) continue;
    if (a.examVersionId !== version) continue;
    const p = await getProgress(a.userId).catch(() => null);
    if (!p?.percentileOptIn) continue;
    cohort.push(a.score.pct);
    if (cohort.length >= 5000) break;
  }
  const dist = cohortBands(cohort);
  if (!dist) {
    return NextResponse.json({ available: false, optedIn: true, n: cohort.length, reason: `Cohort too small (${cohort.length}/${30}) — bands appear at 30+ opted-in attempts.` });
  }
  const userPct = mine[0].score.pct;
  const band = bandFor(userPct, dist);
  return NextResponse.json({
    available: true,
    optedIn: true,
    n: dist.n,
    band,
    copy: BAND_COPY[band],
    userPct,
    disclaimer: "Guidance only — a practice cohort, not the official exam population or a success prediction.",
  });
}
