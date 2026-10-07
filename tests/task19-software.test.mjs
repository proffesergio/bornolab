// Software batch — versions, guide, bulk import, detail page.
// Run: node --test tests/task19-software.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const read = (p) => readFileSync(join(root, p), "utf8");

test("software model supports versions, guide, changelog, screenshots", () => {
  const src = read("src/lib/software-data.ts");
  assert.ok(src.includes("SoftwareVersion"), "SoftwareVersion type must exist.");
  assert.ok(src.includes("versions?"), "Software must allow versions.");
  assert.ok(src.includes("guide?"), "Software must allow a setup guide.");
  assert.ok(src.includes("changelog?"), "Software must allow a changelog.");
  assert.ok(src.includes("screenshots?"), "Software must allow screenshots.");
});

test("admin has version editor + bulk importer + guide field", () => {
  const src = read("src/components/admin-bulk.tsx");
  assert.ok(src.includes("SoftwareVersionsEditor"), "version editor must exist.");
  assert.ok(src.includes("SoftwareBulkImporter"), "bulk importer must exist.");
  assert.ok(src.includes(".exe"), "software uploads must accept executables.");
  const admin = read("src/app/admin/page.tsx");
  assert.ok(admin.includes("SoftwareBulkImporter"), "catalog must mount the bulk importer.");
  assert.ok(admin.includes("SoftwareVersionsEditor"), "catalog must mount the version editor.");
  assert.ok(admin.includes("nsGuide"), "add-software must capture the setup guide.");
});

test("detail page offers versions, guide and screenshots", () => {
  assert.ok(existsSync(join(root, "src/app/software/[id]/page.tsx")), "detail page must exist.");
  const src = read("src/app/software/[id]/page.tsx");
  assert.ok(src.includes("CheckoutModal"), "detail page must support buying.");
  assert.ok(src.includes("guide"), "detail page must render the setup guide.");
  assert.ok(src.includes("screenshots"), "detail page must render screenshots.");
  const index = read("src/app/software/page.tsx");
  assert.ok(index.includes("/software/${"), "index cards must link to detail pages.");
});
