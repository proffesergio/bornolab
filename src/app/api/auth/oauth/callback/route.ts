import { NextRequest, NextResponse } from "next/server";
import { getSiteUrl } from "@/lib/site-url";
import { readJson, writeJson } from "@/lib/store";
import { USER_COOKIE, logAudit, signUserToken, upsertUser } from "@/lib/users";

interface OAuthState { exp: number; next: string }

function baseUrl(req: NextRequest): string {
  const origin = req.nextUrl.origin;
  if (/^https?:\/\//.test(origin)) return origin.replace(/\/+$/, "");
  return getSiteUrl();
}

function redirectUri(req: NextRequest, provider: string) {
  return `${baseUrl(req)}/api/auth/oauth/callback?provider=${provider}`;
}

function fail(req: NextRequest, msg: string) {
  return NextResponse.redirect(`${baseUrl(req)}/login?error=${encodeURIComponent(msg)}`);
}

/** Keep post-login targets inside the app: path-only, no //host smuggling. */
function safeNext(raw: string | null): string {
  if (!raw) return "/";
  if (!raw.startsWith("/") || raw.startsWith("//") || raw.includes("://")) return "/";
  return raw.slice(0, 200);
}

interface GoogleProfile { email?: string; name?: string; picture?: string; email_verified?: boolean }
interface FacebookProfile { email?: string; name?: string; picture?: { data?: { url?: string } } }

/** GET /api/auth/oauth/callback?provider=&code=&state= — completes OAuth, starts a session. */
export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams;
  const provider = q.get("provider");
  const code = q.get("code");
  const state = q.get("state");
  if ((provider !== "google" && provider !== "facebook") || !code || !state) return fail(req, "Login was interrupted. Try again.");

  // Verify + consume CSRF state (supports legacy numeric entries).
  const states = await readJson<Record<string, number | OAuthState>>("oauth-state.json", {});
  const entry = states[state];
  delete states[state];
  await writeJson("oauth-state.json", states);
  const exp = typeof entry === "number" ? entry : entry?.exp;
  const next = typeof entry === "object" && entry ? safeNext(entry.next) : "/";
  if (!exp || Date.now() > exp) return fail(req, "Login expired. Try again.");

  try {
    let email = "";
    let name: string | undefined;
    let avatar: string | undefined;

    if (provider === "google") {
      const secret = process.env.GOOGLE_CLIENT_SECRET ?? "";
      const id = process.env.GOOGLE_CLIENT_ID ?? "";
      if (!secret || !id) return fail(req, "Google login is not configured on the server.");
      const tok = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          code, client_id: id, client_secret: secret,
          redirect_uri: redirectUri(req, provider), grant_type: "authorization_code",
        }),
      });
      if (!tok.ok) return fail(req, "Google rejected the login. Try again.");
      const { access_token } = (await tok.json()) as { access_token?: string };
      if (!access_token) return fail(req, "Google rejected the login. Try again.");
      const me = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
        headers: { Authorization: `Bearer ${access_token}` },
      });
      if (!me.ok) return fail(req, "Could not read your Google profile.");
      const p = (await me.json()) as GoogleProfile;
      if (!p.email) return fail(req, "Google did not share an email address.");
      email = p.email; name = p.name; avatar = p.picture;
    } else {
      const secret = process.env.FACEBOOK_APP_SECRET ?? "";
      const id = process.env.FACEBOOK_APP_ID ?? "";
      if (!secret || !id) return fail(req, "Facebook login is not configured on the server.");
      const tok = await fetch(
        `https://graph.facebook.com/v19.0/oauth/access_token?client_id=${encodeURIComponent(id)}&redirect_uri=${encodeURIComponent(redirectUri(req, provider))}&client_secret=${encodeURIComponent(secret)}&code=${encodeURIComponent(code)}`
      );
      if (!tok.ok) return fail(req, "Facebook rejected the login. Try again.");
      const { access_token } = (await tok.json()) as { access_token?: string };
      if (!access_token) return fail(req, "Facebook rejected the login. Try again.");
      const me = await fetch(`https://graph.facebook.com/me?fields=id,name,email,picture&access_token=${encodeURIComponent(access_token)}`);
      if (!me.ok) return fail(req, "Could not read your Facebook profile.");
      const p = (await me.json()) as FacebookProfile;
      if (!p.email) return fail(req, "Facebook did not share an email address.");
      email = p.email; name = p.name; avatar = p.picture?.data?.url;
    }

    const user = await upsertUser({ email, name, avatar, provider, emailVerified: true });
    if (user.status !== "active") return fail(req, "Account suspended.");
    const token = await signUserToken(user.id);
    await logAudit(`user:${user.id}`, "auth.login", provider);
    const dest = next === "/" ? "/?login=ok" : next;
    const res = NextResponse.redirect(`${baseUrl(req)}${dest}`);
    res.cookies.set(USER_COOKIE, token, {
      httpOnly: true, sameSite: "lax", path: "/", maxAge: 30 * 86400,
      ...(process.env.NODE_ENV === "production" ? { secure: true } : {}),
    });
    return res;
  } catch {
    return fail(req, "Login failed unexpectedly. Try again.");
  }
}
