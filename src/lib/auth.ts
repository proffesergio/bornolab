/** BornoLab admin auth — .env credentials + HMAC-signed cookie token (no DB). Edge-compatible (Web Crypto only). */

const enc = new TextEncoder();

function b64urlEncode(bytes: Uint8Array): string {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "");
}

function b64urlDecode(s: string): Uint8Array<ArrayBuffer> {
  const b64 = s.replaceAll("-", "+").replaceAll("_", "/");
  const bin = atob(b64 + "=".repeat((4 - (b64.length % 4)) % 4));
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function hmacKey(): Promise<CryptoKey> {
  const secret = process.env.ADMIN_JWT_SECRET || `bornolab:${process.env.ADMIN_PASSWORD || "dev-secret-change-me"}`;
  return crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]);
}

/** Constant-time string compare to avoid trivial timing leaks. */
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let d = 0;
  for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return d === 0;
}

export function isAdminConfigured(): boolean {
  return Boolean(process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD);
}

export function verifyCredentials(email: string, password: string): boolean {
  const wantEmail = (process.env.ADMIN_EMAIL || "").trim().toLowerCase();
  const wantPass = process.env.ADMIN_PASSWORD || "";
  if (!wantEmail || !wantPass) return false;
  return safeEqual(email.trim().toLowerCase(), wantEmail) && safeEqual(password, wantPass);
}

export async function signAdminToken(email: string): Promise<string> {
  const header = b64urlEncode(enc.encode(JSON.stringify({ alg: "HS256", typ: "JWT" })));
  const payload = b64urlEncode(
    enc.encode(JSON.stringify({ sub: email, iat: Date.now(), exp: Date.now() + 7 * 86400_000 }))
  );
  const sig = b64urlEncode(
    new Uint8Array(await crypto.subtle.sign("HMAC", await hmacKey(), enc.encode(`${header}.${payload}`)))
  );
  return `${header}.${payload}.${sig}`;
}

/** Returns the admin email if the token is valid, else null. */
export async function verifyAdminToken(token: string): Promise<string | null> {
  try {
    const [h, p, s] = token.split(".");
    if (!h || !p || !s) return null;
    const ok = await crypto.subtle.verify("HMAC", await hmacKey(), b64urlDecode(s), enc.encode(`${h}.${p}`));
    if (!ok) return null;
    const body = JSON.parse(new TextDecoder().decode(b64urlDecode(p))) as { sub: string; exp: number };
    if (Date.now() > body.exp || !body.sub) return null;
    if ((process.env.ADMIN_EMAIL || "").toLowerCase() !== body.sub.toLowerCase()) return null;
    return body.sub;
  } catch {
    return null;
  }
}

export const ADMIN_COOKIE = "bornolab_admin";
