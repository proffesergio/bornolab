// Admin power batch — per-page SEO, ads.txt check, global search, config backup.
// Run: node --test tests/task11-admin-power.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const read = (p) => readFileSync(join(root, p), "utf8");

test("site config carries per-page SEO overrides", () => {
  const src = read("src/lib/site-config-shared.ts");
  assert.ok(src.includes("seoPages"), "SiteConfig must include seoPages.");
  assert.ok(src.includes("SeoPageOverride"), "SeoPageOverride type must exist.");
});

test("seo-pages helper resolves exact, prefix and fallback", () => {
  assert.ok(existsSync(join(root, "src/lib/seo-pages.ts")), "src/lib/seo-pages.ts must exist.");
  const src = read("src/lib/seo-pages.ts");
  assert.ok(src.includes("resolvePageSeo"), "resolvePageSeo must exist.");
  assert.ok(src.includes("SEO_ROUTE_OPTIONS"), "SEO_ROUTE_OPTIONS must exist.");
  assert.ok(src.includes("PATHNAME_HEADER"), "PATHNAME_HEADER must exist.");
  assert.ok(src.includes("noindex"), "noindex must be supported.");
});

test("middleware exposes the pathname and still guards /admin", () => {
  const src = read("src/proxy.ts");
  assert.ok(src.includes("PATHNAME_HEADER"), "proxy must set the pathname header.");
  assert.ok(src.includes("verifyAdminToken"), "proxy must keep the admin guard.");
  assert.ok(src.includes("/admin/:path*"), "proxy matcher must keep /admin coverage.");
});

test("layout applies per-page SEO with noindex support", () => {
  const src = read("src/app/layout.tsx");
  assert.ok(src.includes("resolvePageSeo"), "layout must resolve per-page SEO.");
  assert.ok(src.includes("index: false"), "layout must honor noindex overrides.");
});

test("admin SEO section edits per-page overrides", () => {
  const src = read("src/app/admin/page.tsx");
  assert.ok(src.includes("seoPages"), "admin must read/write seoPages.");
  assert.ok(src.includes("Per-page overrides"), "admin SEO must list overrides.");
  assert.ok(src.includes("noindex this page"), "admin must offer a noindex toggle.");
});

test("ads.txt status check is admin-guarded and surfaced in Ads tab", () => {
  assert.ok(existsSync(join(root, "src/app/api/admin/ads-check/route.ts")), "ads-check route must exist.");
  const api = read("src/app/api/admin/ads-check/route.ts");
  assert.ok(api.includes("requireAdmin"), "ads-check must require admin.");
  assert.ok(api.includes("pub-"), "ads-check must compare publisher IDs.");
  const admin = read("src/app/admin/page.tsx");
  assert.ok(admin.includes("ads.txt status"), "Ads tab must show ads.txt status.");
});

test("global admin search jumps to users, orders and catalog items", () => {
  const src = read("src/app/admin/page.tsx");
  assert.ok(src.includes("searchResults"), "admin must compute global search results.");
  assert.ok(src.includes("setOrderQuery"), "order search must filter the orders list.");
  assert.ok(src.includes("customStudy"), "search must cover study materials.");
});

test("config backup supports export, replace-import and seed copy", () => {
  const api = read("src/app/api/admin/config/route.ts");
  assert.ok(api.includes("__replace"), "config API must support full-replace restore.");
  const admin = read("src/app/admin/page.tsx");
  assert.ok(admin.includes("Backup & restore"), "Settings must have a backup section.");
  assert.ok(admin.includes("Export JSON"), "backup must offer JSON export.");
  assert.ok(admin.includes("SITE_CONFIG_JSON"), "backup must offer a Vercel seed copy.");
});
