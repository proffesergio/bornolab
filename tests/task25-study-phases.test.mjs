// Sprint-3 phases — OCR, SM-2, percentile privacy, PWA offline, advisory RBAC.
// Run: node --test tests/task25-study-phases.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const read = (p) => readFileSync(join(root, p), "utf8");

test("tesseract.js is a declared dependency (justified: image OCR has no in-stack alternative)", () => {
  const pkg = JSON.parse(read("package.json"));
  assert.ok(pkg.dependencies["tesseract.js"], "tesseract.js must be declared");
});

test("SM-2 lib implements classic rules (fail reset, 1/6/x*ease, ease floor, caps)", () => {
  const s = read("src/lib/study-platform/sm2.ts");
  for (const k of ["gradeCard", "newCard", "dueQueue", "summarize", "autoQuality", "MIN_EASE", "START_EASE", "MAX_INTERVAL_DAYS", "GRADES"]) {
    assert.ok(s.includes(k), `sm2 must include ${k}`);
  }
  assert.ok(s.includes("reps === 1 ? 1 : reps === 2 ? 6"), "classic 1/6 progression required");
  const t = read("src/lib/study-platform/types.ts");
  assert.ok(t.includes("SRCard") && t.includes("srCards?") && t.includes("percentileOptIn?"), "progress model required");
});

test("schedule API + Due-Review page + grade wiring exist", () => {
  assert.ok(existsSync(join(root, "src/app/api/study-platform/schedule/route.ts")), "schedule API required");
  assert.ok(existsSync(join(root, "src/app/study/review/page.tsx")), "review page required");
  const r = read("src/app/study/review/page.tsx");
  assert.ok(r.includes("Again") && r.includes("Easy"), "grade buttons required");
  const hub = read("src/components/study-hub.tsx") + read("src/components/study-resource-library.tsx");
  assert.ok(hub.includes("/study/review"), "hub due-review card required");
  const pb = read("src/components/study-platform/practice-builder.tsx");
  assert.ok(pb.includes("/api/study-platform/schedule"), "practice grade wiring required");
  const att = read("src/app/api/study-platform/attempts/route.ts");
  assert.ok(att.includes("gradeCard") && att.includes("autoQuality"), "submit SM-2 wiring required");
});

test("percentile is opt-in, aggregate-only, k-anonymous (no peer data leaks)", () => {
  const p = read("src/lib/study-platform/percentile.ts");
  assert.ok(p.includes("MIN_COHORT") && p.includes("30"), "cohort floor required");
  assert.ok(p.includes("bandFor") && p.includes("cohortBands"), "band functions required");
  assert.ok(existsSync(join(root, "src/app/api/study-platform/consent/route.ts")), "consent endpoint required");
  const api = read("src/app/api/study-platform/percentile/route.ts");
  assert.ok(api.includes("percentileOptIn"), "opt-in gate required");
  assert.ok(api.includes("Cohort too small"), "small-cohort refusal required");
  assert.ok(!api.includes("email") && !api.includes("name"), "no peer identity may leak");
  const res = read("src/app/study/results/[attemptId]/page.tsx");
  assert.ok(res.includes("PercentileCard"), "results band card required");
  const prog = read("src/app/study/progress/page.tsx");
  assert.ok(prog.includes("Cohort") && prog.includes("consent") || prog.includes("/api/study-platform/consent"), "progress consent UI required");
});

test("OCR studio: pdfjs raster + tesseract ben+eng + cleanup + restricted evidence", () => {
  const o = read("src/lib/study-platform/ocr.ts");
  assert.ok(o.includes("cleanupBengaliOcr") && o.includes("chunkEvidence") && o.includes("fixes"), "cleanup lib required");
  assert.ok(!/[\u200B-\u200D\uFEFF]/.test(o.replace(/\\u[0-9A-Fa-f]{4}/g, "")), "no invisible literals in source");
  assert.ok(existsSync(join(root, "src/components/admin-ocr-studio.tsx")), "studio required");
  const st = read("src/components/admin-ocr-studio.tsx");
  assert.ok(st.includes("tesseract.js") && st.includes("ben") && st.includes("pdfjs-dist"), "engine wiring required");
  assert.ok(st.includes("Raw evidence") && st.includes("restricted evidence"), "evidence separation required");
  assert.ok(st.includes("/api/study-platform/evidence"), "evidence endpoint wiring required");
  const ev = read("src/app/api/study-platform/evidence/route.ts");
  assert.ok(ev.includes("requireAdmin"), "evidence RBAC required");
});

test("PWA: manifest + SW (no API caching) + offline page + outbox sync + deadline honesty", () => {
  assert.ok(existsSync(join(root, "src/app/manifest.ts")), "manifest required");
  assert.ok(existsSync(join(root, "public/sw.js")), "service worker required");
  assert.ok(existsSync(join(root, "src/app/offline/page.tsx")), "offline fallback required");
  assert.ok(existsSync(join(root, "src/components/pwa-register.tsx")), "registration required");
  const lay = read("src/app/layout.tsx");
  assert.ok(lay.includes("PwaRegister"), "layout registration required");
  const sw = read("public/sw.js");
  assert.ok(sw.includes("/api/") && sw.includes("return"), "SW must bypass API traffic");
  assert.ok(sw.includes("/offline"), "offline fallback required");
  assert.ok(existsSync(join(root, "src/components/study-platform/outbox.ts")), "outbox required");
  const eng = read("src/components/study-platform/exam-engine.tsx");
  assert.ok(eng.includes("outbox") && eng.includes("offline"), "engine offline queue required");
  const att = read("src/app/api/study-platform/attempts/route.ts");
  assert.ok(att.includes("now > a.deadline"), "late-submit honesty required");
});

test("admin-only management: no reviewer accounts, no assignment workflow", () => {
  const m = read("src/lib/members-shared.ts");
  assert.ok(!m.includes("content-author") && !m.includes("study.review"), "no editorial roles/permissions");
  const rv = read("src/app/api/study-platform/review/route.ts");
  assert.ok(!rv.includes("study.assign") && !rv.includes("assignee"), "no assignment branch");
  const admin = read("src/components/admin-study-platform.tsx");
  assert.ok(!admin.includes("Assign") && !admin.includes("assignee"), "no assign UI");
  const t = read("src/lib/study-platform/types.ts");
  assert.ok(!t.includes("assignee"), "no assignee field");
});
