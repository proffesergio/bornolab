import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { getSiteConfig } from "@/lib/site-config";
import { requireAdmin } from "../me/route";

export const runtime = "nodejs";

/**
 * GET /api/admin/ads-check — verifies the served ads.txt against the
 * configured AdSense publisher ID. Admin-only.
 */
export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (auth instanceof NextResponse) return auth;

  const cfg = await getSiteConfig();
  const client = (cfg.seo.adsenseClient ?? "").trim();
  const pubMatch = client.match(/pub-\d+/);
  const pubId = pubMatch ? pubMatch[0] : "";

  let raw: string | null = null;
  try {
    raw = await fs.readFile(path.join(process.cwd(), "public", "ads.txt"), "utf8");
  } catch {
    raw = null;
  }
  if (raw == null) {
    return NextResponse.json({ exists: false, client, pubId, match: false });
  }
  const sellerLines = raw
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("#"));
  const foundIds = [...new Set(
    sellerLines.flatMap((l) => {
      const m = l.match(/pub-\d+/g);
      return m ?? [];
    })
  )];
  return NextResponse.json({
    exists: true,
    bytes: raw.length,
    sellerLines: sellerLines.length,
    foundIds,
    client,
    pubId,
    placeholderOnly: sellerLines.length === 0,
    match: Boolean(pubId) && foundIds.includes(pubId),
  });
}
