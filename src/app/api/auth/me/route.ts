import { NextRequest, NextResponse } from "next/server";
import { USER_COOKIE, sessionUser } from "@/lib/users";

/** GET /api/auth/me — current signed-in user (public; null when logged out). */
export async function GET(req: NextRequest) {
  const user = await sessionUser(req.cookies.get(USER_COOKIE)?.value ?? "");
  if (!user) return NextResponse.json({ user: null });
  return NextResponse.json({
    user: {
      id: user.id, email: user.email, name: user.name, avatar: user.avatar,
      providers: user.providers, role: user.role, planId: user.planId, planStatus: user.planStatus,
    },
  });
}
