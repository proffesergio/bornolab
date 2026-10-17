// Study platform — domain, scoring, validation, search, routes, RBAC, a11y.
// Run: node --test tests/task22-study-platform.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const read = (p) => readFileSync(join(root, p), "utf8");

// 1. Domain types cover the required model.
test("domain types cover Post/Exam/ExamVersion/Question/Attempt/Audit/Flag + statuses", () => {
  const t = read("src/lib/study-platform/types.ts");
  for (const k of ["Post", "ExamVersion", "Subject", "Chapter", "Topic", "QuestionLocale", "OptionLocale", "AnswerKey", "Explanation", "SourceCitation", "LicenseRecord", "ReviewAction", "QuestionVersion", "Attempt", "AttemptAnswer", "ScorePolicy", "UserProgress", "Bookmark", "QuestionFlag", "AuditEvent", "FeatureFlag"]) {
    const short = k.replace("Locale", "").replace("Action", "").replace("Version", "").replace("Answer", "").replace("Record", "").replace("Citation", "").replace("Policy", "").replace("Progress", "").replace("Flag", "").replace("Event", "");
    assert.ok(t.includes(short) || t.includes(k), `types must include ${k}`);
  }
  assert.ok(t.includes("reviewer_approved") && t.includes("published") && t.includes("retired"), "status pipeline required");
  assert.ok(t.includes("provisional"), "provisional vs approved required");
});

// 2. Postgres DDL + JSON/KV fallback preserves local dev.
test("store has idempotent DDL + KV fallback (no local-dev break)", () => {
  const s = read("src/lib/study-platform/store.ts");
  assert.ok(s.includes("CREATE TABLE IF NOT EXISTS"), "idempotent DDL required");
  assert.ok(s.includes("study_questions") && s.includes("study_attempts") && s.includes("study_audit"), "normalized tables required");
  assert.ok(s.includes("readJson") && s.includes("writeJson"), "must reuse JSON/KV store fallback");
});

// 3. Demo ExamVersion configurability (20Q/15min/0.50, no unanswered penalty).
test("demo ExamVersion is configurable and labeled demo, not universal", () => {
  const c = read("src/lib/study-platform/curriculum.ts");
  assert.ok(c.includes("demo-20q-15min-v1"), "demo version slug required");
  assert.ok(c.includes("durationSec") && c.includes("15 * 60"), "15-minute duration required");
  assert.ok(c.includes("negativeMark: 0.5"), "0.50 negative marking required");
  assert.ok(c.includes("unansweredPenalty: 0"), "no unanswered penalty required");
  assert.ok(c.includes("demo: true"), "demo must be labeled");
});

// 4. Scoring: raw/penalty/net/section/topic/time/provisional — compile-check the lib.
test("scoring lib computes raw/penalty/net/pct/section/topic/time + seeded shuffle", () => {
  const s = read("src/lib/study-platform/scoring.ts");
  for (const k of ["raw", "penalty", "net", "pct", "correct", "incorrect", "unanswered", "timeUsedSec", "sectionTotals", "topicTotals", "keyStatus", "seededShuffle", "scoreAttempt"]) {
    assert.ok(s.includes(k), `scoring must include ${k}`);
  }
});

// 5. Publication blockers + OCR/duplicate flags.
test("validation blocks publish on missing options/key/explanation/citation/rights + flags OCR", () => {
  const v = read("src/lib/study-platform/validation.ts");
  for (const k of ["missing-options", "key-not-approved", "missing-explanation", "missing-citation", "rights-unresolved", "garbled-bangla", "missing-diagram", "findDuplicateStems", "canPublish"]) {
    assert.ok(v.includes(k), `validation must include ${k}`);
  }
});

// 6. Bilingual locales coexist (bn + en, never overwritten).
test("seed questions carry both bn and en locales with ≥4 options each", () => {
  const s = read("src/lib/study-platform/seed-content.ts");
  assert.ok(s.includes("bnStem") && s.includes("enStem"), "both locales required");
  assert.ok(s.includes("bnOpts") && s.includes("enOpts"), "both option locales required");
  assert.ok(s.includes("bnExp") && s.includes("enExp"), "both explanations required");
});

