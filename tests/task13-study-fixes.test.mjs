// BUET study fixes — tracked files, login tri-state, jargon-free UI.
// Run: node --test tests/task13-study-fixes.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const read = (p) => readFileSync(join(root, p), "utf8");

test("BUET reference files use safe names and are git-tracked", () => {
  assert.ok(existsSync(join(root, "public/uploads/study/buet-msc-cse-group1-prep-guide.pdf")), "renamed PDF must exist.");
  assert.ok(existsSync(join(root, "public/uploads/study/buet-msc-cse-group1-prep-guide.html")), "renamed HTML must exist.");
  const ignore = read(".gitignore");
  assert.ok(ignore.includes("buet-msc-cse-group1-prep-guide.pdf"), ".gitignore must whitelist the PDF.");
  assert.ok(ignore.includes("buet-msc-cse-group1-prep-guide.html"), ".gitignore must whitelist the HTML.");
  const data = read("src/lib/study-data.ts");
  assert.ok(data.includes("/uploads/study/buet-msc-cse-group1-prep-guide.pdf"), "catalog must use the safe PDF URL.");
  assert.ok(data.includes("/uploads/study/buet-msc-cse-group1-prep-guide.html"), "catalog must use the safe HTML URL.");
  assert.ok(!data.includes("%20"), "catalog URLs must not contain percent-encoding.");
});

test("study UI never exposes file-type jargon", () => {
  const data = read("src/lib/study-data.ts");
  assert.ok(!data.includes("(HTML)"), "titles must not say HTML.");
  assert.ok(!data.includes("(PDF)"), "titles must not say PDF.");
  assert.ok(data.includes("Interactive"), "interactive option must be named as a module.");
  for (const p of ["src/app/study/page.tsx", "src/app/study/[id]/page.tsx"]) {
    const src = read(p);
    assert.ok(!src.includes("{m.fileType}") && !src.includes("{material.fileType}"), `${p} must not render the raw file type.`);
  }
});

test("old interactive URL redirects to the new one", () => {
  const cfg = read("next.config.ts");
  assert.ok(cfg.includes("buet-msc-cse-prep-html") && cfg.includes("buet-msc-cse-prep-interactive"), "old material id must redirect.");
});

test("login state is tri-state — no login CTA while checking", () => {
  assert.ok(existsSync(join(root, "src/components/use-login.ts")), "useLogin hook must exist.");
  const hook = read("src/components/use-login.ts");
  assert.ok(hook.includes("null"), "hook must model the checking state.");
  for (const p of ["src/app/study/page.tsx", "src/app/study/[id]/page.tsx"]) {
    const src = read(p);
    assert.ok(src.includes("useLogin"), `${p} must use the tri-state hook.`);
    assert.ok(src.includes("loggedIn === false"), `${p} must only show the login CTA when definitively logged out.`);
    assert.ok(src.includes("await refresh()"), `${p} must recheck auth at click time.`);
  }
});

test("study download falls back to origin fetch on serverless", () => {
  const src = read("src/app/api/study/download/route.ts");
  assert.ok(src.includes("new URL(url, req.nextUrl.origin)"), "download must fall back to origin fetch.");
});
