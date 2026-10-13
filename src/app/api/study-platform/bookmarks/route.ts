import { NextRequest, NextResponse } from "next/server";
import { removeBookmark, saveBookmark } from "@/lib/study-platform/store";
import { USER_COOKIE, sessionUser } from "@/lib/users";

/** POST /api/study-platform/bookmarks {kind, refId} — DELETE ?kind=&refId= */
export async function POST(req: NextRequest) {
  let userId: string | null = null;
  try {
    userId = (await sessionUser(req.cookies.get(USER_COOKIE)?.value ?? ""))?.id ?? null;
  } catch { /* anon */ }
  if (!userId) return NextResponse.json({ error: "login required" }, { status: 401 });
  const body = (await req.json().catch(() => ({}))) as { kind?: string; refId?: string };
  if ((body.kind !== "question" && body.kind !== "chapter") || !body.refId) {
    return NextResponse.json({ error: "kind + refId required" }, { status: 400 });
  }
  await saveBookmark({ userId, kind: body.kind, refId: String(body.refId).slice(0, 120), createdAt: Date.now() });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  let userId: string | null = null;
  try {
    userId = (await sessionUser(req.cookies.get(USER_COOKIE)?.value ?? ""))?.id ?? null;
  } catch { /* anon */ }
  if (!userId) return NextResponse.json({ error: "login required" }, { status: 401 });
  const kind = req.nextUrl.searchParams.get("kind") === "chapter" ? "chapter" : "question";
  const refId = req.nextUrl.searchParams.get("refId") ?? "";
  if (!refId) return NextResponse.json({ error: "refId required" }, { status: 400 });
  await removeBookmark(userId, kind, refId);
  return NextResponse.json({ ok: true });
}
