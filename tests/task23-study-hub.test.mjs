// Study hub card view + notes browsing (task23).
// Run: node --test tests/task23-study-hub.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const read = (p) => readFileSync(join(root, p), "utf8");

test("preparation and legacy study routes remain available after hub reorganization", () => {
  for(const route of ["posts","chapters","practice","review","progress","guided-practice"]){assert.ok(existsSync(join(root,"src/app/study",route,"page.tsx")),route+" route must remain accessible");}
  assert.ok(existsSync(join(root,"src/app/study/exams/[slug]/page.tsx")),"timed exam route remains accessible");
});

test("chapters index exists with BN/EN search + subject filter", () => {
  assert.ok(existsSync(join(root, "src/app/study/chapters/page.tsx")), "index page must exist");
  assert.ok(existsSync(join(root, "src/components/study-platform/chapter-browser.tsx")), "browser must exist");
  const b = read("src/components/study-platform/chapter-browser.tsx");
  assert.ok(b.includes("searchPlatform"), "browser must use the BN/EN search lib");
  assert.ok(b.includes("role=\"searchbox\""), "browser must expose a searchbox");
  assert.ok(b.includes("Filter by subject") || b.includes("subject"), "browser must filter by subject");
});

test("every chapter carries full notes (objectives, key terms, example, traps, revision)", () => {
  const seed = read("src/lib/study-platform/seed-content.ts");
  const chapters = read("src/lib/study-platform/curriculum.ts");
  const ids = [...chapters.matchAll(/"(ch-[a-z0-9-]+)"/g)].map((m) => m[1]);
  const unique = [...new Set(ids)].filter((id) => id.startsWith("ch-"));
  assert.ok(unique.length >= 21, `expected ≥21 chapters, saw ${unique.length}`);
  for (const id of unique) {
    assert.ok(seed.includes(`"${id}"`), `NOTES must cover ${id}`);
  }
  assert.ok(seed.includes("keyTerms") && seed.includes("workedExamples") && seed.includes("commonTraps") && seed.includes("revisionNotes"), "note fields required");
});

test("reader renders the key-terms glossary", () => {
  const r = read("src/components/study-platform/chapter-reader.tsx");
  assert.ok(r.includes("keyTerms"), "reader must render keyTerms");
  assert.ok(r.includes("মূল পরিভাষা") || r.includes("Key terms"), "glossary heading required");
});
