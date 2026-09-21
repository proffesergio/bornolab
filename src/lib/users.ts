/** Server-only: member users, OTP/magic-link codes, user sessions, plans, roles, audit log. */
import { readJson, writeJson } from "./store";
import {
  DEFAULT_PLANS, DEFAULT_ROLES,
  type AuditEntry, type MemberUser, type PlanDef, type RoleDef,
} from "./members-shared";

export type { AuditEntry, MemberUser, PlanDef, RoleDef };

const enc = new TextEncoder();

/** UTF-8 bytes as a fresh ArrayBuffer view (satisfies strict BufferSource typing). */
function utf8(s: string): Uint8Array<ArrayBuffer> {
  const v = enc.encode(s);
  const out = new Uint8Array(v.byteLength);
  out.set(v);
  return out;
}

/* ---------------- HMAC helpers (Web Crypto, Edge-compatible) ---------------- */

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

async function userKey(): Promise<CryptoKey> {
  const secret =
    process.env.USER_JWT_SECRET ||
    process.env.ADMIN_JWT_SECRET ||
    `bornolab-users:${process.env.ADMIN_PASSWORD || "dev-secret-change-me"}`;
  return crypto.subtle.importKey("raw", utf8(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]);
}

export async function sha256Hex(s: string): Promise<string> {
  const d = await crypto.subtle.digest("SHA-256", utf8(s));
  return [...new Uint8Array(d)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

/* ---------------- Users ---------------- */

export async function listUsers(): Promise<MemberUser[]> {
  return readJson<MemberUser[]>("users.json", []);
}

async function saveUsers(users: MemberUser[]): Promise<void> {
  await writeJson("users.json", users);
}

function newId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}${Math.floor(Math.random() * 0xffffff).toString(36)}`;
}

export async function getUserById(id: string): Promise<MemberUser | null> {
  return (await listUsers()).find((u) => u.id === id) ?? null;
}

export async function getUserByEmail(email: string): Promise<MemberUser | null> {
  const e = email.trim().toLowerCase();
  return (await listUsers()).find((u) => u.email === e) ?? null;
}

export async function upsertUser(input: {
  email: string; name?: string; avatar?: string; provider: string; emailVerified?: boolean;
}): Promise<MemberUser> {
  const users = await listUsers();
  const email = input.email.trim().toLowerCase();
  const now = Date.now();
  const existing = users.find((u) => u.email === email);
  if (existing) {
    existing.name = input.name || existing.name;
    if (input.avatar) existing.avatar = input.avatar;
    if (!existing.providers.includes(input.provider)) existing.providers.push(input.provider);
    if (input.emailVerified) existing.emailVerified = true;
    existing.lastLoginAt = now;
    await saveUsers(users);
    return existing;
  }
  const user: MemberUser = {
    id: newId("usr"),
    email,
    name: input.name || email.split("@")[0],
    avatar: input.avatar,
    providers: [input.provider],
    role: "member",
    planId: "free",
    planStatus: "none",
    status: "active",
    createdAt: now,
    lastLoginAt: now,
    emailVerified: input.emailVerified ?? false,
  };
  users.push(user);
  await saveUsers(users);
  return user;
}

export async function updateUser(id: string, patch: Partial<Pick<MemberUser, "role" | "planId" | "planStatus" | "status" | "name">>): Promise<MemberUser | null> {
  const users = await listUsers();
  const u = users.find((x) => x.id === id);
  if (!u) return null;
  if (patch.role !== undefined) u.role = patch.role;
  if (patch.planId !== undefined) u.planId = patch.planId;
  if (patch.planStatus !== undefined) u.planStatus = patch.planStatus;
  if (patch.status !== undefined) u.status = patch.status;
  if (patch.name !== undefined) u.name = patch.name;
  await saveUsers(users);
  return u;
}

export interface UserStats {
  total: number;
  new7d: number;
  active: number;
  suspended: number;
  subscribers: number;
  byProvider: Record<string, number>;
  byPlan: Record<string, number>;
}

export async function userStats(): Promise<UserStats> {
  const users = await listUsers();
  const week = Date.now() - 7 * 86400_000;
  const byProvider: Record<string, number> = {};
  const byPlan: Record<string, number> = {};
  let subscribers = 0;
  for (const u of users) {
    for (const p of u.providers) byProvider[p] = (byProvider[p] ?? 0) + 1;
    byPlan[u.planId] = (byPlan[u.planId] ?? 0) + 1;
    if (u.planId !== "free" && (u.planStatus === "active" || u.planStatus === "trial")) subscribers++;
  }
  return {
    total: users.length,
    new7d: users.filter((u) => u.createdAt >= week).length,
    active: users.filter((u) => u.status === "active").length,
    suspended: users.filter((u) => u.status !== "active").length,
    subscribers,
    byProvider,
    byPlan,
  };
}

/* ---------------- OTP / magic-link codes ---------------- */

interface OtpRec { hash: string; exp: number; attempts: number; requestedAt: number[] }

export function makeOtp(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export async function issueOtp(email: string): Promise<{ code: string; linkToken: string }> {
  const e = email.trim().toLowerCase();
  const store = await readJson<Record<string, OtpRec>>("otp.json", {});
  const now = Date.now();
  const rec = store[e] ?? { hash: "", exp: 0, attempts: 0, requestedAt: [] };
  rec.requestedAt = rec.requestedAt.filter((t) => now - t < 10 * 60_000);
  if (rec.requestedAt.length >= 5) throw new Error("Too many codes requested — try again in 10 minutes.");
  const code = makeOtp();
  store[e] = { hash: await sha256Hex(`otp:${e}:${code}`), exp: now + 10 * 60_000, attempts: 0, requestedAt: [...rec.requestedAt, now] };
  await writeJson("otp.json", store);
  // Magic link carries the same one-time code (single-use via attempts/expiry).
  const linkToken = btoa(`${e}:${code}`).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "");
  return { code, linkToken };
}

export function decodeLinkToken(token: string): { email: string; code: string } | null {
  try {
    const b64 = token.replaceAll("-", "+").replaceAll("_", "/");
    const [email, code] = atob(b64 + "=".repeat((4 - (b64.length % 4)) % 4)).split(":");
    if (!email || !/^\d{6}$/.test(code ?? "")) return null;
    return { email, code };
  } catch {
    return null;
  }
}

export async function verifyOtp(email: string, code: string): Promise<boolean> {
  const e = email.trim().toLowerCase();
  const store = await readJson<Record<string, OtpRec>>("otp.json", {});
  const rec = store[e];
  if (!rec || Date.now() > rec.exp) return false;
  if (rec.attempts >= 5) return false;
  const ok = (await sha256Hex(`otp:${e}:${code.trim()}`)) === rec.hash;
  rec.attempts++;
  if (ok) delete store[e];
  else store[e] = rec;
  await writeJson("otp.json", store);
  return ok;
}

/* ---------------- User sessions ---------------- */

export const USER_COOKIE = "bornolab_user";

export async function signUserToken(userId: string): Promise<string> {
  const header = b64urlEncode(enc.encode(JSON.stringify({ alg: "HS256", typ: "JWT" })));
  const payload = b64urlEncode(enc.encode(JSON.stringify({ sub: userId, iat: Date.now(), exp: Date.now() + 30 * 86400_000 })));
  const sig = b64urlEncode(new Uint8Array(await crypto.subtle.sign("HMAC", await userKey(), utf8(`${header}.${payload}`))));
  return `${header}.${payload}.${sig}`;
}

export async function verifyUserToken(token: string): Promise<string | null> {
  try {
    const [h, p, s] = token.split(".");
    if (!h || !p || !s) return null;
    const ok = await crypto.subtle.verify("HMAC", await userKey(), b64urlDecode(s), utf8(`${h}.${p}`));
    if (!ok) return null;
    const body = JSON.parse(new TextDecoder().decode(b64urlDecode(p))) as { sub: string; exp: number };
    if (Date.now() > body.exp || !body.sub) return null;
    return body.sub;
  } catch {
    return null;
  }
}

export async function sessionUser(token: string): Promise<MemberUser | null> {
  const id = await verifyUserToken(token);
  if (!id) return null;
  const u = await getUserById(id);
  return u && u.status === "active" ? u : null;
}

/* ---------------- Plans / Roles ---------------- */

export async function listPlans(): Promise<PlanDef[]> {
  const plans = await readJson<PlanDef[]>("plans.json", []);
  if (!plans.length) {
    await writeJson("plans.json", DEFAULT_PLANS);
    return DEFAULT_PLANS;
  }
  return plans;
}

export async function savePlans(plans: PlanDef[]): Promise<void> {
  await writeJson("plans.json", plans);
}

export async function listRoles(): Promise<RoleDef[]> {
  const roles = await readJson<RoleDef[]>("roles.json", []);
  if (!roles.length) {
    await writeJson("roles.json", DEFAULT_ROLES);
    return DEFAULT_ROLES;
  }
  return roles;
}

export async function saveRoles(roles: RoleDef[]): Promise<void> {
  await writeJson("roles.json", roles);
}

/* ---------------- Audit log ---------------- */

export async function logAudit(actor: string, action: string, detail?: string): Promise<void> {
  const log = await readJson<AuditEntry[]>("audit.json", []);
  log.push({ at: Date.now(), actor, action, detail });
  await writeJson("audit.json", log.slice(-500));
}

export async function readAudit(limit = 100): Promise<AuditEntry[]> {
  const log = await readJson<AuditEntry[]>("audit.json", []);
  return log.slice(-limit).reverse();
}
