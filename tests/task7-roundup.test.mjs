// TDD Task 7 — Roundup: converter files, fonts hardening, styler, software,
// n8n proxies + /format, log hardening, admin ops tools, copy consistency.
// Run: node --test tests/task7-roundup.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const read = (p) => readFileSync(join(root, p), "utf8");

// ---------- CONVERTER ----------
test("converter has swap, txt file I/O and batch docx", () => {
  const src = read("src/app/convert/page.tsx");
  assert.ok(src.includes("Swap"), "converter must offer a Swap direction button.");
  assert.ok(src.includes("Save .txt") && src.includes("Open .txt"), "converter must support .txt upload/download.");
  assert.ok(src.includes("batchDocx") || src.includes("Batch convert"), "converter must batch-convert .docx files.");
  assert.ok(src.includes("mammoth") && src.includes("Packer"), "batch must extract with mammoth and rebuild with docx Packer.");
});

test("/convert canonicalizes to /bijoy-unicode-converter", () => {
  const cfg = read("next.config.ts");
  assert.ok(cfg.includes('"/convert"') && cfg.includes('"/bijoy-unicode-converter"'), "next.config must redirect /convert to canonical.");
  const sm = read("src/app/sitemap.ts");
  assert.ok(!sm.includes('"/convert"'), "sitemap must not list the redirecting /convert.");
  assert.ok(sm.includes('"/bijoy-unicode-converter"'), "sitemap must list the canonical converter.");
});

// ---------- FONTS ----------
test("fonts proxy is SSRF-safe with size limits", () => {
  const src = read("src/app/api/fonts/route.ts");
  assert.ok(src.includes("/fonts/"), "fonts proxy must scope to local /fonts/ paths.");
  assert.ok(/http.*url|fetch\(url\)/.test(src) === false, "fonts proxy must not fetch arbitrary upstream URLs.");
  assert.ok(/413|MAX_BYTES|too large/i.test(src), "fonts proxy must enforce a size cap.");
});

test("fonts page surfaces download failures", () => {
  const src = read("src/app/fonts/page.tsx");
  assert.ok(src.includes('role="alert"'), "fonts page must show an error alert on failed downloads.");
});

// ---------- STYLER / SOFTWARE ----------
test("styler mono map fixed + HTML snippet export exists", () => {
  const lib = read("src/lib/styler.ts");
  assert.ok(lib.includes("0x1d68a"), "lowercase mono must use U+1D68A base (not collide with uppercase).");
  assert.ok(lib.includes("toHtmlSnippet"), "styler lib must export toHtmlSnippet.");
  const page = read("src/app/styler/page.tsx");
  assert.ok(page.includes("toHtmlSnippet"), "styler page must offer HTML copy.");
});

test("software free download is a real starter kit + admin shows fulfillment", () => {
  const sw = read("src/app/software/page.tsx");
  assert.ok(sw.includes("starter-kit") || sw.includes("Starter Kit"), "free download must be a proper starter kit.");
  const admin = read("src/app/admin/page.tsx");
  assert.ok(admin.includes("Fulfill:"), "admin orders must show fulfillment guidance.");
});

// ---------- N8N ----------
test("n8n translate/split proxies + multipart format + status helper exist", () => {
  for (const r of ["translate", "split"]) {
    assert.ok(existsSync(join(root, `src/app/api/n8n/${r}/route.ts`)), `src/app/api/n8n/${r}/route.ts must exist.`);
  }
  const fmt = read("src/app/api/n8n/format/route.ts");
  assert.ok(fmt.includes("multipart/form-data") && fmt.includes("formData"), "format proxy must accept multipart uploads.");
  const lib = read("src/lib/n8n.ts");
  assert.ok(lib.includes("n8nJobStatus"), "n8n lib must expose a server-backed liveness check.");
  assert.ok(!lib.includes("NEXT_PUBLIC_N8N"), "n8n lib must not rely on NEXT_PUBLIC_* env.");
  assert.ok(existsSync(join(root, "src/app/format/page.tsx")), "src/app/format/page.tsx must exist.");
});

// ---------- OPS LOG HARDENING ----------
test("pdf log validates tools, throttles, and supports admin clear", () => {
  const src = read("src/app/api/pdf/log/route.ts");
  assert.ok(src.includes("KNOWN_TOOLS") || src.includes("unknown tool"), "log route must validate the tool key.");
  assert.ok(/429|rate limit/i.test(src), "log route must throttle abuse.");
  assert.ok(src.includes("DELETE"), "log route must support admin clear.");
  const stats = read("src/app/api/admin/pdf-stats/route.ts");
  assert.ok(stats.includes("days"), "pdf-stats must support a days filter.");
});

// ---------- ADMIN OPS TOOLS ----------
test("admin guards stale caps, debounces cap edits, clears/exports logs", () => {
  const shared = read("src/lib/site-config-shared.ts");
  assert.ok(shared.includes("pdfCaps"), "shared config must export a crash-safe pdfCaps helper.");
  for (const p of ["merge", "split", "translate", "compress", "images-to-pdf"]) {
    const src = read(`src/app/${p}/page.tsx`);
    assert.ok(src.includes("pdfCaps"), `${p} page must use pdfCaps.`);
  }
  const admin = read("src/app/admin/page.tsx");
  assert.ok(admin.includes("CapsNumber"), "admin must debounce cap number inputs.");
  assert.ok(admin.includes("Export CSV") && admin.includes("Clear log"), "admin must export + clear ops logs.");
});

// ---------- COPY ----------
test("hub + sitemap cover the new routes", () => {
  const sm = read("src/app/sitemap.ts");
  for (const r of ["/compress", "/images-to-pdf", "/format", "/login"]) {
    assert.ok(sm.includes(`"${r}"`), `sitemap must list '${r}'.`);
  }
  const hub = read("src/app/pdf-tools/page.tsx");
  assert.ok(hub.includes('"/compress"') && hub.includes('"/images-to-pdf"'), "hub must link compress + images live.");
});
