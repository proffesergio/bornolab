import { NextRequest, NextResponse } from "next/server";
import { ADMIN_COOKIE, isAdminConfigured, signAdminToken, verifyCredentials } from "@/lib/auth";

export async function POST(req: NextRequest) {
  if (!isAdminConfigured()) {
    return NextResponse.json(
      { error: "Admin not configured. Set ADMIN_EMAIL and ADMIN_PASSWORD in .env.local" },
      { status: 503 }
    );
  }
  const { email, password } = (await req.json().catch(() => ({}))) as { email?: string; password?: string };
  if (!email || !password || !verifyCredentials(email, password)) {
    return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
  }
  const token = await signAdminToken(email.trim().toLowerCase());
  const res = NextResponse.json({ ok: true, email: email.trim().toLowerCase() });
  res.cookies.set(ADMIN_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 7 * 86400,
  });
  return res;
}
