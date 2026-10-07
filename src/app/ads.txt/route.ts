import { getSiteConfig } from "@/lib/site-config";

/** GET /ads.txt — dynamic AdSense authorization. Falls back to env seed when DB is empty. */
export async function GET(): Promise<Response> {
  let client = (process.env.ADS_TXT_PUB_ID ?? "").trim();
  try {
    const cfg = await getSiteConfig();
    client = (cfg.seo.adsenseClient ?? "").trim() || client;
  } catch {
    // Serve env fallback.
  }
  const id = client.replace(/^ca-pub-/, "pub-");
  const body = id
    ? `google.com, ${id}, DIRECT, f08c47fec0942fa0\n`
    : `# BornoLab ads.txt — set Admin → Ads → AdSense client (ca-pub-…) to authorize Google.\n`;
  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=3600" },
  });
}
