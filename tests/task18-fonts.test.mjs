// Fonts batch — variants, bulk import, family page.
// Run: node --test tests/task18-fonts.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const read = (p) => readFileSync(join(root, p), "utf8");

test("font model supports variants + family bundle", () => {
  const src = read("src/lib/fonts-data.ts");
  assert.ok(src.includes("FontVariant"), "FontVariant type must exist.");
  assert.ok(src.includes("variants?"), "BanglaFont must allow variants.");
  assert.ok(src.includes("bundleUrl"), "BanglaFont must allow a family bundle.");
  assert.ok(src.includes("variantPricing"), "variant price inheritance helper must exist.");
});

test("admin has variant editor + bulk importer", () => {
  const src = read("src/components/admin-bulk.tsx");
  assert.ok(src.includes("FontVariantsEditor"), "variant editor must exist.");
  assert.ok(src.includes("FontBulkImporter"), "bulk importer must exist.");
  assert.ok(src.includes(".zip"), "font uploads must accept .zip.");
  assert.ok(src.includes("Publish"), "bulk queue must publish reviewed drafts.");
  const admin = read("src/app/admin/page.tsx");
  assert.ok(admin.includes("FontBulkImporter"), "catalog must mount the bulk importer.");
  assert.ok(admin.includes("FontVariantsEditor"), "catalog must mount the variant editor.");
});

test("family page offers per-variant download/buy", () => {
  assert.ok(existsSync(join(root, "src/app/fonts/[id]/page.tsx")), "family page must exist.");
  const src = read("src/app/fonts/[id]/page.tsx");
  assert.ok(src.includes("CheckoutModal"), "family page must support buying variants.");
  assert.ok(src.includes("Bundle") || src.includes("bundle"), "family page must offer the bundle.");
  const index = read("src/app/fonts/page.tsx");
  assert.ok(index.includes("/fonts/${"), "index cards must link to family pages.");
});
