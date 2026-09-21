// TDD Task 1 — Converter typing hotfix (Bijoy <> Unicode)
// Run: node --test tests/converter-typing.test.mjs
// STEP A: failing test that reproduces "can't type more than one letter"
// Root cause: <textarea key={`L${ripple}`}> remounts on every keystroke -> focus loss.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const pagePath = join(process.cwd(), "src/app/convert/page.tsx");
const src = readFileSync(pagePath, "utf8");

test("Unicode textarea is stable across keystrokes (no remount key tied to typing state)", () => {
  // FAILS if textarea key changes on every onChange (ripple++ -> key change -> unmount).
  const remountPattern = /<motion\.textarea[^>]*key=\{[`"']L\$\{ripple\}[`"']\}/s;
  const anyRippleKey = /<(motion\.)?textarea[^>]*key=\{[^}]*ripple[^}]*\}/s;
  assert.ok(
    !remountPattern.test(src) && !anyRippleKey.test(src),
    "BUG: textarea uses key={`L${ripple}`} — every keystroke remounts the field, focus is lost after 1 char. Remove ripple from key."
  );
});

test("Unicode + Bijoy panes have equal size (same rows + same min-h)", () => {
  const textareas = [...src.matchAll(/<(motion\.)?textarea[\s\S]*?\/>/g)].map((m) => m[0]);
  assert.ok(textareas.length >= 2, `expected 2 textareas, found ${textareas.length}`);
  const rows = textareas.map((t) => (t.match(/rows=\{([^}]+)\}/) || [])[1]?.trim());
  const mins = textareas.map((t) => (t.match(/min-h-\[[^\]]+\]/) || [])[0]);
  // Both must share identical rows expression and identical min-h class
  assert.ok(
    rows[0] === rows[1],
    `panes unequal: left rows={${rows[0]}} vs right rows={${rows[1]}}. Use identical rows (e.g. rows={10}).`
  );
  assert.ok(
    mins[0] && mins[0] === mins[1],
    `panes unequal heights: left ${mins[0]} vs right ${mins[1]}. Give both the same min-h (e.g. min-h-[280px]).`
  );
});

test("no setState inside useMemo for init (must be useEffect)", () => {
  // Current bug: useMemo(() => { if (!right && left) setRight(...) }, [])
  const memoSetState = /useMemo\(\(\)\s*=>\s*\{\s*if\s*\(!right/;
  assert.ok(
    !memoSetState.test(src),
    "BUG: setRight() called inside useMemo initializer — must be useEffect to avoid render-loop / stale init."
  );
});
