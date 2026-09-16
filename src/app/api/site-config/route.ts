import { NextResponse } from "next/server";
import { getSiteConfig } from "@/lib/site-config";

/** Public (non-secret) site config for storefront rendering. */
export async function GET() {
  return NextResponse.json(await getSiteConfig());
}
