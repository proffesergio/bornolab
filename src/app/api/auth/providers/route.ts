import { NextResponse } from "next/server";
import { getSiteConfig } from "@/lib/site-config";

/** GET /api/auth/providers — public login-method availability (no secrets). */
export async function GET() {
  const cfg = await getSiteConfig();
  return NextResponse.json({
    google: cfg.auth.googleEnabled && cfg.auth.googleClientId.trim().length > 0,
    facebook: cfg.auth.facebookEnabled && cfg.auth.facebookAppId.trim().length > 0,
    otp: cfg.auth.otpEnabled,
    magicLink: cfg.auth.magicLinkEnabled,
  });
}
