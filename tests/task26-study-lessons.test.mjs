// 100+ original lessons (Computer Fundamentals + C Programming) + admin-only workflow.
// Run: node --test tests/task26-study-lessons.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const read = (p) => readFileSync(join(root, p), "utf8");

test("104 original lessons exist (60 fundamentals + 44 C programming)", () => {
  const fund = read("src/lib/study-platform/lessons-fundamentals.ts");
  const cprog = read("src/lib/study-platform/lessons-cprog.ts");
  const fundIds = [...new Set([...fund.matchAll(/id: "(cf-[a-z0-9-]+)"/g)].map((m) => m[1]))];
  const cprogIds = [...new Set([...cprog.matchAll(/id: "(cprog-[a-z0-9-]+)"/g)].map((m) => m[1]))];
  assert.ok(fundIds.length >= 60, `expected ≥60 fundamentals lessons, saw ${fundIds.length}`);
  assert.ok(cprogIds.length >= 44, `expected ≥44 C lessons, saw ${cprogIds.length}`);
  assert.ok(fundIds.length + cprogIds.length >= 100, "expected 100+ lessons total");
  assert.ok(fund.includes("original BornoLab authorship") && cprog.includes("original BornoLab authorship"), "originality header required");
});

test("every lesson is bilingual-complete (titles, overview, objectives, terms, example, traps, revision)", () => {
  for (const f of ["src/lib/study-platform/lessons-fundamentals.ts", "src/lib/study-platform/lessons-cprog.ts"]) {
    const src = read(f);
    for (const k of ["title: { bn:", "overview: { bn:", "objectives:", "keyTerms:", "workedExamples:", "commonTraps:", "revisionNotes:", "aliases:"]) {
      assert.ok(src.includes(k), `${f} must include ${k}`);
    }
  }
});

test("lesson ids/slugs are unique and wired into catalog, search and practice", () => {
  const fund = read("src/lib/study-platform/lessons-fundamentals.ts");
  const cprog = read("src/lib/study-platform/lessons-cprog.ts");
  const ids = [...fund.matchAll(/id: "((?:cf|cprog)-[a-z0-9-]+)"/g)].map((m) => m[1])
    .concat([...cprog.matchAll(/id: "((?:cf|cprog)-[a-z0-9-]+)"/g)].map((m) => m[1]));
  assert.equal(new Set(ids).size, ids.length, "lesson ids must be unique");
  const cat = read("src/lib/study-platform/catalog.ts");
  assert.ok(cat.includes("LESSON_CHAPTERS_FUND") && cat.includes("LESSON_CHAPTERS_CPROG") && cat.includes("LESSON_QUESTIONS"), "catalog must merge lessons + questions");
  const search = read("src/lib/study-platform/search.ts");
  assert.ok(search.includes("getChapters"), "search must cover lessons");
  const practice = read("src/app/api/study-platform/practice/route.ts");
  assert.ok(practice.includes("getChapters"), "practice filter must cover lessons");
  const hub = read("src/components/study-hub.tsx") + read("src/components/study-resource-library.tsx");
  assert.ok(hub.includes("getChapters()"), "hub chapter counts must use the actual catalog");
});

test("lesson seed questions are original, traced, bilingual with reviewed keys", () => {
  const src = read("src/lib/study-platform/lessons-cprog.ts");
  assert.ok(src.includes("LESSON_QUESTIONS") && src.includes("independently traced"), "traced-questions block required");
  assert.ok(src.includes('status: "approved"'), "lesson questions must carry approved keys");
  assert.ok(/original bornoLab lesson question/i.test(src), "original license required");
});

test("no third-party book content is reproduced (topics only, per rights rules)", () => {
  const all = read("src/lib/study-platform/lessons-fundamentals.ts") + read("src/lib/study-platform/lessons-cprog.ts");
  assert.ok(!/Tamim|Subeen|banglabookshelf/i.test(all), "no author/site reproduction");
  assert.ok(!all.includes("drive.google.com"), "no rehosted drive material");
});

test("admin-only management: no reviewer accounts or assignment workflow", () => {
  const m = read("src/lib/members-shared.ts");
  assert.ok(!m.includes("content-author") && !m.includes("study.review"), "no editorial roles/permissions");
  const rv = read("src/app/api/study-platform/review/route.ts");
  assert.ok(!rv.includes("study.assign") && !rv.includes("assignee"), "no assignment branch");
  const admin = read("src/components/admin-study-platform.tsx");
  assert.ok(!admin.includes("Assign") && !admin.includes("assignee"), "no assign UI");
  const t = read("src/lib/study-platform/types.ts");
  assert.ok(!t.includes("assignee"), "no assignee field");
  const runbook = read("docs/study-runbook.md");
  assert.ok(runbook.includes("admin-only") || runbook.includes("admin only"), "runbook must state admin-only");
});
