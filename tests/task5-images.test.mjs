// TDD Task 5 — Images to PDF
// Run: node --test tests/task5-images.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const read = (p) => readFileSync(join(root, p), "utf8");

test("images-to-pdf page exists and builds PDFs from raster images", () => {
  assert.ok(existsSync(join(root, "src/app/images-to-pdf/page.tsx")), "src/app/images-to-pdf/page.tsx must exist.");
  const src = read("src/app/images-to-pdf/page.tsx");
  assert.ok(src.includes("PDFDocument"), "images page must use pdf-lib PDFDocument.");
  assert.ok(src.includes("embedJpg") && src.includes("embedPng"), "images page must embed JPG + PNG.");
  assert.ok(src.includes("drawImage"), "images page must draw images onto pages.");
});

test("images page has layout controls (size, orientation, margin) + reorder", () => {
  const src = read("src/app/images-to-pdf/page.tsx");
  assert.ok(/a4/i.test(src) && /letter|fit/i.test(src), "images page must offer page-size choices.");
  assert.ok(/portrait|landscape/i.test(src), "images page must offer orientation choices.");
  assert.ok(/margin/i.test(src), "images page must offer margin controls.");
  assert.ok(/move|reorder|ArrowUp/i.test(src), "images page must let users reorder images.");
  assert.ok(/remove/i.test(src), "images page must let users remove an image.");
  assert.ok(/multiple/.test(src), "images input must accept multiple files.");
  assert.ok(src.includes("downloadBlob"), "images page must download via downloadBlob.");
});

test("images page enforces admin caps + beacons the ops log", () => {
  const src = read("src/app/images-to-pdf/page.tsx");
  assert.ok(src.includes("pdfTools") || src.includes("pdfCaps"), "images page must read caps from site config (pdfTools).");
  assert.ok(/maxMB|maxFiles/.test(src), "images page must enforce maxMB / maxFiles caps.");
  assert.ok(src.includes("/api/pdf/log"), "images page must POST each job to /api/pdf/log.");
});

test("site config + admin know the images tool", () => {
  const cfg = read("src/lib/site-config-shared.ts");
  assert.ok(cfg.includes("images"), "shared config must include images caps.");
  const admin = read("src/app/admin/page.tsx");
  assert.ok(admin.includes("Images to PDF"), "admin must label the images tool.");
});

test("images is linked live in nav + hub + sitemap (no Soon stub)", () => {
  const nav = read("src/components/navbar.tsx");
  assert.ok(nav.includes('"/images-to-pdf"'), "navbar must link Images to /images-to-pdf.");
  const hub = read("src/app/pdf-tools/page.tsx");
  assert.ok(hub.includes('"/images-to-pdf"'), "pdf-tools hub must link /images-to-pdf live.");
  assert.ok(!hub.includes("Images to PDF\", desc: \"JPG/PNG to PDF with margin"), "hub must not keep the Soon stub copy.");
  const sm = read("src/app/sitemap.ts");
  assert.ok(sm.includes('"/images-to-pdf"') || sm.includes("'/images-to-pdf'"), "sitemap must list /images-to-pdf.");
});
