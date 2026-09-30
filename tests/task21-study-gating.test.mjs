// Gated study reading — preview pages, login gate, paid entitlement.
// Run: node --test tests/task21-study-gating.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const read = (p) => readFileSync(join(root, p), "utf8");

test("materials carry access control fields", () => {
  const src = read("src/lib/study-data.ts");
  assert.ok(src.includes("access?"), "StudyMaterial must include access.");
  assert.ok(src.includes("priceBDT?"), "StudyMaterial must include priceBDT.");
  assert.ok(src.includes("previewPages?"), "StudyMaterial must include previewPages.");
  assert.ok(src.includes("DEFAULT_PREVIEW_PAGES"), "a default preview length must exist.");
});

test("entitlement helper decides read/download by login + paid orders", () => {
  assert.ok(existsSync(join(root, "src/lib/study-access.ts")), "study-access must exist.");
  const src = read("src/lib/study-access.ts");
  assert.ok(src.includes("studyAccess"), "studyAccess must exist.");
  assert.ok(src.includes('"pay"') || src.includes("'pay'"), "paywall gate must exist.");
  assert.ok(src.includes("buyerId"), "paid entitlement must link orders to buyers.");
  assert.ok(src.includes("paid") && src.includes("delivered"), "only verified orders must unlock.");
});

test("orders attach the signed-in buyer id", () => {
  const src = read("src/app/api/orders/route.ts");
  assert.ok(src.includes("buyerId"), "orders must record buyerId.");
  assert.ok(src.includes("sessionUser"), "buyerId must come from the session server-side.");
  assert.ok(src.includes('"study"'), "orders must accept study items.");
});

test("preview API serves first pages publicly, full read is gated", () => {
  assert.ok(existsSync(join(root, "src/app/api/study/preview/route.ts")), "preview route must exist.");
  const preview = read("src/app/api/study/preview/route.ts");
  assert.ok(preview.includes("copyPages") || preview.includes("getPageCount"), "preview must extract pages with pdf-lib.");
  assert.ok(!preview.includes("sessionUser"), "preview must not require login.");
  assert.ok(existsSync(join(root, "src/app/api/study/read/route.ts")), "read route must exist.");
  const rd = read("src/app/api/study/read/route.ts");
  assert.ok(rd.includes("studyAccess"), "read must enforce entitlements.");
  assert.ok(rd.includes("402"), "unpaid readers must get payment-required.");
  const dl = read("src/app/api/study/download/route.ts");
  assert.ok(dl.includes("studyAccess"), "download must enforce entitlements.");
});

test("reader UI flows preview → login → paywall → full", () => {
  assert.ok(existsSync(join(root, "src/components/study-reader.tsx")), "StudyReader must exist.");
  const src = read("src/components/study-reader.tsx");
  assert.ok(src.includes("/api/study/preview"), "reader must show the public preview.");
  assert.ok(src.includes("/api/study/read"), "reader must load full bytes only when entitled.");
  assert.ok(src.includes("Continue with Google"), "login gate must offer Google sign-in.");
  assert.ok(src.includes("via bKash"), "paywall must route through bKash checkout.");
  assert.ok(src.includes('itemType="study"'), "paywall must sell the study material.");
  const detail = read("src/app/study/[id]/page.tsx");
  assert.ok(detail.includes("StudyReader"), "detail page must use the gated reader.");
  assert.ok(!detail.includes("/api/study/download?id="), "detail must not fetch download bytes directly.");
});

test("admin controls access, price and preview length", () => {
  const admin = read("src/components/admin-study.tsx");
  assert.ok(admin.includes("bKash") || admin.includes("paid"), "admin must offer paid access.");
  assert.ok(admin.includes("Preview"), "admin must set preview pages.");
  assert.ok(admin.includes("price"), "admin must set the price.");
});
