// Guides content sprint — long-form SEO pages for approval + traffic.
// Run: node --test tests/task15-guides.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const read = (p) => readFileSync(join(root, p), "utf8");

test("guides library holds substantive long-form content", () => {
  assert.ok(existsSync(join(root, "src/lib/guides.ts")), "src/lib/guides.ts must exist.");
  const src = read("src/lib/guides.ts");
  const slugs = [...src.matchAll(/slug: "([^"]+)"/g)].map((m) => m[1]);
  assert.ok(slugs.length >= 5, `at least 5 guides required (found ${slugs.length}).`);
  assert.ok(src.length > 20000, `guides must be substantive (found ${src.length} chars).`);
  for (const kw of ["faqs", "ctas", "sections", "keywords"]) {
    assert.ok(src.includes(kw), `guides must include '${kw}'.`);
  }
});

test("guides index and article routes exist with SEO schema", () => {
  assert.ok(existsSync(join(root, "src/app/guides/page.tsx")), "guides index must exist.");
  assert.ok(existsSync(join(root, "src/app/guides/[slug]/page.tsx")), "guide article route must exist.");
  const article = read("src/app/guides/[slug]/page.tsx");
  assert.ok(article.includes("generateStaticParams"), "articles must pre-render statically.");
  assert.ok(article.includes("generateMetadata"), "articles must set per-guide metadata.");
  assert.ok(article.includes("FAQPage") || article.includes("Article"), "articles must emit schema JSON-LD.");
  assert.ok(article.includes("Breadcrumb") || article.includes("breadcrumb"), "articles must show breadcrumbs.");
});

test("guides are discoverable: sitemap, footer, SEO options", () => {
  const sm = read("src/app/sitemap.ts");
  assert.ok(sm.includes("/guides"), "sitemap must list /guides.");
  assert.ok(sm.includes("GUIDES"), "sitemap must include guide slugs.");
  const layout = read("src/app/layout.tsx");
  assert.ok(layout.includes("/guides"), "footer must link to guides.");
  const seo = read("src/lib/seo-pages.ts");
  assert.ok(seo.includes("/guides"), "per-page SEO must offer /guides.");
});

test("every guide funnels readers into tools", () => {
  const src = read("src/lib/guides.ts");
  for (const href of ["/bijoy-unicode-converter", "/fonts", "/translate", "/split", "/study"]) {
    assert.ok(src.includes(href), `guides must link to '${href}'.`);
  }
});
