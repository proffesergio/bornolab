/** Tiny in-memory throttle for write-heavy learner endpoints. Per-instance only. */
import type { NextRequest } from "next/server";

const hits = new Map<string, { count: number; reset: number }>();

export function throttle(key: string, limit: number, windowSec: number): { ok: boolean; retryAfterSec: number } {
  const now = Date.now();
  const cur = hits.get(key);
  if (!cur || now > cur.reset) {
    hits.set(key, { count: 1, reset: now + windowSec * 1000 });
    return { ok: true, retryAfterSec: 0 };
  }
  if (cur.count >= limit) {
    return { ok: false, retryAfterSec: Math.max(1, Math.ceil((cur.reset - now) / 1000)) };
  }
  cur.count += 1;
  return { ok: true, retryAfterSec: 0 };
}

export function clientIp(req: NextRequest): string {
  return (req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local").slice(0, 64);
}
