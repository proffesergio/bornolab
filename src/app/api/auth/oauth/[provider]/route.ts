import { NextRequest, NextResponse } from "next/server";
import { getSiteConfig } from "@/lib/site-config";
import { getSiteUrl } from "@/lib/site-url";
import { readJson, writeJson } from "@/lib/store";

function redirectUri(provider: string) {
  return `${getSiteUrl()}/api/auth/oauth/callback?provider=${provider}`;
}

/** GET /api/auth/oauth/:provider — starts Google/Facebook OAuth (redirects to the provider). */
export async function GET(req: NextRequest, ctx: { params: Promise<{ provider: string }> }) {
  const { provider } = await ctx.params;
  if (provider !== "google" && provider !== "facebook") {
    return NextResponse.json({ error: "Unknown provider." }, { status: 400 });
  }
  const cfg = await getSiteConfig();
  if (provider === "google" && (!cfg.auth.googleEnabled || !cfg.auth.googleClientId.trim())) {
    return NextResponse.json({ error: "Google login is not configured." }, { status: 400 });
  }
  if (provider === "facebook" && (!cfg.auth.facebookEnabled || !cfg.auth.facebookAppId.trim())) {
    return NextResponse.json({ error: "Facebook login is not configured." }, { status: 400 });
  }

  // CSRF state: random nonce kept server-side for 10 minutes.
  const states = await readJson<Record<string, number>>("oauth-state.json", {});
  const nonce = `${Date.now().toString(36)}${Math.floor(Math.random() * 0xffffff).toString(36)}`;
  states[nonce] = Date.now() + 10 * 60_000;
  await writeJson("oauth-state.json", states);

  const cb = encodeURIComponent(redirectUri(provider));
  const url =
    provider === "google"
      ? `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(cfg.auth.googleClientId.trim())}&redirect_uri=${cb}&response_type=code&scope=${encodeURIComponent("openid email profile")}&state=${nonce}&prompt=select_account`
      : `https://www.facebook.com/v19.0/dialog/oauth?client_id=${encodeURIComponent(cfg.auth.facebookAppId.trim())}&redirect_uri=${cb}&state=${nonce}&scope=${encodeURIComponent("email,public_profile")}`;
  void req;
  return NextResponse.redirect(url);
}
