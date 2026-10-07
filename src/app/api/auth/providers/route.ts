import { NextResponse } from "next/server";
import { getSiteConfig } from "@/lib/site-config";

/** GET /api/auth/providers — public login-method availability (no secrets). */
export async function GET() {
  const cfg = await getSiteConfig();
  // Env IDs count: Google works out-of-the-box once GOOGLE_CLIENT_ID/SECRET are
  // set in .env.local / Vercel env — the Admin toggle is an extra kill-switch,
  // not a second setup step. Same pattern for Facebook.
  const googleId = cfg.auth.googleClientId.trim() || (process.env.GOOGLE_CLIENT_ID ?? "").trim();
  const fbId = cfg.auth.facebookAppId.trim() || (process.env.FACEBOOK_APP_ID ?? "").trim();
  return NextResponse.json({
    google: Boolean(googleId) && (cfg.auth.googleEnabled || Boolean((process.env.GOOGLE_CLIENT_ID ?? "").trim())),
    facebook: Boolean(fbId) && (cfg.auth.facebookEnabled || Boolean((process.env.FACEBOOK_APP_ID ?? "").trim())),
    otp: cfg.auth.otpEnabled,
    magicLink: cfg.auth.magicLinkEnabled,
  });
}
