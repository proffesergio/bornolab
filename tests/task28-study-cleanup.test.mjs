// Study root cleanup: BUET Masters-only gating + animated hub (task28).
// Run: node --test tests/task28-study-cleanup.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const read = (p) => readFileSync(join(root, p), "utf8");

test("gating helper keeps BUET guides Masters-only", () => {
  const lib = read("src/lib/study-data.ts");
  assert.ok(lib.includes("BUET_ONLY_SUBCATEGORY"), "must export the BUET-only marker");
  assert.ok(lib.includes("isBuetOnlyMaterial"), "must export isBuetOnlyMaterial()");
  assert.ok(lib.includes('"buet-pg"'), "department buet-pg must also gate");
});


// Goal-specific Masters gating and visibility are exercised with real catalog records
// in admin-redesign.test.mjs. The former one-page section arrangement is intentionally replaced.
