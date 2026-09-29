import { NextRequest, NextResponse } from "next/server";
import { ADMIN_COOKIE, verifyAdminToken } from "./lib/auth";
import { PATHNAME_HEADER } from "./lib/seo-pages";

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
  // Expose the route to Server Components (per-page SEO in layout)
  // via request headers — headers() in generateMetadata reads these.
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set(PATHNAME_HEADER, pathname);
  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: ["/admin/:path*", "/((?!_next/static|_next/image|favicon.ico|icon.svg|.*\\..*).*)"],
};
