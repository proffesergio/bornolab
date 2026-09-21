// TDD Task 3 — STEP A (failing first)
// Working Merge PDF tool + Admin CRM PDF Tools module (toggles, caps, ops logs)
// Run: node --test tests/task3-merge-admin.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const read = (p) => readFileSync(join(root, p), "utf8");

// ---------- MERGE PAGE ----------
test("merge page exists and combines PDFs in custom order with pdf-lib", () => {
  assert.ok(existsSync(join(root, "src/app/merge/page.tsx")), "src/app/merge/page.tsx must exist.");
  const src = read("src/app/merge/page.tsx");
  assert.ok(src.includes("PDFDocument"), "merge must use pdf-lib PDFDocument.");
  assert.ok(src.includes("copyPages"), "merge must copyPages in custom sequence.");
  assert.ok(src.includes("save"), "merge must save the combined document.");
});

test("merge page supports multi-pick, reorder, remove, download", () => {
  const src = read("src/app/merge/page.tsx");
  assert.ok(/multiple/.test(src), "merge file input must accept multiple files.");
  assert.ok(/move|reorder|up.*down|ArrowUp/i.test(src), "merge must let users reorder files.");
  assert.ok(/remove/i.test(src), "merge must let users remove a file.");
  assert.ok(src.includes("downloadBlob"), "merge must download the result via downloadBlob.");
});

test("merge page enforces admin caps + beacons the ops log", () => {
  const src = read("src/app/merge/page.tsx");
  assert.ok(src.includes("pdfTools"), "merge must read caps from site config (pdfTools).");
  assert.ok(/maxMB|maxFiles/.test(src), "merge must enforce maxMB / maxFiles caps.");
  assert.ok(src.includes("/api/pdf/log"), "merge must POST each job to /api/pdf/log.");
});

// ---------- CONFIG SCHEMA ----------
test("site config schema has per-tool pdfTools caps with defaults", () => {
  const src = read("src/lib/site-config-shared.ts");
  assert.ok(src.includes("PdfToolKey"), "shared config must export PdfToolKey.");
  assert.ok(src.includes("pdfTools"), "SiteConfig must include pdfTools caps.");
  for (const k of ["merge", "split", "translate", "compress"]) {
    assert.ok(src.includes(`"${k}"`) || src.includes(`${k}:`), `pdfTools defaults must cover '${k}'.`);
  }
});

// ---------- API ROUTES ----------
test("public ops-log endpoint validates + persists entries", () => {
  assert.ok(existsSync(join(root, "src/app/api/pdf/log/route.ts")), "src/app/api/pdf/log/route.ts must exist.");
  const src = read("src/app/api/pdf/log/route.ts");
  assert.ok(src.includes("POST"), "log route must export POST.");
  assert.ok(/pdf-ops/.test(src), "log route must persist to the pdf-ops store.");
  assert.ok(/tool[\s\S]*files[\s\S]*pages/.test(src), "log route must accept {tool, files, pages, ...}.");
});

test("admin pdf-stats endpoint aggregates totals, failures, recent", () => {
  assert.ok(existsSync(join(root, "src/app/api/admin/pdf-stats/route.ts")), "pdf-stats route must exist.");
  const src = read("src/app/api/admin/pdf-stats/route.ts");
  assert.ok(src.includes("requireAdmin"), "pdf-stats must require admin auth.");
  for (const kw of ["total", "fail", "recent", "perTool"]) {
    assert.ok(src.toLowerCase().includes(kw.toLowerCase()), `pdf-stats must expose '${kw}'.`);
  }
});

// ---------- ADMIN CRM ----------
test("admin has a PDF Tools tab with toggles + caps editors", () => {
  const src = read("src/app/admin/page.tsx");
  assert.ok(/pdftools|pdf-tools|PDF Tools/.test(src), "admin must have a PDF Tools section.");
  assert.ok(src.includes("pdfTools"), "admin must read/write config.pdfTools.");
  assert.ok(/maxMB/.test(src), "admin must edit per-tool maxMB caps.");
  assert.ok(/maxFiles/.test(src), "admin must edit per-tool maxFiles caps.");
});

test("admin shows ops dashboard (totals, failure rate, recent jobs)", () => {
  const src = read("src/app/admin/page.tsx");
  assert.ok(src.includes("/api/admin/pdf-stats"), "admin must fetch /api/admin/pdf-stats.");
  assert.ok(/fail/i.test(src), "admin must display failure metrics.");
  assert.ok(/recent/i.test(src), "admin must list recent operations.");
});

// ---------- NAV / SITEMAP ----------
test("merge is linked live in nav + sitemap (no Soon stub)", () => {
  const nav = read("src/components/navbar.tsx");
  assert.ok(nav.includes('"/merge"') || nav.includes("'/merge'"), "navbar must link Merge to /merge.");
  const sm = read("src/app/sitemap.ts");
  assert.ok(sm.includes('"/merge"') || sm.includes("'/merge'"), "sitemap must list /merge.");
  const overview = read("src/app/pdf-tools/page.tsx");
  assert.ok(overview.includes('"/merge"') || overview.includes("'/merge'"), "pdf-tools overview Merge card must link /merge live.");
});
