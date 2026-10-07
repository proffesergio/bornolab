import { NextRequest, NextResponse } from "next/server";
import { getSiteConfig } from "@/lib/site-config";
import { buildStudyCatalog } from "@/lib/study-data";
import { studyAccess } from "@/lib/study-access";
import { USER_COOKIE, sessionUser } from "@/lib/users";

/** GET /api/study/access?id=… — public gate status for the reader UI (no file bytes). */
export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id") ?? "";
  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });
  const config = await getSiteConfig();
  const material = buildStudyCatalog(config.studyOverrides ?? {}, config.customStudy ?? []).find(
    (m) => m.id === id && m.enabled
  );
  if (!material) return NextResponse.json({ error: "material not found" }, { status: 404 });
  let userId: string | null = null;
  try {
    userId = (await sessionUser(req.cookies.get(USER_COOKIE)?.value ?? ""))?.id ?? null;
  } catch { /* anonymous */ }
  const access = await studyAccess(userId, material);
  return NextResponse.json({
    loggedIn: userId !== null,
    fileType: material.fileType,
    ...access,
  });
}
