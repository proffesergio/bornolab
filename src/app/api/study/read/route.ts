import { NextRequest, NextResponse } from "next/server";
import { getSiteConfig } from "@/lib/site-config";
import { buildStudyCatalog } from "@/lib/study-data";
import { loadStudyFile } from "@/lib/study-access";
import { studyAccess } from "@/lib/study-access";
import { USER_COOKIE, sessionUser } from "@/lib/users";

export const runtime = "nodejs";

const MIME: Record<string, string> = {
  pdf: "application/pdf",
  html: "text/html",
  zip: "application/zip",
};

/**
 * GET /api/study/read?id=… — full-document inline stream for entitled
 * readers (iframe src). Free materials: any signed-in user. Paid: a
 * paid/delivered order linked to the buyer. Anonymous → 401, unpaid → 402.
 */
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
  if (!access.read) {
    return NextResponse.json(
      { error: access.gate === "login" ? "Login required to continue reading." : "This is a paid guide — complete checkout first.", gate: access.gate },
      { status: access.gate === "login" ? 401 : 402 }
    );
  }
  const loaded = await loadStudyFile(material, req.nextUrl.origin);
  if (!loaded) return NextResponse.json({ error: "file not found" }, { status: 404 });
  return new NextResponse(loaded.data, {
    headers: {
      "Content-Type": MIME[loaded.ext] ?? "application/octet-stream",
      "Content-Disposition": "inline",
      "Cache-Control": "private, max-age=3600",
    },
  });
}
