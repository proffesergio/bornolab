import { NextRequest, NextResponse } from "next/server";
import { getSiteConfig } from "@/lib/site-config";
import { issueOtp } from "@/lib/users";
import { getSiteUrl } from "@/lib/site-url";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * POST /api/auth/request-code { email, mode: "otp" | "link" }
 * Issues a 10-minute one-time code. Without SMTP configured the code is
 * returned in the response (dev mode) — wire an SMTP provider in production
 * and email the code / magic link instead of returning it.
 */
export async function POST(req: NextRequest) {
  const { email, mode } = (await req.json().catch(() => ({}))) as { email?: string; mode?: string };
  if (!email || !EMAIL_RE.test(email.trim())) {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  }
  const cfg = await getSiteConfig();
  if (mode === "link" && !cfg.auth.magicLinkEnabled) {
    return NextResponse.json({ error: "Magic links are disabled." }, { status: 403 });
  }
  if (mode !== "link" && !cfg.auth.otpEnabled) {
    return NextResponse.json({ error: "Email codes are disabled." }, { status: 403 });
  }
  try {
    const { code, linkToken } = await issueOtp(email);
    const dev = !process.env.SMTP_HOST; // no mailer → return code so dev can log in
    const linkUrl = `${getSiteUrl()}/login/verify?t=${linkToken}`;
    // TODO(prod): send via SMTP — subject/body with `code` (+ `linkUrl` when mode === "link").
    return NextResponse.json({ ok: true, dev, ...(dev ? { code, linkUrl } : {}) });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 429 });
  }
}
