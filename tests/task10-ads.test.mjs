// Ads integration — AdUnits renderer, consent banner, ads.txt, per-page slots.
// Run: node --test tests/task10-ads.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const read = (p) => readFileSync(join(root, p), "utf8");

test("AdUnits renderer exists and pushes adsbygoogle per unit", () => {
  assert.ok(existsSync(join(root, "src/components/ads.tsx")), "src/components/ads.tsx must exist.");
  const src = read("src/components/ads.tsx");
  assert.ok(src.includes("adsbygoogle"), "AdUnits must push to window.adsbygoogle.");
  assert.ok(src.includes("data-ad-slot"), "units must render data-ad-slot ins blocks.");
  assert.ok(src.includes("data-ad-client"), "units must carry the admin adsenseClient.");
  assert.ok(src.includes("min-h-[100px]") || src.includes("min-h"), "units must reserve space (no CLS).");
});

test("AdUnits render nothing until client + numeric slots are configured", () => {
  const src = read("src/components/ads.tsx");
  assert.ok(src.includes("!client"), "AdUnits must bail when no AdSense client is configured.");
  assert.ok(/\\d/.test(src), "ad-slot ids must be validated numeric before render.");
});

test("consent banner exists and is mounted in layout", () => {
  const src = read("src/components/ads.tsx");
  assert.ok(src.includes("ConsentBanner"), "ConsentBanner component must exist.");
  assert.ok(src.includes("bornolab-consent"), "consent choice must persist in localStorage.");
  const layout = read("src/app/layout.tsx");
  assert.ok(layout.includes("ConsentBanner"), "layout must mount the ConsentBanner.");
});

test("ads.txt exists with seller instructions", () => {
  assert.ok(existsSync(join(root, "public/ads.txt")), "public/ads.txt must exist.");
  const txt = read("public/ads.txt");
  assert.ok(txt.includes("pub-"), "ads.txt must document the pub-ID line format.");
});

test("AdSense loader is admin-driven in layout", () => {
  const layout = read("src/app/layout.tsx");
  assert.ok(layout.includes("adsenseClient"), "layout must read the client from site config.");
  assert.ok(layout.includes("adsbygoogle.js"), "layout must inject the AdSense loader when configured.");
});

test("tool pages carry inFeed ad placements", () => {
  for (const p of ["src/app/convert/page.tsx", "src/app/fonts/page.tsx", "src/app/translate/page.tsx", "src/app/study/page.tsx", "src/app/page.tsx"]) {
    const src = read(p);
    assert.ok(
      src.includes("AdUnits") || src.includes("AdSlot"),
      `${p} must include an ad placement.`
    );
  }
});
