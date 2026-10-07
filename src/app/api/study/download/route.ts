import { NextRequest, NextResponse } from "next/server";
import { getSiteConfig } from "@/lib/site-config";
import { buildStudyCatalog } from "@/lib/study-data";
import { loadStudyFile, studyAccess, STUDY_MAX_BYTES } from "@/lib/study-access";
import { USER_COOKIE, logAudit, sessionUser } from "@/lib/users";

export const runtime = "nodejs";

const MIME: Record<string, string> = {
  pdf: "application/pdf",
  html: "text/html",
  zip: "application/zip",
};

/**
 * GET /api/study/download?id=… — entitlement-gated download.
 * Free materials: any signed-in user. Paid: a paid/delivered order linked
 * to the buyer. Reading/sharing the preview stays public on /study.
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
  if (!access.download) {
    return NextResponse.json(
      {
        error: access.gate === "login" ? "Login required to download study files." : "This is a paid guide — complete checkout first.",
        gate: access.gate,
        loginUrl: "/login",
      },
      { status: access.gate === "login" ? 401 : 402 }
    );
  }
  const loaded = await loadStudyFile(material, req.nextUrl.origin);
  if (!loaded) return NextResponse.json({ error: "file not found" }, { status: 404 });
  if (loaded.data.byteLength > STUDY_MAX_BYTES) {
    return NextResponse.json({ error: "file too large" }, { status: 413 });
  }
  const safeTitle = material.title.replace(/["\r\n/\\]/g, "").trim().slice(0, 80) || "study-material";
  // Member download ledger for Admin → Customers → Activity.
  if (userId) await logAudit(`user:${userId}`, "study.download", `${material.id} • ${material.title.slice(0, 120)}`);
  return new NextResponse(loaded.data, {
    headers: {
      "Content-Type": MIME[loaded.ext] ?? "application/octet-stream",
      "Content-Disposition": `attachment; filename="${safeTitle}.${loaded.ext}"`,
      "Cache-Control": "private, max-age=3600",
    },
  });
}
