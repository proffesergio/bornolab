/** Client-safe: canonical site URL for metadata, robots, sitemap. No fs. */

export function getSiteUrl(): string {
  const env = (process.env.NEXT_PUBLIC_SITE_URL ?? "").trim().replace(/\/+$/, "");
  if (env) return env;
  return "https://bornolab.vercel.app";
}
