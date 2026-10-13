// Study completion sprint — scoring, progress, limits, review, export, recalc, search, code-safe text.
// Run: node --test tests/task24-study-complete.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const read = (p) => readFileSync(join(root, p), "utf8");

test("Attempt preserves score history + per-question sections", () => {
  const t = read("src/lib/study-platform/types.ts");
  assert.ok(t.includes("previousScores"), "previousScores required");
  assert.ok(t.includes("sectionOf"), "sectionOf map required");
});

test("scoring resolves real sections via caller callback (no first-section fallback)", () => {
  const s = read("src/lib/study-platform/scoring.ts");
  assert.ok(s.includes("sectionOf?"), "sectionOf callback required");
  assert.ok(!s.includes("resolved by caller into tags"), "fallback comment must be gone");
  const c = read("src/lib/study-platform/catalog.ts");
  assert.ok(c.includes("resolveSection") && c.includes("chapterSubjectMap"), "resolver helpers required");
});

test("submit writes chapter mastery + streaks; create enforces limits + resume", () => {
  const a = read("src/app/api/study-platform/attempts/route.ts");
  assert.ok(a.includes("chapterMastery") && a.includes("streakDays") && a.includes("lastActiveDay"), "mastery + streak required");
  assert.ok(a.includes("attemptLimit") && a.includes("attempt limit reached"), "limit enforcement required");
  assert.ok(a.includes("resumed"), "active-attempt resume required");
  assert.ok(a.includes("resolveSection"), "section-aware submit required");
});

test("cancel-attempt DELETE exists with ownership guard", () => {
  const a = read("src/app/api/study-platform/attempts/route.ts");
  assert.ok(a.includes("export async function DELETE"), "DELETE handler required");
  assert.ok(a.includes("already submitted — cannot cancel"), "submitted guard required");
  assert.ok(a.includes("removeAttempt"), "store removal required");
  const eng = read("src/components/study-platform/exam-engine.tsx");
  assert.ok(eng.includes('method: "DELETE"'), "engine cancel button required");
});

test("expired citations block publication; endpoints are throttled", () => {
  const v = read("src/lib/study-platform/validation.ts");
  assert.ok(v.includes("citation-expired"), "expiry blocker required");
  const r = read("src/lib/study-platform/ratelimit.ts");
  assert.ok(r.includes("throttle") && r.includes("clientIp"), "throttle helper required");
  const att = read("src/app/api/study-platform/attempts/route.ts");
  assert.ok(att.includes("too many attempts"), "create throttle required");
  const pr = read("src/app/api/study-platform/practice/route.ts");
  assert.ok(pr.includes("too many requests"), "practice throttle required");
});

test("review queue shows preview/confidence/duplicates + supports rollback", () => {
  const r = read("src/app/api/study-platform/review/route.ts");
  assert.ok(r.includes("previewBn") && r.includes("confidence") && r.includes("duplicates"), "preview data required");
  assert.ok(r.includes("rollbackTo") && r.includes("study.rollback"), "rollback required");
  const admin = read("src/components/admin-study-platform.tsx");
  assert.ok(admin.includes("Rollback") && admin.includes("duplicates"), "admin rollback/duplicates UI required");
});

test("export + recalculate endpoints exist with admin RBAC + preserved originals", () => {
  assert.ok(existsSync(join(root, "src/app/api/study-platform/export/route.ts")), "export route required");
  assert.ok(existsSync(join(root, "src/app/api/study-platform/recalculate/route.ts")), "recalculate route required");
  const e = read("src/app/api/study-platform/export/route.ts");
  assert.ok(e.includes("requireAdmin") && e.includes("text/csv"), "export RBAC + CSV required");
  const r = read("src/app/api/study-platform/recalculate/route.ts");
  assert.ok(r.includes("requireAdmin") && r.includes("previousScores") && r.includes("study.recalculate"), "recalc with history required");
  const admin = read("src/components/admin-study-platform.tsx");
  assert.ok(admin.includes("recalculate") && admin.includes("export?kind="), "admin export/recalc UI required");
});

test("progress UI shows streak, mastery heatmap, spaced review, bookmarks", () => {
  const p = read("src/app/study/progress/page.tsx");
  for (const k of ["streakDays", "heatmap", "recommendations", "bookmarks", "chapterMastery", "Readiness/heatmap"]) {
    assert.ok(p.includes(k), `progress must include ${k}`);
  }
});

test("posts have BN/EN search; question text is code-safe", () => {
  assert.ok(existsSync(join(root, "src/components/study-platform/post-browser.tsx")), "post browser required");
  const b = read("src/components/study-platform/post-browser.tsx");
  assert.ok(b.includes("searchPlatform") && b.includes('role="searchbox"'), "post search required");
  assert.ok(existsSync(join(root, "src/components/study-platform/code-text.tsx")), "CodeText required");
  const c = read("src/components/study-platform/code-text.tsx");
  assert.ok(c.includes("overflow-wrap:anywhere") || c.includes("anywhere"), "wrap-anywhere required");
  for (const f of ["practice-builder.tsx", "exam-engine.tsx", "chapter-reader.tsx"]) {
    assert.ok(read(`src/components/study-platform/${f}`).includes("CodeText"), `${f} must use CodeText`);
  }
  assert.ok(read("src/app/study/results/[attemptId]/page.tsx").includes("CodeText"), "results must use CodeText");
});
