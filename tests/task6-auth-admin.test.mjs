// TDD Task 6 — Member auth + admin membership console
// Run: node --test tests/task6-auth-admin.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const read = (p) => readFileSync(join(root, p), "utf8");

// ---------- AUTH CORE ----------
test("member store supports users, OTP, sessions, plans, roles, audit", () => {
  assert.ok(existsSync(join(root, "src/lib/users.ts")), "src/lib/users.ts must exist.");
  const src = read("src/lib/users.ts");
  for (const kw of ["upsertUser", "issueOtp", "verifyOtp", "signUserToken", "sessionUser", "listPlans", "listRoles", "logAudit", "userStats"]) {
    assert.ok(src.includes(kw), `users lib must export '${kw}'.`);
  }
});

test("auth API covers providers, OTP, session, OAuth", () => {
  for (const r of ["providers", "request-code", "verify-code", "me", "logout"]) {
    assert.ok(existsSync(join(root, `src/app/api/auth/${r}/route.ts`)), `src/app/api/auth/${r}/route.ts must exist.`);
  }
  assert.ok(existsSync(join(root, "src/app/api/auth/oauth/[provider]/route.ts")), "oauth start route must exist.");
  assert.ok(existsSync(join(root, "src/app/api/auth/oauth/callback/route.ts")), "oauth callback route must exist.");
  const cb = read("src/app/api/auth/oauth/callback/route.ts");
  assert.ok(cb.includes("googleapis.com") && cb.includes("graph.facebook.com"), "callback must handle Google + Facebook.");
  const start = read("src/app/api/auth/oauth/[provider]/route.ts");
  assert.ok(start.includes("accounts.google.com") && start.includes("facebook.com"), "start route must redirect to both providers.");
});

// ---------- LOGIN UI ----------
test("login + magic-link verify pages exist with social buttons", () => {
  assert.ok(existsSync(join(root, "src/app/login/page.tsx")), "src/app/login/page.tsx must exist.");
  assert.ok(existsSync(join(root, "src/app/login/verify/page.tsx")), "src/app/login/verify/page.tsx must exist.");
  const src = read("src/app/login/page.tsx");
  assert.ok(src.includes("/api/auth/oauth/google"), "login must offer Google.");
  assert.ok(src.includes("/api/auth/oauth/facebook"), "login must offer Facebook.");
  assert.ok(src.includes("/api/auth/request-code"), "login must request email codes.");
  assert.ok(src.includes("/api/auth/verify-code"), "login must verify codes.");
  assert.ok(existsSync(join(root, "src/components/user-menu.tsx")), "src/components/user-menu.tsx must exist.");
  const nav = read("src/components/navbar.tsx");
  assert.ok(nav.includes("UserMenu"), "navbar must render the user menu.");
});

// ---------- ADMIN MEMBERSHIP APIs ----------
test("admin users/plans/roles/audit APIs exist", () => {
  for (const r of ["users", "plans", "roles", "audit"]) {
    assert.ok(existsSync(join(root, `src/app/api/admin/${r}/route.ts`)), `src/app/api/admin/${r}/route.ts must exist.`);
  }
  const users = read("src/app/api/admin/users/route.ts");
  assert.ok(users.includes("PATCH"), "users route must allow role/plan/status updates.");
  const plans = read("src/app/api/admin/plans/route.ts");
  assert.ok(plans.includes("POST") && plans.includes("DELETE"), "plans route must support CRUD.");
  const roles = read("src/app/api/admin/roles/route.ts");
  assert.ok(roles.includes("POST") && roles.includes("DELETE"), "roles route must support CRUD.");
});

// ---------- ADMIN CONSOLE ----------
test("admin has a grouped sidebar (reference design) with membership sections", () => {
  const src = read("src/app/admin/page.tsx");
  for (const label of ["Customers", "Subscriptions", "Roles", "Plans", "Audit Log", "Access"]) {
    assert.ok(src.includes(label), `admin sidebar must include '${label}'.`);
  }
  assert.ok(src.includes("Manage") && src.includes("System"), "admin sidebar must group Manage + System sections.");
});

test("admin manages ad units + payment processors + auth providers", () => {
  const src = read("src/app/admin/page.tsx");
  assert.ok(src.includes("Ad units") || src.includes("Ad Units"), "admin Ads must manage ad units.");
  assert.ok(src.includes("adSlotId"), "ad units must carry an AdSense slot id.");
  assert.ok(src.includes("processors"), "admin Payments must manage processors.");
  assert.ok(src.includes("googleClientId") && src.includes("facebookAppId"), "admin Access must configure OAuth app IDs.");
  const cfg = read("src/lib/site-config-shared.ts");
  assert.ok(cfg.includes("units"), "site config ads must include units.");
  assert.ok(cfg.includes("processors"), "site config payments must include processors.");
  assert.ok(cfg.includes("auth"), "site config must include auth provider config.");
});

test("sitemap lists the login page", () => {
  const sm = read("src/app/sitemap.ts");
  assert.ok(sm.includes('"/login"') || sm.includes("'/login'"), "sitemap must list /login.");
});
