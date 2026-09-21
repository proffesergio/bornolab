import { NextRequest, NextResponse } from "next/server";
import { USER_COOKIE, logAudit, signUserToken, upsertUser, verifyOtp } from "@/lib/users";

/** POST /api/auth/verify-code { email, code, name? } — verifies OTP/magic-link code, starts a session. */
export async function POST(req: NextRequest) {
  const { email, code, name } = (await req.json().catch(() => ({}))) as {
    email?: string; code?: string; name?: string;
  };
  if (!email || !code) return NextResponse.json({ error: "Email and code are required." }, { status: 400 });
  if (!(await verifyOtp(email, code))) {
    return NextResponse.json({ error: "Invalid or expired code. Request a new one." }, { status: 401 });
  }
  const user = await upsertUser({ email, name, provider: "otp", emailVerified: true });
  if (user.status !== "active") return NextResponse.json({ error: "Account suspended." }, { status: 403 });
  const token = await signUserToken(user.id);
  await logAudit(`user:${user.id}`, "auth.login", "otp");
  const res = NextResponse.json({ ok: true, user: { id: user.id, email: user.email, name: user.name, avatar: user.avatar } });
  res.cookies.set(USER_COOKIE, token, {
    httpOnly: true, sameSite: "lax", path: "/", maxAge: 30 * 86400,
    ...(process.env.NODE_ENV === "production" ? { secure: true } : {}),
  });
  return res;
}
