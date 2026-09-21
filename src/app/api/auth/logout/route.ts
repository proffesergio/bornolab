import { NextResponse } from "next/server";
import { USER_COOKIE } from "@/lib/users";

/** POST /api/auth/logout — clears the user session cookie. */
export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(USER_COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
  return res;
}
