// TDD Task 4 — Compress PDF (iLovePDF-style)
// Run: node --test tests/task4-compress.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const read = (p) => readFileSync(join(root, p), "utf8");

// ---------- COMPRESS PAGE ----------
test("compress page exists and raster-rebuilds PDFs with quality control", () => {
  assert.ok(existsSync(join(root, "src/app/compress/page.tsx")), "src/app/compress/page.tsx must exist.");
  const src = read("src/app/compress/page.tsx");
  assert.ok(src.includes("embedJpg"), "compress must rebuild pages via pdf-lib embedJpg (raster recompress).");
  assert.ok(src.includes("toBlob"), "compress must rasterize pages through canvas toBlob.");
  assert.ok(/quality/i.test(src), "compress must expose a quality control.");
});

test("compress page offers iLovePDF-style levels + custom slider", () => {
  const src = read("src/app/compress/page.tsx");
  for (const kw of ["extreme", "recommended", "less"]) {
    assert.ok(src.toLowerCase().includes(kw), `compress must offer a '${kw}' level.`);
  }
  assert.ok(src.includes('type="range"'), "compress must include a quality range slider.");
});

test("compress page supports multi-pick, per-file results, download all", () => {
  const src = read("src/app/compress/page.tsx");
  assert.ok(/multiple/.test(src), "compress file input must accept multiple files.");
  assert.ok(/remove/i.test(src), "compress must let users remove a file.");
  assert.ok(src.includes("downloadBlob"), "compress must download results via downloadBlob.");
  assert.ok(/savings|smaller|ratio|−/i.test(src), "compress must show before/after savings.");
});

test("compress page enforces admin caps + beacons the ops log", () => {
  const src = read("src/app/compress/page.tsx");
  assert.ok(src.includes("pdfTools") || src.includes("pdfCaps"), "compress must read caps from site config (pdfTools).");
  assert.ok(/maxMB|maxFiles/.test(src), "compress must enforce maxMB / maxFiles caps.");
  assert.ok(src.includes("/api/pdf/log"), "compress must POST each job to /api/pdf/log.");
  assert.ok(src.includes('"compress"') || src.includes("'compress'"), "compress log calls must use tool 'compress'.");
});

// ---------- CONFIG / WIRING ----------
test("site config enables compress by default", () => {
  const src = read("src/lib/site-config-shared.ts");
  assert.ok(src.includes("compress"), "shared config must include compress caps.");
  assert.ok(/compress:\s*\{\s*enabled:\s*true/.test(src), "compress must be enabled by default.");
});

test("compress is linked live in nav + hub + sitemap (no Soon stub)", () => {
  const nav = read("src/components/navbar.tsx");
  assert.ok(nav.includes('"/compress"'), "navbar must link Compress to /compress.");
  assert.ok(!nav.includes("/pdf-tools#compress"), "navbar must not stub compress to /pdf-tools#compress.");
  const hub = read("src/app/pdf-tools/page.tsx");
  assert.ok(hub.includes('"/compress"'), "pdf-tools hub Compress card must link /compress live.");
  assert.ok(!hub.includes('anchor: "compress"') && !hub.includes("anchor:'compress'"), "hub must not keep the Soon anchor stub.");
  const sm = read("src/app/sitemap.ts");
  assert.ok(sm.includes('"/compress"') || sm.includes("'/compress'"), "sitemap must list /compress.");
});
