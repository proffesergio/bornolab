// Study root cleanup: BUET Masters-only gating + animated hub (task28).
// Run: node --test tests/task28-study-cleanup.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const read = (p) => readFileSync(join(root, p), "utf8");

test("gating helper keeps BUET guides Masters-only", () => {
  const lib = read("src/lib/study-data.ts");
  assert.ok(lib.includes("BUET_ONLY_SUBCATEGORY"), "must export the BUET-only marker");
  assert.ok(lib.includes("isBuetOnlyMaterial"), "must export isBuetOnlyMaterial()");
  assert.ok(lib.includes('"buet-pg"'), "department buet-pg must also gate");
});

test("study root hides BUET on All and reveals under Masters", () => {
  const hub = read("src/app/study/page.tsx");
  assert.ok(hub.includes("isBuetOnlyMaterial"), "hub must use the gating helper");
  assert.ok(hub.includes("showBuet"), "hub must compute Masters visibility");
  assert.ok(hub.includes("showBuet || !isBuetOnlyMaterial(m)"), "material list must gate BUET");
  assert.ok(hub.includes("hiddenBuetCount"), "hub must hint at hidden Masters-only guides");
  assert.ok(hub.includes("open Masters"), "hint must link to the Masters view");
});

test("study root is animated but keeps every section + contract", () => {
  const hub = read("src/app/study/page.tsx");
  assert.ok(hub.includes("study-motion"), "hub must use shared motion components");
  assert.ok(hub.includes("AnimatePresence"), "filtering grid must animate");
  assert.ok(existsSync(join(root, "src/components/study-motion.tsx")), "motion file must exist");
  const motion = read("src/components/study-motion.tsx");
  assert.ok(motion.includes("FadeUp") && motion.includes("StaggerGrid") && motion.includes("StaggerItem"), "motion primitives required");
  // Old contracts preserved (task23).
  assert.ok(hub.includes("PREP_MODULES"), "prep modules preserved");
  for (const href of ["/study/posts", "/study/chapters", "/study/practice", "/study/exams/demo-20q-15min-v1", "/study/progress"]) {
    assert.ok(hub.includes(href), `hub must link ${href}`);
  }
  assert.ok(hub.includes('role="list"') && hub.includes("Preparation modules"), "modules must stay a labeled card list");
  assert.ok(hub.includes("useLogin") && hub.includes("await refresh()"), "tri-state login recheck preserved");
  assert.ok(hub.includes("StudyPractice"), "legacy practice section preserved");
  assert.ok(hub.includes("PLATFORM_SUBJECTS"), "subject taxonomy preserved");
  assert.ok(hub.includes("/study/chapters?subject="), "subject cards must deep-link to notes");
  assert.ok(hub.includes("ProgressRail"), "progress rail preserved");
  // task27 contracts preserved.
  assert.ok(hub.includes("STUDY_DEPARTMENTS"), "generic department filter preserved");
  assert.ok(hub.includes("Featured study materials"), "generic featured rail preserved");
  assert.ok(!hub.includes("BUET Post Graduate Admission</p>"), "no hardcoded BUET-only featured label");
  assert.ok(hub.includes("/study/question-bank"), "QB entry preserved");
  assert.ok(hub.includes("Question Bank Solutions"), "QB section preserved");
});
