// TDD Task 2 — STEP A (failing first)
// Nav: "Bijoy <> Unicode" + /bijoy-unicode-converter + PDF Tools dropdown (translate+split inside)
// Hero: animated randomized rotator covering the whole toolbox
// SEO/AdSense: metadata, robots, sitemap, legal pages, footer links
// Run: node --test tests/task2-nav-hero-seo.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync, statSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const read = (p) => readFileSync(join(root, p), "utf8");

// ---------- NAV ----------
test("nav labels the converter 'Bijoy <> Unicode'", () => {
  const src = read("src/components/navbar.tsx");
  assert.ok(
    src.includes("Bijoy <> Unicode"),
    "navbar must label the converter exactly 'Bijoy <> Unicode'."
  );
});

test("nav links to /bijoy-unicode-converter", () => {
  const src = read("src/components/navbar.tsx");
  assert.ok(
    src.includes("/bijoy-unicode-converter"),
    "navbar must link to /bijoy-unicode-converter."
  );
});

test("nav has a PDF Tools dropdown containing PDF→DOCX + Splitter", () => {
  const src = read("src/components/navbar.tsx");
  assert.ok(src.includes("PDF Tools"), "navbar must contain a 'PDF Tools' menu.");
  assert.ok(src.includes("/translate"), "PDF Tools dropdown must include /translate (PDF to DOCX).");
  assert.ok(src.includes("/split"), "PDF Tools dropdown must include /split (Splitter).");
});

test("/convert redirects permanently to /bijoy-unicode-converter", () => {
  const cfg = read("next.config.ts");
  assert.ok(
    cfg.includes("/bijoy-unicode-converter") && cfg.includes("redirects"),
    "next.config.ts must define a permanent redirect /convert → /bijoy-unicode-converter."
  );
});

test("/bijoy-unicode-converter route exists", () => {
  assert.ok(
    existsSync(join(root, "src/app/bijoy-unicode-converter/page.tsx")),
    "src/app/bijoy-unicode-converter/page.tsx must exist."
  );
});

// ---------- HERO ----------
test("hero has an animated rotating text element", () => {
  const home = read("src/app/page.tsx");
  const hasRotator =
    home.includes("hero-rotator") || existsSync(join(root, "src/components/hero-rotator.tsx"));
  assert.ok(hasRotator, "homepage hero must render a rotating-phrases element (hero-rotator).");
});

test("hero rotator randomizes + animates + cleans up + respects reduced motion", () => {
  const p = existsSync(join(root, "src/components/hero-rotator.tsx"))
    ? "src/components/hero-rotator.tsx"
    : "src/app/page.tsx";
  const src = read(p);
  assert.ok(src.includes("setInterval"), `${p} must advance phrases on an interval.`);
  assert.ok(src.includes("clearInterval"), `${p} must clear the interval on unmount.`);
  assert.ok(
    /Math\.random|random/.test(src),
    `${p} must randomize phrase order (no fixed loop).`
  );
  assert.ok(
    src.includes("prefers-reduced-motion"),
    `${p} must respect prefers-reduced-motion.`
  );
});

test("hero phrases cover the whole toolbox", () => {
  const p = existsSync(join(root, "src/components/hero-rotator.tsx"))
    ? "src/components/hero-rotator.tsx"
    : "src/app/page.tsx";
  const src = read(p).toLowerCase();
  for (const kw of ["bijoy", "font", "styler", "pdf", "docx", "split", "merge"]) {
    assert.ok(src.includes(kw), `hero phrases must mention '${kw}'.`);
  }
});

// ---------- SEO / ADSENSE ----------
test("root metadata covers canonical + OpenGraph + Twitter + robots", () => {
  const src = read("src/app/layout.tsx");
  for (const kw of ["openGraph", "twitter", "alternates", "robots", "metadataBase"]) {
    assert.ok(src.includes(kw), `layout metadata must include '${kw}'.`);
  }
});

test("robots.ts + sitemap.ts exist and list key routes", () => {
  assert.ok(existsSync(join(root, "src/app/robots.ts")), "src/app/robots.ts must exist.");
  assert.ok(existsSync(join(root, "src/app/sitemap.ts")), "src/app/sitemap.ts must exist.");
  const sm = read("src/app/sitemap.ts");
  for (const r of ["/bijoy-unicode-converter", "/pdf-tools", "/privacy", "/terms", "/about", "/contact"]) {
    assert.ok(sm.includes(`"${r}"`) || sm.includes(`'${r}'`), `sitemap must list '${r}'.`);
  }
});

test("footer links Privacy + Terms + About + Contact", () => {
  const src = read("src/app/layout.tsx");
  for (const r of ["/privacy", "/terms", "/about", "/contact"]) {
    assert.ok(src.includes(r), `footer/layout must link to '${r}' (AdSense trust pages).`);
  }
});

test("AdSense trust pages exist with substantive unique content", () => {
  for (const r of ["about", "privacy", "terms", "contact"]) {
    const p = join(root, `src/app/${r}/page.tsx`);
    assert.ok(existsSync(p), `src/app/${r}/page.tsx must exist.`);
    const size = statSync(p).size;
    assert.ok(size > 1500, `${r}/page.tsx is too thin (${size} bytes) — AdSense rejects thin content.`);
  }
  const privacy = read("src/app/privacy/page.tsx").toLowerCase();
  assert.ok(privacy.includes("cookie") || privacy.includes("adsense"), "privacy page must disclose cookies/ads.");
  const contact = read("src/app/contact/page.tsx").toLowerCase();
  assert.ok(contact.includes("@") || contact.includes("mailto"), "contact page must give a contact address.");
});
