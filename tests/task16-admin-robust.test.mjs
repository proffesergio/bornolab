// Admin robustness — registry/CSV/duplication, media library, order verify trail.
// Run: node --test tests/task16-admin-robust.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const read = (p) => readFileSync(join(root, p), "utf8");

test("catalog registry covers fonts, software and study generically", () => {
  assert.ok(existsSync(join(root, "src/lib/catalog-registry.ts")), "catalog-registry must exist.");
  const src = read("src/lib/catalog-registry.ts");
  for (const k of ["CATALOG_DEFS", "catalogToCsv", "catalogFromCsv", "makeCustomId", "validateStudyRow"]) {
    assert.ok(src.includes(k), `registry must expose '${k}'.`);
  }
  assert.ok(src.includes("font") && src.includes("software") && src.includes("study"), "registry must define all three kinds.");
});

test("CSV helpers handle quoting and required columns", () => {
  const src = read("src/lib/catalog-registry.ts");
  assert.ok(src.includes('""'), "CSV export must escape quotes.");
  assert.ok(src.includes("Missing required column"), "CSV import must validate required columns.");
  assert.ok(src.includes("500"), "CSV import must cap rows.");
});

test("bulk tools component offers template, export, import and duplication", () => {
  assert.ok(existsSync(join(root, "src/components/admin-bulk.tsx")), "admin-bulk must exist.");
  const src = read("src/components/admin-bulk.tsx");
  assert.ok(src.includes("CsvBulkTools"), "CsvBulkTools must exist.");
  assert.ok(src.includes("duplicateCustom"), "duplicateCustom must exist.");
  assert.ok(src.includes("template") && src.includes("Export") && src.includes("Import"), "all three CSV actions must exist.");
});

test("all three catalog managers wire duplication + CSV", () => {
  const admin = read("src/app/admin/page.tsx");
  assert.ok((admin.match(/duplicateCustom\("font"/g) || []).length >= 1, "fonts must support duplication.");
  assert.ok((admin.match(/duplicateCustom\("software"/g) || []).length >= 1, "software must support duplication.");
  assert.ok(admin.includes('kind="font"') && admin.includes('kind="software"'), "catalog must mount CSV tools.");
  const study = read("src/components/admin-study.tsx");
  assert.ok(study.includes('kind="study"'), "study must mount CSV tools.");
  assert.ok(study.includes("duplicateCustom"), "study must support duplication.");
});

test("media library API is admin-guarded and flags orphans", () => {
  assert.ok(existsSync(join(root, "src/app/api/admin/media/route.ts")), "media route must exist.");
  const src = read("src/app/api/admin/media/route.ts");
  assert.ok(src.includes("requireAdmin"), "media must require admin.");
  assert.ok(src.includes("referenced"), "media must flag referenced vs orphan files.");
  assert.ok(src.includes("totalBytes"), "media must report storage usage.");
  const admin = read("src/app/admin/page.tsx");
  assert.ok(admin.includes('"media"'), "admin must have a media section.");
});

test("orders carry a verification trail end to end", () => {
  const type = read("src/app/api/orders/route.ts");
  assert.ok(type.includes("history"), "Order must carry history.");
  const api = read("src/app/api/admin/orders/route.ts");
  assert.ok(api.includes("note"), "status changes must accept a verification note.");
  assert.ok(api.includes("order.status"), "status changes must hit the audit log.");
  const admin = read("src/app/admin/page.tsx");
  assert.ok(admin.includes("Trail ("), "orders UI must show the trail.");
  assert.ok(admin.includes("Verification note"), "orders UI must accept verification notes.");
});
