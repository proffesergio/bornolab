// TDD Task 9 — Admin catalog uploads: custom fonts + software (link or .zip upload)
// Run: node --test tests/task9-catalog-upload.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const read = (p) => readFileSync(join(root, p), "utf8");

// ---------- DATA MODEL ----------
test("site config carries admin-added custom catalogs", () => {
  const src = read("src/lib/site-config-shared.ts");
  assert.ok(src.includes("customFonts"), "SiteConfig must include customFonts.");
  assert.ok(src.includes("customSoftware"), "SiteConfig must include customSoftware.");
  assert.ok(src.includes("customFonts: []"), "customFonts must default to [].");
  assert.ok(src.includes("customSoftware: []"), "customSoftware must default to [].");
});

test("catalogs merge built-in + custom entries under one override system", () => {
  const fonts = read("src/lib/fonts-data.ts");
  assert.ok(fonts.includes("buildFontCatalog"), "fonts-data must export buildFontCatalog.");
  assert.ok(fonts.includes("...custom"), "buildFontCatalog must include admin-added fonts.");
  const soft = read("src/lib/software-data.ts");
  assert.ok(soft.includes("buildSoftwareCatalog"), "software-data must export buildSoftwareCatalog.");
  assert.ok(soft.includes("...custom"), "buildSoftwareCatalog must include admin-added apps.");
});

// ---------- UPLOAD API ----------
test("admin upload route guards auth, allowlists types, caps size, cleans up", () => {
  assert.ok(existsSync(join(root, "src/app/api/admin/uploads/route.ts")), "uploads route must exist.");
  const src = read("src/app/api/admin/uploads/route.ts");
  assert.ok(src.includes("requireAdmin"), "uploads must require admin auth.");
  assert.ok(src.includes('"font"') && src.includes('"software"'), "uploads must accept font + software kinds.");
  for (const ext of ["ttf", "otf", "woff2", "zip", "exe", "msi"]) {
    assert.ok(src.includes(`"${ext}"`), `uploads must allowlist '.${ext}'.`);
  }
  assert.ok(src.includes("maxBytes"), "uploads must cap file size.");
  assert.ok(src.includes("413"), "oversize uploads must return 413.");
  assert.ok(src.includes("public") && src.includes("uploads"), "uploads must land under public/uploads.");
  assert.ok(src.includes("DELETE"), "uploads must support DELETE cleanup.");
  assert.ok(src.includes(".."), "DELETE must block path traversal.");
  assert.ok(existsSync(join(root, "public/uploads/.gitkeep")), "uploads dir placeholder must exist.");
  const ignore = read(".gitignore");
  assert.ok(ignore.includes("/public/uploads/*"), "uploaded files must be git-ignored.");
  assert.ok(ignore.includes("!/public/uploads/.gitkeep"), "uploads placeholder must stay committable.");
});

// ---------- ADMIN UI ----------
test("admin Catalog tab publishes fonts + software by link or upload", () => {
  const src = read("src/app/admin/page.tsx");
  for (const label of ["Add a font", "Add software", "Your uploaded fonts", "Your uploaded software"]) {
    assert.ok(src.includes(label), `catalog must include '${label}'.`);
  }
  assert.ok(src.includes("/api/admin/uploads"), "catalog forms must post files to the uploads API.");
  assert.ok(src.includes(".ttf,.otf,.woff,.woff2,.zip"), "font picker must accept font files + zips.");
  assert.ok(src.includes(".zip,.exe,.msi,.dmg,.pkg,.apk"), "software picker must accept installers + zips.");
  assert.ok(src.includes("customFonts") && src.includes("customSoftware"), "catalog must read/write both custom arrays.");
  assert.ok(src.includes("deleteCustomFont") && src.includes("deleteCustomSoftware"), "custom items must be deletable.");
});

// ---------- STOREFRONT ----------
test("fonts page renders custom fonts and keeps real file extensions", () => {
  const src = read("src/app/fonts/page.tsx");
  assert.ok(src.includes("buildFontCatalog"), "fonts page must build the merged catalog.");
  assert.ok(src.includes("customFonts"), "fonts page must load admin-added fonts.");
  assert.ok(src.includes("downloadName"), "downloads must keep the real extension (.ttf/.zip …), not force .ttf.");
});

test("software page renders custom apps with real free downloads", () => {
  const src = read("src/app/software/page.tsx");
  assert.ok(src.includes("buildSoftwareCatalog"), "software page must build the merged catalog.");
  assert.ok(src.includes("customSoftware"), "software page must load admin-added apps.");
  assert.ok(src.includes("Download Free"), "free items with a real file must offer a direct download.");
});

test("font proxy serves uploaded fonts as attachments", () => {
  const src = read("src/app/api/fonts/route.ts");
  assert.ok(src.includes("uploads\\/fonts") || src.includes("uploads/fonts"), "proxy must allow /uploads/fonts/… paths.");
  assert.ok(src.includes("zip"), "proxy must serve uploaded .zip bundles.");
});
