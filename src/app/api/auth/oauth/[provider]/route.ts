import { NextRequest, NextResponse } from "next/server";
import { getSiteConfig } from "@/lib/site-config";
import { getSiteUrl } from "@/lib/site-url";
import { readJson, writeJson } from "@/lib/store";

interface OAuthState { exp: number; next: string }

function baseUrl(req: NextRequest): string {
  // Prefer the live request origin so localhost + preview deployments get a
  // matching redirect_uri; fall back to the canonical site URL.
  const origin = req.nextUrl.origin;
  if (/^https?:\/\//.test(origin)) return origin.replace(/\/+$/, "");
  return getSiteUrl();
}

function redirectUri(req: NextRequest, provider: string) {
  return `${baseUrl(req)}/api/auth/oauth/callback?provider=${provider}`;
}

/** Keep post-login targets inside the app: path-only, no //host smuggling. */
function safeNext(raw: string | null): string {
  if (!raw) return "/";
  if (!raw.startsWith("/") || raw.startsWith("//") || raw.includes("://")) return "/";
  return raw.slice(0, 200);
}

/** GET /api/auth/oauth/:provider — starts Google/Facebook OAuth (redirects to the provider). */
export async function GET(req: NextRequest, ctx: { params: Promise<{ provider: string }> }) {
  const { provider } = await ctx.params;
  if (provider !== "google" && provider !== "facebook") {
    return NextResponse.json({ error: "Unknown provider." }, { status: 400 });
  }
  const cfg = await getSiteConfig();
  // Env fallbacks so OAuth works with zero dashboard setup.
  const googleId = cfg.auth.googleClientId.trim() || (process.env.GOOGLE_CLIENT_ID ?? "").trim();
  const fbId = cfg.auth.facebookAppId.trim() || (process.env.FACEBOOK_APP_ID ?? "").trim();
  if (provider === "google" && !googleId) {
    return NextResponse.json({ error: "Google login is not configured." }, { status: 400 });
  }
  if (provider === "facebook" && !fbId) {
    return NextResponse.json({ error: "Facebook login is not configured." }, { status: 400 });
  }

  // CSRF state: random nonce kept server-side for 10 minutes, carrying ?next=.
  const states = await readJson<Record<string, number | OAuthState>>("oauth-state.json", {});
  const nonce = `${Date.now().toString(36)}${Math.floor(Math.random() * 0xffffff).toString(36)}`;
  states[nonce] = { exp: Date.now() + 10 * 60_000, next: safeNext(req.nextUrl.searchParams.get("next")) };
  await writeJson("oauth-state.json", states);

  const cb = encodeURIComponent(redirectUri(req, provider));
  const url =
    provider === "google"
      ? `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(googleId)}&redirect_uri=${cb}&response_type=code&scope=${encodeURIComponent("openid email profile")}&state=${nonce}&prompt=select_account`
      : `https://www.facebook.com/v19.0/dialog/oauth?client_id=${encodeURIComponent(fbId)}&redirect_uri=${cb}&state=${nonce}&scope=${encodeURIComponent("email,public_profile")}`;
  void req;
  return NextResponse.redirect(url);
}
