import { NextRequest, NextResponse } from "next/server";
import { ADMIN_COOKIE, verifyAdminToken } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const email = await verifyAdminToken(req.cookies.get(ADMIN_COOKIE)?.value ?? "");
  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({ ok: true, email });
}

/** Shared guard for admin JSON routes. Returns email or an error response. */
export async function requireAdmin(req: NextRequest): Promise<string | NextResponse> {
  const email = await verifyAdminToken(req.cookies.get(ADMIN_COOKIE)?.value ?? "");
  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return email;
}
