import { NextRequest, NextResponse } from "next/server";
import { throttle } from "../study-platform/ratelimit";
export function writeGuard(req: NextRequest, actor: string): NextResponse | null {
  const origin = req.headers.get("origin");
  if ((origin && origin !== req.nextUrl.origin) || req.headers.get("sec-fetch-site") === "cross-site") return NextResponse.json({ error: "Cross-site request rejected." }, { status: 403 });
  const limit = throttle(`printing:${actor}`, 40, 60);
  if (!limit.ok) return NextResponse.json({ error: "Too many requests. Please try again shortly." }, { status: 429, headers: { "Retry-After": String(limit.retryAfterSec) } });
  return null;
}
export class PrintingPriceConflict extends Error {}
export function failure(error: unknown) {
  if(error instanceof PrintingPriceConflict)return NextResponse.json({error:error.message,code:"price_changed"},{status:409});
  if(error&&typeof error==="object"&&"code" in error)return NextResponse.json({error:"Printing services are temporarily unavailable. Please try again or contact support."},{status:503});
  return NextResponse.json({ error: error instanceof Error ? error.message : "Printing request failed." }, { status: 400 });
}
export function text(value: unknown, max = 1000): string { if (typeof value !== "string" || value.length > max) throw new Error("Invalid text field."); return value.trim(); }
export function number(value: unknown, max = 100_000_000): number { if (typeof value !== "number" || !Number.isSafeInteger(value) || value < 0 || value > max) throw new Error("Invalid number."); return value; }
