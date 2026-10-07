// TDD Task 8 — Config-driven GA/GTM + site verification + env template
// Run: node --test tests/task8-seo-env.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const read = (p) => readFileSync(join(root, p), "utf8");

// ---------- NO HARDCODED TRACKING ----------
test("layout has no hardcoded analytics IDs or verification tokens", () => {
  const src = read("src/app/layout.tsx");
  assert.ok(!src.includes("G-1WVRY0063T"), "stale hardcoded measurement ID must be gone.");
  assert.ok(!src.includes('gtmId="'), "GTM id must come from config, not a literal.");
  assert.ok(!src.includes('name="google-site-verification"'), "verification meta must come from metadata API, not body markup.");
  assert.ok(!src.includes("1K6AxjUFKTfzqFLOWn1Ugtlc7Ctbr3dwrLrGmvDl6K4"), "hardcoded verification token must be gone.");
});

// ---------- CONFIG-DRIVEN GA / GTM ----------
test("layout injects GA4 vs GTM based on the admin-configured ID shape", () => {
  const src = read("src/app/layout.tsx");
  assert.ok(src.includes("GoogleAnalytics") && src.includes("GoogleTagManager"), "layout must support both GA4 and GTM components.");
  assert.ok(src.includes("seo.gaId"), "the ID must be read from site config.");
  assert.ok(src.includes("GTM-") && src.includes("G-"), "layout must distinguish GTM- containers from G- measurement IDs.");
  assert.ok(src.includes("<GoogleAnalytics gaId={gaId}") || src.includes("<GoogleAnalytics gaId"), "GA4 component must receive the configured ID.");
  assert.ok(src.includes("<GoogleTagManager gtmId={gaId}") || src.includes("<GoogleTagManager gtmId"), "GTM component must receive the configured ID.");
});

test("verification code flows from config into metadata", () => {
  const layout = read("src/app/layout.tsx");
  assert.ok(layout.includes("googleSiteVerification"), "layout must read the verification code from config.");
  assert.ok(layout.includes("verification"), "layout must expose it via the Metadata verification API.");
  const shared = read("src/lib/site-config-shared.ts");
  assert.ok(shared.includes("googleSiteVerification"), "SiteConfig.seo must include googleSiteVerification.");
  assert.ok(shared.includes('googleSiteVerification: ""'), "default config must define it (crash-safe for old stored configs).");
});

// ---------- NO DOUBLE-LOADING ----------
test("Tracker only beacons page views — scripts come from layout", () => {
  const src = read("src/components/site-widgets.tsx");
  assert.ok(src.includes("/api/track"), "Tracker must keep the page-view beacon.");
  assert.ok(!src.includes("gtag"), "Tracker must not inject gtag (layout owns analytics).");
  assert.ok(!src.includes("googletagmanager.com"), "Tracker must not load tag-manager scripts.");
});

// ---------- ADMIN SEO TAB ----------
test("admin SEO tab edits the Google ID + verification code defensively", () => {
  const src = read("src/app/admin/page.tsx");
  assert.ok(src.includes("googleSiteVerification"), "SEO tab must include the verification field.");
  assert.ok(src.includes("GTM-"), "SEO label must tell admins both ID shapes work.");
  assert.ok(src.includes("config.seo[k] ??"), "SEO inputs must tolerate stored configs missing newer keys.");
});

// ---------- ENV TEMPLATE ----------
test(".env.example documents every server env var without real secrets", () => {
  assert.ok(existsSync(join(root, ".env.example")), ".env.example must exist (docs reference it).");
  const src = read(".env.example");
  for (const kw of ["ADMIN_EMAIL", "ADMIN_PASSWORD", "ADMIN_JWT_SECRET", "NEXT_PUBLIC_SITE_URL", "N8N_FORMAT_WEBHOOK_URL", "N8N_API_KEY", "SITE_CONFIG_JSON"]) {
    assert.ok(src.includes(kw), `.env.example must document '${kw}'.`);
  }
  assert.ok(!src.includes("bornolab-admin-123"), ".env.example must not contain real/dev secrets.");
  const ignore = read(".gitignore");
  assert.ok(ignore.includes("!.env.example"), ".gitignore must re-include .env.example so it can be committed.");
});
