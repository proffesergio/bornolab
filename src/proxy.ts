import { NextRequest, NextResponse } from "next/server";
import { ADMIN_COOKIE, verifyAdminToken } from "./lib/auth";

// Mirrors USER_COOKIE in src/lib/users.ts without importing fs-backed modules (Edge-safe).
const MEMBER_COOKIE = "bornolab_user";

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    const email = await verifyAdminToken(req.cookies.get(ADMIN_COOKIE)?.value ?? "");
    if (!email) {
      const url = req.nextUrl.clone();
      url.pathname = "/admin/login";
      return NextResponse.redirect(url);
    }
  }
  // Member-only surfaces (future-proof: /dashboard + /account). Full JWT
  // verification happens page/API-side via sessionUser() because users.ts
  // pulls in fs (not Edge-safe); here we enforce presence + shape, then
  // redirect to /login?next= for a friction-free login loop.
  if (pathname.startsWith("/dashboard") || pathname.startsWith("/account")) {
    const token = req.cookies.get(MEMBER_COOKIE)?.value ?? "";
    if (!token || token.split(".").length !== 3) {
      const url = req.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
  }
  return NextResponse.next();
}

export const config = { matcher: ["/admin/:path*", "/dashboard/:path*", "/account/:path*"] };
