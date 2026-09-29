import { NextRequest, NextResponse } from "next/server";
import { getSiteConfig, updateSiteConfig } from "@/lib/site-config";
import { requireAdmin } from "../me/route";

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (auth instanceof NextResponse) return auth;
  return NextResponse.json(await getSiteConfig());
}

export async function PUT(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (auth instanceof NextResponse) return auth;
  const patch = await req.json().catch(() => ({}));
  // Full restore (Admin → Settings → Import): replaces the stored file
  // instead of deep-merging, so deleted keys actually disappear.
  if (
    typeof patch === "object" && patch !== null &&
    (patch as { __replace?: unknown }).__replace === true &&
    typeof (patch as { config?: unknown }).config === "object" &&
    (patch as { config?: unknown }).config !== null
  ) {
    const { writeJson } = await import("@/lib/store");
    await writeJson("site-config.json", (patch as { config: unknown }).config);
    return NextResponse.json(await getSiteConfig());
  }
  return NextResponse.json(await updateSiteConfig(patch));
}