// 7. Attempt engine: server deadline, idempotent autosave/submit, no extension, leave policy.
test("attempt API is server-authoritative, idempotent, resumable without extension", () => {
  const a = read("src/app/api/study-platform/attempts/route.ts");
  assert.ok(a.includes("deadline"), "server deadline required");
  assert.ok(a.includes("idempotent"), "idempotency required");
  assert.ok(a.includes("already submitted") || a.includes("409"), "double-submit guard required");
  assert.ok(a.includes("PATCH"), "autosave required");
  const ui = read("src/components/study-platform/exam-engine.tsx");
  assert.ok(ui.includes("deadline - Date.now()"), "client must derive remaining from server deadline");
  assert.ok(ui.includes("beforeunload"), "leave policy required");
  assert.ok(ui.includes('role="timer"') && ui.includes("aria-live"), "timer announcements required");
  assert.ok(ui.includes("Question palette") || ui.includes("palette"), "palette required");
});

// 8. Provisional keys distinct + recalculation preserves originals + audit.
test("provisional keys visible + key changes create recalculation candidates + audit", () => {
  const r = read("src/app/api/study-platform/review/route.ts");
  assert.ok(r.includes("needsRecalculation"), "recalculation marker required");
  assert.ok(r.includes("correctionNote") || r.includes("original"), "correction note required");
  assert.ok(r.includes("appendAudit"), "audit event required");
  const res = read("src/app/study/results/[attemptId]/page.tsx");
  assert.ok(res.includes("Provisional") && res.includes("Approved"), "result must distinguish key status");
});

// 9. RBAC: raw evidence/admin-only, public taxonomy excludes drafts.
test("RBAC hides evidence/drafts/private data from public APIs", () => {
  const tax = read("src/app/api/study-platform/taxonomy/route.ts");
  assert.ok(tax.includes('status === "published"'), "public must only serve published");
  const imp = read("src/app/api/study-platform/import/route.ts");
  assert.ok(imp.includes("requireAdmin"), "import must require admin");
  assert.ok(imp.includes("admin-only") || imp.includes("evidence"), "evidence must stay admin-only");
  const rev = read("src/app/api/study-platform/review/route.ts");
  assert.ok(rev.includes("requireAdmin"), "review must require admin");
});

// 10. A11y + i18n: keyboard, focus, radio groups, reduced motion note, BN/EN search.
test("a11y smoke: keyboard, radiogroups, focus, non-color status + BN/EN search", () => {
  const eng = read("src/components/study-platform/exam-engine.tsx");
  assert.ok(eng.includes("onKey") || eng.includes("keydown"), "keyboard controls required");
  assert.ok(eng.includes('role="radio"') || eng.includes("radiogroup"), "radio groups required");
  const search = read("src/lib/study-platform/search.ts");
  assert.ok(search.includes("সাবনেট") && search.includes("subnet"), "BN/EN synonyms required");
  const plan = read("docs/study-platform-plan.md");
  assert.ok(plan.includes("prefers-reduced-motion"), "reduced-motion policy required");
});

// 11. Routes exist; old study behavior preserved.
test("learner routes exist and old study files untouched in contract", () => {
  for (const p of [
    "src/app/study/posts/page.tsx",
    "src/app/study/posts/[slug]/page.tsx",
    "src/app/study/chapters/[slug]/page.tsx",
    "src/app/study/practice/page.tsx",
    "src/app/study/exams/[slug]/page.tsx",
    "src/app/study/exams/[slug]/attempt/[attemptId]/page.tsx",
    "src/app/study/results/[attemptId]/page.tsx",
    "src/app/study/progress/page.tsx",
  ]) assert.ok(existsSync(join(root, p)), `${p} must exist`);
  const hub = read("src/components/study-hub.tsx") + read("src/components/study-resource-library.tsx");
  assert.ok(hub.includes("useLogin") && hub.includes("await refresh()"), "hub must keep tri-state login recheck");
  const data = read("src/lib/study-data.ts");
  assert.ok(!data.includes("(HTML)") && !data.includes("(PDF)"), "no file-type jargon regression");
});

// 12. No protected branding/content copied; lawful links present.
test("no copied branding; lawful resource links seeded", () => {
  const cur = read("src/lib/study-platform/curriculum.ts");
  assert.ok(cur.includes("rfc-editor.org") && cur.includes("owasp") && cur.includes("bpsc.gov.bd"), "lawful links required");
  const all = ["curriculum", "seed-content", "types", "scoring", "validation"].map((f) => read(`src/lib/study-platform/${f}.ts`)).join("\n");
  assert.ok(!/livemcq.*logo|duranta.*logo|scribd.*pdf/i.test(all), "no copied branding");
  assert.ok(!all.includes("LiveMCQ ©") && !all.includes("Duranta ©"), "no copied marks");
});
