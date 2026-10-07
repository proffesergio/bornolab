import { NextRequest, NextResponse } from "next/server";
import { ADMIN_COOKIE, verifyAdminToken } from "./lib/auth";
import { PATHNAME_HEADER } from "./lib/seo-pages";

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
  // Expose the route to Server Components (per-page SEO in layout)
  // via request headers — headers() in generateMetadata reads these.
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set(PATHNAME_HEADER, pathname);
  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: ["/admin/:path*", "/((?!_next/static|_next/image|favicon.ico|icon.svg|.*\\..*).*)"],
};
