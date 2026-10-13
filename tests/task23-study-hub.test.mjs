// Study hub card view + notes browsing (task23).
// Run: node --test tests/task23-study-hub.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const read = (p) => readFileSync(join(root, p), "utf8");

test("hub has preparation-module cards (posts/notes/practice/exams/progress)", () => {
  const hub = read("src/app/study/page.tsx");
  assert.ok(hub.includes("PREP_MODULES"), "hub must define preparation modules");
  for (const href of ["/study/posts", "/study/chapters", "/study/practice", "/study/exams/demo-20q-15min-v1", "/study/progress"]) {
    assert.ok(hub.includes(href), `hub must link ${href}`);
  }
  assert.ok(hub.includes('role="list"') && hub.includes("Preparation modules"), "modules must be a labeled card list");
  // Old contracts preserved.
  assert.ok(hub.includes("useLogin") && hub.includes("await refresh()"), "tri-state login recheck preserved");
  assert.ok(hub.includes("StudyPractice"), "legacy practice section preserved");
});

test("hub has subject rail with chapter counts linking to notes index", () => {
  const hub = read("src/app/study/page.tsx");
  assert.ok(hub.includes("PLATFORM_SUBJECTS"), "hub must use the subject taxonomy");
  assert.ok(hub.includes("/study/chapters?subject="), "subject cards must deep-link to the notes index");
  assert.ok(hub.includes("ProgressRail"), "hub must include the progress rail");
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
