// User activity control — beacons linked to members, per-user admin timeline.
// Run: node --test tests/task12-user-activity.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const read = (p) => readFileSync(join(root, p), "utf8");

test("activity aggregator exists and covers views, jobs, downloads, logins", () => {
  assert.ok(existsSync(join(root, "src/lib/activity.ts")), "src/lib/activity.ts must exist.");
  const src = read("src/lib/activity.ts");
  assert.ok(src.includes("getUserActivity"), "getUserActivity must exist.");
  for (const k of ["views", "pdfJobs", "downloads", "logins", "lastActive", "timeline"]) {
    assert.ok(src.includes(k), `activity summary must include '${k}'.`);
  }
});

test("page-view beacon links signed-in views to the member id", () => {
  const src = read("src/app/api/track/route.ts");
  assert.ok(src.includes("sessionUser"), "track must resolve the session user.");
  assert.ok(src.includes("uid"), "track events must carry the member uid when signed in.");
});

test("PDF ops beacon links signed-in jobs to the member id", () => {
  const src = read("src/app/api/pdf/log/route.ts");
  assert.ok(src.includes("sessionUser"), "pdf log must resolve the session user.");
  assert.ok(src.includes("uid"), "pdf ops must carry the member uid when signed in.");
  const shared = read("src/lib/site-config-shared.ts");
  assert.ok(shared.includes("uid?: string"), "PdfOp must allow an optional uid.");
});

test("study downloads are audited per member", () => {
  const src = read("src/app/api/study/download/route.ts");
  assert.ok(src.includes("study.download"), "downloads must be audit-logged.");
  assert.ok(src.includes("logAudit"), "download route must call logAudit.");
});

test("per-user activity API is admin-guarded", () => {
  assert.ok(existsSync(join(root, "src/app/api/admin/user-activity/route.ts")), "user-activity route must exist.");
  const src = read("src/app/api/admin/user-activity/route.ts");
  assert.ok(src.includes("requireAdmin"), "user-activity must require admin.");
  assert.ok(src.includes("getUserActivity"), "user-activity must use the aggregator.");
});

test("admin Customers rows expand a per-user activity timeline", () => {
  const src = read("src/app/admin/page.tsx");
  assert.ok(src.includes("toggleActivity") || src.includes("Activity"), "customers must offer an activity view.");
  assert.ok(src.includes("/api/admin/user-activity"), "admin must fetch per-user activity.");
  assert.ok(src.includes("timeline"), "admin must render the activity timeline.");
});

test("privacy policy discloses signed-in activity linkage", () => {
  const src = read("src/app/privacy/page.tsx").toLowerCase();
  assert.ok(src.includes("logged in") || src.includes("signed-in"), "privacy must mention signed-in data.");
});
