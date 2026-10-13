import { NextRequest, NextResponse } from "next/server";
import { getSiteConfig, updateSiteConfig } from "@/lib/site-config";
import { DEFAULT_STUDY_PLATFORM_CONFIG } from "@/lib/study-platform/types";

/** GET/PUT /api/study-platform/flags — admin feature flags (reuses admin auth). */
export async function GET(req: NextRequest) {
  const { requireAdmin } = await import("@/app/api/admin/me/route");
  const auth = await requireAdmin(req);
  if (auth instanceof NextResponse) return auth;
  const cfg = await getSiteConfig();
  const sp = (cfg as unknown as { studyPlatform?: typeof DEFAULT_STUDY_PLATFORM_CONFIG }).studyPlatform ?? DEFAULT_STUDY_PLATFORM_CONFIG;
  return NextResponse.json({ studyPlatform: { ...DEFAULT_STUDY_PLATFORM_CONFIG, ...sp } });
}

export async function PUT(req: NextRequest) {
  const { requireAdmin } = await import("@/app/api/admin/me/route");
  const auth = await requireAdmin(req);
  if (auth instanceof NextResponse) return auth;
  const body = (await req.json().catch(() => ({}))) as { enabled?: boolean; flags?: Record<string, { enabled?: boolean }> };
  const cfg = await getSiteConfig();
  const prev = (cfg as unknown as { studyPlatform?: typeof DEFAULT_STUDY_PLATFORM_CONFIG }).studyPlatform ?? DEFAULT_STUDY_PLATFORM_CONFIG;
  const next = {
    enabled: body.enabled ?? prev.enabled,
    demoMode: prev.demoMode,
    flags: { ...prev.flags, ...Object.fromEntries(Object.entries(body.flags ?? {}).map(([k, v]) => [k, { id: k, enabled: v.enabled === true }])) },
  };
  const updated = await updateSiteConfig({ studyPlatform: next } as unknown as Parameters<typeof updateSiteConfig>[0]);
  void updated;
  return NextResponse.json({ ok: true, studyPlatform: next });
}
