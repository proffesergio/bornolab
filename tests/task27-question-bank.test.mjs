// Question Bank Solutions module + generic Study Hub card view (task27).
// Run: node --test tests/task27-question-bank.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const read = (p) => readFileSync(join(root, p), "utf8");

test("question-bank taxonomy exists with Petrobangla subject-wise template", () => {
  const lib = read("src/lib/question-bank-data.ts");
  assert.ok(lib.includes("QB_DEPARTMENTS"), "must export QB_DEPARTMENTS");
  assert.ok(lib.includes("petrobangla"), "must include the Petrobangla department");
  for (const s of ["general-knowledge", "general-math", "bangla", "english", "computer-fundamentals"]) {
    assert.ok(lib.includes(s), `Petrobangla must have subject ${s}`);
  }
  assert.ok(lib.includes("QB_SEED_DOCS"), "must ship seed templates");
  assert.ok(lib.includes("buildQuestionBankCatalog"), "must export catalog builder");
  assert.ok(lib.includes("sourcePdf"), "seed docs must trace source PDFs");
});

test("question-bank API serves public catalog + admin write", () => {
  assert.ok(existsSync(join(root, "src/app/api/question-bank/route.ts")), "API route must exist");
  const api = read("src/app/api/question-bank/route.ts");
  assert.ok(api.includes("customQuestionBank"), "API must persist to site-config");
  assert.ok(api.includes("deptId"), "POST must target a department section");
  assert.ok(api.includes("/uploads/study/"), "uploads must reuse the study pipeline");
});

test("question-bank hub + department pages are card views", () => {
  assert.ok(existsSync(join(root, "src/app/study/question-bank/page.tsx")), "hub page must exist");
  assert.ok(existsSync(join(root, "src/app/study/question-bank/[dept]/page.tsx")), "dept page must exist");
  const hub = read("src/app/study/question-bank/page.tsx");
  assert.ok(hub.includes('role="list"') && hub.includes("Departments"), "dept cards must be a labeled list");
  assert.ok(hub.includes("Featured solutions"), "hub must have a featured rail");
  assert.ok(hub.includes("/study/question-bank/"), "hub must deep-link to departments");
  const dept = read("src/app/study/question-bank/[dept]/page.tsx");
  assert.ok(dept.includes("chapter"), "dept page must render chapter rails");
});

test("admin can upload a PDF to a specific QB section", () => {
  assert.ok(existsSync(join(root, "src/components/admin-question-bank.tsx")), "admin QB component must exist");
  const a = read("src/components/admin-question-bank.tsx");
  assert.ok(a.includes('kind", "study"'), "uploads must use kind=study pipeline");
  assert.ok(a.includes("chapterId"), "publish must target a chapter section");
  assert.ok(a.includes("customQuestionBank"), "must save to site-config");
  const panel = read("src/components/admin-study.tsx");
  assert.ok(panel.includes("AdminQuestionBank"), "AdminStudy must embed the QB manager");
});

test("site-config persists question-bank docs with overrides", () => {
  const shared = read("src/lib/site-config-shared.ts");
  assert.ok(shared.includes("customQuestionBank"), "SiteConfig must carry customQuestionBank");
  assert.ok(shared.includes("qbOverrides"), "SiteConfig must carry qbOverrides");
});
