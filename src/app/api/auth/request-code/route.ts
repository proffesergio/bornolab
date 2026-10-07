import { NextRequest, NextResponse } from "next/server";
import { getSiteConfig } from "@/lib/site-config";
import { issueOtp } from "@/lib/users";
import { getSiteUrl } from "@/lib/site-url";
import { isSmtpConfigured, sendAuthMail } from "@/lib/mailer";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * POST /api/auth/request-code { email, mode: "otp" | "link" }
 * Issues a 10-minute one-time code and emails it via SMTP.
 * Without SMTP configured the code is returned in the response (local dev
 * only) so you can log in without a mailer — never rely on this in production.
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
    const linkUrl = `${getSiteUrl()}/login/verify?t=${linkToken}`;
    if (!isSmtpConfigured()) {
      // Local dev without a mailer: return the code so login still works.
      // Production MUST set SMTP_HOST/USER/PASS so this branch never runs there.
      return NextResponse.json({ ok: true, dev: true, code, linkUrl });
    }
    try {
      await sendAuthMail(email.trim(), mode === "link" ? "link" : "otp", code, linkUrl);
    } catch {
      return NextResponse.json({ error: "Could not send the email. Try again in a minute." }, { status: 502 });
    }
    return NextResponse.json({ ok: true, dev: false });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 429 });
  }
}
