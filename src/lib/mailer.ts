/** Server-only: SMTP mailer for auth codes / magic links. Never import from Client Components. */
import nodemailer from "nodemailer";

export function isSmtpConfigured(): boolean {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

/** Sends the OTP code (+ magic link when mode is "link"). Throws when SMTP is unset or sending fails. */
export async function sendAuthMail(
  to: string,
  mode: "otp" | "link",
  code: string,
  linkUrl: string
): Promise<void> {
  const host = (process.env.SMTP_HOST ?? "").trim();
  const port = Number(process.env.SMTP_PORT ?? 587) || 587;
  const user = (process.env.SMTP_USER ?? "").trim();
  const pass = (process.env.SMTP_PASS ?? "").trim();
  const from = (process.env.SMTP_FROM ?? "").trim() || user;
  if (!host || !user || !pass) throw new Error("SMTP is not configured.");

  const transport = nodemailer.createTransport({
    host,
    port,
    secure: port === 465, // 465 = implicit TLS; 587 = STARTTLS
    auth: { user, pass },
  });

  const subject = mode === "link" ? "Your BornoLab magic link" : "Your BornoLab login code";
  const text =
    mode === "link"
      ? `Click this link to log in to BornoLab (valid 10 minutes):\n\n${linkUrl}\n\nOr enter this 6-digit code on the login page: ${code}\n\nIf you didn't request this, ignore this email.`
      : `Your BornoLab login code (valid 10 minutes):\n\n${code}\n\nIf you didn't request this, ignore this email.`;

  await transport.sendMail({ from, to, subject, text });
}
