/** BornoLab Decorator & Styler — LingoJam-style transforms + CSS visual styles */

const BOLD_MAP: Record<string, string> = {};
const ITALIC_MAP: Record<string, string> = {};
const MONO_MAP: Record<string, string> = {};

function buildMathMaps() {
  const a = "a".charCodeAt(0), A = "A".charCodeAt(0);
  const boldA = 0x1d41a, italicA = 0x1d44e;
  const boldUA = 0x1d400, italicUA = 0x1d434;
  for (let i = 0; i < 26; i++) {
    BOLD_MAP[String.fromCharCode(A + i)] = String.fromCodePoint(boldUA + i);
    BOLD_MAP[String.fromCharCode(a + i)] = String.fromCodePoint(boldA + i);
    ITALIC_MAP[String.fromCharCode(A + i)] = String.fromCodePoint(italicUA + i);
    ITALIC_MAP[String.fromCharCode(a + i)] = String.fromCodePoint(italicA + i);
    MONO_MAP[String.fromCharCode(A + i)] = String.fromCodePoint(0x1d670 + i);
    MONO_MAP[String.fromCharCode(a + i)] = String.fromCodePoint(0x1d670 + i);
  }
  for (let i = 0; i < 10; i++) {
    BOLD_MAP[String(i)] = String.fromCodePoint(0x1d7ce + i);
    MONO_MAP[String(i)] = String.fromCodePoint(0x1d7f6 + i);
  }
}
buildMathMaps();

const flipMap: Record<string, string> = {
  a: "ɐ", b: "q", c: "ɔ", d: "p", e: "ǝ", f: "ɟ", g: "ƃ", h: "ɥ", i: "ᴉ",
  j: "ɾ", k: "ʞ", l: "l", m: "ɯ", n: "u", o: "o", p: "d", q: "b", r: "ɹ",
  s: "s", t: "ʇ", u: "n", v: "ʌ", w: "ʍ", x: "x", y: "ʎ", z: "z",
  A: "∀", B: "𐐒", C: "Ɔ", E: "Ǝ", F: "Ⅎ", G: "פ", H: "H", I: "I", J: "ſ",
  K: "ʞ", L: "˥", M: "W", N: "N", O: "O", P: "Ԁ", R: "ᴚ", S: "S", T: "⊥", U: "∩", V: "Λ", Y: "⅄",
};

export interface StyleVariant {
  id: string;
  label: string;
  transform: (s: string) => string;
  css?: React.CSSProperties;
  badge: string;
}

const mapThrough = (s: string, m: Record<string, string>) =>
  Array.from(s).map((c) => m[c] ?? c).join("");

export function getVariants(): StyleVariant[] {
  return [
    { id: "bold", label: "Bold Math", badge: "A+", transform: (s) => mapThrough(s, BOLD_MAP) },
    { id: "italic", label: "Italic Serif", badge: "Az", transform: (s) => mapThrough(s, ITALIC_MAP), css: { fontStyle: "italic" } },
    { id: "mono", label: "Monospace", badge: "</>", transform: (s) => mapThrough(s, MONO_MAP), css: { fontFamily: "monospace" } },
    { id: "brackets", label: "Bracket Frame", badge: "【】", transform: (s) => `【 ${s} 】` },
    { id: "double-frame", label: "Double Frame", badge: "〖〗", transform: (s) => `〖 ${s} 〗` },
    { id: "stars", label: "Star Wrap", badge: "★", transform: (s) => `★彡 ${s} 彡★` },
    { id: "wings", label: "Wings", badge: "꧁꧂", transform: (s) => `꧁༒ ${s} ༒꧂` },
    { id: "arrows", label: "Arrow Crown", badge: "➳", transform: (s) => `➳ ${s} ➳` },
    { id: "mirror", label: "Mirrored", badge: "⇄", transform: (s) => Array.from(s).reverse().map((c) => flipMap[c] ?? flipMap[c.toLowerCase()] ?? c).join("") },
    { id: "upper-deco", label: "Dot Decor", badge: "•", transform: (s) => Array.from(s).join("•") },
    {
      id: "outline", label: "Outline", badge: "CSS", transform: (s) => s,
      css: { WebkitTextStroke: "1px #22d3ee", color: "transparent", fontWeight: 800 },
    },
    {
      id: "neon", label: "Neon Glow", badge: "CSS", transform: (s) => s,
      css: { color: "#fff", textShadow: "0 0 8px #22d3ee, 0 0 20px #22d3ee, 0 0 42px #a855f7", fontWeight: 700 },
    },
    {
      id: "gradient", label: "Gradient Fill", badge: "CSS", transform: (s) => s,
      css: { background: "linear-gradient(90deg,#22d3ee,#a855f7,#f472b6)", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent", fontWeight: 800 },
    },
    {
      id: "glitch", label: "Cyber Glitch", badge: "CSS", transform: (s) => `▓ ${s} ▓`,
      css: { fontFamily: "monospace", color: "#a7f3d0", textShadow: "2px 0 #f0f, -2px 0 #0ff", letterSpacing: "1px" },
    },
    {
      id: "shadow-pop", label: "Drop Shadow Pop", badge: "CSS", transform: (s) => s,
      css: { fontWeight: 800, color: "#f8fafc", textShadow: "3px 3px 0 #a855f7, 6px 6px 0 rgba(34,211,238,.5)" },
    },
  ];
}
